# Production Quick Start Guide

Quick reference for production-grade deployment of CodeVerse.

---

## 🚀 Production Setup (5 Minutes)

### Step 1: Set EAS Environment Variables

```bash
# Login to EAS
eas login

# Set production API URL (REQUIRED)
eas env:create --name EXPO_PUBLIC_API_URL --value "https://codeverse-api-429f.onrender.com" --environment production --visibility plaintext

# Verify it's set
eas env:list
```

### Step 2: Verify Backend is Running

Your backend should be deployed at: `https://codeverse-api-429f.onrender.com`

Test it:
```bash
curl https://codeverse-api-429f.onrender.com/health
```

Should return: `{"ok":true,"database":"connected"}`

### Step 3: Build Production App

```bash
# Android (for Play Store)
eas build --platform android --profile production

# iOS (for App Store)
eas build --platform ios --profile production
```

---

## ✅ Production Checklist

### Backend (Render)

- [x] `NODE_ENV=production` ✅
- [x] `JWT_SECRET` set (≥32 chars) ✅
- [x] `DATABASE_URL` configured ✅
- [x] `OPENAI_API_KEY` set ✅
- [x] Backend deployed and accessible ✅

### Frontend (EAS)

- [ ] `EXPO_PUBLIC_API_URL` set in EAS production environment
- [ ] Production build tested
- [ ] Ready for store submission

---

## 🔧 Current Configuration

### Backend URL
```
https://codeverse-api-429f.onrender.com
```

### Required EAS Variables (Production)

```bash
EXPO_PUBLIC_API_URL=https://codeverse-api-429f.onrender.com
```

### Optional (if using OAuth)

```bash
EXPO_PUBLIC_GOOGLE_CLIENT_ID=436868027669-k90ua4c64llls5bk0pmqlimd8d9sdt4g.apps.googleusercontent.com
EXPO_PUBLIC_GITHUB_CLIENT_ID=Ov23li12lOljFCToSg2E
```

---

## 📝 Quick Commands

### Set Production Environment Variables

```bash
eas env:create --name EXPO_PUBLIC_API_URL --value "https://codeverse-api-429f.onrender.com" --environment production --visibility plaintext
```

### Build Production

```bash
eas build --platform android --profile production
```

### Check Environment Variables

```bash
eas env:list
```

---

## 🎯 Next Steps

1. ✅ Set `EXPO_PUBLIC_API_URL` in EAS (command above)
2. ✅ Build production app: `eas build --platform android --profile production`
3. ✅ Test the build
4. ✅ Submit to Play Store

---

**Your backend is already production-ready! Just set the EAS environment variable and build.**
