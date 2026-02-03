# Production checklist – CodeVerse

Use this when deploying or auditing the app and backend for production.

---

## Backend (Node / Render)

### Required

| Item | Action |
|------|--------|
| **NODE_ENV** | Set to `production` on Render (or your host). Enables strict JWT check and rate limits. |
| **JWT_SECRET** | Set a strong secret (e.g. `openssl rand -hex 32`). Must be ≥ 32 characters when NODE_ENV=production. |
| **CORS_ORIGINS** | Set allowed origins (comma-separated), e.g. your app’s Expo / web URLs. Empty = allow all (ok for mobile-only). |
| **HTTPS** | Use HTTPS in production (Render provides it). |
| **Secrets** | Never commit `.env`. Use the host’s env vars (e.g. Render Environment). |

### Optional but recommended

| Item | Action |
|------|--------|
| **Rate limits** | Already applied: general (200/15min), auth (20/15min), AI (30/min) in production. Tune via code if needed. |
| **Health check** | Use `GET /health` (returns 200 OK) for load balancers. |
| **Logging** | In production, stack traces are not sent to clients. Add a logging/monitoring service if needed. |
| **Database** | When you add a DB, use connection pooling and run migrations before deploy. |

### Env summary (production)

```
NODE_ENV=production
PORT=          # set by host
JWT_SECRET=    # ≥32 chars
CORS_ORIGINS=  # optional, e.g. https://yourapp.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=  # optional, default gpt-4o-mini
```

---

## App (Expo / EAS)

### Required

| Item | Action |
|------|--------|
| **EXPO_PUBLIC_API_URL** | Set to your production API URL (HTTPS, no trailing slash). |
| **OAuth client IDs** | Set in app and backend; redirect URIs must match production or Expo proxy. |
| **EAS Build** | For store builds use `eas build`; avoid shipping dev-only config. |

### Optional

| Item | Action |
|------|--------|
| **App config** | Use EAS environment secrets or `app.config.js` with env for different builds (staging vs prod). |
| **Crash reporting** | Add Sentry or similar and set DSN via env. |
| **Analytics** | Add only in production builds if needed. |

---

## Security summary

- **Backend:** Helmet (security headers), rate limiting, CORS allowlist, request body limit (500kb), no stack traces in prod.
- **Auth:** JWT with expiry; OAuth code exchange on server only; client never sees OAuth client secrets.
- **App:** No secrets in repo; use env for API URL and OAuth client IDs (client IDs are public).

---

## Deploy flow

1. Set all production env vars on the host (e.g. Render).
2. Set `NODE_ENV=production` on the backend.
3. Deploy backend; confirm `GET /health` returns 200.
4. Point the app’s `EXPO_PUBLIC_API_URL` at the deployed backend.
5. Build the app with EAS or your pipeline; test login and AI chat.
