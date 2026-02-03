/**
 * API service for CodeVerse backend.
 * EXPO_PUBLIC_API_URL must be set for production (EAS env or .env).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
const API_TIMEOUT_MS = 30000;

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

let authTokens: AuthTokens | null = null;

export function setAuthTokens(tokens: AuthTokens | null) {
  authTokens = tokens;
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
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
      const err = await res.json().catch(() => ({}));
      const msg = (err as { message?: string }).message ?? res.statusText;
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
  return api<{ user: { id: string; email: string; name: string; avatar?: string; provider: 'google' | 'github' }; accessToken: string }>(
    '/auth/exchange',
    {
      method: 'POST',
      body: JSON.stringify({ provider, code, redirectUri, codeVerifier }),
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
//   Body: { message: string, context?: string }
//   Response: { reply: string, tokensUsed: number }
//   Errors: 402 when insufficient tokens, 4xx/5xx for other failures.
export type SendAIMessageResult = { reply: string; tokensUsed: number };

const AI_TIMEOUT_MS = 60000;

export async function sendAIMessage(message: string, context?: string): Promise<SendAIMessageResult> {
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
      body: JSON.stringify({ message: String(message).slice(0, 16000), context: context ? String(context).slice(0, 2000) : undefined }),
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = (data as { message?: string }).message ?? res.statusText;
      if (res.status === 402) {
        throw new Error('Insufficient tokens. Please recharge to continue.');
      }
      throw new Error(msg || 'AI request failed.');
    }

    const reply = (data as { reply?: string }).reply ?? '';
    const tokensUsed = Math.max(0, Number((data as { tokensUsed?: number }).tokensUsed) || 50);
    return { reply, tokensUsed };
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
