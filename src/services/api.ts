/**
 * API service for CodeVerse backend.
 * EXPO_PUBLIC_API_URL must be set for production (EAS env or .env).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
const API_TIMEOUT_MS = 30000;
const AUTH_TIMEOUT_MS = 10000; // Faster timeout for auth endpoints
const AUTH_MAX_RETRIES = 2; // Retry auth requests on network issues

import type { AuthTokens } from '../types';

let authTokens: AuthTokens | null = null;
let refreshPromise: Promise<string> | null = null;

export function setAuthTokens(tokens: AuthTokens | null) {
  authTokens = tokens;
}

export function getAuthTokens(): AuthTokens | null {
  return authTokens;
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  
  if (!authTokens?.refreshToken) {
    throw new Error('No refresh token available.');
  }

  refreshPromise = (async () => {
    try {
      const result = await api<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: authTokens!.refreshToken }),
      });
      if (authTokens) {
        authTokens.accessToken = result.accessToken;
      }
      return result.accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  if (!BASE_URL) {
    const error = new Error('App is not configured. Please update and restart.');
    (error as any).status = 503;
    (error as any).response = { error: 'CONFIGURATION_ERROR', message: 'App is not configured.' };
    throw error;
  }
  const url = `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authTokens?.accessToken && {
      Authorization: `Bearer ${authTokens.accessToken}`,
    }),
    ...options.headers,
  };
  try {
    const res = await fetchWithTimeout(url, { ...options, headers });
    
    // Read response body once - we'll need it for both success and error cases
    let responseText: string = '';
    let responseData: any = {};
    
    try {
      responseText = await res.text();
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          // Not JSON, that's okay
        }
      }
    } catch (readError) {
      // Failed to read response, continue with empty data
    }
    
    if (!res.ok) {
      // Try to refresh token on 401
      if (res.status === 401 && retryOn401 && authTokens?.refreshToken && path !== '/auth/refresh') {
        try {
          const newAccessToken = await refreshAccessToken();
          // Retry request with new token
          const retryHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newAccessToken}`,
            ...options.headers,
          };
          const retryRes = await fetchWithTimeout(url, { ...options, headers: retryHeaders });
          
          // Read retry response
          let retryText = '';
          let retryData: any = {};
          try {
            retryText = await retryRes.text();
            if (retryText) {
              try {
                retryData = JSON.parse(retryText);
              } catch {
                // Not JSON
              }
            }
          } catch {
            // Ignore read errors
          }
          
          if (!retryRes.ok) {
            const msg = retryData?.message ?? retryRes.statusText ?? 'Request failed.';
            const error = new Error(msg);
            (error as any).status = retryRes.status;
            (error as any).response = retryData;
            throw error;
          }
          
          return retryData;
        } catch (refreshErr) {
          // Refresh failed, throw original 401 error
          const msg = responseData?.message ?? res.statusText ?? 'Authentication failed. Please sign in again.';
          const error = new Error(msg);
          (error as any).status = res.status;
          (error as any).response = responseData;
          throw error;
        }
      }
      
      const msg = responseData?.message ?? res.statusText ?? 'Request failed';
      
      // Handle 403 conversation limit errors
      if (res.status === 403) {
        const errorData = responseData as { message?: string; error?: string; limit?: number; current?: number; plan?: string };
        throw new Error(JSON.stringify({
          message: errorData.message || 'Conversation limit reached',
          error: errorData.error || 'CONVERSATION_LIMIT_REACHED',
          limit: errorData.limit,
          current: errorData.current,
          plan: errorData.plan,
        }));
      }
      
      // Handle 404 errors (expected when not authenticated or resource doesn't exist)
      if (res.status === 404) {
        throw new Error('Not found');
      }
      
      // Handle 401 errors (authentication required)
      if (res.status === 401) {
        // Extract error message from response
        const errorMsg = responseData?.message || msg || 'Authentication required';
        const errorCode = responseData?.error;
        
        // Check if it's a token error specifically
        if (errorCode === 'INVALID_TOKEN' ||
            errorMsg.toLowerCase().includes('invalid token') || 
            errorMsg.toLowerCase().includes('expired token') ||
            errorMsg.toLowerCase().includes('invalid or expired')) {
          const error = new Error('Invalid or expired token.');
          (error as any).status = res.status;
          (error as any).response = responseData;
          throw error;
        }
        const error = new Error('Authentication required');
        (error as any).status = res.status;
        (error as any).response = responseData;
        throw error;
      }
      
      // Attach status code and response to error for better debugging
      const error = new Error(msg || 'Request failed.');
      (error as any).status = res.status;
      (error as any).response = responseData;
      throw error;
    }
    
    // Success - return parsed data
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    return responseData;
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('Request timed out. Try again.');
      }
      // Handle network errors more gracefully
      if (e.message.includes('Network request failed') || 
          e.message.includes('Failed to fetch') ||
          e.message.includes('NetworkError') ||
          e.name === 'TypeError' && e.message.includes('Network')) {
        throw new Error('Network error. Check your connection.');
      }
      throw e;
    }
    throw new Error('Network error. Check your connection.');
  }
}

// Auth (OAuth exchange – backend exchanges code for tokens and returns user + JWT)
export async function exchangeOAuthCode(
  provider: 'google' | 'github',
  code: string,
  redirectUri: string,
  codeVerifier?: string
) {
  return api<{ user: { id: string; email: string; name: string; avatar?: string; provider: 'google' | 'github'; subscriptionPlan?: string }; accessToken: string; refreshToken: string; expiresAt?: string }>(
    '/auth/exchange',
    {
      method: 'POST',
      body: JSON.stringify({ provider, code, redirectUri, codeVerifier }),
    }
  );
}

// Email/Password Auth - Optimized with retry logic
export async function registerEmail(email: string, password: string, name?: string) {
  if (!BASE_URL) {
    const error = new Error('App is not configured. Please update and restart.');
    (error as any).status = 503;
    throw error;
  }

  const url = `${BASE_URL.replace(/\/$/, '')}/auth/register`;
  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= AUTH_MAX_RETRIES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      clearTimeout(timeout);

      let data: any = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        // JSON parse failed
      }

      if (!res.ok) {
        const msg = data?.message || res.statusText || 'Registration failed';
        
        // Retry on server errors only
        if (res.status >= 500 && retryCount < AUTH_MAX_RETRIES) {
          retryCount++;
          await new Promise(r => setTimeout(r, 600 * retryCount));
          continue;
        }

        const error = new Error(msg);
        (error as any).status = res.status;
        (error as any).response = data;
        throw error;
      }

      return data as { 
        user: { id: string; email: string; name: string; avatar?: string; provider: 'email'; emailVerified?: boolean; subscriptionPlan?: string }; 
        accessToken: string; 
        refreshToken: string; 
        expiresAt?: string;
        tokenUsage?: { freeUsed: number; purchasedTotal: number; purchasedUsed: number };
      };
    } catch (e) {
      clearTimeout(timeout);

      if (e instanceof Error) {
        if (e.name === 'AbortError') {
          if (retryCount < AUTH_MAX_RETRIES) {
            retryCount++;
            lastError = new Error('Request timed out. Retrying...');
            await new Promise(r => setTimeout(r, 300 * retryCount));
            continue;
          }
          throw new Error('Registration timed out. Please check your connection and try again.');
        }

        if (e.message.includes('Network') || e.message.includes('fetch') || e.name === 'TypeError') {
          if (retryCount < AUTH_MAX_RETRIES) {
            retryCount++;
            lastError = e;
            await new Promise(r => setTimeout(r, 600 * retryCount));
            continue;
          }
          throw new Error('Network error. Please check your connection and try again.');
        }

        throw e;
      }

      lastError = new Error(String(e));
      if (retryCount < AUTH_MAX_RETRIES) {
        retryCount++;
        await new Promise(r => setTimeout(r, 600 * retryCount));
        continue;
      }
    }
  }

  throw lastError || new Error('Registration failed after multiple attempts. Please try again.');
}

export async function loginEmail(email: string, password: string, rememberMe = false, mfaCode?: string) {
  // Optimized login with faster timeout, retry logic, and better error handling
  if (!BASE_URL) {
    const error = new Error('App is not configured. Please update and restart.');
    (error as any).status = 503;
    throw error;
  }

  const url = `${BASE_URL.replace(/\/$/, '')}/auth/login`;
  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= AUTH_MAX_RETRIES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe, mfaCode }),
      });
      clearTimeout(timeout);

      // Read response
      let data: any = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        // JSON parse failed
      }

      if (!res.ok) {
        const msg = data?.message || res.statusText || 'Login failed';
        
        // Retry on server errors (5xx)
        if (res.status >= 500 && retryCount < AUTH_MAX_RETRIES) {
          retryCount++;
          await new Promise(r => setTimeout(r, 600 * retryCount));
          continue;
        }

        // Don't retry client errors - throw immediately
        const error = new Error(msg);
        (error as any).status = res.status;
        (error as any).response = data;
        throw error;
      }

      return data as { 
        user: { id: string; email: string; name: string; avatar?: string; provider: 'email'; mfaEnabled?: boolean; subscriptionPlan?: string }; 
        accessToken: string; 
        refreshToken: string; 
        expiresAt?: string; 
        requiresMfa?: boolean;
        tokenUsage?: { freeUsed: number; purchasedTotal: number; purchasedUsed: number };
      };
    } catch (e) {
      clearTimeout(timeout);

      if (e instanceof Error) {
        // Timeout - retry
        if (e.name === 'AbortError') {
          if (retryCount < AUTH_MAX_RETRIES) {
            retryCount++;
            lastError = new Error('Request timed out. Retrying...');
            await new Promise(r => setTimeout(r, 300 * retryCount));
            continue;
          }
          throw new Error('Login timed out. Please check your connection and try again.');
        }

        // Network error - retry
        if (e.message.includes('Network') || e.message.includes('fetch') || e.name === 'TypeError') {
          if (retryCount < AUTH_MAX_RETRIES) {
            retryCount++;
            lastError = e;
            await new Promise(r => setTimeout(r, 600 * retryCount));
            continue;
          }
          throw new Error('Network error. Please check your connection and try again.');
        }

        throw e;
      }
      
      lastError = new Error(String(e));
      if (retryCount < AUTH_MAX_RETRIES) {
        retryCount++;
        await new Promise(r => setTimeout(r, 600 * retryCount));
        continue;
      }
    }
  }

  throw lastError || new Error('Login failed after multiple attempts. Please try again.');
}

export async function requestMagicLink(email: string, redirectUrl?: string) {
  return api<{ message: string }>(
    '/auth/magic-link/send',
    {
      method: 'POST',
      body: JSON.stringify({ email, redirectUrl }),
    }
  );
}

export async function refreshToken(refreshToken: string) {
  return api<{ accessToken: string }>(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
    false // Don't retry refresh on 401
  );
}

export async function logout(refreshToken?: string) {
  return api<{ message: string }>(
    '/auth/logout',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }
  );
}

export async function requestPasswordReset(email: string) {
  return api<{ message: string }>('/auth/password/reset-request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return api<{ message: string }>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ token, password: newPassword }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return api<{ message: string }>('/auth/password/change', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteAccount(password: string) {
  return api<{ message: string }>('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password, confirm: 'DELETE' }),
  });
}

// Token Usage Management
export async function getTokenUsage() {
  try {
    return await api<{ freeUsed: number; purchasedTotal: number; purchasedUsed: number }>(
      '/tokens/usage',
      {
        method: 'GET',
      }
    );
  } catch (e) {
    // Handle network errors gracefully - don't throw, let caller handle fallback
    const errorMsg = e instanceof Error ? e.message : String(e);
    if (errorMsg.includes('Network') || 
        errorMsg.includes('fetch') ||
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('ETIMEDOUT')) {
      // Re-throw with a more specific error that TokenContext can handle
      throw new Error('Network request failed');
    }
    throw e;
  }
}

export async function syncTokenUsage(freeUsed: number, purchasedTotal: number, purchasedUsed: number) {
  return api<{ message: string }>(
    '/tokens/sync',
    {
      method: 'POST',
      body: JSON.stringify({ freeUsed, purchasedTotal, purchasedUsed }),
    }
  );
}

// Conversation Management
export type Conversation = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tokensUsed: number;
  createdAt: string;
};

export async function getConversations() {
  return api<{ conversations: Conversation[] }>(
    '/ai/conversations',
    {
      method: 'GET',
    }
  );
}

export async function createConversation(title?: string) {
  try {
    const result = await api<{ conversation: Conversation }>(
      '/ai/conversations',
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      }
    );
    
    // Validate response structure
    if (!result || !result.conversation) {
      throw new Error('Invalid response: missing conversation data');
    }
    
    return result;
  } catch (e: any) {
    // Re-throw with proper error format for conversation limits
    if (e.message && typeof e.message === 'string') {
      try {
        const errorData = JSON.parse(e.message);
        if (errorData.error === 'CONVERSATION_LIMIT_REACHED') {
          throw new Error(JSON.stringify(errorData));
        }
      } catch {
        // Not JSON, continue with original error
      }
    }
    
    // Preserve original error with more context
    if (e instanceof Error) {
      // Attach status code if available
      if ((e as any).status) {
        const statusError = new Error(e.message);
        (statusError as any).status = (e as any).status;
        (statusError as any).response = (e as any).response;
        throw statusError;
      }
      
      // Check if it's a structured error from the API
      if (e.message.includes('Failed to create conversation')) {
        // This is the generic error from backend - preserve it but add context
        const enhancedError = new Error(e.message);
        (enhancedError as any).status = (e as any).status || 500;
        (enhancedError as any).response = (e as any).response;
        throw enhancedError;
      }
      throw e;
    }
    
    const genericError = new Error('Failed to create conversation. Please try again later.');
    (genericError as any).status = 500;
    throw genericError;
  }
}

export async function getConversationMessages(conversationId: string) {
  return api<{ messages: ConversationMessage[] }>(
    `/ai/conversations/${conversationId}/messages`,
    {
      method: 'GET',
    }
  );
}

export async function updateConversationTitle(conversationId: string, title: string) {
  return api<{ message: string }>(
    `/ai/conversations/${conversationId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ title }),
    }
  );
}

export async function deleteConversation(conversationId: string) {
  return api<{ message: string }>(
    `/ai/conversations/${conversationId}`,
    {
      method: 'DELETE',
    }
  );
}

// Languages & articles (replace with real endpoints)
export async function getLanguages() {
  // return api<ProgrammingLanguage[]>('/languages');
  return Promise.resolve([]);
}

export async function getArticles(languageId: string) {
  // return api<Article[]>(`/languages/${languageId}/articles`);
  return Promise.resolve([]);
}

// AI mentor – backend must validate token balance and deduct usage server-side.
// Contract: POST /ai/chat
//   Body: { message: string, context?: string, conversationId?: string }
//   Response: { reply: string, tokensUsed: number, conversationId?: string }
//   Errors: 402 when insufficient tokens, 4xx/5xx for other failures.
export type SendAIMessageResult = { 
  reply: string; 
  tokensUsed: number;
  conversationId?: string;
};

const AI_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE_MS = 1000; // Base delay for exponential backoff

// Helper function for exponential backoff retry
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if error is retryable
function isRetryableError(status: number, error: any): boolean {
  // Retry on network errors, timeouts, and server errors
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return true;
  }
  
  // Retry on 5xx errors (server errors)
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // Retry on 429 (rate limit) - but with longer delay
  if (status === 429) {
    return true;
  }
  
  // Don't retry on 4xx client errors (except 429)
  return false;
}

export async function sendAIMessage(
  message: string, 
  context?: string, 
  conversationId?: string
): Promise<SendAIMessageResult> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!baseUrl) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      reply: "AI mentor is not configured. Please check your connection and try again later.",
      tokensUsed: 0,
    };
  }

  const url = `${baseUrl.replace(/\/$/, '')}/ai/chat`;
  
  // Ensure we have a valid access token before making requests
  let accessToken = authTokens?.accessToken;
  
  // If token is missing or expired, try to refresh proactively
  if (!accessToken && authTokens?.refreshToken) {
    try {
      const refreshResult = await refreshToken(authTokens.refreshToken);
      accessToken = refreshResult.accessToken;
      if (authTokens) {
        authTokens.accessToken = accessToken;
      }
    } catch (refreshError) {
      // Refresh failed - will try with existing token or fail with 401
      if (__DEV__) console.warn('Token refresh failed before AI request:', refreshError);
    }
  }

  let lastError: Error | null = null;
  let retryCount = 0;

  // Retry loop with exponential backoff
  while (retryCount <= MAX_RETRIES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && {
            Authorization: `Bearer ${accessToken}`,
          }),
        },
        body: JSON.stringify({ 
          message: String(message).slice(0, 16000), 
          context: context ? String(context).slice(0, 2000) : undefined,
          conversationId: conversationId || undefined,
        }),
      });
      clearTimeout(timeout);

      // Handle 401 - try refreshing token and retry once
      if (res.status === 401 && authTokens?.refreshToken && accessToken === authTokens?.accessToken) {
        try {
          const refreshResult = await refreshToken(authTokens.refreshToken);
          const newAccessToken = refreshResult.accessToken;
          if (authTokens) {
            authTokens.accessToken = newAccessToken;
          }
          accessToken = newAccessToken;
          
          // Retry immediately with new token (don't count as retry)
          continue;
        } catch (refreshError) {
          throw new Error('Your session has expired. Please sign in again.');
        }
      }

      let data: any = {};
      try {
        const text = await res.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        // If JSON parsing fails, use empty object
        data = {};
      }

      if (!res.ok) {
        const msg = (data as { message?: string }).message ?? res.statusText;
        
        // Check if we should retry
        if (isRetryableError(res.status, null) && retryCount < MAX_RETRIES) {
          // Calculate exponential backoff delay
          const delayMs = RETRY_DELAY_BASE_MS * Math.pow(2, retryCount);
          if (__DEV__) {
            console.log(`Retrying AI request (${retryCount + 1}/${MAX_RETRIES}) after ${delayMs}ms due to ${res.status}`);
          }
          await sleep(delayMs);
          retryCount++;
          lastError = new Error(msg || `Request failed with status ${res.status}`);
          continue; // Retry
        }
        
        // Don't retry - handle specific errors
        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (res.status === 402) {
          // Insufficient tokens - include details if available
          const tokensRequired = (data as { tokensRequired?: number }).tokensRequired ?? 10;
          const tokensAvailable = (data as { tokensAvailable?: number }).tokensAvailable ?? 0;
          throw new Error(`Insufficient tokens. You need ${tokensRequired} tokens but only have ${tokensAvailable} available. Please recharge to continue.`);
        }
        if (res.status === 403) {
          // Conversation limit reached
          const errorData = data as { message?: string; error?: string; limit?: number; current?: number; plan?: string };
          throw new Error(JSON.stringify({
            message: errorData.message || 'Conversation limit reached',
            error: errorData.error || 'CONVERSATION_LIMIT_REACHED',
            limit: errorData.limit,
            current: errorData.current,
            plan: errorData.plan,
          }));
        }
        if (res.status === 503 || res.status === 502) {
          throw new Error('Server is temporarily unavailable. Please try again in a moment.');
        }
        if (res.status === 504) {
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        if (res.status >= 500) {
          throw new Error('Server error. Please try again in a moment.');
        }
        throw new Error(msg || `AI request failed (${res.status}). Please try again.`);
      }

      // Success - validate and return response
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server. Please try again.');
      }

      const reply = (data as { reply?: string }).reply ?? '';
      if (!reply) {
        throw new Error('Empty response from AI. Please try again.');
      }
      
      const tokensUsed = Math.max(0, Number((data as { tokensUsed?: number }).tokensUsed) || 10);
      const conversationId = (data as { conversationId?: string }).conversationId;
      
      return { reply, tokensUsed, conversationId };
    } catch (e) {
      clearTimeout(timeout);
      
      if (e instanceof Error) {
        // Check if we should retry this error
        if (isRetryableError(0, e) && retryCount < MAX_RETRIES) {
          const delayMs = RETRY_DELAY_BASE_MS * Math.pow(2, retryCount);
          if (__DEV__) {
            console.log(`Retrying AI request (${retryCount + 1}/${MAX_RETRIES}) after ${delayMs}ms due to error: ${e.message}`);
          }
          await sleep(delayMs);
          retryCount++;
          lastError = e;
          continue; // Retry
        }
        
        // Don't retry - handle specific errors
        if (e.name === 'AbortError') {
          throw new Error('Request took too long. Please check your connection and try again.');
        }
        throw e;
      }
      
      // Non-Error object
      lastError = new Error(String(e));
      if (retryCount < MAX_RETRIES) {
        const delayMs = RETRY_DELAY_BASE_MS * Math.pow(2, retryCount);
        await sleep(delayMs);
        retryCount++;
        continue;
      }
      
      throw new Error('Unable to reach AI. Check your connection and try again.');
    }
  }
  
  // If we exhausted all retries, throw the last error
  throw lastError || new Error('Request failed after multiple attempts. Please try again later.');
}

// Token recharge (payment – integrate Stripe/RevenueCat on backend)
export async function createTokenPurchaseIntent(
  packId: string,
  tokens: number,
  amountCents: number
) {
  // return api<{ clientSecret: string }>('/tokens/purchase', {
  //   method: 'POST',
  //   body: JSON.stringify({ packId, tokens, amountCents }),
  // });
  return Promise.resolve({ clientSecret: '' });
}
