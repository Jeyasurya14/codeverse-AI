# Fix "App is not configured" Error in Preview Build

## Problem

The preview build shows "App is not configured. Please update and restart." This happens because the preview build profile doesn't have the required environment variables set.

## Solution

Set environment variables for the **preview** environment in EAS, or configure preview to use production environment variables.

## Option 1: Set Preview Environment Variables (Required)

Since you're not using Google/GitHub login, you only need to set the API URL:

```bash
# Set API URL for preview builds (REQUIRED)
eas env:create --name EXPO_PUBLIC_API_URL --value "https://YOUR-BACKEND.onrender.com" --environment preview --visibility plaintext
```

Replace `YOUR-BACKEND.onrender.com` with your actual backend URL (e.g., `https://codeverse-api-429f.onrender.com`).

**Note:** If you're using email/password login only, you don't need Google or GitHub OAuth client IDs.

## Option 2: Use Production Environment Variables

If you want preview builds to use the same config as production, you can update `eas.json` to use production environment. However, it's better to set preview-specific variables (Option 1).

## After Setting Variables

Rebuild the preview app:

```bash
eas build --platform android --profile preview
```

The new build will have the environment variables and won't show the "App is not configured" error.

## Verify Environment Variables

Check your environment variables:

```bash
# List all environment variables
eas env:list

# Or check in Expo Dashboard
# Go to: https://expo.dev → Your Project → Environment Variables
```

## Required Variables for Preview

- `EXPO_PUBLIC_API_URL` - Your backend API URL (e.g., `https://codeverse-api.onrender.com`)

**Optional (only if using OAuth):**
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID (only if using Google login)
- `EXPO_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth client ID (only if using GitHub login)

Since you're using email/password login only, you only need the API URL.
