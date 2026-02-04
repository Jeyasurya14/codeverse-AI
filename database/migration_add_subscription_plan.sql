-- Migration: Add subscription_plan column to users table
-- Run this if you have existing users in your database

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
  END IF;
END $$;

-- Update existing users to have 'free' plan if they don't have one
UPDATE users 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;
