# AI Mentor Setup – Using Your OpenAI API Key

The AI Mentor uses **OpenAI's API** on the **backend only**. You provide your API key once in the backend; the app never sees or stores it.

---

## Step 1: Get an OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Sign in or create an account.
3. Click **Create new secret key**.
4. Copy the key (it starts with `sk-`). You won’t be able to see it again.

---

## Step 2: Put the Key in the Backend

**File:** `backend/.env`

Add or update this line (use your real key, no quotes):

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

**Example:**

```env
OPENAI_API_KEY=sk-proj-abc123...your-full-key
OPENAI_MODEL=gpt-4o-mini
```

- **OPENAI_API_KEY** – Your secret key from Step 1. **Required** for the AI Mentor to work.
- **OPENAI_MODEL** – Optional. Default is `gpt-4o-mini`. You can use `gpt-4o` for better quality (higher cost).

**Important:**

- Use **backend/.env** only. Do **not** put the key in the frontend `.env` or in the app code.
- Do **not** commit `backend/.env` to Git (it should be in `.gitignore`).

---

## Step 3: Start the Backend

From the project root:

```bash
cd backend
npm start
```

You should see:

```
✅ OpenAI client initialized
✅ OpenAI API key validated successfully
✅ AI Mentor: ready (OpenAI API key loaded from OPENAI_API_KEY)
CodeVerse API listening on port 3000
```

If you see:

```
⚠️  AI Mentor: disabled - set OPENAI_API_KEY in backend/.env to enable
```

then the key is missing or not loaded. Check that:

- The key is in **backend/.env** (not the root `.env`).
- The line is exactly `OPENAI_API_KEY=sk-...` with no spaces around `=` and no quotes.

---

## Step 4: Point the App to the Backend

**Local (emulator):**

In the **project root** `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Local (physical device):** Use your computer’s IP instead of `localhost`:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

**Production:** Set the production API URL in EAS (e.g. `https://your-backend.onrender.com`), not in the repo. See `PRODUCTION_QUICK_START.md`.

---

## Step 5: Run the App

1. Backend: `cd backend && npm start` (keep this running).
2. Frontend: from project root run `npm start`, then open the app in Expo Go or a device.

In the app, open **AI Mentor** and send a message. If the backend is running with a valid key, you’ll get a reply.

---

## Quick Checklist

- [ ] OpenAI API key created at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- [ ] `OPENAI_API_KEY=sk-...` added to **backend/.env**
- [ ] Backend started with `cd backend && npm start`
- [ ] Startup shows: `✅ AI Mentor: ready`
- [ ] Root `.env` has `EXPO_PUBLIC_API_URL` pointing to your backend (e.g. `http://localhost:3000`)
- [ ] App restarted after changing env (e.g. `npm start -- --clear`)

---

## Troubleshooting

### "AI service is not configured"

- Backend is not using your key. Check **backend/.env** has `OPENAI_API_KEY=sk-...`.
- Restart the backend after changing `.env`.

### "Invalid or expired" / 401 from OpenAI

- Key is wrong, revoked, or out of credits. Create a new key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) and update **backend/.env**, then restart the backend.

### "Network error" in the app

- Backend not running: start it with `cd backend && npm start`.
- Wrong URL: for local use, root `.env` must have `EXPO_PUBLIC_API_URL=http://localhost:3000` (or your machine’s IP for a device).

### Backend starts but key not loaded

- The server loads **backend/.env** from the `backend` folder. If you run from the project root (e.g. `node backend/server.js`), it still loads `backend/.env`. Ensure the file exists and contains `OPENAI_API_KEY=sk-...`.

---

## Summary

| What            | Where                | Example / Note                          |
|-----------------|----------------------|-----------------------------------------|
| OpenAI API key  | **backend/.env**     | `OPENAI_API_KEY=sk-proj-...`            |
| Backend URL     | Root **.env** (dev)  | `EXPO_PUBLIC_API_URL=http://localhost:3000` |
| Start backend   | Terminal             | `cd backend && npm start`               |
| Start app       | Project root         | `npm start`                             |

Once the key is in **backend/.env** and the backend is running, the AI Mentor will use your OpenAI API key to respond to users.
