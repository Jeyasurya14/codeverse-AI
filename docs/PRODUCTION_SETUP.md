# Production setup – CodeVerse

One guide to take CodeVerse from dev to **production-grade**: backend, app env, OAuth, EAS builds, and store launch. Follow in order.

---

## Overview

| Step | What | Where |
|------|------|--------|
| 1 | Backend env & deploy | Render (or your host) |
| 2 | OAuth (Google + GitHub) | Google Cloud Console, GitHub, backend + app |
| 3 | App env for production builds | EAS Environment (production) |
| 4 | Build & test | EAS Build |
| 5 | Store release (optional) | Play Store / App Store |

**Security:** Never commit `.env` or `.env.production`. Use EAS secrets and your host’s environment variables.

---

## Step 1 – Backend (production)

### 1.1 Deploy on Render

1. [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect repo, set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. In **Environment**, add every variable from the table below.

Full walkthrough: [DEPLOY_RENDER.md](./DEPLOY_RENDER.md).

### 1.2 Backend environment variables (production)

Set these on Render (or your host). **PORT** is set by Render; do not add it.

| Key | Required | Example / notes |
|-----|----------|------------------|
| `NODE_ENV` | Yes | `production` |
| `JWT_SECRET` | Yes | ≥ 32 chars, e.g. `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | For Google login | Same as app (e.g. `…apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | For Google login | From Google OAuth client |
| `GITHUB_CLIENT_ID` | For GitHub login | Same as app |
| `GITHUB_CLIENT_SECRET` | For GitHub login | From GitHub OAuth App |
| `OPENAI_API_KEY` | For real AI | From [OpenAI](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `CORS_ORIGINS` | No | Comma-separated; empty = allow all (ok for mobile-only) |

### 1.3 Verify backend

- URL: `https://<your-service>.onrender.com`
- `GET https://<your-service>.onrender.com/health` → `200 OK`
- `GET https://<your-service>.onrender.com/` → JSON with `env: "production"`, `auth: true` if OAuth is set

---

## Step 2 – OAuth (Google + GitHub)

Login uses **direct redirect** (no auth.expo.io). The redirect URI must match **exactly** in the app and in Google/GitHub.

### 2.1 Get the redirect URI

**Google’s “Web application” client only accepts URIs with a domain** — you cannot use `codeverse-ai://` (you’ll get “Invalid Redirect: must contain a domain”). Use the **Expo proxy URL**:

- **Redirect URI:** **`https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai`** (replace with your Expo username from `npx expo whoami`). No trailing slash.
- In the app `.env` set **`EXPO_PUBLIC_GOOGLE_REDIRECT_URI`** to this same URL so the app and Google match.

### 2.2 Google Cloud Console

1. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. **OAuth consent screen:** External, app name, support email. Add test users if app is in Testing.
3. **Create credentials → OAuth client ID** → Application type: **Web application**.
4. **Authorized redirect URIs:** add **`https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai`** (your Expo username). Do not use `codeverse-ai://` — Google requires a domain.
5. Copy **Client ID** and **Client secret**. Client ID goes in app + backend; secret only in backend.

### 2.3 GitHub OAuth App

1. [GitHub → Developer settings → OAuth Apps](https://github.com/settings/developers) → **New OAuth App**.
2. **Authorization callback URL:** same as Google — **`https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai`**.
3. Copy **Client ID** and generate **Client secret**. Client ID → app + backend; secret → backend only.

### 2.4 Backend

Ensure Render (or your host) has:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

Redirect URI is sent by the app on each login; backend uses it for the token exchange. No redirect URI env var needed on the backend.

Detailed OAuth steps: [OAUTH_SETUP.md](./OAUTH_SETUP.md).

---

## Step 3 – App environment (production builds)

Production app builds get config at **build time** via EAS Environment. Do not rely on local `.env` for store builds.

### 3.1 EAS environment variables (production)

Run (replace placeholders with your values):

```bash
eas login
eas env:create --name EXPO_PUBLIC_API_URL --value "https://YOUR-BACKEND.onrender.com" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_GITHUB_CLIENT_ID --value "YOUR_GITHUB_CLIENT_ID" --environment production --visibility plaintext
```

Optional (pin redirect so it matches Google/GitHub):

```bash
eas env:create --name EXPO_PUBLIC_GOOGLE_REDIRECT_URI --value "https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai" --environment production --visibility plaintext
```
Replace `YOUR_EXPO_USERNAME` with your Expo account (e.g. `learnmadetamil`).

- **production** = only `eas build --profile production` gets these.
- List/update: [expo.dev](https://expo.dev) → your project → **Environment variables**, or `eas env:list`.

### 3.2 Local production build (optional)

If you build production locally (e.g. `eas build --profile production` with env from a file):

1. Copy `.env.production.example` to `.env.production`.
2. Fill in values. **Do not commit** `.env.production` (it’s in `.gitignore`).
3. Run build so it loads `.env.production` (e.g. `npx dotenv -e .env.production -- eas build --profile production` if you use `dotenv-cli`), or rely on EAS env for cloud builds.

**Recommendation:** Use EAS Environment (3.1) for production so secrets stay in EAS and work for all team members.

---

## Step 4 – Build and test

### 4.1 Production build

```bash
# Android (AAB for Play Store)
eas build --platform android --profile production

# iOS (TestFlight / App Store)
eas build --platform ios --profile production

# Both
eas build --platform all --profile production
```

Builds run in the cloud. Links and status: [expo.dev](https://expo.dev) → your project → **Builds**.

### 4.2 Test before store release

1. Install the built app (download from Expo dashboard or use internal distribution).
2. **Login:** Google and GitHub sign-in complete and return to the app.
3. **API:** AI mentor uses the production backend (no “App is not configured”).
4. **OAuth:** Redirect URI in Google/GitHub must be **`https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai`**; set `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` in EAS or `.env` to the same value.

---

## Step 5 – Store release (optional)

- **Play Store:** [PLAY_STORE_LAUNCH.md](./PLAY_STORE_LAUNCH.md) – package name, AAB upload, listing, content rating, privacy policy.
- **App Store:** [EXPO_PRODUCTION.md](./EXPO_PRODUCTION.md) – section 7 (Submit to stores).

After first release, you can use **EAS Submit** for future builds (see EXPO_PRODUCTION.md and PLAY_STORE_LAUNCH.md).

---

## Production checklist

Use this before going live.

### Backend

- [ ] Deployed (e.g. Render) with **Root Directory** `backend`.
- [ ] `NODE_ENV=production` set.
- [ ] `JWT_SECRET` set, ≥ 32 characters.
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` set (for login).
- [ ] `OPENAI_API_KEY` set (for real AI).
- [ ] `GET /health` returns 200.
- [ ] No secrets in repo; all from host env.

### OAuth

- [ ] Google: OAuth client type **Web application**, redirect URI **`https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai`** (not `codeverse-ai://`).
- [ ] GitHub: callback URL same as above.
- [ ] Same Client IDs in app (EAS) and backend (Render).

### App

- [ ] EAS **production** env has: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GITHUB_CLIENT_ID`.
- [ ] Production build completes: `eas build --platform android --profile production` (and/or ios).
- [ ] Installed build: login (Google/GitHub) and AI mentor work; no “App is not configured”.

### Store (when applicable)

- [ ] Play Store: package name in `app.json`, AAB upload, listing, content rating, privacy policy (see PLAY_STORE_LAUNCH.md).
- [ ] App Store: credentials and submit config (see EXPO_PRODUCTION.md).

---

## Quick reference

| Doc | Purpose |
|-----|--------|
| **PRODUCTION_SETUP.md** (this file) | End-to-end production setup |
| [PRODUCTION.md](./PRODUCTION.md) | Short checklist and security summary |
| [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) | Render deploy steps |
| [OAUTH_SETUP.md](./OAUTH_SETUP.md) | OAuth details and troubleshooting |
| [EXPO_PRODUCTION.md](./EXPO_PRODUCTION.md) | EAS builds, env, OAuth redirects, submit |
| [PLAY_STORE_LAUNCH.md](./PLAY_STORE_LAUNCH.md) | Play Store launch steps |
