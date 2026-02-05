# Fix: Network Error in App

## Problem

The app shows "Network error" when trying to connect to the backend.

## Common Causes

### 1. **Backend Not Running (Local Development)**

**Symptom:** Network error when using `http://localhost:3000`

**Solution:**
```bash
# Start the backend server
cd backend
npm start
```

**Verify:** Open `http://localhost:3000/health` in browser - should return JSON

---

### 2. **Using Physical Device with Localhost**

**Symptom:** Network error on physical device, works on emulator

**Problem:** `localhost` only works on emulator, not physical devices

**Solution:** Use your computer's local IP address

**Steps:**
1. Find your local IP address:
   ```powershell
   # Windows PowerShell
   ipconfig | Select-String "IPv4"
   ```
   Example output: `192.168.31.67`

2. Update `.env` file:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.31.67:3000
   ```
   (Replace `192.168.31.67` with your actual IP)

3. Restart Expo:
   ```bash
   npm start -- --clear
   ```

---

### 3. **Production Build Using Wrong URL**

**Symptom:** Network error in production build

**Problem:** Production build is using localhost instead of production URL

**Solution:** Set EAS environment variable for production

```bash
# Set production API URL
eas env:create --name EXPO_PUBLIC_API_URL \
  --value "https://codeverse-api-429f.onrender.com" \
  --environment production \
  --visibility plaintext

# Verify
eas env:list

# Rebuild
eas build --platform android --profile production
```

---

### 4. **Backend Server Down**

**Symptom:** Network error even with correct URL

**Check Backend Status:**
```bash
# Test production backend
curl https://codeverse-api-429f.onrender.com/health

# Should return:
# {"status":"OK","timestamp":"...","database":"connected"}
```

**If backend is down:**
- Check Render dashboard: https://dashboard.render.com
- Restart the backend service
- Check backend logs for errors

---

## Quick Diagnostic Steps

### Step 1: Check Current Configuration
```bash
# Check .env file
cat .env | grep EXPO_PUBLIC_API_URL
```

### Step 2: Test Backend Connection
```bash
# Test local backend
curl http://localhost:3000/health

# Test production backend
curl https://codeverse-api-429f.onrender.com/health
```

### Step 3: Check What URL App is Using
Add temporary logging in `src/services/api.ts`:
```typescript
console.log('API Base URL:', BASE_URL);
```

---

## Solutions by Scenario

### Scenario A: Local Development (Emulator)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```
**Requirements:**
- Backend must be running: `cd backend && npm start`
- Using Android/iOS emulator (not physical device)

### Scenario B: Local Development (Physical Device)
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
```
**Requirements:**
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Backend must be running
- Device and computer on same Wi-Fi network

### Scenario C: Production Build
```bash
# Set EAS environment variable (not .env)
eas env:create --name EXPO_PUBLIC_API_URL \
  --value "https://codeverse-api-429f.onrender.com" \
  --environment production \
  --visibility plaintext
```
**Requirements:**
- Backend deployed and accessible
- EAS environment variable set
- Rebuild app after setting variable

---

## Troubleshooting Checklist

- [ ] Backend is running (`npm start` in backend folder)
- [ ] Correct URL in `.env` (localhost for emulator, IP for device)
- [ ] Device and computer on same network (for physical device)
- [ ] Backend accessible at the URL (test with curl/browser)
- [ ] Restarted Expo after changing `.env`
- [ ] Cleared Expo cache: `npm start -- --clear`
- [ ] For production: EAS env variable set correctly

---

## Common Error Messages

### "Network request failed"
- **Cause:** Can't reach backend
- **Fix:** Check backend is running and URL is correct

### "Network error. Check your connection."
- **Cause:** Connection timeout or refused
- **Fix:** Verify backend URL and network connectivity

### "Request timed out"
- **Cause:** Backend took too long to respond
- **Fix:** Check backend logs, may be overloaded

---

## Still Having Issues?

1. **Check Backend Logs:**
   ```bash
   cd backend
   npm start
   # Look for errors in terminal
   ```

2. **Check App Logs:**
   - Open React Native debugger
   - Check console for API errors
   - Look for the actual error message

3. **Verify Network:**
   - Test backend URL in browser
   - Check firewall settings
   - Verify Wi-Fi connection

4. **Reset Everything:**
   ```bash
   # Clear Expo cache
   npm start -- --clear
   
   # Restart backend
   cd backend
   npm start
   ```

---

## Quick Fix Summary

**For Local Development:**
1. Start backend: `cd backend && npm start`
2. Use `localhost:3000` for emulator
3. Use your local IP for physical device

**For Production:**
1. Set EAS env variable
2. Rebuild app
3. Verify backend is accessible
