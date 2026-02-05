# Production-Grade Configuration Guide

Complete production setup for CodeVerse backend and frontend.

---

## Backend Production Configuration

### 1. Backend Environment Variables (Render/Production Host)

Set these in your hosting platform (Render, Railway, Heroku, etc.):

#### Required Variables

```env
NODE_ENV=production
JWT_SECRET=<your-32-char-secret>
DATABASE_URL=<your-postgresql-url>
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4o-mini
```

#### Optional Variables

```env
# OAuth (if using)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# CORS (optional - empty allows all, recommended for mobile apps)
CORS_ORIGINS=

# Email (optional)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
# OR use SendGrid
SENDGRID_API_KEY=<your-sendgrid-key>
EMAIL_FROM=noreply@yourdomain.com
```

**Note:** `PORT` is automatically set by your hosting platform - don't add it manually.

---

## Frontend Production Configuration

### 1. EAS Environment Variables (Production)

For production builds, set these in EAS (not in `.env` file):

```bash
# Login to EAS
eas login

# Set production API URL (REQUIRED)
eas env:create --name EXPO_PUBLIC_API_URL --value "https://codeverse-api-429f.onrender.com" --environment production --visibility plaintext

# OAuth Client IDs (if using OAuth)
eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "436868027669-k90ua4c64llls5bk0pmqlimd8d9sdt4g.apps.googleusercontent.com" --environment production --visibility plaintext

eas env:create --name EXPO_PUBLIC_GITHUB_CLIENT_ID --value "Ov23li12lOljFCToSg2E" --environment production --visibility plaintext

# Optional: Google Redirect URI
eas env:create --name EXPO_PUBLIC_GOOGLE_REDIRECT_URI --value "https://auth.expo.io/@learnmadetamil/codeverse-ai" --environment production --visibility plaintext
```

### 2. Verify Environment Variables

```bash
# List all environment variables
eas env:list

# Or check in Expo Dashboard
# https://expo.dev → Your Project → Environment Variables
```

---

## Production Checklist

### Backend ✅

- [ ] `NODE_ENV=production` set on hosting platform
- [ ] `JWT_SECRET` set (≥32 characters)
- [ ] `DATABASE_URL` set (PostgreSQL connection string)
- [ ] `OPENAI_API_KEY` set and validated
- [ ] Backend deployed and accessible at `https://codeverse-api-429f.onrender.com`
- [ ] Health check works: `GET https://codeverse-api-429f.onrender.com/health`
- [ ] CORS configured (empty = allow all for mobile apps)

### Frontend ✅

- [ ] `EXPO_PUBLIC_API_URL` set in EAS for production environment
- [ ] OAuth Client IDs set in EAS (if using OAuth)
- [ ] Production build tested before store submission
- [ ] All environment variables verified with `eas env:list`

---

## Production Build Commands

### Build for Production

```bash
# Android (AAB for Play Store)
eas build --platform android --profile production

# iOS (for App Store)
eas build --platform ios --profile production

# Both platforms
eas build --platform all --profile production
```

### Preview Build (Testing)

```bash
# Set preview environment variables first
eas env:create --name EXPO_PUBLIC_API_URL --value "https://codeverse-api-429f.onrender.com" --environment preview --visibility plaintext

# Build preview
eas build --platform android --profile preview
```

---

## Security Best Practices

### ✅ Do's

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use EAS Environment** - Store secrets in EAS, not in code
3. **Strong JWT_SECRET** - Use `openssl rand -hex 32` to generate
4. **HTTPS only** - Always use HTTPS in production
5. **Validate API keys** - Check OpenAI key is valid on startup
6. **Rate limiting** - Already configured in backend
7. **Error handling** - Don't expose internal errors to users

### ❌ Don'ts

1. **Don't hardcode secrets** - Use environment variables
2. **Don't use dev secrets in production** - Generate new ones
3. **Don't expose API keys** - Keep them in environment variables only
4. **Don't skip validation** - Validate all environment variables

---

## Testing Production Configuration

### 1. Test Backend

```bash
# Health check
curl https://codeverse-api-429f.onrender.com/health

# Should return: {"ok":true,"database":"connected"}
```

### 2. Test Frontend

1. Build production app: `eas build --platform android --profile production`
2. Install on device
3. Test login
4. Test AI Mentor
5. Verify all features work

---

## Current Production URLs

Based on your configuration:

- **Backend URL:** `https://codeverse-api-429f.onrender.com`
- **Frontend API URL (Production):** `https://codeverse-api-429f.onrender.com`
- **Database:** PostgreSQL on Render

---

## Environment Variable Reference

### Backend (Render/Production Host)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `JWT_SECRET` | Yes | ≥32 characters, strong secret |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `CORS_ORIGINS` | No | Comma-separated, empty = allow all |
| `PORT` | Auto | Set by hosting platform |

### Frontend (EAS Environment)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend URL (HTTPS) |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | No | If using Google login |
| `EXPO_PUBLIC_GITHUB_CLIENT_ID` | No | If using GitHub login |

---

## Quick Setup Commands

### Backend (Render)

1. Go to Render Dashboard
2. Select your service
3. Go to "Environment" tab
4. Add all required variables
5. Redeploy

### Frontend (EAS)

```bash
# Set production API URL
eas env:create --name EXPO_PUBLIC_API_URL --value "https://codeverse-api-429f.onrender.com" --environment production --visibility plaintext

# Build production
eas build --platform android --profile production
```

---

## Verification Steps

1. ✅ Backend running: `https://codeverse-api-429f.onrender.com/health`
2. ✅ OpenAI key validated: Check backend logs
3. ✅ Database connected: Check backend logs
4. ✅ EAS env vars set: `eas env:list`
5. ✅ Production build works: Test on device

---

**Your production configuration is ready! Follow the steps above to deploy.**
