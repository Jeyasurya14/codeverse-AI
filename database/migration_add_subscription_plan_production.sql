-- Production Migration: Add subscription_plan column to users table
-- This migration is safe to run multiple times (idempotent)
-- Run this on your production database

BEGIN;

-- Add subscription_plan column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free' 
    CHECK (subscription_plan IN ('free', 'starter', 'learner', 'pro', 'unlimited'));
    
    -- Add comment for documentation
    COMMENT ON COLUMN users.subscription_plan IS 'User subscription plan determining conversation limits';
  END IF;
END $$;

-- Update existing users to have 'free' plan if they don't have one
UPDATE users 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Add composite index for better query performance (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_conversations_user_updated'
  ) THEN
    CREATE INDEX idx_ai_conversations_user_updated 
    ON ai_conversations(user_id, updated_at DESC);
  END IF;
END $$;

-- Verify migration
DO $$
DECLARE
  column_exists BOOLEAN;
  index_exists BOOLEAN;
BEGIN
  -- Check column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_plan'
  ) INTO column_exists;
  
  -- Check index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_conversations_user_updated'
  ) INTO index_exists;
  
  IF column_exists AND index_exists THEN
    RAISE NOTICE '✅ Migration completed successfully';
  ELSE
    RAISE EXCEPTION 'Migration verification failed: column_exists=%, index_exists=%', column_exists, index_exists;
  END IF;
END $$;

COMMIT;

-- Post-migration verification queries (run separately to verify)
-- SELECT COUNT(*) as total_users, 
--        COUNT(CASE WHEN subscription_plan IS NULL THEN 1 END) as null_plans,
--        COUNT(CASE WHEN subscription_plan = 'free' THEN 1 END) as free_users
-- FROM users;
