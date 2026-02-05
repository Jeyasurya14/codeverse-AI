# How to See Your Custom Splash Screen

## The Problem

In **Expo Go**, you'll always see the white "Bundling" screen first. This is Expo Go's default behavior and cannot be customized.

## The Solution: Use Development Build

To see your custom dark splash screen immediately, create a **development build** instead of using Expo Go.

## Step-by-Step Instructions

### Option 1: Build Development Client (Recommended)

```bash
# Build a development client for Android
eas build --platform android --profile development

# Or for iOS
eas build --platform ios --profile development
```

**What this does:**
- Creates a custom Expo app with your splash screen
- Shows dark splash screen immediately (no bundling screen)
- Can still reload code during development
- Perfect for testing your splash screen

**After build completes:**
1. Download and install the APK/IPA
2. Open the app - you'll see dark splash screen immediately!
3. Connect to your dev server: `expo start --dev-client`

### Option 2: Use Preview Build (APK)

```bash
# Build APK with production settings
eas build --platform android --profile preview
```

**What this does:**
- Builds an APK you can install directly
- Shows dark splash screen immediately
- Uses production environment
- Good for testing before Play Store

### Option 3: Local Development Build

```bash
# Generate native code
npx expo prebuild --clean

# Run on Android
npx expo run:android

# Or iOS
npx expo run:ios
```

**What this does:**
- Creates native Android/iOS projects locally
- Shows dark splash screen immediately
- Requires Android Studio / Xcode
- Fastest for local development

## Why Expo Go Shows Bundling Screen

- **Expo Go** = Generic app that loads any Expo project
- Shows "Bundling" screen while downloading your code
- Cannot be customized (it's Expo's app, not yours)

- **Development Build** = Your custom app with your splash screen
- Shows your dark splash screen immediately
- No bundling screen visible

## Quick Test

To see your splash screen RIGHT NOW:

```bash
# Build development client (takes ~10-15 minutes)
eas build --platform android --profile development

# Or test locally (faster, requires Android Studio)
npx expo prebuild --clean
npx expo run:android
```

## What You'll See

**With Development Build:**
1. ✅ Dark splash screen appears immediately
2. ✅ CodeVerse logo with animations
3. ✅ Smooth transition to app

**With Expo Go:**
1. ❌ White bundling screen (can't be changed)
2. ✅ Dark splash screen after bundling completes
3. ✅ Then app loads

## Summary

- **Expo Go** = Always shows bundling screen (can't change this)
- **Development Build** = Shows your custom splash screen immediately
- **Production Build** = Shows your custom splash screen immediately

To see the dark splash screen without the bundling screen, you need to build a development or production build.
