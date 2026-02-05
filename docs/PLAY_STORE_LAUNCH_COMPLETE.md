# CodeVerse – Complete pre-launch check & Play Store launch

This guide has two parts: **Part A** is a full application check before launch; **Part B** is the step-by-step process to publish on Google Play Store without issues.

---

# Part A: Pre-launch application check

Do this **before** building for production or submitting to Play Store.

---

## A1. App identity & config

| Item | Where to check | Status |
|------|----------------|--------|
| **App name** | `app.json` → `expo.name` = `codeverse-ai` (internal). Store listing will use "CodeVerse". | ✓ |
| **Version** | `app.json` → `expo.version` = `1.0.0`. | ✓ |
| **Android package** | `app.json` → `expo.android.package` = `com.learnmadetamil.codeverseai`. Must be unique on Play Store; do not change after first release. | ✓ |
| **Deep link scheme** | `app.json` → `expo.scheme` = `codeverse-ai`. Used for OAuth and magic link in standalone app. | ✓ |
| **EAS project** | `app.json` → `extra.eas.projectId` and `owner` match your Expo account. | ✓ |
| **Icon & splash** | `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png` exist and look correct. | Verify |

---

## A2. No secrets in app code

| Item | Status |
|------|--------|
| API URL and OAuth client IDs come from **env** (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GITHUB_CLIENT_ID`). Not hardcoded. | ✓ |
| `.env` and `backend/.env` are in `.gitignore`. Never commit them. | ✓ |
| Production console logs gated with `__DEV__` (AuthDeepLinkHandler, ErrorBoundary, etc.). | ✓ |

---

## A3. Backend production-ready

| Item | Action |
|------|--------|
| Backend deployed (e.g. Render) with **HTTPS**. | Deploy if not done. |
| `NODE_ENV=production`. | Set on host. |
| `JWT_SECRET` ≥ 32 characters. | Set on host. |
| `DATABASE_URL` points to production DB. | Set on host. |
| `OPENAI_API_KEY` set for AI mentor. | Set on host. |
| OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. | Set on host. |
| CORS: `CORS_ORIGINS` includes your backend URL if needed; or allow your app origin. | Configure. |
| Health: `GET /health` returns 200 when DB is connected. | Verify. |

See `docs/PRODUCTION.md` and `docs/DEPLOY_RENDER.md`.

---

## A4. EAS production environment variables

These are **baked in at build time**. Set them in EAS for the **production** environment:

```bash
eas env:list   # see current vars

# Required for production build
eas env:create --name EXPO_PUBLIC_API_URL --value "https://YOUR-BACKEND.onrender.com" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_GITHUB_CLIENT_ID --value "YOUR_GITHUB_CLIENT_ID" --environment production --visibility plaintext
```

- Replace with your real backend URL and OAuth client IDs.
- **No trailing slash** on `EXPO_PUBLIC_API_URL`.
- If vars already exist, use `eas env:update` instead of `create`.

---

## A5. OAuth redirect URIs (critical for login in store build)

For **Google** and **GitHub** OAuth apps, both URIs must be added:

| Use case | Redirect URI to add |
|----------|---------------------|
| Expo Go / dev | `https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai` |
| Standalone / Play Store | `codeverse-ai://` |

Replace `YOUR_EXPO_USERNAME` with your Expo account username (e.g. `learnmadetamil`).

- **Google:** Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID → Authorized redirect URIs.
- **GitHub:** GitHub → Settings → Developer settings → OAuth Apps → your app → Authorization callback URL (you may need to add a second callback; ensure both proxy and direct scheme work).

---

## A6. Payment / Recharge

| Item | Status |
|------|--------|
| Recharge screen shows **"Payment coming soon"** (no real payment). | ✓ `PAYMENT_COMING_SOON = true` in `src/constants/theme.ts`. |
| When you enable payment later: set `PAYMENT_COMING_SOON = false` and wire Razorpay (see `docs/SUBSCRIPTION_SETUP_RAZORPAY.md`). | Optional later. |

---

## A7. Test the production build locally (recommended)

1. Set EAS production env vars (A4).
2. Build: `eas build --platform android --profile production`.
3. Download the **.aab** from [expo.dev](https://expo.dev) → your project → Builds.
4. Install on a device (e.g. upload AAB to **Internal testing** and install from Play Console, or use a tool to extract/install from AAB).
5. Test:
   - App opens, no "App is not configured" (confirms `EXPO_PUBLIC_API_URL` is set).
   - Email sign up / sign in.
   - Google sign in (confirms redirect URI for standalone).
   - GitHub sign in (same).
   - AI Mentor: send a message (confirms backend + OpenAI).
   - Recharge screen: shows "Payment coming soon".
   - No crash on main flows.

---

# Part B: Step-by-step Play Store launch

Follow in order. Do **Part A** first.

---

## Direct to Production (no internal testing)

If you want to **publish straight to the store and test after it’s live**:

1. **Build** once: `eas build --platform android --profile production` → download the **.aab**.
2. In Play Console, use **Release → Production** only (skip Internal/Closed testing).
3. **Upload** the .aab to **Production** → **Create new release** → add the AAB → **Save**.
4. Complete **all** required items so the dashboard has no blocking issues:
   - **Store listing** (short + full description, icon 512×512, feature graphic 1024×500, at least 2 screenshots).
   - **Content rating** (questionnaire).
   - **Privacy policy** (public URL).
   - **Target audience** (age groups, news app: No, ads: No if none).
   - **App access** (how to sign in + optional test account).
   - **Data safety** (what you collect/share).
5. When everything shows ready, go to **Release → Production** → **Review release** → **Start rollout to Production**.
6. After Google approves (often a few hours to a couple of days), the app goes **live**. Install from the Play Store and test on a real device.

You can fix issues in a new version (bump version, new build, upload to Production again) if you find bugs after launch.

---

## B1. Google Play Developer account

1. Go to [Google Play Console](https://play.google.com/console).
2. Sign in with a Google account.
3. **Register as a developer** – one-time **$25** fee.
4. Complete profile (name, address, etc.) if prompted.
5. Accept the Developer Distribution Agreement.

---

## B2. Create the app in Play Console

1. In Play Console, click **Create app**.
2. Fill in:
   - **App name:** CodeVerse
   - **Default language:** e.g. English (India) or English (United States)
   - **App or game:** App
   - **Free or paid:** Free
3. Declare that you comply with the policies and create the app.

---

## B3. Build the Android App Bundle (AAB)

Play Store requires **.aab** for production (not APK).

1. Ensure EAS production env vars are set (Part A4).
2. In project root:
   ```bash
   eas build --platform android --profile production
   ```
3. Wait for the build on [expo.dev](https://expo.dev) → your project → Builds.
4. Download the **.aab** from the build page (or use the link from the CLI).

Do **not** change `expo.android.package` after the first release; it must stay the same for updates.

---

## B4. First release – upload manually

Google requires the **first** version to be uploaded manually.

1. In Play Console, open your app.
2. Go to **Release** → **Production** (or **Testing** → **Internal testing** to test first).
3. Click **Create new release**.
4. **Upload** the .aab (drag and drop or **Upload** button).
5. **Release name:** e.g. `1.0.0 (1)`.
6. **Save** (do not roll out yet – complete the rest of the checklist first).

---

## B5. Store listing (Main store listing)

1. Go to **Grow** → **Store presence** → **Main store listing** (or **Dashboard** → **Set up your app**).
2. Fill in:
   - **Short description** (max 80 characters):  
     e.g. *Learn programming from basics to advance with articles & AI mentor.*
   - **Full description** (max 4000 characters):  
     Describe features: programming articles, AI mentor, multiple languages, sign in, token system, etc.
3. **Graphics:**
   - **App icon:** 512×512 PNG (e.g. export from `assets/icon.png` or design tool).
   - **Feature graphic:** 1024×500 PNG (required).
   - **Screenshots:** At least 2 phone screenshots (e.g. 1080×1920 or 9:16). Take from emulator or device (login, home, AI mentor, articles).
4. **Save**.

---

## B6. Content rating

1. Go to **Policy** → **App content** → **Content rating**.
2. Start questionnaire; choose **Education** or **Productivity**.
3. Answer questions (no violence, no gambling, etc.).
4. Submit and get the rating (e.g. Everyone, 3+).

---

## B7. Privacy policy (required)

Required because the app collects email/name (sign in) and usage (AI, progress).

1. **Create a privacy policy** and host it at a public URL (e.g. your website, GitHub Pages, or a free host).
2. It should cover:
   - What data you collect (email, name, usage, tokens, conversation data).
   - How you use it (account, AI, improving service).
   - How you store it (backend, database).
   - Third parties (e.g. OpenAI for AI, Google/GitHub for sign-in).
   - User rights (access, deletion, contact).
3. In Play Console: **Policy** → **App content** → **Privacy policy** → add the **URL**.

---

## B8. Target audience and content form

1. **Policy** → **App content** → **Target audience and content**.
2. Set **Target age groups** (e.g. 13+ or 18+ depending on your policy).
3. **News app:** No (unless you are a news app).
4. Complete any other required declarations (ads: No if you don’t show ads).

---

## B9. App access (if required)

If your app has login:

- **Policy** → **App content** → **App access**.
- Provide **instructions** (and optional test account) for Google to access the app. Example: “Sign in with email or Google/GitHub. Test account: test@example.com / password.”

---

## B10. Data safety

1. **Policy** → **App content** → **Data safety**.
2. Declare:
   - Data collected (e.g. email address, name, app interactions).
   - Whether it’s shared with third parties (e.g. OpenAI, Google, GitHub).
   - Whether users can request deletion (if you support it).
3. Save and submit.

---

## B11. Release to production

1. Go to **Release** → **Production** (or **Internal testing** if you chose that).
2. Your release with the uploaded .aab should be there.
3. Resolve any remaining warnings in the dashboard (red/yellow items).
4. Click **Review release** → **Start rollout to Production** (or to Internal testing).
5. After review (often a few hours to a couple of days), the app will go **live** (or appear in internal testing).

---

## B12. After first release (optional: EAS Submit for updates)

For **future** updates you can use EAS Submit:

1. Create a **Google Play service account** with access to your app in Play Console (see [Expo: Submit to Android](https://docs.expo.dev/submit/android/)).
2. Download the **JSON key**, store as e.g. `play-store-key.json` in project root, and add to `.gitignore` (already added).
3. Submit the latest build:
   ```bash
   eas build --platform android --profile production
   eas submit --platform android --latest
   ```
   When prompted, point to the JSON key file. Or set `submit.production.android.serviceAccountKeyPath` in `eas.json`.

---

# Quick checklist (before you launch)

- [ ] Part A: Pre-launch check done (config, env, OAuth, backend, one production build test).
- [ ] Play Developer account ($25) and app created in Play Console.
- [ ] `eas build --platform android --profile production` and .aab downloaded.
- [ ] First version uploaded manually in Play Console.
- [ ] Store listing: short + full description, 512×512 icon, 1024×500 feature graphic, ≥2 screenshots.
- [ ] Content rating completed.
- [ ] Privacy policy URL added.
- [ ] Target audience and data safety completed.
- [ ] App access (and test account) provided if required.
- [ ] Release rolled out to Production (or Internal testing first).

---

# References

- **Expo production:** `docs/EXPO_PRODUCTION.md`
- **Backend production:** `docs/PRODUCTION.md`, `docs/DEPLOY_RENDER.md`
- **Existing Play guide:** `docs/PLAY_STORE_LAUNCH.md`
- **Razorpay (when you enable payment):** `docs/SUBSCRIPTION_SETUP_RAZORPAY.md`
