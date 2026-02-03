# Expo production setup – CodeVerse AI

Get the app ready for production builds (TestFlight, Play Store, or internal distribution) and point it at your production backend.

---

## Quick start

1. Set production env vars in EAS (so production builds use your live API):
   ```bash
   eas env:create --name EXPO_PUBLIC_API_URL --value "https://YOUR-BACKEND.onrender.com" --environment production --visibility plaintext
   eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "YOUR_GOOGLE_CLIENT_ID" --environment production --visibility plaintext
   eas env:create --name EXPO_PUBLIC_GITHUB_CLIENT_ID --value "YOUR_GITHUB_CLIENT_ID" --environment production --visibility plaintext
   ```
2. Build:
   ```bash
   eas build --platform all --profile production
   ```
3. Download the build from [expo.dev](https://expo.dev) → your project → Builds, or submit to the stores (see section 7).

---

## 1. Prerequisites

- **Expo account** – You’re already using EAS (project linked).
- **EAS CLI** – Install if needed: `npm install -g eas-cli`
- **Production backend** – Deployed (e.g. on Render) with `NODE_ENV=production` and env vars set.

---

## 2. Set production environment variables

Your app uses **EXPO_PUBLIC_*** variables. They are baked in at **build time**, so production builds must get the production values when the build runs.

### Option A: EAS environment (recommended)

Store production values in EAS so every production build uses them:

```bash
# Log in
eas login

# Production API URL (your real backend, e.g. Render)
eas env:create --name EXPO_PUBLIC_API_URL --value "https://your-backend.onrender.com" --environment production --visibility plaintext

# Google OAuth (same Client ID as in backend)
eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" --environment production --visibility plaintext

# GitHub OAuth (same Client ID as in backend)
eas env:create --name EXPO_PUBLIC_GITHUB_CLIENT_ID --value "YOUR_GITHUB_CLIENT_ID" --environment production --visibility plaintext
```

- Use **production** so only production builds get these.
- To list or update: Expo Dashboard → your project → **Environment variables**, or `eas env:list`.

### Option B: Local `.env.production`

For local production builds only:

1. Create **`.env.production`** in the project root (same folder as `app.json`).
2. Add:
   ```env
   EXPO_PUBLIC_API_URL=https://your-backend.onrender.com
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
   EXPO_PUBLIC_GITHUB_CLIENT_ID=...
   ```
3. Add `.env.production` to **`.gitignore`** so secrets aren’t committed.
4. Run builds with a tool that loads `.env.production` (e.g. `env-cmd -f .env.production eas build --profile production`), or rely on EAS env (Option A) for cloud builds.

**Recommendation:** Use **Option A** for EAS cloud builds so production credentials stay in EAS and work for everyone on the team.

---

## 3. Build profiles (`eas.json`)

The project has three profiles:

| Profile       | Use case              | Distribution   |
|---------------|------------------------|----------------|
| **development** | Dev client, testing  | Internal       |
| **preview**     | Internal testing (APK on Android) | Internal |
| **production**  | App Store / Play Store | Store      |

- **development** – For development builds with dev client.
- **preview** – Build an APK (Android) or internal iOS build for testers; can use production or preview env.
- **production** – For store submission; uses EAS **production** environment variables.

---

## 4. Run a production build

### iOS (TestFlight / App Store)

```bash
eas build --platform ios --profile production
```

- First time: EAS will prompt for Apple credentials (Apple ID, team, etc.).
- After the build finishes, use **EAS Submit** or upload the IPA from the Expo dashboard to App Store Connect.

### Android (Play Store or APK)

```bash
# Store build (AAB for Play Store)
eas build --platform android --profile production

# Or internal APK (no store) – use preview profile
eas build --platform android --profile preview
```

### Both platforms

```bash
eas build --platform all --profile production
```

Builds run in the cloud; links and status appear in the terminal and in [expo.dev](https://expo.dev) → your project → Builds.

---

## 5. Point production builds at your backend

- **EXPO_PUBLIC_API_URL** must be your **production** backend URL (e.g. `https://codeverse-api.onrender.com`), **no trailing slash**.
- Set it in the **production** EAS environment (Option A) so every `--profile production` build uses it.
- For **preview** builds you can use the same production URL or a separate preview backend by defining a **preview** environment in EAS and setting `EXPO_PUBLIC_API_URL` there.

---

## 6. OAuth redirect URLs for production

- **Expo Go / development:**  
  `https://auth.expo.io/@learnmadetamil/codeverse-ai`
- **Standalone app (production):**  
  Redirect uses your custom scheme. Add to Google and GitHub:
  - **Scheme:** `codeverse-ai` → redirect URI: **`codeverse-ai://`** (or the exact redirect path your app uses).

In Google Cloud Console and GitHub OAuth App, add both:

1. `https://auth.expo.io/@learnmadetamil/codeverse-ai` (Expo Go / dev)
2. `codeverse-ai://` (or your full redirect path for standalone builds)

so login works in both development and production.

---

## 7. Submit to stores (optional)

After a successful **production** build:

**iOS (TestFlight / App Store):**

```bash
eas submit --platform ios --profile production
```

Configure Apple ID, App Store Connect app, and team in `eas.json` under `submit.production.ios` or when prompted.

**Android (Play Store):**

```bash
eas submit --platform android --profile production
```

Configure a Google Play service account and track in `eas.json` under `submit.production.android`, or follow the EAS Submit prompts.

---

## 8. Checklist

- [ ] Backend deployed with `NODE_ENV=production` and required env vars (see [PRODUCTION.md](./PRODUCTION.md)).
- [ ] Production env vars set in EAS for **production** (or in `.env.production` for local prod builds):  
  `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GITHUB_CLIENT_ID`.
- [ ] Google and GitHub OAuth redirect URIs include both Expo proxy URL and `codeverse-ai://` for standalone.
- [ ] Run `eas build --platform all --profile production` and confirm build succeeds.
- [ ] Install the built app (from Expo dashboard or TestFlight/Play) and test: login (Google/GitHub), AI chat, and API URL (no CORS issues).
- [ ] Optional: configure `eas.json` submit and run `eas submit` for store release.

For backend production details, see [PRODUCTION.md](./PRODUCTION.md) and [DEPLOY_RENDER.md](./DEPLOY_RENDER.md).
