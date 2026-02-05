# Fix AI Mentor "Server Temporarily Unavailable" Error

This guide helps you fix the "Server is temporarily unavailable" error in the AI Mentor.

---

## Issue

The AI Mentor shows "Server is temporarily unavailable" or "something went wrong" errors.

---

## Solution

### 1. Check OpenAI API Key

The backend needs a valid OpenAI API key to work. Check your `.env` file:

**Location:** `backend/.env`

**Required variable:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### 2. Verify API Key is Valid

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Check if your API key is active
3. Ensure you have credits/quota available
4. Copy a valid API key

### 3. Update Backend .env File

1. Open `backend/.env`
2. Update the `OPENAI_API_KEY` value:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
3. Save the file

### 4. Restart Backend Server

After updating the `.env` file, restart your backend server:

```bash
cd backend
npm start
```

Or if using a process manager:
```bash
pm2 restart codeverse-backend
# or
systemctl restart codeverse-backend
```

### 5. Check Server Logs

When the server starts, you should see:
```
✅ OpenAI client initialized
✅ OpenAI API key validated successfully
```

If you see errors instead:
```
❌ OpenAI API key validation failed: ...
```

This means the API key is invalid or expired.

---

## Common Issues

### Issue 1: API Key Not Set

**Error:** `⚠️  OPENAI_API_KEY not set - AI chat will be mocked`

**Fix:** Add `OPENAI_API_KEY` to your `.env` file

### Issue 2: Invalid API Key

**Error:** `❌ OpenAI API key validation failed: 401`

**Fix:** 
- Check your API key at https://platform.openai.com/api-keys
- Generate a new key if needed
- Update `.env` file

### Issue 3: API Key Expired

**Error:** `Invalid OpenAI API key`

**Fix:**
- Generate a new API key
- Update `.env` file
- Restart server

### Issue 4: No Credits/Quota

**Error:** `Insufficient quota` or `429` errors

**Fix:**
- Check your OpenAI account billing
- Add credits if needed
- Wait if you've hit rate limits

---

## Environment Variables

### Required for AI Mentor

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### Optional

```env
# Model to use (default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini

# Disable API key validation on startup (faster startup)
VALIDATE_OPENAI_KEY=false
```

---

## Testing

After updating the API key and restarting:

1. Open the app
2. Go to AI Mentor screen
3. Send a test message
4. You should get a response (not an error)

---

## Production Deployment

If deploying to production (e.g., Render, Railway, Heroku):

1. Set `OPENAI_API_KEY` in your hosting platform's environment variables
2. Do NOT commit `.env` file to git
3. Restart your server after setting the variable

### For Render:
1. Go to your service dashboard
2. Click "Environment"
3. Add `OPENAI_API_KEY` variable
4. Redeploy

### For Railway:
1. Go to your project settings
2. Click "Variables"
3. Add `OPENAI_API_KEY`
4. Redeploy

---

## Verification

To verify the API key is working:

1. Check server logs on startup
2. Look for: `✅ OpenAI client initialized`
3. Look for: `✅ OpenAI API key validated successfully`
4. If you see errors, the API key is invalid

---

## Still Having Issues?

1. **Check server logs** - Look for OpenAI-related errors
2. **Test API key** - Try using the key with curl or Postman
3. **Check OpenAI dashboard** - Verify key is active and has credits
4. **Restart server** - After making changes, always restart

---

**Last Updated:** February 3, 2026
