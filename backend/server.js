/**
 * CodeVerse API – runs on Render or locally.
 * Implements POST /ai/chat and POST /auth/exchange (Google & GitHub OAuth).
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai').default;
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const JWT_SECRET = process.env.JWT_SECRET || 'codeverse-dev-secret-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Health check (Render uses this to know the service is up)
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'codeverse-api',
    ai: openai ? 'openai' : 'mock',
    auth: !!(GOOGLE_CLIENT_ID || GITHUB_CLIENT_ID),
  });
});

/**
 * POST /auth/exchange
 * Body: { provider: 'google' | 'github', code: string, redirectUri?: string, codeVerifier?: string }
 * Response: { user: { id, email, name, avatar?, provider }, accessToken: string }
 */
app.post('/auth/exchange', async (req, res) => {
  try {
    const { provider, code, redirectUri, codeVerifier } = req.body || {};
    if (!provider || !code) {
      return res.status(400).json({ message: 'Missing provider or code.' });
    }
    if (provider !== 'google' && provider !== 'github') {
      return res.status(400).json({ message: 'Provider must be google or github.' });
    }

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
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri || 'http://localhost',
          ...(codeVerifier && { code_verifier: codeVerifier }),
        }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error('Google token error:', err);
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
          code,
          redirect_uri: redirectUri || 'http://localhost',
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
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ user: profile, accessToken });
  } catch (err) {
    console.error('/auth/exchange error:', err);
    res.status(500).json({ message: err.message || 'Sign-in failed.' });
  }
});

/**
 * POST /ai/chat
 * Body: { message: string, context?: string }
 * Response: { reply: string, tokensUsed: number }
 * 402: insufficient tokens (app shows recharge message)
 */
app.post('/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid "message" in body.' });
    }

    // Optional: validate JWT and load user token balance from DB (see database/schema.sql)
    // const userId = req.user?.id; const balance = await getTokenBalance(userId);
    // if (balance < 100) return res.status(402).json({ message: 'Insufficient tokens.' });

    if (openai) {
      const systemContent =
        context && context.trim()
          ? `You are a friendly programming mentor. The user is learning in this context: ${context.trim()}. Explain clearly and concisely.`
          : 'You are a friendly programming mentor. Explain concepts clearly and concisely. Help with code and interview prep.';

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || "I couldn't generate a reply.";
      const tokensUsed =
        completion.usage?.total_tokens ?? Math.ceil((message.length + reply.length) / 4);

      return res.json({ reply, tokensUsed });
    }

    // No OPENAI_API_KEY: return mock so the app still works
    const mockReply =
      "I'm the CodeVerse AI mentor. Set OPENAI_API_KEY on Render (and redeploy) to enable real AI. Until then, try the articles in the app for learning!";
    res.json({ reply: mockReply, tokensUsed: 50 });
  } catch (err) {
    console.error('/ai/chat error:', err.message);
    if (err.status === 401) {
      return res.status(500).json({ message: 'Invalid OpenAI API key. Check OPENAI_API_KEY.' });
    }
    if (err.status === 429) {
      return res.status(503).json({ message: 'AI is busy. Please try again in a moment.' });
    }
    res.status(500).json({ message: err.message || 'AI request failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`CodeVerse API listening on port ${PORT}`);
});
