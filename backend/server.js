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
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

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

// Database connection pool
const pool = process.env.DATABASE_URL
  ? new Pool({ 
      connectionString: process.env.DATABASE_URL, 
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    })
  : null;

// Test database connection on startup
if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });
  
  // Test connection
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ Database connected successfully');
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err.message);
      if (isProduction) {
        console.error('FATAL: Cannot connect to database in production');
        process.exit(1);
      }
    });
} else {
  console.warn('⚠️  DATABASE_URL not set - database operations will be mocked');
  if (isProduction) {
    console.error('FATAL: DATABASE_URL must be set in production');
    process.exit(1);
  }
}

// Email transporter (nodemailer)
let emailTransporter = null;
if (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY) {
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid via SMTP
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (process.env.SMTP_HOST) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@codeverse.ai';
const APP_URL = process.env.APP_URL || 'https://codeverse-api-429f.onrender.com';

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

// --- Database helpers ---

async function findUserByEmail(email) {
  if (!pool) {
    console.warn('⚠️  Database not configured - cannot find user');
    return null;
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('❌ Error finding user by email:', err.message);
    throw err;
  }
}

async function findUserByProviderId(providerId, provider) {
  if (!pool) return null;
  const result = await pool.query('SELECT * FROM users WHERE provider_id = $1 AND provider = $2', [providerId, provider]);
  return result.rows[0] || null;
}

async function createUser({ email, name, passwordHash }) {
  if (!pool) {
    console.warn('⚠️  Database not configured - returning mock user');
    return { id: `mock-${Date.now()}`, email, name, email_verified: false, provider: 'email' };
  }
  
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  try {
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, provider, email_verification_token, email_verification_expires_at)
       VALUES ($1, $2, $3, 'email', $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [email.toLowerCase().trim(), name, passwordHash, emailVerificationToken, emailVerificationExpires]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Email already registered');
    }
    
    const user = result.rows[0];
    console.log(`✅ User created in database: ${user.email} (ID: ${user.id})`);
    return user;
  } catch (err) {
    console.error('❌ Error creating user in database:', err.message);
    throw err;
  }
}

async function logSecurityEvent(userId, eventType, ipAddress, userAgent, details = {}) {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO security_audit_logs (user_id, event_type, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, eventType, ipAddress, userAgent, JSON.stringify(details)]
    );
  } catch (e) {
    if (!isProduction) console.error('Failed to log security event:', e);
  }
}

async function checkAccountLocked(user) {
  if (!user.account_locked_until) return false;
  return new Date(user.account_locked_until) > new Date();
}

async function incrementFailedLoginAttempts(userId) {
  if (!pool) return;
  const result = await pool.query(
    `UPDATE users 
     SET failed_login_attempts = failed_login_attempts + 1,
         account_locked_until = CASE 
           WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
           ELSE account_locked_until
         END
     WHERE id = $1
     RETURNING failed_login_attempts, account_locked_until`,
    [userId]
  );
  return result.rows[0];
}

async function resetFailedLoginAttempts(userId) {
  if (!pool) return;
  await pool.query(
    'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = $1',
    [userId]
  );
}

async function updateLastLogin(userId) {
  if (!pool) return;
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
}

async function createRefreshToken(userId, expiresAt) {
  if (!pool) return crypto.randomBytes(32).toString('hex');
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return token;
}

async function findRefreshToken(token) {
  if (!pool) return null;
  const result = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  return result.rows[0] || null;
}

async function deleteRefreshToken(token) {
  if (!pool) return;
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

async function createMagicLinkToken(email, userId = null) {
  if (!pool) return crypto.randomBytes(32).toString('hex');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await pool.query(
    'INSERT INTO magic_link_tokens (email, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
    [email.toLowerCase().trim(), userId, token, expiresAt]
  );
  return token;
}

async function findMagicLinkToken(token) {
  if (!pool) return null;
  const result = await pool.query(
    'SELECT * FROM magic_link_tokens WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
    [token]
  );
  return result.rows[0] || null;
}

async function markMagicLinkTokenUsed(token) {
  if (!pool) return;
  await pool.query('UPDATE magic_link_tokens SET used = TRUE WHERE token = $1', [token]);
}

function generateTokens(user) {
  const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, type: 'access' },
    secret,
    { expiresIn: accessTokenExpiresIn }
  );
  return { accessToken };
}

async function generateTokensWithRefresh(user, rememberMe = false) {
  const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const refreshExpiresIn = rememberMe
    ? process.env.JWT_REFRESH_EXPIRES_IN_LONG || '30d'
    : process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, type: 'access' },
    secret,
    { expiresIn: accessTokenExpiresIn }
  );
  
  const expiresAt = new Date(Date.now() + parseExpiresIn(refreshExpiresIn));
  const refreshToken = await createRefreshToken(user.id, expiresAt);
  
  return { accessToken, refreshToken, expiresAt: expiresAt.toISOString() };
}

function parseExpiresIn(str) {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return Number(num) * multipliers[unit];
}

async function sendMagicLinkEmail(email, token, redirectUrl) {
  if (!emailTransporter) {
    if (!isProduction) console.log(`[DEV] Magic link for ${email}: ${APP_URL}/auth/magic-link/verify?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`);
    return;
  }
  const magicLink = `${APP_URL}/auth/magic-link/verify?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`;
  await emailTransporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Sign in to CodeVerse',
    html: `
      <h2>Sign in to CodeVerse</h2>
      <p>Click the link below to sign in (this link expires in 15 minutes):</p>
      <p><a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#6c9eff;color:#fff;text-decoration:none;border-radius:8px;">Sign In</a></p>
      <p>Or copy this URL:</p>
      <p style="word-break:break-all;">${magicLink}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

// --- Routes ---

// Health (for load balancers / Render)
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'disconnected',
  };
  
  // Check database connection
  if (pool) {
    try {
      await pool.query('SELECT 1');
      health.database = 'connected';
    } catch (err) {
      health.database = 'error';
      health.databaseError = err.message;
    }
  }
  
  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
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

/** Send instant redirect to app - no visible page, immediate redirect. */
function sendRedirectToApp(res, target) {
  // Use HTTP 302 redirect - browsers will handle this immediately
  // For custom schemes (exp://, codeverse-ai://), browsers will open the app directly
  res.redirect(302, target);
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

    // Create or update user in database
    const user = await createUser({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatar,
      provider: profile.provider,
      providerId: profile.id,
    });

    const { accessToken, refreshToken, expiresAt } = await generateTokensWithRefresh(user, false);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: user.provider,
      },
      accessToken,
      refreshToken,
      expiresAt,
    });
  } catch (err) {
    if (!isProduction) console.error('/auth/exchange error:', err);
    res.status(500).json({
      message: isProduction ? 'Sign-in failed.' : (err.message || 'Sign-in failed.'),
    });
  }
});

/**
 * POST /auth/register
 * Body: { email: string, password: string, name?: string }
 */
app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase, and a number.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12); // Higher cost for better security
    
    // Create user in PostgreSQL database
    console.log(`[Register] Creating user in database: ${email}`);
    const user = await createUser({
      email,
      name: name || email.split('@')[0],
      passwordHash,
    });
    console.log(`[Register] User created successfully: ${user.id}`);

    // Send email verification
    if (emailTransporter && user.email_verification_token) {
      const verificationUrl = `${APP_URL}/auth/verify-email?token=${user.email_verification_token}`;
      await emailTransporter.sendMail({
        from: EMAIL_FROM,
        to: user.email,
        subject: 'Verify your CodeVerse account',
        html: `
          <h2>Welcome to CodeVerse!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#6c9eff;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a></p>
          <p>Or copy this URL: ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
        `,
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    await logSecurityEvent(user.id, 'user_registered', ipAddress, userAgent);

    const { accessToken, refreshToken, expiresAt } = await generateTokensWithRefresh(user, false);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: user.provider,
        emailVerified: user.email_verified,
      },
      accessToken,
      refreshToken,
      expiresAt,
    });
  } catch (err) {
    if (!isProduction) console.error('/auth/register error:', err);
    res.status(500).json({
      message: isProduction ? 'Registration failed.' : (err.message || 'Registration failed.'),
    });
  }
});

/**
 * POST /auth/login
 * Body: { email: string, password: string, rememberMe?: boolean, mfaCode?: string }
 * Enterprise-grade login with account lockout, MFA, and security logging
 */
app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password, rememberMe, mfaCode } = req.body || {};
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) {
      // Don't reveal if user exists - security best practice
      await logSecurityEvent(null, 'login_failed', ipAddress, userAgent, { email, reason: 'invalid_credentials' });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check if account is locked
    if (await checkAccountLocked(user)) {
      await logSecurityEvent(user.id, 'login_blocked', ipAddress, userAgent, { reason: 'account_locked' });
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        lockedUntil: user.account_locked_until
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await incrementFailedLoginAttempts(user.id);
      await logSecurityEvent(user.id, 'login_failed', ipAddress, userAgent, { reason: 'invalid_password' });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check MFA if enabled
    if (user.mfa_enabled) {
      if (!mfaCode) {
        return res.status(200).json({ 
          requiresMfa: true,
          message: 'MFA code required.'
        });
      }

      const isValidMfa = authenticator.verify({ token: mfaCode, secret: user.mfa_secret });
      if (!isValidMfa) {
        // Check backup codes
        const backupCodes = user.mfa_backup_codes || [];
        const codeIndex = backupCodes.indexOf(mfaCode);
        if (codeIndex === -1) {
          await logSecurityEvent(user.id, 'mfa_failed', ipAddress, userAgent);
          return res.status(401).json({ message: 'Invalid MFA code.' });
        }
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await pool.query('UPDATE users SET mfa_backup_codes = $1 WHERE id = $2', [backupCodes, user.id]);
      }
    }

    // Successful login
    await resetFailedLoginAttempts(user.id);
    await updateLastLogin(user.id);
    await logSecurityEvent(user.id, 'login_success', ipAddress, userAgent);

    const { accessToken, refreshToken, expiresAt } = await generateTokensWithRefresh(user, !!rememberMe);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: user.provider,
        mfaEnabled: user.mfa_enabled,
      },
      accessToken,
      refreshToken,
      expiresAt,
    });
  } catch (err) {
    if (!isProduction) console.error('/auth/login error:', err);
    res.status(500).json({
      message: isProduction ? 'Login failed.' : (err.message || 'Login failed.'),
    });
  }
});

/**
 * POST /auth/magic-link/send
 * Body: { email: string, redirectUrl?: string }
 */
app.post('/auth/magic-link/send', authLimiter, async (req, res) => {
  try {
    const { email, redirectUrl } = req.body || {};
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required.' });
    }

    const user = await findUserByEmail(email);
    const token = await createMagicLinkToken(email, user?.id || null);
    const finalRedirectUrl = redirectUrl || 'codeverse-ai://auth';

    await sendMagicLinkEmail(email, token, finalRedirectUrl);

    // Always return success (don't reveal if email exists)
    return res.json({ message: 'If the email exists, a magic link has been sent.' });
  } catch (err) {
    if (!isProduction) console.error('/auth/magic-link/send error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to send magic link.' : (err.message || 'Failed to send magic link.'),
    });
  }
});

/**
 * GET /auth/magic-link/verify?token=...&redirect=...
 */
app.get('/auth/magic-link/verify', async (req, res) => {
  try {
    const { token, redirect } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send('Missing or invalid token.');
    }

    const magicToken = await findMagicLinkToken(token);
    if (!magicToken) {
      return res.status(400).send('Invalid or expired magic link.');
    }

    await markMagicLinkTokenUsed(token);

    // Find or create user
    let user = await findUserByEmail(magicToken.email);
    if (!user) {
      user = await createUser({
        email: magicToken.email,
        name: magicToken.email.split('@')[0],
        provider: 'email',
      });
    }

    const { accessToken, refreshToken } = await generateTokensWithRefresh(user, false);

    // Redirect to app with tokens
    const redirectUrl = redirect || 'codeverse-ai://auth';
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      provider: 'email',
    });
    const target = redirectUrl.includes('?') ? `${redirectUrl}&${params}` : `${redirectUrl}?${params}`;

    return sendRedirectToApp(res, target);
  } catch (err) {
    if (!isProduction) console.error('/auth/magic-link/verify error:', err);
    res.status(500).send('Magic link verification failed.');
  }
});

/**
 * POST /auth/refresh
 * Body: { refreshToken: string }
 */
app.post('/auth/refresh', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const tokenRecord = await findRefreshToken(refreshToken);
    if (!tokenRecord) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    // Get user
    if (!pool) {
      return res.status(503).json({ message: 'Database not configured.' });
    }
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [tokenRecord.user_id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }
    const user = userResult.rows[0];

    // Generate new access token
    const { accessToken } = generateTokens(user);

    return res.json({ accessToken });
  } catch (err) {
    if (!isProduction) console.error('/auth/refresh error:', err);
    res.status(500).json({
      message: isProduction ? 'Token refresh failed.' : (err.message || 'Token refresh failed.'),
    });
  }
});

/**
 * POST /auth/logout
 * Body: { refreshToken?: string }
 */
app.post('/auth/logout', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    
    // Get user from token if available
    let userId = null;
    if (refreshToken) {
      const tokenRecord = await findRefreshToken(refreshToken);
      if (tokenRecord) {
        userId = tokenRecord.user_id;
        await deleteRefreshToken(refreshToken);
      }
    }
    
    if (userId) {
      await logSecurityEvent(userId, 'logout', ipAddress, userAgent);
    }
    
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    if (!isProduction) console.error('/auth/logout error:', err);
    res.status(500).json({
      message: isProduction ? 'Logout failed.' : (err.message || 'Logout failed.'),
    });
  }
});

/**
 * GET /auth/verify-email?token=...
 * Verify email address
 */
app.get('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send('Missing verification token.');
    }

    if (!pool) {
      return res.status(503).send('Database not configured.');
    }

    const result = await pool.query(
      `SELECT * FROM users 
       WHERE email_verification_token = $1 
       AND email_verification_expires_at > NOW() 
       AND email_verified = FALSE`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send('Invalid or expired verification token.');
    }

    const user = result.rows[0];
    await pool.query(
      `UPDATE users 
       SET email_verified = TRUE, 
           email_verification_token = NULL,
           email_verification_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    await logSecurityEvent(user.id, 'email_verified', req.ip, req.get('user-agent'));

    return res.send(`
      <html>
        <head><title>Email Verified</title></head>
        <body style="font-family:system-ui;text-align:center;padding:40px;">
          <h1>Email Verified Successfully!</h1>
          <p>Your email has been verified. You can now close this window and return to the app.</p>
        </body>
      </html>
    `);
  } catch (err) {
    if (!isProduction) console.error('/auth/verify-email error:', err);
    res.status(500).send('Email verification failed.');
  }
});

/**
 * POST /auth/mfa/setup
 * Generate MFA secret and QR code
 * Requires authentication
 */
app.post('/auth/mfa/setup', authLimiter, async (req, res) => {
  try {
    // Get user from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentUser = user.rows[0];
    if (currentUser.mfa_enabled) {
      return res.status(400).json({ message: 'MFA is already enabled.' });
    }

    // Generate MFA secret
    const mfaSecret = authenticator.generateSecret();
    const serviceName = 'CodeVerse';
    const accountName = currentUser.email;
    const otpAuthUrl = authenticator.keyuri(accountName, serviceName, mfaSecret);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store secret temporarily (user needs to verify before enabling)
    await pool.query(
      `UPDATE users 
       SET mfa_secret = $1, 
           mfa_backup_codes = $2
       WHERE id = $3`,
      [mfaSecret, backupCodes, currentUser.id]
    );

    await logSecurityEvent(currentUser.id, 'mfa_setup_initiated', req.ip, req.get('user-agent'));

    return res.json({
      secret: mfaSecret,
      qrCodeUrl,
      backupCodes,
      message: 'Scan QR code with authenticator app and verify to enable MFA.',
    });
  } catch (err) {
    if (!isProduction) console.error('/auth/mfa/setup error:', err);
    res.status(500).json({
      message: isProduction ? 'MFA setup failed.' : (err.message || 'MFA setup failed.'),
    });
  }
});

/**
 * POST /auth/mfa/verify
 * Verify MFA code and enable MFA
 * Requires authentication
 */
app.post('/auth/mfa/verify', authLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const { mfaCode } = req.body || {};
    if (!mfaCode || typeof mfaCode !== 'string') {
      return res.status(400).json({ message: 'MFA code is required.' });
    }

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentUser = user.rows[0];
    if (!currentUser.mfa_secret) {
      return res.status(400).json({ message: 'MFA setup not initiated. Call /auth/mfa/setup first.' });
    }

    const isValid = authenticator.verify({ token: mfaCode, secret: currentUser.mfa_secret });
    if (!isValid) {
      await logSecurityEvent(currentUser.id, 'mfa_verification_failed', req.ip, req.get('user-agent'));
      return res.status(401).json({ message: 'Invalid MFA code.' });
    }

    // Enable MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = TRUE WHERE id = $1',
      [currentUser.id]
    );

    await logSecurityEvent(currentUser.id, 'mfa_enabled', req.ip, req.get('user-agent'));

    return res.json({
      message: 'MFA enabled successfully.',
      backupCodes: currentUser.mfa_backup_codes,
    });
  } catch (err) {
    if (!isProduction) console.error('/auth/mfa/verify error:', err);
    res.status(500).json({
      message: isProduction ? 'MFA verification failed.' : (err.message || 'MFA verification failed.'),
    });
  }
});

/**
 * POST /auth/mfa/disable
 * Disable MFA
 * Requires authentication
 */
app.post('/auth/mfa/disable', authLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const { password, mfaCode } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: 'Password is required to disable MFA.' });
    }

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentUser = user.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, currentUser.password_hash);
    if (!validPassword) {
      await logSecurityEvent(currentUser.id, 'mfa_disable_failed', req.ip, req.get('user-agent'), { reason: 'invalid_password' });
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // Verify MFA if enabled
    if (currentUser.mfa_enabled && currentUser.mfa_secret) {
      if (!mfaCode) {
        return res.status(400).json({ message: 'MFA code is required.' });
      }
      const isValidMfa = authenticator.verify({ token: mfaCode, secret: currentUser.mfa_secret });
      if (!isValidMfa) {
        await logSecurityEvent(currentUser.id, 'mfa_disable_failed', req.ip, req.get('user-agent'), { reason: 'invalid_mfa' });
        return res.status(401).json({ message: 'Invalid MFA code.' });
      }
    }

    // Disable MFA
    await pool.query(
      `UPDATE users 
       SET mfa_enabled = FALSE, 
           mfa_secret = NULL,
           mfa_backup_codes = NULL
       WHERE id = $1`,
      [currentUser.id]
    );

    await logSecurityEvent(currentUser.id, 'mfa_disabled', req.ip, req.get('user-agent'));

    return res.json({ message: 'MFA disabled successfully.' });
  } catch (err) {
    if (!isProduction) console.error('/auth/mfa/disable error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to disable MFA.' : (err.message || 'Failed to disable MFA.'),
    });
  }
});

/**
 * POST /auth/password/reset-request
 * Request password reset
 */
app.post('/auth/password/reset-request', authLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    if (emailTransporter) {
      const resetUrl = `${APP_URL}/auth/password/reset?token=${resetToken}`;
      await emailTransporter.sendMail({
        from: EMAIL_FROM,
        to: user.email,
        subject: 'Reset your CodeVerse password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password (expires in 1 hour):</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6c9eff;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a></p>
          <p>Or copy this URL: ${resetUrl}</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    }

    await logSecurityEvent(user.id, 'password_reset_requested', req.ip, req.get('user-agent'));

    return res.json({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (err) {
    if (!isProduction) console.error('/auth/password/reset-request error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to send reset link.' : (err.message || 'Failed to send reset link.'),
    });
  }
});

/**
 * POST /auth/password/reset
 * Reset password with token
 */
app.post('/auth/password/reset', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required.' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase, and a number.' });
    }

    const tokenResult = await pool.query(
      `SELECT prt.*, u.id as user_id 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 
       AND prt.expires_at > NOW() 
       AND prt.used = FALSE`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const tokenRecord = tokenResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and invalidate token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           password_changed_at = NOW(),
           failed_login_attempts = 0,
           account_locked_until = NULL
       WHERE id = $2`,
      [passwordHash, tokenRecord.user_id]
    );

    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [token]
    );

    // Invalidate all refresh tokens for security
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [tokenRecord.user_id]
    );

    await logSecurityEvent(tokenRecord.user_id, 'password_reset', req.ip, req.get('user-agent'));

    return res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (err) {
    if (!isProduction) console.error('/auth/password/reset error:', err);
    res.status(500).json({
      message: isProduction ? 'Password reset failed.' : (err.message || 'Password reset failed.'),
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
  if (!openai) console.warn('⚠️  OpenAI not configured - AI chat will be mocked');
  if (!pool) console.warn('⚠️  Database not configured - user data will not be persisted');
  if (pool) console.log('✅ Database connection pool initialized');
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
