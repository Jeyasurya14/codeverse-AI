/**
 * CodeVerse API – production-grade.
 * POST /ai/chat, POST /auth/exchange, health checks, security, rate limiting.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
const fs = require('fs');

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
      connectionTimeoutMillis: 30000, // Return an error after 30 seconds if connection cannot be established
      query_timeout: 30000, // Query timeout in milliseconds
      statement_timeout: 30000, // Statement timeout in milliseconds
    })
  : null;

// Test database connection on startup with retry logic
if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });
  
  // Test connection with retry logic
  let retries = 3;
  const testConnection = async () => {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection pool initialized');
      console.log('✅ Database connected successfully');
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
        console.error(`   Error code: ${err.code}`);
        console.error(`   Attempting to connect to: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'unknown'}`);
      }
      
      retries--;
      if (retries > 0) {
        console.log(`   Retrying connection... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return testConnection();
      }
      
      if (isProduction) {
        console.error('FATAL: Cannot connect to database in production after retries');
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing without database connection (development mode)');
      }
    }
  };
  
  testConnection();
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

// Initialize OpenAI client with proper error handling and validation
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const apiKey = process.env.OPENAI_API_KEY.trim();
    if (apiKey && apiKey.length > 0) {
      // Validate API key format (should start with sk-)
      if (!apiKey.startsWith('sk-')) {
        console.warn('⚠️  OPENAI_API_KEY format looks invalid (should start with sk-)');
      }
      openai = new OpenAI({ 
        apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 2, // Retry failed requests up to 2 times
      });
      console.log('✅ OpenAI client initialized');
      
      // Test the API key with a simple request (optional, can be disabled for faster startup)
      if (process.env.VALIDATE_OPENAI_KEY !== 'false') {
        // Don't await - let it validate in background
        openai.models.list().then(() => {
          console.log('✅ OpenAI API key validated successfully');
        }).catch((err) => {
          console.error('❌ OpenAI API key validation failed:', err.message);
          if (err.status === 401) {
            console.error('   The API key appears to be invalid or expired. Please check your OPENAI_API_KEY.');
          }
        });
      }
    } else {
      console.warn('⚠️  OPENAI_API_KEY is empty');
    }
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
    openai = null;
  }
} else {
  console.warn('⚠️  OPENAI_API_KEY not set - AI chat will be mocked');
}

// Razorpay (India) – monthly subscriptions
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const RAZORPAY_PLANS = {
  starter: process.env.RAZORPAY_PLAN_STARTER,
  learner: process.env.RAZORPAY_PLAN_LEARNER,
  pro: process.env.RAZORPAY_PLAN_PRO,
  unlimited: process.env.RAZORPAY_PLAN_UNLIMITED,
};
const Razorpay = require('razorpay');
const razorpay = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;
const bodyParser = require('body-parser');

// Subscription plan display (prices in INR – set to match Razorpay Plans)
const SUBSCRIPTION_PLANS_CONFIG = [
  { planId: 'starter', name: 'Starter', priceMonthly: 199, tokens: 500, conversationLimit: 10 },
  { planId: 'learner', name: 'Learner', priceMonthly: 499, tokens: 1500, conversationLimit: 25 },
  { planId: 'pro', name: 'Pro', priceMonthly: 999, tokens: 5000, conversationLimit: 100 },
  { planId: 'unlimited', name: 'Unlimited', priceMonthly: 1999, tokens: 15000, conversationLimit: -1 },
];

// --- App ---
const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));

// Razorpay webhook MUST use raw body for signature verification – register before express.json()
app.post('/api/webhooks/razorpay', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  handleRazorpayWebhook(req, res).catch((err) => {
    console.error('Razorpay webhook error:', err);
    res.status(500).send('Webhook error');
  });
});

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

// Rate limiter for conversation creation (prevent abuse)
const conversationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 10 : 50, // Max 10 conversations per 15 minutes in production
  message: { message: 'Too many conversation creation attempts. Please wait before creating more.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
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

// --- Token Usage Management ---

// Token cost constants
const TOKENS_PER_AI_MESSAGE = 10; // Fixed cost per AI message
const AI_TOKENS_FREE_LIMIT = 300; // Free tokens limit per user

// MNC-grade AI Mentor: professional, senior-level guidance (OpenAI API key in backend .env)
const AI_MENTOR_SYSTEM_PROMPT = `You are the CodeVerse AI Mentor: a senior software engineer and tech lead with experience at top-tier technology companies (FAANG and global MNCs). Your role is to give professional, production-grade guidance.

**Expertise:** Algorithms & data structures, system design, clean code, design patterns, code review, technical interviews, best practices (SOLID, DRY, testing), and career growth.

**Response style:**
- Be concise and actionable. Prefer bullets or numbered steps when explaining.
- Use markdown: **bold** for emphasis, \`code\` for identifiers, and fenced \`\`\`code blocks\`\`\` for snippets. Always use proper syntax (e.g. \`\`\`javascript, \`\`\`python).
- For algorithms: give time/space complexity (Big O) when relevant.
- For design: consider scale, trade-offs, and real-world constraints.
- For code: suggest clean, readable, maintainable solutions; mention edge cases and tests when appropriate.
- Stay professional and encouraging. No filler or marketing language.

**Rules:**
- Answer in the same language the user writes in (e.g. English if they write in English).
- If the question is vague, ask one short clarifying question.
- Do not make up APIs or library versions; if unsure, say so.
- Keep responses focused. For long topics, offer a structured breakdown (e.g. 1. Overview 2. Approach 3. Code 4. Complexity).`;

// Conversation limits based on subscription plan
const CONVERSATION_LIMITS = {
  free: 2,
  starter: 10,
  learner: 25,
  pro: 100,
  unlimited: -1, // -1 means unlimited
};

/**
 * Initialize token_usage record for a new user
 */
async function initializeTokenUsage(userId) {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO token_usage (user_id, free_used, purchased_total, purchased_used)
       VALUES ($1, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
  } catch (err) {
    console.error('❌ Error initializing token usage:', err.message);
    throw err;
  }
}

/**
 * Get token usage for a user
 */
async function getTokenUsage(userId) {
  if (!pool) {
    return { freeUsed: 0, purchasedTotal: 0, purchasedUsed: 0 };
  }
  try {
    const result = await pool.query(
      'SELECT free_used, purchased_total, purchased_used FROM token_usage WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      // Initialize if doesn't exist
      await initializeTokenUsage(userId);
      return { freeUsed: 0, purchasedTotal: 0, purchasedUsed: 0 };
    }
    const row = result.rows[0];
    return {
      freeUsed: row.free_used || 0,
      purchasedTotal: row.purchased_total || 0,
      purchasedUsed: row.purchased_used || 0,
    };
  } catch (err) {
    console.error('❌ Error getting token usage:', err.message);
    return { freeUsed: 0, purchasedTotal: 0, purchasedUsed: 0 };
  }
}

/**
 * Update token usage for a user (sync from frontend)
 */
async function updateTokenUsage(userId, freeUsed, purchasedTotal, purchasedUsed) {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO token_usage (user_id, free_used, purchased_total, purchased_used, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         free_used = EXCLUDED.free_used,
         purchased_total = EXCLUDED.purchased_total,
         purchased_used = EXCLUDED.purchased_used,
         updated_at = NOW()`,
      [userId, freeUsed || 0, purchasedTotal || 0, purchasedUsed || 0]
    );
  } catch (err) {
    console.error('❌ Error updating token usage:', err.message);
    throw err;
  }
}

/**
 * Check if user has enough tokens available
 */
async function checkTokenBalance(userId, required) {
  if (!pool) return { hasEnough: false, available: 0, freeRemaining: 0, purchasedRemaining: 0 };
  try {
    const usage = await getTokenUsage(userId);
    const freeRemaining = Math.max(0, AI_TOKENS_FREE_LIMIT - usage.freeUsed);
    const purchasedRemaining = Math.max(0, usage.purchasedTotal - usage.purchasedUsed);
    const totalAvailable = freeRemaining + purchasedRemaining;
    
    return {
      hasEnough: totalAvailable >= required,
      available: totalAvailable,
      freeRemaining,
      purchasedRemaining,
      freeUsed: usage.freeUsed,
      purchasedTotal: usage.purchasedTotal,
      purchasedUsed: usage.purchasedUsed,
    };
  } catch (err) {
    console.error('❌ Error checking token balance:', err.message);
    return { hasEnough: false, available: 0, freeRemaining: 0, purchasedRemaining: 0 };
  }
}

/**
 * Get user's subscription plan (with validation)
 */
async function getUserPlan(userId) {
  if (!pool) {
    throw new Error('Database not configured');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  
  try {
    const result = await pool.query(
      'SELECT subscription_plan FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const plan = result.rows[0]?.subscription_plan || 'free';
    
    // Validate plan is in allowed list
    if (!CONVERSATION_LIMITS.hasOwnProperty(plan)) {
      console.warn(`⚠️  Invalid subscription plan "${plan}" for user ${userId}, defaulting to "free"`);
      return 'free';
    }
    
    return plan;
  } catch (err) {
    if (err.message === 'User not found' || err.message === 'Invalid user ID') {
      throw err;
    }
    console.error('❌ Error getting user plan:', err.message);
    throw new Error('Failed to retrieve user plan');
  }
}

/**
 * Get conversation count for a user (with validation)
 */
async function getConversationCount(userId) {
  if (!pool) {
    throw new Error('Database not configured');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::int as count FROM ai_conversations WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.count || 0;
  } catch (err) {
    console.error('❌ Error getting conversation count:', err.message);
    throw new Error('Failed to retrieve conversation count');
  }
}

/**
 * Check if user can create a new conversation (atomic check)
 * Returns: { allowed: boolean, limit: number, current: number, plan: string }
 */
async function canCreateConversation(userId) {
  if (!pool) {
    throw new Error('Database not configured');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Get plan and count in a single transaction to avoid race conditions
    const result = await pool.query(
      `SELECT 
        u.subscription_plan,
        COUNT(c.id)::int as conversation_count
      FROM users u
      LEFT JOIN ai_conversations c ON c.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.subscription_plan`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const plan = result.rows[0]?.subscription_plan || 'free';
    const current = result.rows[0]?.conversation_count || 0;
    const limit = CONVERSATION_LIMITS[plan] || CONVERSATION_LIMITS.free;
    
    // Unlimited plan
    if (limit === -1) {
      return { allowed: true, limit: -1, current, plan };
    }
    
    return {
      allowed: current < limit,
      limit,
      current,
      plan,
    };
  } catch (err) {
    if (err.message === 'User not found' || err.message === 'Invalid user ID') {
      throw err;
    }
    console.error('❌ Error checking conversation limit:', err.message);
    throw new Error('Failed to check conversation limit');
  }
}

// --- Razorpay subscription helpers ---

/** Returns true if this event was newly inserted (should process). False if duplicate. */
async function ensureWebhookEventProcessed(eventId, eventType) {
  if (!pool) return false;
  try {
    const r = await pool.query(
      'INSERT INTO subscription_webhook_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING RETURNING id',
      [eventId, eventType]
    );
    return r.rowCount > 0;
  } catch (e) {
    return false;
  }
}

async function getOrCreateRazorpayCustomer(userId, email, name) {
  if (!razorpay || !pool) return null;
  const row = await pool.query(
    'SELECT razorpay_customer_id FROM users WHERE id = $1',
    [userId]
  );
  let customerId = row.rows[0]?.razorpay_customer_id;
  if (customerId) return customerId;
  try {
    const customer = await razorpay.customers.create({
      name: name || email?.split('@')[0] || 'Customer',
      email: email || '',
      contact: '', // optional
    });
    customerId = customer.id;
    await pool.query(
      'UPDATE users SET razorpay_customer_id = $1, updated_at = NOW() WHERE id = $2',
      [customerId, userId]
    );
    return customerId;
  } catch (err) {
    console.error('Razorpay customer create error:', err.message);
    return null;
  }
}

async function handleRazorpayWebhook(req, res) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook not configured');
  }
  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).send('Invalid body');
  }
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).send('Missing signature');
  }
  const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  if (expected !== signature) {
    return res.status(400).send('Invalid signature');
  }
  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch (e) {
    return res.status(400).send('Invalid JSON');
  }
  const eventId = payload.id || payload.event?.id;
  const eventType = payload.event || payload.entity;
  if (!eventId) {
    return res.status(200).send('OK');
  }
  const isNew = await ensureWebhookEventProcessed(eventId, eventType);
  if (!isNew) {
    return res.status(200).send('OK');
  }
  const sub = payload.payload?.subscription?.entity || payload.payload?.subscription;
  if (!sub) {
    return res.status(200).send('OK');
  }
  const razorpaySubId = sub.id;
  const status = sub.status;
  const notes = sub.notes || {};
  const userId = notes.user_id || notes.userId;
  const currentEnd = sub.current_end ? new Date(sub.current_end * 1000) : null;
  const endedAt = sub.ended_at ? new Date(sub.ended_at * 1000) : null;

  if (!pool) return res.status(200).send('OK');

  try {
    if (status === 'activated' || status === 'charged') {
      const planRow = await pool.query(
        'SELECT plan_id FROM subscriptions WHERE razorpay_subscription_id = $1',
        [razorpaySubId]
      );
      const planId = planRow.rows[0]?.plan_id || 'starter';
      const targetUserId = userId || (await pool.query('SELECT user_id FROM subscriptions WHERE razorpay_subscription_id = $1', [razorpaySubId])).rows[0]?.user_id;
      if (targetUserId) {
        await pool.query(
          'UPDATE users SET subscription_plan = $1, updated_at = NOW() WHERE id = $2',
          [planId, targetUserId]
        );
        await pool.query(
          `UPDATE subscriptions SET status = $1, current_period_start = $2, current_period_end = $3, updated_at = NOW()
           WHERE razorpay_subscription_id = $4`,
          [status, sub.current_start ? new Date(sub.current_start * 1000) : null, currentEnd, razorpaySubId]
        );
      }
    } else if (status === 'cancelled' || status === 'completed' || status === 'halted') {
      const targetUserId = userId || (await pool.query('SELECT user_id FROM subscriptions WHERE razorpay_subscription_id = $1', [razorpaySubId])).rows[0]?.user_id;
      await pool.query(
        `UPDATE subscriptions SET status = $1, ended_at = $2, updated_at = NOW() WHERE razorpay_subscription_id = $3`,
        [status, endedAt, razorpaySubId]
      );
      if (targetUserId) {
        const periodEnd = (await pool.query('SELECT current_period_end FROM subscriptions WHERE razorpay_subscription_id = $1', [razorpaySubId])).rows[0]?.current_period_end;
        const now = new Date();
        if (status === 'cancelled' || status === 'completed' || (periodEnd && new Date(periodEnd) < now)) {
          await pool.query(
            'UPDATE users SET subscription_plan = $1, updated_at = NOW() WHERE id = $2',
            ['free', targetUserId]
          );
        }
      }
    }
  } catch (err) {
    console.error('Razorpay webhook DB update error:', err.message);
  }
  res.status(200).send('OK');
}

/**
 * Create a new conversation for a user (atomic operation with limit check)
 * Validates input and uses transaction to prevent race conditions
 */
async function createConversation(userId, title = null) {
  // Ensure debug log directory exists
  const debugLogDir = path.join(__dirname, '../.cursor');
  if (!fs.existsSync(debugLogDir)) {
    fs.mkdirSync(debugLogDir, { recursive: true });
  }
  
  // #region agent log
  try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:505',message:'createConversation entry',data:{userId,title,hasPool:!!pool},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})+'\n');}catch(e){}
  // #endregion
  
  // Check database connection
  if (!pool) {
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:511',message:'Pool check failed',data:{pool:pool},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
    // #endregion
    throw new Error('Database not configured');
  }
  
  // Input validation
  if (!userId || typeof userId !== 'string') {
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:519',message:'Invalid userId',data:{userId,type:typeof userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');}catch(e){}
    // #endregion
    throw new Error('Invalid user ID');
  }
  
  // Validate title length (max 255 chars per schema)
  if (title !== null && title !== undefined) {
    if (typeof title !== 'string') {
      throw new Error('Title must be a string');
    }
    if (title.length > 255) {
      throw new Error('Title exceeds maximum length of 255 characters');
    }
    // Sanitize title - remove leading/trailing whitespace
    title = title.trim() || null;
  }
  
  // #region agent log
  try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:531',message:'Before pool.connect',data:{poolExists:!!pool},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion
  
  let client;
  try {
    client = await pool.connect();
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:537',message:'After pool.connect success',data:{clientExists:!!client},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
    // #endregion
  } catch (connectErr) {
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:540',message:'pool.connect failed',data:{error:connectErr.message,code:connectErr.code,detail:connectErr.detail},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
    // #endregion
    throw connectErr;
  }
  
  try {
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:545',message:'Before BEGIN transaction',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');}catch(e){}
    // #endregion
    await client.query('BEGIN');
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:547',message:'After BEGIN transaction',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');}catch(e){}
    // #endregion
    
    // Atomic check: Get plan and count in same transaction
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:549',message:'Before SELECT query',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
    // #endregion
    const checkResult = await client.query(
      `SELECT 
        u.subscription_plan,
        COUNT(c.id)::int as conversation_count
      FROM users u
      LEFT JOIN ai_conversations c ON c.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.subscription_plan
      FOR UPDATE`,
      [userId]
    );
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:560',message:'After SELECT query',data:{rowCount:checkResult.rows.length,hasRows:checkResult.rows.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
    // #endregion
    
    if (checkResult.rows.length === 0) {
      // #region agent log
      try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:562',message:'User not found, rolling back',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
      // #endregion
      await client.query('ROLLBACK');
      throw new Error('User not found');
    }
    
    const plan = checkResult.rows[0]?.subscription_plan || 'free';
    const current = checkResult.rows[0]?.conversation_count || 0;
    const limit = CONVERSATION_LIMITS[plan] || CONVERSATION_LIMITS.free;
    
    // Check limit (unlimited = -1)
    if (limit !== -1 && current >= limit) {
      // #region agent log
      try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:571',message:'Limit reached, rolling back',data:{limit,current,plan},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
      // #endregion
      await client.query('ROLLBACK');
      const error = new Error(`CONVERSATION_LIMIT_REACHED`);
      error.limit = limit;
      error.current = current;
      error.plan = plan;
      throw error;
    }
    
    // Create conversation
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:579',message:'Before INSERT query',data:{userId,title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
    // #endregion
    const insertResult = await client.query(
      'INSERT INTO ai_conversations (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title]
    );
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:584',message:'After INSERT query',data:{rowCount:insertResult.rows.length,hasId:!!insertResult.rows[0]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
    // #endregion
    
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:586',message:'Before COMMIT',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');}catch(e){}
    // #endregion
    await client.query('COMMIT');
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:588',message:'After COMMIT, returning result',data:{conversationId:insertResult.rows[0]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
    // #endregion
    
    return insertResult.rows[0];
  } catch (err) {
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:592',message:'createConversation catch block',data:{error:err.message,code:err.code,detail:err.detail,constraint:err.constraint,stack:err.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,D,E'})+'\n');}catch(e){}
    // #endregion
    
    if (client) {
      try {
        // #region agent log
        try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:595',message:'Attempting ROLLBACK',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');}catch(e){}
        // #endregion
        await client.query('ROLLBACK');
        // #region agent log
        try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:597',message:'ROLLBACK successful',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');}catch(e){}
        // #endregion
      } catch (rollbackErr) {
        // #region agent log
        try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:599',message:'ROLLBACK failed',data:{error:rollbackErr.message,code:rollbackErr.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');}catch(e){}
        // #endregion
      }
    }
    
    // Re-throw known errors
    if (err.message === 'CONVERSATION_LIMIT_REACHED' || err.message === 'User not found' || err.message === 'Invalid user ID' || err.message === 'Database not configured') {
      // #region agent log
      try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:605',message:'Re-throwing known error',data:{message:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');}catch(e){}
      // #endregion
      throw err;
    }
    
    // Log and wrap database errors with more detail
    console.error('❌ Database error creating conversation:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
    });
    
    // Check for constraint violations
    if (err.code === '23505') { // Unique violation
      throw new Error('Conversation already exists');
    }
    if (err.code === '23503') { // Foreign key violation
      throw new Error('Invalid user ID');
    }
    
    // Check for connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.message?.includes('connection')) {
      throw new Error('Database connection error');
    }
    
    // Check for query errors
    if (err.code === '42P01') { // Undefined table
      throw new Error('Database schema error');
    }
    
    // Wrap other database errors with more context
    throw new Error(`Database error: ${err.message || 'Failed to create conversation'}`);
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Get all conversations for a user (ordered by most recent)
 * Production-grade: Input validation, error handling, optimized query
 */
async function getUserConversations(userId) {
  if (!pool) {
    throw new Error('Database not configured');
  }
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Optimized query using the composite index
    const result = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        COUNT(m.id)::int as message_count,
        (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY created_at ASC LIMIT 1) as first_message
      FROM ai_conversations c
      LEFT JOIN ai_messages m ON m.conversation_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id, c.title, c.created_at, c.updated_at
      ORDER BY c.updated_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title || (row.first_message ? row.first_message.substring(0, 50) + '...' : 'New Conversation'),
      messageCount: row.message_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error('❌ Error getting conversations:', err.message);
    throw new Error('Failed to retrieve conversations');
  }
}

/**
 * Get messages for a conversation
 */
async function getConversationMessages(conversationId, userId) {
  if (!pool) return [];
  try {
    // Verify conversation belongs to user
    const convCheck = await pool.query(
      'SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (convCheck.rows.length === 0) {
      return [];
    }
    
    const result = await pool.query(
      'SELECT id, role, content, tokens_used, created_at FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    return result.rows.map(row => ({
      id: row.id,
      role: row.role,
      text: row.content,
      tokensUsed: row.tokens_used || 0,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('❌ Error getting messages:', err.message);
    return [];
  }
}

/**
 * Add a message to a conversation
 */
async function addMessageToConversation(conversationId, role, content, tokensUsed = 0) {
  if (!pool) return null;
  try {
    const result = await pool.query(
      'INSERT INTO ai_messages (conversation_id, role, content, tokens_used) VALUES ($1, $2, $3, $4) RETURNING *',
      [conversationId, role, content, tokensUsed]
    );
    
    // Update conversation's updated_at timestamp
    await pool.query(
      'UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );
    
    return result.rows[0];
  } catch (err) {
    console.error('❌ Error adding message:', err.message);
    throw err;
  }
}

/**
 * Update conversation title
 */
async function updateConversationTitle(conversationId, userId, title) {
  if (!pool) return false;
  try {
    const result = await pool.query(
      'UPDATE ai_conversations SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [title, conversationId, userId]
    );
    return result.rowCount > 0;
  } catch (err) {
    console.error('❌ Error updating conversation title:', err.message);
    return false;
  }
}

/**
 * Delete a conversation
 */
async function deleteConversation(conversationId, userId) {
  if (!pool) return false;
  try {
    const result = await pool.query(
      'DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    return result.rowCount > 0;
  } catch (err) {
    console.error('❌ Error deleting conversation:', err.message);
    return false;
  }
}

/**
 * Consume tokens atomically (deduct from available tokens)
 * Uses database transaction to ensure atomicity
 */
async function consumeTokens(userId, count) {
  if (!pool) return { success: false, error: 'Database not available' };
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get current usage with row lock to prevent race conditions
    const usageResult = await client.query(
      'SELECT free_used, purchased_total, purchased_used FROM token_usage WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    
    if (usageResult.rows.length === 0) {
      // Initialize if doesn't exist
      await client.query(
        'INSERT INTO token_usage (user_id, free_used, purchased_total, purchased_used) VALUES ($1, 0, 0, 0)',
        [userId]
      );
      await client.query('COMMIT');
      return { success: false, error: 'Insufficient tokens' };
    }
    
    const usage = usageResult.rows[0];
    const freeRemaining = Math.max(0, AI_TOKENS_FREE_LIMIT - (usage.free_used || 0));
    const purchasedRemaining = Math.max(0, (usage.purchased_total || 0) - (usage.purchased_used || 0));
    const totalAvailable = freeRemaining + purchasedRemaining;
    
    if (count > totalAvailable) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Insufficient tokens', available: totalAvailable };
    }
    
    let remaining = count;
    let newFreeUsed = usage.free_used || 0;
    let newPurchasedUsed = usage.purchased_used || 0;
    
    // Use free tokens first
    if (freeRemaining > 0 && remaining > 0) {
      const useFromFree = Math.min(freeRemaining, remaining);
      newFreeUsed = (usage.free_used || 0) + useFromFree;
      remaining -= useFromFree;
    }
    
    // Then use purchased tokens
    if (remaining > 0 && purchasedRemaining > 0) {
      const useFromPurchased = Math.min(purchasedRemaining, remaining);
      newPurchasedUsed = (usage.purchased_used || 0) + useFromPurchased;
    }
    
    // Update atomically
    await client.query(
      `UPDATE token_usage 
       SET free_used = $1, purchased_used = $2, updated_at = NOW() 
       WHERE user_id = $3`,
      [newFreeUsed, newPurchasedUsed, userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      freeUsed: newFreeUsed,
      purchasedUsed: newPurchasedUsed,
      consumed: count,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error consuming tokens:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) {
      client.release();
    }
  }
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
    openai: openai ? 'configured' : 'not_configured',
    environment: isProduction ? 'production' : 'development',
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
  
  // Check OpenAI configuration (lightweight check)
  if (openai) {
    health.openai = 'configured';
  } else {
    health.openai = 'not_configured';
    if (isProduction) {
      health.openaiWarning = 'OpenAI not configured - AI chat unavailable';
    }
  }
  
  // Determine overall status
  const isHealthy = health.database === 'connected' && (health.openai === 'configured' || !isProduction);
  health.status = isHealthy ? 'OK' : 'DEGRADED';
  
  const statusCode = isHealthy ? 200 : 503;
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

    // Ensure token usage is initialized (for new users)
    await initializeTokenUsage(user.id);
    
    // Get token usage for response
    const tokenUsage = await getTokenUsage(user.id);
    const balance = await checkTokenBalance(user.id, 0);

    const { accessToken, refreshToken, expiresAt } = await generateTokensWithRefresh(user, false);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: user.provider,
        subscriptionPlan: user.subscription_plan || 'free',
      },
      accessToken,
      refreshToken,
      expiresAt,
      tokenUsage: {
        freeUsed: tokenUsage.freeUsed,
        purchasedTotal: tokenUsage.purchasedTotal,
        purchasedUsed: tokenUsage.purchasedUsed,
        freeLimit: AI_TOKENS_FREE_LIMIT,
        freeRemaining: balance.freeRemaining,
        purchasedRemaining: balance.purchasedRemaining,
        totalAvailable: balance.available,
        tokensPerMessage: TOKENS_PER_AI_MESSAGE,
      },
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
    
    // Initialize token usage record
    await initializeTokenUsage(user.id);
    console.log(`[Register] Token usage initialized for user: ${user.id}`);

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

    // Get token usage (should be initialized, but fetch to be sure)
    const tokenUsage = await getTokenUsage(user.id);
    const balance = await checkTokenBalance(user.id, 0);

    const { accessToken, refreshToken, expiresAt } = await generateTokensWithRefresh(user, false);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: user.provider,
        emailVerified: user.email_verified,
        subscriptionPlan: user.subscription_plan || 'free',
      },
      accessToken,
      refreshToken,
      expiresAt,
      tokenUsage: {
        freeUsed: tokenUsage.freeUsed,
        purchasedTotal: tokenUsage.purchasedTotal,
        purchasedUsed: tokenUsage.purchasedUsed,
        freeLimit: AI_TOKENS_FREE_LIMIT,
        freeRemaining: balance.freeRemaining,
        purchasedRemaining: balance.purchasedRemaining,
        totalAvailable: balance.available,
        tokensPerMessage: TOKENS_PER_AI_MESSAGE,
      },
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

    // Ensure token usage record exists
    await initializeTokenUsage(user.id);
    
    // Get token usage for response
    const tokenUsage = await getTokenUsage(user.id);
    const balance = await checkTokenBalance(user.id, 0);

    const { accessToken, refreshToken, expiresAt } = await generateTokensWithRefresh(user, !!rememberMe);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: user.provider,
        mfaEnabled: user.mfa_enabled,
        subscriptionPlan: user.subscription_plan || 'free',
      },
      accessToken,
      refreshToken,
      expiresAt,
      tokenUsage: {
        freeUsed: tokenUsage.freeUsed,
        purchasedTotal: tokenUsage.purchasedTotal,
        purchasedUsed: tokenUsage.purchasedUsed,
        freeLimit: AI_TOKENS_FREE_LIMIT,
        freeRemaining: balance.freeRemaining,
        purchasedRemaining: balance.purchasedRemaining,
        totalAvailable: balance.available,
        tokensPerMessage: TOKENS_PER_AI_MESSAGE,
      },
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
      // Initialize token usage for new user
      await initializeTokenUsage(user.id);
    } else {
      // Ensure token usage exists for existing user
      await initializeTokenUsage(user.id);
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
 * GET /tokens/usage
 * Get current token usage and balance for authenticated user
 */
app.get('/tokens/usage', async (req, res) => {
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

    const userId = decoded.sub;
    const tokenUsage = await getTokenUsage(userId);
    const balance = await checkTokenBalance(userId, 0); // Just get balance info
    
    return res.json({
      freeUsed: tokenUsage.freeUsed,
      purchasedTotal: tokenUsage.purchasedTotal,
      purchasedUsed: tokenUsage.purchasedUsed,
      freeLimit: AI_TOKENS_FREE_LIMIT,
      freeRemaining: balance.freeRemaining,
      purchasedRemaining: balance.purchasedRemaining,
      totalAvailable: balance.available,
      tokensPerMessage: TOKENS_PER_AI_MESSAGE,
    });
  } catch (err) {
    if (!isProduction) console.error('/tokens/usage error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to get token usage.' : (err.message || 'Failed to get token usage.'),
    });
  }
});

/**
 * GET /tokens/balance
 * Quick check of token balance (lightweight endpoint)
 */
app.get('/tokens/balance', async (req, res) => {
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

    const balance = await checkTokenBalance(decoded.sub, TOKENS_PER_AI_MESSAGE);
    
    return res.json({
      hasEnough: balance.hasEnough,
      available: balance.available,
      required: TOKENS_PER_AI_MESSAGE,
      freeRemaining: balance.freeRemaining,
      purchasedRemaining: balance.purchasedRemaining,
    });
  } catch (err) {
    if (!isProduction) console.error('/tokens/balance error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to get token balance.' : (err.message || 'Failed to get token balance.'),
    });
  }
});

/**
 * POST /tokens/sync
 * Sync token usage from frontend to backend
 * Body: { freeUsed: number, purchasedTotal: number, purchasedUsed: number }
 */
app.post('/tokens/sync', async (req, res) => {
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

    const { freeUsed, purchasedTotal, purchasedUsed } = req.body || {};
    
    // Validate input
    if (typeof freeUsed !== 'number' || typeof purchasedTotal !== 'number' || typeof purchasedUsed !== 'number') {
      return res.status(400).json({ message: 'Invalid token usage values.' });
    }
    
    if (freeUsed < 0 || purchasedTotal < 0 || purchasedUsed < 0) {
      return res.status(400).json({ message: 'Token usage values cannot be negative.' });
    }

    await updateTokenUsage(decoded.sub, freeUsed, purchasedTotal, purchasedUsed);
    return res.json({ message: 'Token usage synced successfully.' });
  } catch (err) {
    if (!isProduction) console.error('/tokens/sync error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to sync token usage.' : (err.message || 'Failed to sync token usage.'),
    });
  }
});

/**
 * GET /api/subscription/plans
 * Returns monthly subscription plans (for India – prices in INR). No auth required.
 */
app.get('/api/subscription/plans', (req, res) => {
  const plans = SUBSCRIPTION_PLANS_CONFIG.map((p) => ({
    planId: p.planId,
    name: p.name,
    priceMonthly: p.priceMonthly,
    currency: 'INR',
    tokens: p.tokens,
    conversationLimit: p.conversationLimit,
    enabled: !!RAZORPAY_PLANS[p.planId],
  }));
  return res.json({ plans });
});

/**
 * POST /api/subscription/create
 * Body: { planId: 'starter' | 'learner' | 'pro' | 'unlimited' }
 * Creates Razorpay subscription and returns short_url for payment. Auth required.
 */
app.post('/api/subscription/create', async (req, res) => {
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
    if (!razorpay || !pool) {
      return res.status(503).json({ message: 'Subscriptions are not configured.' });
    }
    const { planId } = req.body || {};
    if (!SUBSCRIPTION_PLANS_CONFIG.some((p) => p.planId === planId)) {
      return res.status(400).json({ message: 'Invalid planId.' });
    }
    const razorpayPlanId = RAZORPAY_PLANS[planId];
    if (!razorpayPlanId) {
      return res.status(400).json({ message: 'This plan is not available for subscription.' });
    }
    const userId = decoded.sub;
    const userRow = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
    if (userRow.rows.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }
    const user = userRow.rows[0];
    const customerId = await getOrCreateRazorpayCustomer(userId, user.email, user.name);
    if (!customerId) {
      return res.status(500).json({ message: 'Could not create payment customer.' });
    }
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_id: customerId,
      total_count: 12,
      quantity: 1,
      notes: { user_id: userId },
    });
    const subId = subscription.id;
    const shortUrl = subscription.short_url || null;
    await pool.query(
      `INSERT INTO subscriptions (user_id, razorpay_subscription_id, razorpay_plan_id, plan_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'created', NOW(), NOW())`,
      [userId, subId, razorpayPlanId, planId]
    );
    return res.json({
      subscriptionId: subId,
      shortUrl,
      planId,
      message: shortUrl ? 'Open shortUrl in browser to complete payment.' : 'Subscription created; complete payment in Razorpay.',
    });
  } catch (err) {
    if (!isProduction) console.error('/api/subscription/create error:', err);
    res.status(500).json({
      message: isProduction ? 'Subscription creation failed.' : (err.message || 'Subscription creation failed.'),
    });
  }
});

/**
 * GET /ai/conversations
 * Get all conversations for authenticated user
 */
app.get('/ai/conversations', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        error: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      return res.status(401).json({ 
        message: 'Invalid or expired token.',
        error: 'INVALID_TOKEN',
      });
    }

    const conversations = await getUserConversations(decoded.sub);
    return res.json({ conversations });
  } catch (err) {
    // Handle database errors
    if (err.message === 'Database not configured') {
      return res.status(503).json({
        message: 'Service temporarily unavailable.',
        error: 'SERVICE_UNAVAILABLE',
      });
    }
    
    if (!isProduction) {
      console.error('❌ /ai/conversations GET error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
    }
    
    res.status(500).json({
      message: isProduction ? 'Failed to get conversations.' : (err.message || 'Failed to get conversations.'),
      error: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /ai/conversations
 * Create a new conversation
 * Body: { title?: string }
 * Rate limited: 10 per 15 minutes (production)
 */
app.post('/ai/conversations', conversationLimiter, async (req, res) => {
  // #region agent log
  try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:2122',message:'POST /ai/conversations entry',data:{hasAuthHeader:!!req.headers.authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})+'\n');}catch(e){}
  // #endregion
  try {
    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        error: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      // #region agent log
      try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:2137',message:'JWT verified',data:{userId:decoded.sub},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');}catch(e){}
      // #endregion
    } catch (jwtErr) {
      return res.status(401).json({ 
        message: 'Invalid or expired token.',
        error: 'INVALID_TOKEN',
      });
    }

    // Input validation
    const { title } = req.body || {};
    
    // Validate title if provided
    if (title !== undefined && title !== null) {
      if (typeof title !== 'string') {
        return res.status(400).json({
          message: 'Title must be a string.',
          error: 'INVALID_INPUT',
        });
      }
      if (title.length > 255) {
        return res.status(400).json({
          message: 'Title exceeds maximum length of 255 characters.',
          error: 'INVALID_INPUT',
        });
      }
    }
    
    try {
      // #region agent log
      try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:2243',message:'Before createConversation call',data:{userId:decoded.sub,title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})+'\n');}catch(e){}
      // #endregion
      const conversation = await createConversation(decoded.sub, title || null);
      // #region agent log
      try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:2246',message:'createConversation success',data:{conversationId:conversation?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
      // #endregion
      
      // Log successful creation (for monitoring)
      if (isProduction) {
        console.log(`✅ Conversation created: ${conversation.id} for user ${decoded.sub}`);
      }
      
      return res.status(201).json({ 
        conversation,
        message: 'Conversation created successfully.',
      });
    } catch (err) {
      // #region agent log
      try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:2255',message:'createConversation catch in endpoint',data:{error:err.message,code:err.code,detail:err.detail,constraint:err.constraint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');}catch(e){}
      // #endregion
      // Handle conversation limit error (structured error from createConversation)
      if (err.message === 'CONVERSATION_LIMIT_REACHED' || err.limit !== undefined) {
        const limit = err.limit || CONVERSATION_LIMITS.free;
        const current = err.current || 0;
        const plan = err.plan || 'free';
        
        // Log limit reached (for analytics)
        if (isProduction) {
          console.log(`⚠️  Conversation limit reached: user ${decoded.sub}, plan ${plan}, ${current}/${limit}`);
        }
        
        return res.status(403).json({
          message: `You have reached the maximum of ${limit} conversations for your ${plan} plan. Please delete an existing conversation or upgrade to create more.`,
          error: 'CONVERSATION_LIMIT_REACHED',
          limit,
          current,
          plan,
        });
      }
      
      // Handle other known errors
      if (err.message === 'User not found') {
        return res.status(404).json({
          message: 'User not found.',
          error: 'USER_NOT_FOUND',
        });
      }
      
      if (err.message === 'Invalid user ID') {
        return res.status(400).json({
          message: 'Invalid user ID.',
          error: 'INVALID_INPUT',
        });
      }
      
      if (err.message === 'Database not configured') {
        return res.status(503).json({
          message: 'Service temporarily unavailable.',
          error: 'SERVICE_UNAVAILABLE',
        });
      }
      
      // Log unexpected errors with full context
      console.error('❌ Unexpected error creating conversation:', {
        userId: decoded.sub,
        error: err.message,
        code: err.code,
        detail: err.detail,
        constraint: err.constraint,
        stack: isProduction ? undefined : err.stack,
      });
      
      throw err;
    }
  } catch (err) {
    // Final error handler
    const statusCode = err.statusCode || 500;
    
    // #region agent log
    try{fs.appendFileSync(path.join(__dirname,'../.cursor/debug.log'),JSON.stringify({location:'server.js:2307',message:'Final error handler',data:{message:err.message,code:err.code,detail:err.detail,constraint:err.constraint,statusCode,stack:err.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');}catch(e){}
    // #endregion
    
    // Log the actual error for debugging with full details
    console.error('❌ /ai/conversations POST final error handler:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      statusCode,
      stack: isProduction ? undefined : err.stack,
    });
    
    // Check for specific error types and provide helpful messages
    if (err.message && err.message.includes('Database not configured')) {
      return res.status(503).json({
        message: 'Service temporarily unavailable. Database connection error.',
        error: 'SERVICE_UNAVAILABLE',
      });
    }
    
    if (err.message && err.message.includes('timeout')) {
      return res.status(504).json({
        message: 'Request timed out. Please try again.',
        error: 'TIMEOUT',
      });
    }
    
    if (err.message && err.message.includes('Database error')) {
      // Check for specific database error codes
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        return res.status(503).json({
          message: 'Database connection error. Please try again in a few moments.',
          error: 'DATABASE_CONNECTION_ERROR',
        });
      }
      if (err.code === '42P01') {
        return res.status(503).json({
          message: 'Database schema error. Please contact support.',
          error: 'DATABASE_SCHEMA_ERROR',
        });
      }
      return res.status(503).json({
        message: 'Database error. Please try again later.',
        error: 'DATABASE_ERROR',
      });
    }
    
    // Check for connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({
        message: 'Unable to connect to database. Please try again later.',
        error: 'SERVICE_UNAVAILABLE',
      });
    }
    
    // In production, show generic message; in dev, show actual error
    const errorMessage = isProduction 
      ? 'Failed to create conversation. Please try again later.' 
      : (err.message || 'Failed to create conversation.');
    
    res.status(statusCode).json({
      message: errorMessage,
      error: 'INTERNAL_ERROR',
      ...(isProduction ? {} : { details: err.message, code: err.code }),
    });
  }
});

/**
 * GET /ai/conversations/:id/messages
 * Get messages for a conversation
 */
app.get('/ai/conversations/:id/messages', async (req, res) => {
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

    const { id } = req.params;
    const messages = await getConversationMessages(id, decoded.sub);
    return res.json({ messages });
  } catch (err) {
    if (!isProduction) console.error('/ai/conversations/:id/messages error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to get messages.' : (err.message || 'Failed to get messages.'),
    });
  }
});

/**
 * PUT /ai/conversations/:id
 * Update conversation title
 * Body: { title: string }
 */
app.put('/ai/conversations/:id', async (req, res) => {
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

    const { id } = req.params;
    const { title } = req.body || {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Title is required.' });
    }

    const success = await updateConversationTitle(id, decoded.sub, title);
    if (!success) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }
    return res.json({ message: 'Conversation updated.' });
  } catch (err) {
    if (!isProduction) console.error('/ai/conversations/:id PUT error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to update conversation.' : (err.message || 'Failed to update conversation.'),
    });
  }
});

/**
 * DELETE /ai/conversations/:id
 * Delete a conversation
 */
app.delete('/ai/conversations/:id', async (req, res) => {
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

    const { id } = req.params;
    const success = await deleteConversation(id, decoded.sub);
    if (!success) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }
    return res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    if (!isProduction) console.error('/ai/conversations/:id DELETE error:', err);
    res.status(500).json({
      message: isProduction ? 'Failed to delete conversation.' : (err.message || 'Failed to delete conversation.'),
    });
  }
});

/**
 * POST /ai/chat
 * Body: { message: string, context?: string, conversationId?: string }
 * Response: { reply: string, tokensUsed: number, conversationId?: string }
 * Requires authentication and sufficient token balance (10 tokens per message)
 */
app.post('/ai/chat', aiLimiter, async (req, res) => {
  try {
    // Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const userId = decoded.sub;
    const { message, context, conversationId } = req.body || {};
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid "message" in body.' });
    }

    // Check token balance BEFORE processing
    const balance = await checkTokenBalance(userId, TOKENS_PER_AI_MESSAGE);
    if (!balance.hasEnough) {
      return res.status(402).json({
        message: `Insufficient tokens. You need ${TOKENS_PER_AI_MESSAGE} tokens but only have ${balance.available} available.`,
        tokensRequired: TOKENS_PER_AI_MESSAGE,
        tokensAvailable: balance.available,
        freeRemaining: balance.freeRemaining,
        purchasedRemaining: balance.purchasedRemaining,
      });
    }

    // Consume tokens BEFORE making AI call (atomic operation)
    const consumeResult = await consumeTokens(userId, TOKENS_PER_AI_MESSAGE);
    if (!consumeResult.success) {
      return res.status(402).json({
        message: `Failed to consume tokens: ${consumeResult.error || 'Unknown error'}`,
        tokensRequired: TOKENS_PER_AI_MESSAGE,
        tokensAvailable: consumeResult.available || 0,
      });
    }

    // Handle conversation
    let currentConversationId = conversationId;
    
    // Create new conversation if not provided
    if (!currentConversationId) {
      try {
        const newConv = await createConversation(userId);
        currentConversationId = newConv.id;
      } catch (convErr) {
        // Handle conversation limit error (structured error from createConversation)
        if (convErr.message === 'CONVERSATION_LIMIT_REACHED' || convErr.limit !== undefined) {
          const limit = convErr.limit || CONVERSATION_LIMITS.free;
          const current = convErr.current || 0;
          const plan = convErr.plan || 'free';
          
          // Log limit reached
          if (isProduction) {
            console.log(`⚠️  Conversation limit reached during AI chat: user ${userId}, plan ${plan}, ${current}/${limit}`);
          }
          
          return res.status(403).json({
            message: `You have reached the maximum of ${limit} conversations for your ${plan} plan. Please delete an existing conversation or upgrade to create more.`,
            error: 'CONVERSATION_LIMIT_REACHED',
            tokensUsed: 0, // No tokens consumed
            limit,
            current,
            plan,
          });
        }
        throw convErr;
      }
    } else {
      // Validate conversation ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(currentConversationId)) {
        return res.status(400).json({
          message: 'Invalid conversation ID format.',
          error: 'INVALID_INPUT',
        });
      }
      
      // Verify conversation belongs to user
      const convCheck = await pool.query(
        'SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2',
        [currentConversationId, userId]
      );
      if (convCheck.rows.length === 0) {
        // Create new conversation if provided ID doesn't exist or doesn't belong to user
        try {
          const newConv = await createConversation(userId);
          currentConversationId = newConv.id;
        } catch (convErr) {
          // Handle conversation limit error (structured error from createConversation)
          if (convErr.message === 'CONVERSATION_LIMIT_REACHED' || convErr.limit !== undefined) {
            const limit = convErr.limit || CONVERSATION_LIMITS.free;
            const current = convErr.current || 0;
            const plan = convErr.plan || 'free';
            
            // Log limit reached
            if (isProduction) {
              console.log(`⚠️  Conversation limit reached during AI chat (invalid conv ID): user ${userId}, plan ${plan}, ${current}/${limit}`);
            }
            
            return res.status(403).json({
              message: `You have reached the maximum of ${limit} conversations for your ${plan} plan. Please delete an existing conversation or upgrade to create more.`,
              error: 'CONVERSATION_LIMIT_REACHED',
              tokensUsed: 0, // No tokens consumed
              limit,
              current,
              plan,
            });
          }
          throw convErr;
        }
      }
    }
    
    // Store user message
    await addMessageToConversation(currentConversationId, 'user', message, 0);
    
    // Load conversation history for context (last 10 messages)
    const previousMessages = await getConversationMessages(currentConversationId, userId);
    const recentMessages = previousMessages.slice(-10); // Last 10 messages for context
    
    // Now process the AI request
    let reply;
    let aiTokensUsed = 0;
    
    try {
      if (!openai) {
        console.error('OpenAI client not initialized - check OPENAI_API_KEY environment variable');
        return res.status(503).json({ 
          message: 'AI service is not configured. Please contact support.',
          tokensUsed: 0, // Refund tokens if service not configured
        });
      }

      const contextHint = context && String(context).trim()
        ? `\n\n**User context:** ${String(context).trim()}`
        : '';
      const systemContent = AI_MENTOR_SYSTEM_PROMPT + contextHint;

      // Build messages array with conversation history
      const messagesForAI = [
        { role: 'system', content: systemContent },
      ];
      
      // Add conversation history (excluding the current message we just added)
      recentMessages.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messagesForAI.push({
            role: msg.role,
            content: msg.text,
          });
        }
      });

      // Make OpenAI API call with timeout and retry logic
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      let completion;
      let lastError;
      const maxRetries = 2;
      let retryCount = 0;
      
      // Retry logic for transient failures
      while (retryCount <= maxRetries) {
        try {
          completion = await Promise.race([
            openai.chat.completions.create({
              model: model,
              messages: messagesForAI,
              max_tokens: 1536,
              temperature: 0.6,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('OpenAI API request timeout')), 35000)
            )
          ]);
          
          // Success - break out of retry loop
          break;
        } catch (retryError) {
          lastError = retryError;
          
          // Don't retry on non-retryable errors
          const isRetryable = 
            retryError.status === 429 || // Rate limit
            retryError.status === 500 || // Server error
            retryError.status === 502 || // Bad gateway
            retryError.status === 503 || // Service unavailable
            retryError.message?.includes('timeout') || // Timeout
            retryError.message?.includes('ECONNRESET') || // Connection reset
            retryError.message?.includes('ETIMEDOUT'); // Network timeout
          
          if (!isRetryable || retryCount >= maxRetries) {
            throw retryError;
          }
          
          // Exponential backoff: wait 1s, 2s, 4s
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 4000);
          if (isProduction) {
            console.log(`⚠️  OpenAI API retry ${retryCount + 1}/${maxRetries} after ${delayMs}ms: ${retryError.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, delayMs));
          retryCount++;
        }
      }

      reply = completion.choices[0]?.message?.content?.trim() || "I couldn't generate a reply.";
      aiTokensUsed = completion.usage?.total_tokens ?? Math.ceil((message.length + reply.length) / 4);
      
      if (!reply || reply.length === 0) {
        throw new Error('Empty response from OpenAI API');
      }
      
      // Store assistant reply
      await addMessageToConversation(currentConversationId, 'assistant', reply, TOKENS_PER_AI_MESSAGE);
      
      // Update conversation title if it's the first message
      if (previousMessages.length === 0) {
        const title = message.substring(0, 50).trim();
        await updateConversationTitle(currentConversationId, userId, title);
      }

      // Return success with fixed token cost (not actual AI usage)
      return res.json({
        reply,
        tokensUsed: TOKENS_PER_AI_MESSAGE, // Always return fixed cost
        aiTokensUsed, // Actual AI tokens used (for reference)
        remainingTokens: balance.available - TOKENS_PER_AI_MESSAGE,
        conversationId: currentConversationId,
      });
    } catch (aiError) {
      // Refund tokens on certain errors
      let shouldRefundTokens = false;
      let errorMessage = 'AI request failed. Please try again.';
      let statusCode = 500;
      
      // Check if OpenAI is configured
      if (!openai) {
        shouldRefundTokens = true;
        errorMessage = 'AI service is not configured. Please contact support.';
        statusCode = 503;
      }
      // Handle OpenAI API errors
      else if (aiError.status === 401 || aiError.statusCode === 401 || aiError.code === 'invalid_api_key') {
        shouldRefundTokens = true;
        errorMessage = 'AI service configuration error. Please contact support.';
        statusCode = 500;
        if (isProduction) {
          console.error('❌ OpenAI API key is invalid or expired');
        }
      }
      // Rate limit - don't refund (user should wait)
      else if (aiError.status === 429 || aiError.statusCode === 429) {
        errorMessage = 'AI service is busy. Please try again in a moment.';
        statusCode = 503;
        if (isProduction) {
          console.log('⚠️  OpenAI rate limit hit for user:', userId);
        }
      }
      // Server errors - refund tokens (not user's fault)
      else if (aiError.status === 500 || aiError.statusCode === 500 || 
               aiError.status === 502 || aiError.statusCode === 502 ||
               aiError.status === 503 || aiError.statusCode === 503) {
        shouldRefundTokens = true;
        errorMessage = 'AI service error. Please try again in a moment.';
        statusCode = 503;
        if (isProduction) {
          console.error('⚠️  OpenAI server error:', aiError.status || aiError.statusCode);
        }
      }
      // Timeout errors - refund tokens
      else if (aiError.message?.includes('timeout') || aiError.message?.includes('Timeout')) {
        shouldRefundTokens = true;
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 504;
        if (isProduction) {
          console.error('⚠️  OpenAI timeout for user:', userId);
        }
      }
      // Network errors - refund tokens
      else if (aiError.message?.includes('ECONNRESET') || 
               aiError.message?.includes('ETIMEDOUT') ||
               aiError.message?.includes('ENOTFOUND') ||
               aiError.code === 'ECONNRESET' ||
               aiError.code === 'ETIMEDOUT') {
        shouldRefundTokens = true;
        errorMessage = 'Network error. Please check your connection and try again.';
        statusCode = 503;
        if (isProduction) {
          console.error('⚠️  OpenAI network error:', aiError.message || aiError.code);
        }
      }
      // Invalid request - don't refund (user's fault)
      else if (aiError.type === 'invalid_request_error' || aiError.code === 'invalid_request_error') {
        errorMessage = 'Invalid request. Please check your message and try again.';
        statusCode = 400;
      }
      
      // Refund tokens if needed
      if (shouldRefundTokens && consumeResult.success) {
        try {
          await pool.query(
            `UPDATE token_usage 
             SET free_used = GREATEST(0, free_used - $1),
                 purchased_used = GREATEST(0, purchased_used - $2)
             WHERE user_id = $3`,
            [
              consumeResult.freeConsumed || 0,
              consumeResult.purchasedConsumed || 0,
              userId
            ]
          );
          if (isProduction) {
            console.log(`✅ Refunded ${TOKENS_PER_AI_MESSAGE} tokens to user ${userId} due to ${statusCode} error`);
          }
        } catch (refundError) {
          // Log but don't fail - token refund is best effort
          if (isProduction) {
            console.error('⚠️  Failed to refund tokens:', refundError.message);
          }
        }
      }
      
      // Log error for production monitoring
      if (isProduction) {
        const errorLog = {
          userId,
          error: aiError.message || String(aiError),
          status: aiError.status || aiError.statusCode,
          code: aiError.code,
          type: aiError.type,
          timestamp: new Date().toISOString(),
        };
        console.error('AI call failed:', JSON.stringify(errorLog));
      } else {
        console.error('AI call failed:', aiError.message || aiError);
      }
      
      return res.status(statusCode).json({ 
        message: errorMessage,
        tokensUsed: shouldRefundTokens ? 0 : TOKENS_PER_AI_MESSAGE,
      });
    }
  } catch (err) {
    if (!isProduction) console.error('/ai/chat error:', err.message);
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
  if (openai) {
    console.log('✅ AI Mentor: ready (OpenAI API key loaded from OPENAI_API_KEY)');
  } else {
    console.warn('⚠️  AI Mentor: disabled - set OPENAI_API_KEY in backend/.env to enable');
  }
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
