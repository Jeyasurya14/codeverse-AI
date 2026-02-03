# Google and GitHub OAuth setup

To make "Continue with Google" and "Continue with GitHub" work, configure OAuth in both the **app** and the **backend**.

---

## How to get your Expo Go redirect URL

You need this **exact** URL as the redirect/callback URI in Google and GitHub OAuth:

```
https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai
```

**Step 1 – Get your Expo username**

- **Option A:** In a terminal (in your project folder), run:
  ```bash
  npx expo whoami
  ```
  If you’re logged in, it prints your username (e.g. `johndoe`). If not, run `npx expo login` first.

- **Option B:** Go to [expo.dev](https://expo.dev), sign in, and open your profile. Your username is in the URL: `https://expo.dev/@YOUR_USERNAME` or shown on the profile page.

**Step 2 – Build the URL**

Replace `YOUR_EXPO_USERNAME` with that username. The app **slug** is `codeverse-ai` (from `app.json`), so the full redirect URL is:

```
https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai
```

**Example:** If your username is `learnmadetamil`, use:
```
https://auth.expo.io/@learnmadetamil/codeverse-ai
```

Use this **same** URL in:
- **Google Cloud Console** → OAuth client → Authorized redirect URIs
- **GitHub** → OAuth App → Authorization callback URL

---

## 1. Backend (Render or local)

Add these environment variables to your backend (e.g. in Render **Environment**):

| Key | Where to get it |
|-----|------------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console (same value as in the app) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth client → Client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth App (same value as in the app) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App → Client secret |
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |

The backend uses these to exchange the authorization code for tokens and to sign JWTs.

---

## 2. Google OAuth (app + backend)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create or select a project.
3. **OAuth consent screen**: Configure consent screen (External), add your app name and support email.
4. **Credentials** → **Create credentials** → **OAuth client ID**.
5. Application type:
   - **Web application** (works with Expo’s redirect proxy in Expo Go).
   - Or **iOS** / **Android** if you use a dev/standalone build.
6. **Authorized redirect URIs** – add **exactly** one of:
   - **Expo Go**: `https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai`  
     (Replace `YOUR_EXPO_USERNAME` with your Expo account username; find it in [expo.dev](https://expo.dev) profile.)
   - **Dev/standalone**: your app scheme, e.g. `codeverse-ai://` or `exp://...`.
7. Copy the **Client ID** into:
   - App: `.env` → `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
   - Backend: `GOOGLE_CLIENT_ID`
8. Copy the **Client secret** into the backend only: `GOOGLE_CLIENT_SECRET`.

---

## 3. GitHub OAuth (app + backend)

1. Go to [GitHub → Developer settings → OAuth Apps](https://github.com/settings/developers).
2. **New OAuth App**.
3. **Application name**: e.g. CodeVerse.
4. **Homepage URL**: e.g. `https://your-app.com` or `https://expo.dev`.
5. **Authorization callback URL** – add **exactly** one of:
   - **Expo Go**: `https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai`
   - **Dev/standalone**: your app scheme, e.g. `codeverse://`.
6. Copy the **Client ID** into:
   - App: `.env` → `EXPO_PUBLIC_GITHUB_CLIENT_ID`
   - Backend: `GITHUB_CLIENT_ID`
7. Generate a **Client secret** and put it only in the backend: `GITHUB_CLIENT_SECRET`.

---

## 4. App `.env`

In the **Expo app** root, in `.env`:

```
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

Restart the Expo dev server after changing `.env`.

---

## 5. Flow summary

1. User taps "Continue with Google" or "Continue with GitHub".
2. App opens the provider’s login page with `redirect_uri` (Expo proxy or your scheme).
3. User signs in; provider redirects back with an authorization `code`.
4. App sends `code` and `redirectUri` to your backend `POST /auth/exchange`.
5. Backend exchanges `code` for tokens with Google/GitHub, gets profile, returns `{ user, accessToken }` (JWT).
6. App stores user and token and navigates into the app.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| "Google/GitHub sign-in is not configured" | Set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` / `EXPO_PUBLIC_GITHUB_CLIENT_ID` in app `.env` and restart Expo. |
| **"Access blocked: Authorization Error" / 400 invalid_request** | See "Access blocked (Google)" below. |
| "Sign-in failed" / 400 from backend | Redirect URI in Google/GitHub must match **exactly** what the app sends (Expo proxy URL or your scheme). |
| "Google sign-in is not configured" (backend) | Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the backend (e.g. Render env). |
| Redirect doesn’t open app | In Expo Go, redirect must be `https://auth.expo.io/@USERNAME/codeverse-ai`. Use `useProxy: true` in the app (already set in `useOAuth.ts`). |

### "Access blocked: Authorization Error" (Google)

This usually means one of:

1. **Redirect URI mismatch**  
   The `redirect_uri` sent to Google must match **exactly** (no trailing slash) one of the "Authorized redirect URIs" in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth client.

   - In **Expo Go**, the URL is `https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai` (replace `YOUR_EXPO_USERNAME` with your Expo account from `npx expo whoami` or [expo.dev](https://expo.dev) profile).
   - Add that **exact** URL in Google Console. If the app's computed redirect differs, set `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` in app `.env` to the same URL you added in Google Console, then restart Expo.
   - In dev, the app logs the redirect URI to the console: look for `[OAuth] Use this exact URL...` and add that URL in Google Console.

2. **App in Testing mode**  
   If the OAuth consent screen is in **Testing** mode, only "Test users" you added can sign in. Add your Google account in [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) → Test users, or publish the app for production.

3. **OAuth client type**  
   For Expo Go with the proxy, the Google OAuth client must be **Web application**. Create a Web application client and use the Expo proxy URL above as the redirect URI.
