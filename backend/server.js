/**
 * CodeVerse API – production-grade.
 * POST /ai/chat, POST /auth/exchange, health checks, security, rate limiting.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai').default;
const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// --- Config & validation ---
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (isProduction) {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('FATAL: In production, JWT_SECRET must be set and at least 32 characters.');
    process.exit(1);
  }
  const missing = [];
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) missing.push('Google OAuth');
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) missing.push('GitHub OAuth');
  if (!process.env.OPENAI_API_KEY) missing.push('OpenAI');
  if (missing.length) {
    console.warn('Production: optional services not configured:', missing.join(', '));
  }
}

const secret = JWT_SECRET || 'codeverse-dev-secret-change-in-production';

// CORS: allowlist in production, else allow all for dev
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];
const corsOptions = corsOrigins.length
  ? { origin: corsOrigins, optionsSuccessStatus: 200 }
  : { origin: true };

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// --- App ---
const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '500kb' }));

// General rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Stricter limits for auth and AI
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 100,
  message: { message: 'Too many sign-in attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isProduction ? 30 : 60,
  message: { message: 'Too many AI requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Routes ---

// Health (for load balancers / Render)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'codeverse-api',
    env: isProduction ? 'production' : 'development',
    ai: openai ? 'openai' : 'mock',
    auth: !!(GOOGLE_CLIENT_ID || GITHUB_CLIENT_ID),
  });
});

/** App deep-link scheme – redirect from here opens the app with the auth code. */
const APP_AUTH_SCHEME = 'codeverse-ai://auth';

/**
 * Parse state: optional "redirect_back" URL after last "." so backend can redirect to Expo Go (exp://...) or app (codeverse-ai://auth).
 */
function getRedirectBack(state) {
  if (!state || typeof state !== 'string') return APP_AUTH_SCHEME;
  const lastDot = state.lastIndexOf('.');
  if (lastDot === -1) return APP_AUTH_SCHEME;
  try {
    const encoded = state.slice(lastDot + 1);
    const decoded = decodeURIComponent(encoded);
    if (decoded.startsWith('exp://') || decoded.startsWith('codeverse-ai://')) return decoded;
  } catch (e) {
    // ignore
  }
  return APP_AUTH_SCHEME;
}

/** Send HTML that redirects to the app immediately so the app opens and user lands on home. */
function sendRedirectToApp(res, target) {
  const escaped = target.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const scriptUrl = JSON.stringify(target);
  // Parse code from target URL to include in page (fallback if deep link fails)
  const urlMatch = target.match(/[?&]code=([^&]+)/);
  const codeParam = urlMatch ? urlMatch[1] : '';
  const providerMatch = target.match(/[?&]provider=([^&]+)/);
  const providerParam = providerMatch ? providerMatch[1] : '';
  
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta http-equiv="refresh" content="1;url=${escaped}">` +
    `<title>Opening app…</title><style>body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;background:#1a1a2e;color:#eee;}a{color:#6c9eff;margin-top:1rem;padding:12px 24px;background:#6c9eff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;}</style></head><body>` +
    `<p>Sign-in successful!</p><p>Opening app…</p><p><a href="${escaped}" style="margin-top:2rem;">Tap to Open App</a></p>` +
    `<script>try{var u=${scriptUrl};setTimeout(function(){window.location.href=u;},500);}catch(e){console.error('Redirect failed',e);}</script>` +
    // Store code in sessionStorage as fallback (app can read via WebView if needed)
    (codeParam ? `<script>try{sessionStorage.setItem('oauth_code','${codeParam}');sessionStorage.setItem('oauth_provider','${providerParam}');}catch(e){}</script>` : '') +
    `</body></html>`
  );
}

/**
 * GET /auth/callback/google?code=...&state=...
 * Redirects browser to app (or Expo Go exp:// URL from state) so the app can exchange the code.
 * For Expo Go, encodes code in path to avoid Android browser stripping query params.
 */
app.get('/auth/callback/google', (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing code');
  }
  const redirectBack = getRedirectBack(state);
  
  // For Expo Go (exp://), encode code in path to avoid Android browser stripping query params
  let target;
  if (redirectBack.startsWith('exp://')) {
    // Use path format: exp://.../auth/google/CODE_ENCODED
    const encodedCode = encodeURIComponent(code);
    target = `${redirectBack}/google/${encodedCode}`;
    if (state && typeof state === 'string') {
      target += `?state=${encodeURIComponent(state)}`;
    }
  } else {
    // For standalone (codeverse-ai://), use query params
    const params = new URLSearchParams({ code, provider: 'google' });
    if (state && typeof state === 'string') params.set('state', state);
    target = redirectBack.includes('?') ? `${redirectBack}&${params}` : `${redirectBack}?${params}`;
  }
  
  return sendRedirectToApp(res, target);
});

/**
 * GET /auth/callback/github?code=...&state=...
 * Same for GitHub.
 */
app.get('/auth/callback/github', (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing code');
  }
  const redirectBack = getRedirectBack(state);
  
  // For Expo Go (exp://), encode code in path to avoid Android browser stripping query params
  let target;
  if (redirectBack.startsWith('exp://')) {
    // Use path format: exp://.../auth/github/CODE_ENCODED
    const encodedCode = encodeURIComponent(code);
    target = `${redirectBack}/github/${encodedCode}`;
    if (state && typeof state === 'string') {
      target += `?state=${encodeURIComponent(state)}`;
    }
  } else {
    // For standalone (codeverse-ai://), use query params
    const params = new URLSearchParams({ code, provider: 'github' });
    if (state && typeof state === 'string') params.set('state', state);
    target = redirectBack.includes('?') ? `${redirectBack}&${params}` : `${redirectBack}?${params}`;
  }
  
  return sendRedirectToApp(res, target);
});

/**
 * POST /auth/exchange
 * Body: { provider: 'google' | 'github', code: string, redirectUri?: string, codeVerifier?: string }
 */
app.post('/auth/exchange', authLimiter, async (req, res) => {
  try {
    const { provider, code, redirectUri, codeVerifier } = req.body || {};
    if (!provider || !code) {
      return res.status(400).json({ message: 'Missing provider or code.' });
    }
    if (provider !== 'google' && provider !== 'github') {
      return res.status(400).json({ message: 'Provider must be google or github.' });
    }
    const redirect = typeof redirectUri === 'string' ? redirectUri.trim() : '';
    if (isProduction && !redirect) {
      return res.status(400).json({ message: 'Missing redirect URI.' });
    }
    if (redirect.length > 512) {
      return res.status(400).json({ message: 'Invalid redirect URI.' });
    }
    const finalRedirectUri = redirect || 'http://localhost';

    let profile;
    if (provider === 'google') {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({ message: 'Google sign-in is not configured.' });
      }
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code: String(code).slice(0, 2048),
          grant_type: 'authorization_code',
          redirect_uri: finalRedirectUri,
          ...(codeVerifier && typeof codeVerifier === 'string' && { code_verifier: codeVerifier.slice(0, 256) }),
        }),
      });
      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        if (!isProduction) console.error('Google token error:', errText);
        return res.status(400).json({ message: 'Google sign-in failed. Try again.' });
      }
      const tokens = await tokenRes.json();
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!userRes.ok) {
        return res.status(400).json({ message: 'Could not load Google profile.' });
      }
      const g = await userRes.json();
      profile = {
        id: `google-${g.id}`,
        email: g.email || '',
        name: g.name || g.email || 'User',
        avatar: g.picture,
        provider: 'google',
      };
    } else {
      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(503).json({ message: 'GitHub sign-in is not configured.' });
      }
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code: String(code).slice(0, 2048),
          redirect_uri: finalRedirectUri,
        }),
      });
      if (!tokenRes.ok) {
        return res.status(400).json({ message: 'GitHub sign-in failed. Try again.' });
      }
      const tokens = await tokenRes.json();
      if (tokens.error) {
        return res.status(400).json({ message: tokens.error_description || 'GitHub sign-in failed.' });
      }
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!userRes.ok) {
        return res.status(400).json({ message: 'Could not load GitHub profile.' });
      }
      const g = await userRes.json();
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      let email = g.email;
      if (emailRes.ok) {
        const emails = await emailRes.json();
        const primary = emails.find((e) => e.primary);
        if (primary) email = primary.email;
      }
      profile = {
        id: `github-${g.id}`,
        email: email || '',
        name: g.name || g.login || 'User',
        avatar: g.avatar_url,
        provider: 'github',
      };
    }

    const accessToken = jwt.sign(
      { sub: profile.id, email: profile.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return res.json({ user: profile, accessToken });
  } catch (err) {
    if (!isProduction) console.error('/auth/exchange error:', err);
    res.status(500).json({
      message: isProduction ? 'Sign-in failed.' : (err.message || 'Sign-in failed.'),
    });
  }
});

/**
 * POST /ai/chat
 * Body: { message: string, context?: string }
 * Response: { reply: string, tokensUsed: number }
 */
app.post('/ai/chat', aiLimiter, async (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid "message" in body.' });
    }

    if (openai) {
      const systemContent =
        context && String(context).trim()
          ? `You are a friendly programming mentor. The user is learning in this context: ${String(context).trim()}. Explain clearly and concisely.`
          : 'You are a friendly programming mentor. Explain clearly and concisely. Help with code and interview prep.';

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: message.slice(0, 16000) },
        ],
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || "I couldn't generate a reply.";
      const tokensUsed =
        completion.usage?.total_tokens ?? Math.ceil((message.length + reply.length) / 4);

      return res.json({ reply, tokensUsed });
    }

    const mockReply =
      "I'm the CodeVerse AI mentor. Set OPENAI_API_KEY to enable real AI.";
    res.json({ reply: mockReply, tokensUsed: 50 });
  } catch (err) {
    if (!isProduction) console.error('/ai/chat error:', err.message);
    if (err.status === 401) {
      return res.status(500).json({ message: 'Invalid OpenAI API key.' });
    }
    if (err.status === 429) {
      return res.status(503).json({ message: 'AI is busy. Please try again in a moment.' });
    }
    res.status(500).json({
      message: isProduction ? 'AI request failed.' : (err.message || 'AI request failed.'),
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler (unhandled errors)
app.use((err, req, res, next) => {
  if (!isProduction) console.error(err);
  res.status(500).json({
    message: isProduction ? 'Something went wrong.' : (err.message || 'Something went wrong.'),
  });
});

// --- Server & graceful shutdown ---
const server = app.listen(PORT, () => {
  console.log(`CodeVerse API listening on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing server...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
