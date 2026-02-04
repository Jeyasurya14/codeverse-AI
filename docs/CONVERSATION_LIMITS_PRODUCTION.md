# Conversation Limits - Production Implementation

## Overview

This document describes the production-grade conversation limit system implemented for CodeVerse AI Mentor.

## Features

### ✅ Production-Grade Implementation

1. **Atomic Operations**
   - Uses database transactions with `FOR UPDATE` row locking
   - Prevents race conditions when multiple requests create conversations simultaneously
   - Ensures conversation count is accurate

2. **Input Validation**
   - Validates user ID format (UUID)
   - Validates title length (max 255 characters)
   - Sanitizes input (trims whitespace)
   - Rejects invalid data types

3. **Error Handling**
   - Structured error responses with error codes
   - Specific error types: `CONVERSATION_LIMIT_REACHED`, `USER_NOT_FOUND`, `INVALID_INPUT`
   - Proper HTTP status codes (403, 400, 404, 500)
   - Production-safe error messages (no stack traces in production)

4. **Rate Limiting**
   - Conversation creation: 10 per 15 minutes (production)
   - Prevents abuse and spam
   - Uses `express-rate-limit` middleware

5. **Performance Optimization**
   - Composite database index: `idx_ai_conversations_user_updated`
   - Optimized queries using JOINs instead of subqueries
   - Efficient conversation count queries

6. **Security**
   - SQL injection prevention (parameterized queries)
   - User ownership verification
   - Authentication required for all endpoints

7. **Monitoring & Logging**
   - Structured logging for conversation creation
   - Logs limit reached events (for analytics)
   - Error tracking with context

## Subscription Plans & Limits

| Plan | Conversation Limit |
|------|-------------------|
| `free` | 2 conversations |
| `starter` | 10 conversations |
| `learner` | 25 conversations |
| `pro` | 100 conversations |
| `unlimited` | Unlimited (-1) |

## Database Schema

### Users Table
```sql
subscription_plan VARCHAR(50) DEFAULT 'free' 
CHECK (subscription_plan IN ('free', 'starter', 'learner', 'pro', 'unlimited'))
```

### Indexes
```sql
-- Existing indexes
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated ON ai_conversations(updated_at DESC);

-- New composite index for performance
CREATE INDEX idx_ai_conversations_user_updated 
ON ai_conversations(user_id, updated_at DESC);
```

## API Endpoints

### POST /ai/conversations
Create a new conversation.

**Rate Limit:** 10 requests per 15 minutes

**Request:**
```json
{
  "title": "Optional conversation title" // Max 255 chars
}
```

**Success Response (201):**
```json
{
  "conversation": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string or null",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "message": "Conversation created successfully."
}
```

**Error Responses:**

**403 - Conversation Limit Reached:**
```json
{
  "message": "You have reached the maximum of 2 conversations for your free plan...",
  "error": "CONVERSATION_LIMIT_REACHED",
  "limit": 2,
  "current": 2,
  "plan": "free"
}
```

**400 - Invalid Input:**
```json
{
  "message": "Title exceeds maximum length of 255 characters.",
  "error": "INVALID_INPUT"
}
```

**401 - Unauthorized:**
```json
{
  "message": "Authentication required.",
  "error": "UNAUTHORIZED"
}
```

## Implementation Details

### Atomic Transaction Flow

```javascript
BEGIN TRANSACTION
  SELECT user plan + conversation count FOR UPDATE
  IF count >= limit:
    ROLLBACK
    RETURN 403 ERROR
  ELSE:
    INSERT conversation
COMMIT
```

This ensures:
- No race conditions
- Accurate limit enforcement
- Data consistency

### Error Handling Strategy

1. **Structured Errors**: All errors include `error` code and `message`
2. **User-Friendly Messages**: Clear, actionable error messages
3. **Security**: No sensitive data in error responses
4. **Logging**: Errors logged with context (user ID, plan, etc.)

## Migration Guide

### Step 1: Run Migration Script

```bash
# Option A: Using Render SQL Editor (Recommended)
1. Go to Render Dashboard → Your PostgreSQL database
2. Click "Connect" → "SQL Editor"
3. Copy contents of: database/migration_add_subscription_plan_production.sql
4. Paste and run

# Option B: Using psql
psql <your-database-url> < database/migration_add_subscription_plan_production.sql
```

### Step 2: Verify Migration

```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'subscription_plan';

-- Check all users have a plan
SELECT subscription_plan, COUNT(*) 
FROM users 
GROUP BY subscription_plan;

-- Check index exists
SELECT indexname FROM pg_indexes 
WHERE indexname = 'idx_ai_conversations_user_updated';
```

### Step 3: Test in Production

1. Create 2 conversations as a free user → Should succeed
2. Try to create 3rd conversation → Should return 403 error
3. Delete a conversation → Should be able to create new one
4. Test rate limiting → Should block after 10 requests in 15 minutes

## Monitoring

### Key Metrics to Track

1. **Conversation Creation Rate**
   - Total conversations created per hour/day
   - By subscription plan

2. **Limit Reached Events**
   - Frequency of `CONVERSATION_LIMIT_REACHED` errors
   - Which plans hit limits most often

3. **Error Rates**
   - 403 errors (limit reached)
   - 400 errors (invalid input)
   - 500 errors (server errors)

4. **Performance**
   - Query execution time for conversation creation
   - Database connection pool usage

### Logging Examples

**Successful Creation:**
```
✅ Conversation created: abc-123-def for user xyz-789
```

**Limit Reached:**
```
⚠️  Conversation limit reached: user xyz-789, plan free, 2/2
```

**Error:**
```
❌ Unexpected error creating conversation: {
  userId: 'xyz-789',
  error: 'Database connection timeout',
  stack: '...'
}
```

## Upgrading User Plans

To upgrade a user's plan:

```sql
UPDATE users 
SET subscription_plan = 'starter' 
WHERE email = 'user@example.com';
```

The new limit takes effect immediately for new conversation creation.

## Troubleshooting

### Issue: Users can create more conversations than their limit

**Check:**
1. Verify `subscription_plan` column exists and has correct values
2. Check `CONVERSATION_LIMITS` constant matches database values
3. Verify transaction isolation level (should be READ COMMITTED or higher)

### Issue: Race conditions allowing extra conversations

**Solution:** Already handled with `FOR UPDATE` row locking in transactions.

### Issue: Slow conversation creation

**Check:**
1. Verify composite index exists: `idx_ai_conversations_user_updated`
2. Check database connection pool size
3. Monitor query execution time

## Security Considerations

1. **SQL Injection**: Prevented by parameterized queries
2. **Authorization**: All endpoints verify user ownership
3. **Rate Limiting**: Prevents abuse and DoS attacks
4. **Input Validation**: Prevents invalid data corruption
5. **Error Messages**: No sensitive data exposed in errors

## Future Enhancements

- [ ] Add metrics endpoint for monitoring
- [ ] Implement plan upgrade API endpoint
- [ ] Add conversation archiving (soft delete)
- [ ] Implement conversation export feature
- [ ] Add admin dashboard for plan management
