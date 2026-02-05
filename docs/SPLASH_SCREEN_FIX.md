# Splash Screen - Why You See "Bundling" Screen

## The Issue

The white "Bundling" screen you're seeing is **Metro's development bundler screen**. This is normal during development and appears BEFORE your React Native app loads.

## Why This Happens

1. **Development Mode**: When running `expo start`, Metro bundles JavaScript on-the-fly
2. **Bundling Screen**: Shows while JavaScript is being compiled (0% → 100%)
3. **After Bundling**: Once complete, your custom dark splash screen appears

## The Solution

### Option 1: Wait for Bundling to Complete (Development)
- The "Bundling" screen will show 0% → 100%
- Once it reaches 100%, your custom dark splash screen will appear
- This is normal in development mode

### Option 2: Build the App (See Native Splash Immediately)
To see the dark splash screen immediately without the bundling screen:

```bash
# For Android
npx expo prebuild --clean
npx expo run:android

# For iOS  
npx expo prebuild --clean
npx expo run:ios
```

This creates a development build where:
- Bundling happens at build time (not runtime)
- Native splash screen shows immediately
- No "Bundling" screen appears

### Option 3: Use Production Build
```bash
# Build for production
eas build --platform android --profile production
```

## Current Configuration

Your app is already configured with:
- ✅ Dark splash screen background (#0C1222)
- ✅ CodeVerse logo image
- ✅ Custom animated splash screen component
- ✅ Dark theme throughout

## What Happens Now

1. **During Development** (`expo start`):
   - White "Bundling" screen appears first (Metro bundler)
   - After bundling completes → Dark splash screen appears
   - Then app loads

2. **After Building** (`expo run:android/ios`):
   - Dark native splash screen appears immediately
   - No bundling screen
   - Smooth transition to app

## Summary

The "Bundling" screen is **normal in development** and cannot be removed. Your custom dark splash screen will appear once bundling completes. To see the splash immediately, rebuild the app.
