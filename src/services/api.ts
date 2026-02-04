/**
 * API service for CodeVerse backend.
 * EXPO_PUBLIC_API_URL must be set for production (EAS env or .env).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
const API_TIMEOUT_MS = 30000;

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
    throw new Error('App is not configured. Please update and restart.');
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
          if (!retryRes.ok) {
            let err: any = {};
            try {
              const errorText = await retryRes.text();
              if (errorText) {
                err = JSON.parse(errorText);
              }
            } catch {
              // Ignore parse errors
            }
            const msg = (err as { message?: string }).message ?? retryRes.statusText;
            throw new Error(msg || 'Request failed.');
          }
          
          // Parse JSON response safely
          try {
            const text = await retryRes.text();
            if (!text) {
              throw new Error('Empty response from server');
            }
            return JSON.parse(text);
          } catch (parseError) {
            throw new Error('Invalid response from server. Please try again.');
          }
        } catch (refreshErr) {
          // Refresh failed, throw original 401 error
          let err: any = {};
          try {
            const errorText = await res.text();
            if (errorText) {
              err = JSON.parse(errorText);
            }
          } catch {
            // Ignore parse errors
          }
          const msg = (err as { message?: string }).message ?? res.statusText;
          throw new Error(msg || 'Authentication failed. Please sign in again.');
        }
      }
      let err: any = {};
      let msg = res.statusText;
      
      try {
        const errorText = await res.text();
        if (errorText) {
          err = JSON.parse(errorText);
          msg = err.message || res.statusText;
        }
      } catch (parseError) {
        // If JSON parsing fails, use status text
        msg = res.statusText || 'Request failed';
      }
      
      // Handle 403 conversation limit errors
      if (res.status === 403) {
        const errorData = err as { message?: string; error?: string; limit?: number; current?: number; plan?: string };
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
        throw new Error('Authentication required');
      }
      
      throw new Error(msg || 'Request failed.');
    }
    return res.json();
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') throw new Error('Request timed out. Try again.');
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
  return api<{ user: { id: string; email: string; name: string; avatar?: string; provider: 'google' | 'github' }; accessToken: string; refreshToken: string; expiresAt?: string }>(
    '/auth/exchange',
    {
      method: 'POST',
      body: JSON.stringify({ provider, code, redirectUri, codeVerifier }),
    }
  );
}

// Email/Password Auth
export async function registerEmail(email: string, password: string, name?: string) {
  return api<{ 
    user: { id: string; email: string; name: string; avatar?: string; provider: 'email'; emailVerified?: boolean }; 
    accessToken: string; 
    refreshToken: string; 
    expiresAt?: string;
    tokenUsage?: { freeUsed: number; purchasedTotal: number; purchasedUsed: number };
  }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }
  );
}

export async function loginEmail(email: string, password: string, rememberMe = false, mfaCode?: string) {
  return api<{ 
    user: { id: string; email: string; name: string; avatar?: string; provider: 'email'; mfaEnabled?: boolean }; 
    accessToken: string; 
    refreshToken: string; 
    expiresAt?: string; 
    requiresMfa?: boolean;
    tokenUsage?: { freeUsed: number; purchasedTotal: number; purchasedUsed: number };
  }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe, mfaCode }),
    }
  );
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

// Token Usage Management
export async function getTokenUsage() {
  return api<{ freeUsed: number; purchasedTotal: number; purchasedUsed: number }>(
    '/tokens/usage',
    {
      method: 'GET',
    }
  );
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
    return await api<{ conversation: Conversation }>(
      '/ai/conversations',
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      }
    );
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
    throw e;
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authTokens?.accessToken && {
          Authorization: `Bearer ${authTokens.accessToken}`,
        }),
      },
      body: JSON.stringify({ 
        message: String(message).slice(0, 16000), 
        context: context ? String(context).slice(0, 2000) : undefined,
        conversationId: conversationId || undefined,
      }),
    });
    clearTimeout(timeout);

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
      throw new Error(msg || 'AI request failed.');
    }

    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from server');
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
      if (e.name === 'AbortError') throw new Error('Request took too long. Try again.');
      throw e;
    }
    throw new Error('Unable to reach AI. Check your connection and try again.');
  }
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
