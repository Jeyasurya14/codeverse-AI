# Host Privacy Policy on GitHub Pages (Best & Free)

Step-by-step guide to create and host your privacy policy for Play Store.

---

## Step 1: Create the privacy policy HTML file

1. Create a new folder in your project (or anywhere): `privacy-policy`
2. Create `index.html` inside it:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeVerse - Privacy Policy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        h1 {
            color: #3B82F6;
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        ul {
            margin: 10px 0;
        }
        strong {
            color: #333;
        }
        a {
            color: #3B82F6;
        }
    </style>
</head>
<body>
    <h1>Privacy Policy for CodeVerse</h1>
    <p><strong>Last updated:</strong> February 3, 2026</p>
    
    <h2>1. Information We Collect</h2>
    <p>When you use CodeVerse, we collect the following information:</p>
    <ul>
        <li><strong>Account Information:</strong> Email address, name (when you sign up or sign in using email, Google, or GitHub)</li>
        <li><strong>Usage Data:</strong> AI conversations, token usage, articles read, progress tracking, bookmarks</li>
        <li><strong>Device Information:</strong> Device type, operating system (collected automatically for app functionality)</li>
    </ul>
    
    <h2>2. How We Use Your Information</h2>
    <p>We use your information to:</p>
    <ul>
        <li>Provide AI mentor and learning features</li>
        <li>Manage your account and track your learning progress</li>
        <li>Improve our service and user experience</li>
        <li>Send important updates and notifications (if you opt in)</li>
    </ul>
    
    <h2>3. Third-Party Services</h2>
    <p>We use the following third-party services that may collect or process your data:</p>
    <ul>
        <li><strong>OpenAI:</strong> For AI mentor responses and chat functionality</li>
        <li><strong>Google:</strong> For Google Sign-In authentication</li>
        <li><strong>GitHub:</strong> For GitHub Sign-In authentication</li>
        <li><strong>Hosting Provider:</strong> For backend services and secure data storage</li>
    </ul>
    <p>These services have their own privacy policies. We recommend reviewing them.</p>
    
    <h2>4. Data Storage and Security</h2>
    <p>Your data is stored securely on our backend servers. We use industry-standard security measures, including encryption, to protect your information. However, no method of transmission over the internet is 100% secure.</p>
    
    <h2>5. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
        <li>Access your personal data</li>
        <li>Request deletion of your data</li>
        <li>Opt out of certain data collection</li>
        <li>Update or correct your information</li>
    </ul>
    <p>To exercise these rights, please contact us using the information below.</p>
    
    <h2>6. Children's Privacy</h2>
    <p>CodeVerse is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
    
    <h2>7. Changes to This Policy</h2>
    <p>We may update this privacy policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this page. Your continued use of the app after changes constitutes acceptance of the updated policy.</p>
    
    <h2>8. Contact Us</h2>
    <p>If you have questions about this privacy policy or wish to exercise your rights, please contact us at:</p>
    <p><strong>Email:</strong> [YOUR_EMAIL_HERE]</p>
    <p><strong>App:</strong> CodeVerse</p>
</body>
</html>
```

3. **Replace `[YOUR_EMAIL_HERE]`** with your actual contact email (e.g., `privacy@codeverse.ai` or `support@yourdomain.com`).

---

## Step 2: Create a GitHub repository

1. Go to [github.com](https://github.com) and sign in (or create an account).
2. Click the **"+"** icon → **"New repository"**.
3. Repository name: `codeverse-privacy-policy` (or any name).
4. Description: "Privacy Policy for CodeVerse".
5. Set to **Public** (required for free GitHub Pages).
6. **Do NOT** check "Initialize with README" (you'll upload files).
7. Click **"Create repository"**.

---

## Step 3: Upload the HTML file

**Option A: Via GitHub website**

1. In your new repo, click **"uploading an existing file"** (or drag & drop).
2. Upload your `index.html` file.
3. Scroll down → **Commit message**: "Add privacy policy" → **Commit changes**.

**Option B: Via Git (if you have Git installed)**

```bash
cd privacy-policy
git init
git add index.html
git commit -m "Add privacy policy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/codeverse-privacy-policy.git
git push -u origin main
```

---

## Step 4: Enable GitHub Pages

1. In your GitHub repo, go to **Settings** (top menu).
2. Scroll to **Pages** (left sidebar).
3. Under **Source**, select **"Deploy from a branch"**.
4. Branch: **`main`** (or `master`).
5. Folder: **`/ (root)`**.
6. Click **Save**.
7. Wait 1–2 minutes, then refresh the page.
8. You'll see: **"Your site is live at `https://YOUR_USERNAME.github.io/codeverse-privacy-policy/`"**

---

## Step 5: Use the URL in Play Console

1. Copy your GitHub Pages URL: `https://YOUR_USERNAME.github.io/codeverse-privacy-policy/`
2. In Play Console → **"Set privacy policy"** (or **Policy** → **App content** → **Privacy policy**).
3. Paste the URL → **Save**.

---

## Step 6: Test the URL

1. Open the URL in a browser to confirm it loads.
2. Make sure it shows your privacy policy correctly.

---

## Benefits of GitHub Pages

- ✅ **Free** (no credit card)
- ✅ **Permanent URL** (doesn't expire)
- ✅ **Easy updates** (edit `index.html` → commit → changes go live)
- ✅ **HTTPS** (secure, required by Play Store)
- ✅ **Fast** (hosted on GitHub's CDN)

---

## Updating later

To update your privacy policy:

1. Edit `index.html` in your GitHub repo.
2. Commit the changes.
3. The URL stays the same; Play Console will see the updated content automatically.

---

## Quick checklist

- [ ] Created `index.html` with privacy policy content
- [ ] Replaced `[YOUR_EMAIL_HERE]` with your email
- [ ] Created GitHub repository (public)
- [ ] Uploaded `index.html` to the repo
- [ ] Enabled GitHub Pages (Settings → Pages)
- [ ] Copied the GitHub Pages URL
- [ ] Added URL in Play Console → "Set privacy policy"
- [ ] Tested the URL in a browser

Done! Your privacy policy is now live and ready for Play Store.
