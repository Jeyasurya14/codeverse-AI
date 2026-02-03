# How to launch CodeVerse AI on the Google Play Store

Step-by-step from build to live on Play Store.

---

## 1. Google Play Developer account

- Go to [Google Play Console](https://play.google.com/console).
- Sign in with a Google account.
- **Register as a developer** – one-time **$25** fee.
- Complete account details (name, address, etc.) if prompted.

---

## 2. Create your app in Play Console

1. In Play Console, click **Create app**.
2. Fill in:
   - **App name:** CodeVerse AI
   - **Default language:** your choice (e.g. English)
   - **App or game:** App
   - **Free or paid:** Free (or Paid if you monetize)
3. Accept the declarations and create the app.

---

## 3. Set the Android package name

Your Expo app needs a **unique package name** (e.g. `com.yourcompany.codeverseai`).

1. In the project root, open **app.json** (or **app.config.js**).
2. Under `expo`, add (or edit) **android.package**:

```json
"android": {
  "package": "com.learnmadetamil.codeverseai",
  "adaptiveIcon": { ... },
  ...
}
```

Use your own domain/name reversed (e.g. `com.yourname.codeverseai`). It must be unique on Play Store.

3. **Rebuild** the Android app after changing the package name:
   ```bash
   eas build --platform android --profile production
   ```

---

## 4. Build the Android App Bundle (AAB)

Play Store requires an **Android App Bundle** (.aab), not APK, for production.

```bash
eas build --platform android --profile production
```

- Wait for the build to finish on [expo.dev](https://expo.dev) → your project → Builds.
- Download the **.aab** file from the build page (or use the link in the CLI).

---

## 5. First upload (manual)

Google requires the **first version** of a new app to be uploaded **manually** in Play Console.

1. In Play Console, open your app → **Release** → **Production** (or **Testing** → **Internal testing** to test first).
2. Click **Create new release**.
3. **Upload** the .aab file (drag and drop or **Upload** button).
4. Add **Release name** (e.g. `1.0.0 (1)`).
5. **Save** (you’ll complete the rest of the listing before rolling out).

---

## 6. Complete the store listing

Before you can publish, Play Console will show a checklist. Complete these:

### 6.1 Store listing (Main store listing)

- **Short description** (max 80 chars): e.g. *Learn programming from basics to advance with articles & AI mentor.*
- **Full description** (max 4000 chars): Explain features (articles, AI mentor, languages, login).
- **App icon:** 512×512 PNG (you can use `assets/icon.png` if it meets the size).
- **Feature graphic:** 1024×500 PNG (required).
- **Screenshots:** At least 2 phone screenshots (e.g. 1080×1920 or similar). Take from emulator or device.

### 6.2 Content rating

- Go to **Policy** → **App content** → **Content rating**.
- Complete the questionnaire (education/productivity, no harmful content).
- Submit and get the rating (e.g. Everyone, 3+, etc.).

### 6.3 Privacy policy

- **Required** if you collect any user data (email, name from login, or usage).
- Host a page with your privacy policy (e.g. on your site or a free host).
- In Play Console: **Policy** → **App content** → **Privacy policy** → add the URL.

### 6.4 Target audience and news app (if asked)

- Set **Target age groups**.
- Declare if the app is a news app (select **No** for CodeVerse).

### 6.5 Ads (if applicable)

- If your app shows ads, declare it. If not, select **No**.

---

## 7. Release to production

1. Go to **Release** → **Production** (or **Internal testing** first to test).
2. Your release with the uploaded .aab should be there.
3. Complete any remaining warnings in the dashboard.
4. Click **Review release** → **Start rollout to Production** (or to Internal testing).
5. After review (can take hours to a few days), the app will go **live** (or appear in internal testing).

---

## 8. Later updates (EAS Submit, optional)

After the **first upload is done manually**, you can use **EAS Submit** for future builds:

1. **Create a Google Service Account** with access to your Play Console app (see [Expo: Submit to Android](https://docs.expo.dev/submit/android/)).
2. Download the **JSON key** and store it securely (e.g. `play-store-key.json` in project root, add to `.gitignore`).
3. Submit the latest build:
   ```bash
   eas submit --platform android --latest
   ```
   When prompted, point to your JSON key file. Or configure it in **eas.json** under `submit.production.android.serviceAccountKeyPath`.

---

## 9. Production-grade checklist (before launch)

- [ ] **Backend:** Deployed with `NODE_ENV=production`; `JWT_SECRET` (≥32 chars), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` set on Render. See [PRODUCTION.md](./PRODUCTION.md) and [DEPLOY_RENDER.md](./DEPLOY_RENDER.md).
- [ ] **App env (EAS production):** `EXPO_PUBLIC_API_URL` (your backend URL), `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GITHUB_CLIENT_ID` set in EAS for **production** so the built app uses them.
- [ ] **OAuth redirect for standalone:** In Google Cloud Console and GitHub OAuth App, add **both** redirect URIs so login works in Expo Go and in the store build:
  - `https://auth.expo.io/@YOUR_EXPO_USERNAME/codeverse-ai` (Expo Go)
  - `codeverse-ai://` (standalone/Play Store build; the app uses direct deep link in production).
- [ ] **No dev leaks:** No `console.log`/`console.warn` in production code paths (they are gated with `__DEV__`).
- [ ] **Test the production build:** Install the built AAB/APK (or from internal testing), then test: Google sign-in, GitHub sign-in, AI mentor, and that the app does not show "App is not configured" (confirms `EXPO_PUBLIC_API_URL` is set in EAS production).

---

## Checklist

- [ ] Google Play Developer account ($25) and app created in Play Console.
- [ ] `android.package` set in app.json and production build re-run.
- [ ] `eas build --platform android --profile production` and .aab downloaded.
- [ ] First version uploaded manually in Play Console.
- [ ] Store listing: short + full description, icon, feature graphic, screenshots.
- [ ] Content rating, privacy policy URL, target audience completed.
- [ ] Release created and rolled out to Production (or Internal testing first).
- [ ] Production-grade checklist (Section 9) completed.

For **Expo/EAS build and env** details, see [EXPO_PRODUCTION.md](./EXPO_PRODUCTION.md).
