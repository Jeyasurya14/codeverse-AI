# Fix AI Mentor "Server Temporarily Unavailable" - Local Development

## Problem

The AI Mentor shows "Server is temporarily unavailable" even though the backend is running locally.

## Root Cause

The frontend `.env` file is pointing to a remote Render URL instead of your local backend.

---

## Solution

### Step 1: Update Frontend `.env` File

Open `d:\codeverse\.env` and update the API URL:

**For Expo Go / Android Emulator:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**For iOS Simulator:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**For Physical Device (Android/iOS):**
```env
EXPO_PUBLIC_API_URL=http://192.168.31.67:3000
```
*(Replace `192.168.31.67` with your computer's local IP address)*

### Step 2: Restart Expo Server

After updating `.env`, restart your Expo server:

```bash
# Stop the current server (Ctrl+C)
# Then restart with:
npm start --clear
```

Or:
```bash
npm run start:clear
```

### Step 3: Verify Backend is Running

Make sure your backend is running on port 3000:

```bash
cd backend
npm start
```

You should see:
```
✅ OpenAI client initialized
✅ OpenAI API key validated successfully
CodeVerse API listening on port 3000 (production)
```

### Step 4: Test Connection

1. Open the app
2. Go to AI Mentor
3. Send a test message
4. It should work now!

---

## Finding Your Local IP Address

**Windows:**
```bash
ipconfig | findstr /i "IPv4"
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

Look for an IP like `192.168.x.x` or `10.0.x.x` (not `127.0.0.1`)

---

## Troubleshooting

### Issue 1: Still Getting "Server Temporarily Unavailable"

**Check:**
1. Backend is running (`npm start` in backend folder)
2. Backend shows `✅ OpenAI client initialized`
3. Frontend `.env` has correct URL
4. Restarted Expo server after changing `.env`

### Issue 2: "Network Error" on Physical Device

**Fix:**
- Use your computer's local IP address (not `localhost`)
- Make sure phone and computer are on the same WiFi network
- Check Windows Firewall isn't blocking port 3000

### Issue 3: CORS Errors

**Fix:**
- Backend CORS is already configured to allow all origins in development
- If you see CORS errors, check `backend/.env` has no `CORS_ORIGINS` set (or it allows your origin)

---

## Quick Checklist

- [ ] Backend is running (`cd backend && npm start`)
- [ ] Backend shows `✅ OpenAI API key validated successfully`
- [ ] Frontend `.env` has `EXPO_PUBLIC_API_URL=http://localhost:3000` (or your local IP)
- [ ] Restarted Expo server after changing `.env`
- [ ] Testing on same network (if using physical device)

---

## Production vs Development

**Development (Local):**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
# or
EXPO_PUBLIC_API_URL=http://192.168.31.67:3000
```

**Production (Render/Deployed):**
```env
EXPO_PUBLIC_API_URL=https://codeverse-api-429f.onrender.com
```

---

**After making these changes, restart your Expo server and test the AI Mentor again!**
