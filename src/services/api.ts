/**
 * API service for CodeVerse backend (PostgreSQL + REST/GraphQL).
 * Replace base URL with your deployed backend.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.codeverse.app';

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

let authTokens: AuthTokens | null = null;

export function setAuthTokens(tokens: AuthTokens) {
  authTokens = tokens;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authTokens?.accessToken && {
      Authorization: `Bearer ${authTokens.accessToken}`,
    }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json();
}

// Auth (OAuth exchange – call from your backend after Google/GitHub redirect)
export async function exchangeOAuthCode(
  provider: 'google' | 'github',
  code: string,
  codeVerifier?: string
) {
  return api<{ user: unknown; accessToken: string; refreshToken?: string }>(
    '/auth/exchange',
    {
      method: 'POST',
      body: JSON.stringify({ provider, code, codeVerifier }),
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

export async function sendAIMessage(message: string, context?: string): Promise<SendAIMessageResult> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const useBackend = baseUrl && baseUrl !== '' && !baseUrl.includes('codeverse.app');

  if (!useBackend) {
    // No backend configured or placeholder URL: use mock so app works offline/demo
    await new Promise((r) => setTimeout(r, 800));
    return {
      reply:
        "I'm your AI mentor. To enable real AI replies, set EXPO_PUBLIC_API_URL to your backend and implement POST /ai/chat (see api.ts). I can still help you think through concepts—try asking about JavaScript, Python, or interview prep!",
      tokensUsed: 50,
    };
  }

  try {
    const res = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authTokens?.accessToken && {
          Authorization: `Bearer ${authTokens.accessToken}`,
        }),
      },
      body: JSON.stringify({ message, context }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = (data as { message?: string }).message ?? res.statusText;
      if (res.status === 402) {
        throw new Error('Insufficient tokens. Please recharge to continue.');
      }
      throw new Error(msg);
    }

    const reply = (data as { reply?: string }).reply ?? '';
    const tokensUsed = Math.max(0, Number((data as { tokensUsed?: number }).tokensUsed) || 50);
    return { reply, tokensUsed };
  } catch (e) {
    if (e instanceof Error) throw e;
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
