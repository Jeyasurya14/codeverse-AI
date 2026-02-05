# Upload CodeVerse AI to Play Store (public release)

Step-by-step guide to put your app live for everyone. Do each step in order.

---

## Before you start

- [ ] Google Play Developer account created and **$25** paid.
- [ ] **.aab** file ready (from `eas build --platform android --profile production` → download from [expo.dev](https://expo.dev) → Builds).
- [ ] Backend live and EAS production env vars set (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GITHUB_CLIENT_ID`).

---

## Step 1: Create the app (if you haven’t)

1. Go to [Play Console](https://play.google.com/console).
2. Click **Create app**.
3. **App name:** CodeVerse AI  
   **Default language:** English (India) or English (United States)  
   **App or game:** App  
   **Free or paid:** Free  
4. Accept declarations → **Create app**.

---

## Step 2: Upload the AAB to Production

1. In the left menu: **Release** → **Production**.
2. Click **Create new release**.
3. Under **App bundles**, click **Upload** and select your **.aab** file.
4. **Release name:** e.g. `1.0.0 (1)`.
5. Click **Save** (don’t roll out yet).

---

## Step 3: Store listing (what users see)

1. Left menu: **Grow** → **Store presence** → **Main store listing**.
2. Fill in:
   - **Short description** (max 80 chars):  
     *Learn programming from basics to advance with articles & AI mentor.*
   - **Full description** (max 4000 chars):  
     Describe: programming articles, AI mentor, multiple languages, sign in, tokens, etc.
3. **Graphics** (all required):
   - **App icon:** 512×512 PNG (no transparency).
   - **Feature graphic:** 1024×500 PNG.
   - **Phone screenshots:** At least 2 (e.g. 1080×1920). Use login, home, AI mentor, articles.
4. **Save**.

---

## Step 4: Content rating

1. **Policy** → **App content** → **Content rating**.
2. **Start questionnaire** → choose **Education** or **Productivity**.
3. Answer (no violence, no gambling, etc.) → **Submit**.
4. Attach the rating to your app when asked.

---

## Step 5: Privacy policy

1. Host a **privacy policy** page at a public URL (your site, GitHub Pages, etc.).
2. It should mention: email/name (sign in), usage/AI data, how you store it, third parties (OpenAI, Google, GitHub), user rights.
3. **Policy** → **App content** → **Privacy policy** → enter the **URL** → **Save**.

---

## Step 6: Target audience

1. **Policy** → **App content** → **Target audience and content**.
2. **Target age groups:** e.g. 13+ or 18+.
3. **News app:** No.  
   **Ads:** No (if you don’t show ads).
4. Complete any other questions → **Save**.

---

## Step 7: App access (login apps)

1. **Policy** → **App content** → **App access**.
2. Select that the app has **sign-in or restricted access**.
3. Add **instructions** for reviewers, e.g.:  
   *“Sign in with email (or Google/GitHub). You can create a new account or use: [test@example.com / YourTestPassword].”*
4. **Save**.

---

## Step 8: Data safety

1. **Policy** → **App content** → **Data safety**.
2. Declare:
   - **Data collected:** e.g. email, name, app interactions.
   - **Shared with third parties:** Yes (e.g. OpenAI, Google, GitHub for sign-in).
   - **User can request deletion:** Yes or No (match your policy).
3. **Submit**.

---

## Step 9: Fix any dashboard errors

1. Go to **Dashboard** (home of your app).
2. Resolve every **red** or **yellow** item (e.g. “Store listing incomplete”, “Content rating missing”).
3. You can’t roll out until all **required** items are done.

---

## Step 10: Roll out to Production (go public)

1. **Release** → **Production**.
2. Open your release (the one with the uploaded AAB).
3. Click **Review release**.
4. Click **Start rollout to Production**.
5. Confirm. Google will review (often a few hours to 1–2 days).
6. When approved, the app is **live** and anyone can install it from the Play Store.

---

## After it’s live

- Install from Play Store and test on a real device.
- For updates: change version in `app.json`, run `eas build --platform android --profile production`, then in Play Console → **Release** → **Production** → **Create new release** → upload the new .aab → **Start rollout to Production**.

---

## Quick checklist

- [ ] AAB uploaded to **Production** and release saved.
- [ ] **Store listing** done (short + full description, icon, feature graphic, ≥2 screenshots).
- [ ] **Content rating** completed and applied.
- [ ] **Privacy policy** URL added.
- [ ] **Target audience** set (age, news: No, ads: No if none).
- [ ] **App access** instructions (and test account) added.
- [ ] **Data safety** form submitted.
- [ ] Dashboard has no blocking issues.
- [ ] **Start rollout to Production** clicked.

For full pre-launch checks and env setup, see **PLAY_STORE_LAUNCH_COMPLETE.md**.
