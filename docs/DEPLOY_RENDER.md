# Deploy CodeVerse backend on Render

This guide walks you through deploying the CodeVerse API (in the `backend/` folder) as a **Web Service** on [Render](https://render.com).

---

## Prerequisites

- A [Render](https://render.com) account (free tier is fine).
- Your CodeVerse repo pushed to **GitHub** (or GitLab).
- An **OpenAI API key** (optional but recommended for real AI): [Create one](https://platform.openai.com/api-keys).

---

## Step 1: Create a new Web Service

1. Go to [Render Dashboard](https://dashboard.render.com) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your Git provider (GitHub) if needed, then select the **CodeVerse repository**.
4. Click **Connect**.

---

## Step 2: Configure the service

Use these settings so Render runs the backend in the `backend/` folder.

| Field | Value |
|-------|--------|
| **Name** | `codeverse-api` (or any name) |
| **Region** | Choose closest to your users |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

- **Root Directory** must be `backend` so Render uses the backend’s `package.json` and `server.js`.
- **Build Command**: `npm install` installs dependencies.
- **Start Command**: `npm start` runs `node server.js`.

---

## Step 3: Environment variables

In the same screen, open **Environment** and add:

| Key | Value | Notes |
|-----|--------|--------|
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key. Required for real AI. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Optional. Default is `gpt-4o-mini`. |
| `GOOGLE_CLIENT_ID` | from Google Console | Same value as app’s `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (e.g. `…apps.googleusercontent.com`). |
| `GOOGLE_CLIENT_SECRET` | from Google Console | Client secret from the same OAuth client. |
| `GITHUB_CLIENT_ID` | from GitHub OAuth App | Same value as app’s `EXPO_PUBLIC_GITHUB_CLIENT_ID`. |
| `GITHUB_CLIENT_SECRET` | from GitHub OAuth App | Required for GitHub sign-in. |
| `JWT_SECRET` | long random string | **Required in production.** At least 32 characters (e.g. `openssl rand -hex 32`). |
| `NODE_ENV` | `production` | **Set in production.** Enables strict JWT check and production rate limits. |
| `CORS_ORIGINS` | e.g. `https://yourapp.com` | Optional. Comma-separated allowed origins. Empty = allow all (fine for mobile-only). |

- **PORT** is set by Render automatically; do not add it.
- Without `OPENAI_API_KEY`, the backend still deploys and returns a short mock reply so the app works.
- For Google/GitHub login to work, set the OAuth env vars and configure redirect URIs (see **docs/OAUTH_SETUP.md**).

---

## Step 4: Deploy

1. Click **Create Web Service**.
2. Render will clone the repo, run `npm install` in `backend/`, then run `npm start`.
3. Wait for the build and deploy to finish. The log should end with something like: `CodeVerse API listening on port 10000`.
4. Your API URL will be: **`https://<your-service-name>.onrender.com`** (Render shows it at the top).

---

## Step 5: Point the app at your backend

1. In your **CodeVerse app** (Expo project), set the backend URL:
   - In `.env`:  
     `EXPO_PUBLIC_API_URL=https://<your-service-name>.onrender.com`  
     (no trailing slash)
2. Restart the Expo dev server so it picks up the new env value.
3. In the app, open **AI Mentor** and send a message. It should hit your Render backend and return a real AI reply (if `OPENAI_API_KEY` is set) or the mock reply.

---

## Optional: Health check

- **GET** `https://<your-service-name>.onrender.com/`  
  Returns something like:  
  `{ "ok": true, "service": "codeverse-api", "ai": "openai" }`  
  so you can confirm the service is up and whether OpenAI is configured.

---

## Free tier notes

- **Spin-down**: Free web services sleep after ~15 minutes of no traffic. The first request after that may take 30–60 seconds; the app will wait for the response.
- **Build minutes**: Free tier has a monthly limit; this small backend uses very little.
- To avoid spin-down, use a paid plan or an external cron that hits your service URL every 10–14 minutes.

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| Build fails | Check the **Logs** tab. Ensure **Root Directory** is `backend` and **Build Command** is `npm install`. |
| 503 / timeout | Free tier may be waking up; try again. Or check **Logs** for crashes. |
| App says “Unable to reach AI” | Confirm `EXPO_PUBLIC_API_URL` has no trailing slash and matches the Render URL. Test in a browser: `GET https://your-url.onrender.com/`. |
| AI replies are mock | Add `OPENAI_API_KEY` in Render **Environment**, save, and let Render redeploy. |

---

## Summary

1. **New** → **Web Service** → connect repo.
2. **Root Directory**: `backend`; **Build**: `npm install`; **Start**: `npm start`.
3. Add **OPENAI_API_KEY** (and optionally **OPENAI_MODEL**).
4. Deploy; copy the `.onrender.com` URL into the app’s **EXPO_PUBLIC_API_URL**.

After that, the CodeVerse app will use your Render backend for AI chat.
