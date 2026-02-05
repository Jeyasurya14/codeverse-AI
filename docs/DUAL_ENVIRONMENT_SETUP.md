# Dual Environment Setup: Local Development + Production

This guide helps you set up both local development and production environments.

---

## 🎯 Overview

- **Local Development**: Uses `.env` file with `http://localhost:3000` (or your local IP)
- **Production Builds**: Uses EAS Environment Variables with production URL

---

## 📋 Setup Steps

### Step 1: Local Development Configuration (`.env`)

Your `.env` file is already configured for local development:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**For Physical Device Testing:**
If testing on a physical device, update to your local IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.31.67:3000
```

**To find your IP:**
```powershell
# Windows
ipconfig | Select-String "IPv4"
```

---

### Step 2: Production Configuration (EAS Environment Variables)

Set the production API URL for EAS builds:

```bash
eas env:create --name EXPO_PUBLIC_API_URL \
  --value "https://codeverse-api-429f.onrender.com" \
  --environment production \
  --visibility plaintext
```

**Verify it's set:**
```bash
eas env:list
```

You should see `EXPO_PUBLIC_API_URL` under `production` environment.

---

## 🔄 How It Works

### Local Development (`npm start`)
- ✅ Uses `.env` file
- ✅ Points to `http://localhost:3000` (or your local IP)
- ✅ Requires backend running locally
- ✅ Fast iteration and debugging

### Production Build (`eas build`)
- ✅ Uses EAS Environment Variables
- ✅ Points to `https://codeverse-api-429f.onrender.com`
- ✅ No local backend needed
- ✅ Ready for app store submission

---

## 🚀 Usage Guide

### Scenario A: Local Development

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   npm start
   ```

3. **Test on Emulator:**
   - Use `http://localhost:3000` in `.env`
   - Works automatically

4. **Test on Physical Device:**
   - Update `.env` with your local IP
   - Restart Expo: `npm start -- --clear`

---

### Scenario B: Production Build

1. **Verify EAS Environment Variable:**
   ```bash
   eas env:list
   ```

2. **Build Production App:**
   ```bash
   eas build --platform android --profile production
   ```

3. **The build automatically uses:**
   - Production URL from EAS env variables
   - Not your local `.env` file

---

## 🔍 Quick Reference

### Check Current Configuration

**Local Development:**
```bash
# Check .env file
cat .env | grep EXPO_PUBLIC_API_URL
```

**Production:**
```bash
# Check EAS environment variables
eas env:list
```

---

## 🛠️ Switching Between Environments

### Switch to Local Development
1. Ensure `.env` has: `EXPO_PUBLIC_API_URL=http://localhost:3000`
2. Start backend: `cd backend && npm start`
3. Start Expo: `npm start`

### Switch to Production Testing
1. Update `.env` temporarily: `EXPO_PUBLIC_API_URL=https://codeverse-api-429f.onrender.com`
2. Restart Expo: `npm start -- --clear`
3. **Note:** This is for testing only. For actual production builds, use EAS env variables.

---

## ✅ Verification Checklist

### Local Development
- [ ] `.env` file exists with `EXPO_PUBLIC_API_URL=http://localhost:3000`
- [ ] Backend is running (`cd backend && npm start`)
- [ ] Backend accessible at `http://localhost:3000/health`
- [ ] Expo app connects successfully

### Production
- [ ] EAS environment variable set: `eas env:list`
- [ ] Production URL: `https://codeverse-api-429f.onrender.com`
- [ ] Production backend is accessible
- [ ] Build uses production URL (not `.env`)

---

## 🐛 Troubleshooting

### Issue: App uses wrong URL

**Local Development:**
- Check `.env` file exists
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Restart Expo: `npm start -- --clear`

**Production Build:**
- Check EAS env variables: `eas env:list`
- Verify production URL is set
- Rebuild app after setting variables

### Issue: Network error in local development

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **If using physical device:**
   - Update `.env` with your local IP
   - Ensure device and computer on same Wi-Fi
   - Restart Expo

### Issue: Network error in production build

1. **Check production backend:**
   ```bash
   curl https://codeverse-api-429f.onrender.com/health
   ```

2. **Verify EAS env variable:**
   ```bash
   eas env:list
   ```

3. **Rebuild if needed:**
   ```bash
   eas build --platform android --profile production
   ```

---

## 📝 Summary

| Environment | Configuration | URL | Backend Required |
|------------|---------------|-----|-----------------|
| **Local Dev** | `.env` file | `http://localhost:3000` | ✅ Yes (local) |
| **Production** | EAS Env Vars | `https://codeverse-api-429f.onrender.com` | ✅ Yes (Render) |

**Key Points:**
- ✅ `.env` for local development
- ✅ EAS env variables for production builds
- ✅ Both can coexist without conflicts
- ✅ EAS builds ignore `.env` file

---

## 🎉 You're All Set!

You now have both environments configured:
- ✅ Local development ready
- ✅ Production builds ready

Just remember:
- **Local**: Use `npm start` (uses `.env`)
- **Production**: Use `eas build` (uses EAS env vars)
