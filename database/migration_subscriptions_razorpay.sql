-- Production: Razorpay monthly subscriptions and webhook idempotency
-- Run after schema.sql. Safe to run multiple times (IF NOT EXISTS).

-- Optional: link user to Razorpay customer for subscriptions
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_razorpay_customer ON users(razorpay_customer_id) WHERE razorpay_customer_id IS NOT NULL;

-- Subscriptions: link Razorpay subscription to user and plan
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  razorpay_plan_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(50) NOT NULL CHECK (plan_id IN ('starter', 'learner', 'pro', 'unlimited')),
  status VARCHAR(50) NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'authenticated', 'activated', 'charged', 'cancelled', 'completed', 'halted', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Idempotency: process each webhook event only once
CREATE TABLE IF NOT EXISTS subscription_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON subscription_webhook_events(event_id);

COMMENT ON TABLE subscriptions IS 'Razorpay subscription records; user.subscription_plan is source of truth for access';
COMMENT ON TABLE subscription_webhook_events IS 'Razorpay webhook idempotency – one row per event_id';
