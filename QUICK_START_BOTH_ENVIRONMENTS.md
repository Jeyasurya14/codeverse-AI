# 🚀 Quick Start: Both Environments

This guide helps you use **both** local development and production environments seamlessly.

---

## ✅ Current Setup

### Local Development ✅
- **Configuration:** `.env` file
- **API URL:** `http://localhost:3000`
- **Status:** ✅ Configured

### Production ⏳
- **Configuration:** EAS Environment Variables
- **API URL:** `https://codeverse-api-429f.onrender.com`
- **Status:** Check with `npm run check:env`

---

## 🎯 Quick Commands

### Check Environment Setup
```bash
npm run check:env
```
This will verify both local and production configurations.

### Start Local Development
```bash
npm run start:local
```
This guides you through starting both backend and frontend.

### Manual Start (Local)
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
npm start
```

### Build Production
```bash
# First, ensure EAS env variable is set
eas env:create --name EXPO_PUBLIC_API_URL \
  --value "https://codeverse-api-429f.onrender.com" \
  --environment production \
  --visibility plaintext

# Then build
eas build --platform android --profile production
```

---

## 📋 How It Works

### Local Development (`npm start`)
1. ✅ Reads from `.env` file
2. ✅ Uses `http://localhost:3000`
3. ✅ Requires backend running locally
4. ✅ Fast development cycle

### Production Build (`eas build`)
1. ✅ Reads from EAS Environment Variables
2. ✅ Uses `https://codeverse-api-429f.onrender.com`
3. ✅ No local backend needed
4. ✅ Ready for app stores

**Key Point:** EAS builds **ignore** `.env` file and use environment variables instead.

---

## 🔧 Setup Checklist

### Local Development
- [x] `.env` file exists
- [x] `EXPO_PUBLIC_API_URL=http://localhost:3000` in `.env`
- [ ] Backend can be started (`cd backend && npm start`)
- [ ] Test: `npm run check:env`

### Production
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] EAS account logged in (`eas login`)
- [ ] Production env variable set (`eas env:create ...`)
- [ ] Verified with `eas env:list`
- [ ] Test: `npm run check:env`

---

## 🐛 Troubleshooting

### "Network error" in Local Development

**Problem:** Backend not running

**Solution:**
```bash
# Start backend
cd backend
npm start

# In another terminal, start frontend
npm start
```

### "Network error" on Physical Device

**Problem:** `localhost` doesn't work on physical devices

**Solution:**
1. Find your IP: `ipconfig | Select-String "IPv4"`
2. Update `.env`: `EXPO_PUBLIC_API_URL=http://YOUR_IP:3000`
3. Restart Expo: `npm start -- --clear`

### Production Build Uses Wrong URL

**Problem:** Build uses localhost instead of production URL

**Solution:**
1. Verify EAS env variable: `eas env:list`
2. If missing, set it:
   ```bash
   eas env:create --name EXPO_PUBLIC_API_URL \
     --value "https://codeverse-api-429f.onrender.com" \
     --environment production \
     --visibility plaintext
   ```
3. Rebuild: `eas build --platform android --profile production`

---

## 📚 Detailed Guides

- **Full Setup:** `docs/DUAL_ENVIRONMENT_SETUP.md`
- **Network Errors:** `docs/FIX_NETWORK_ERROR.md`
- **Production Config:** `docs/PRODUCTION_QUICK_START.md`

---

## 🎉 You're Ready!

You now have:
- ✅ Local development environment
- ✅ Production build environment
- ✅ Helper scripts to manage both

**Remember:**
- **Local:** Use `npm start` (uses `.env`)
- **Production:** Use `eas build` (uses EAS env vars)
