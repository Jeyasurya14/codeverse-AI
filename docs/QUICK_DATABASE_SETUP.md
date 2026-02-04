# Quick Database Setup Guide

Since `psql` is not installed on Windows, here are the **easiest ways** to set up your PostgreSQL database:

## 🎯 Option 1: Render SQL Editor (Easiest - No Installation Needed)

1. **Go to Render Dashboard** → Your PostgreSQL database
2. **Click "Connect"** → **"SQL Editor"** (or "Connect with psql")
3. **Copy the entire contents** of `database/schema.sql`
4. **Paste into the SQL editor** and click **"Run"**
5. **Done!** ✅

This is the fastest method - no local tools needed.

---

## 🎯 Option 2: Node.js Script (If you have Node.js)

### Step 1: Get Full Connection String from Render

Your `DATABASE_URL` in `backend/.env` is incomplete. You need the full connection string:

1. Go to Render Dashboard → Your PostgreSQL database
2. Click **"Connect"** → You'll see:
   ```
   Internal Database URL: postgresql://user:password@host:port/database
   ```
3. Copy the **entire** connection string (starts with `postgresql://`)

### Step 2: Update backend/.env

Edit `backend/.env` and replace the `DATABASE_URL` line:

```env
# OLD (incomplete):
DATABASE_URL=dpg-d61ioavgi27c73c9o5b0-a.singapore-postgres.render.com

# NEW (complete):
DATABASE_URL=postgresql://codeverse_user:your_password@dpg-d61ioavgi27c73c9o5b0-a.singapore-postgres.render.com:5432/codeverse_db
```

### Step 3: Run Setup Script

```bash
cd backend
node ../scripts/setup-database.js
```

The script will:
- ✅ Connect to your database
- ✅ Create all tables
- ✅ Verify everything was created
- ✅ Show a summary

---

## 🔍 Verify Setup

After running the schema, check:

1. **Health endpoint**: `https://your-backend.onrender.com/health`
   - Should show: `"database": "connected"`

2. **Register a test user** via the app
   - Check backend logs for: `✅ User created in database: ...`

3. **Query database** (in Render SQL Editor):
   ```sql
   SELECT id, email, name, email_verified, created_at 
   FROM users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

## ❌ Troubleshooting

### "DATABASE_URL appears incomplete"
- Make sure your connection string starts with `postgresql://`
- Get the full string from Render dashboard → Connect

### "Cannot find pg module"
- Run: `cd backend && npm install`

### "Connection refused" or "Authentication failed"
- Double-check your connection string from Render
- Make sure you're using the **Internal Database URL** (not External)

---

## 📝 Notes

- The connection string format is: `postgresql://username:password@host:port/database`
- Render provides this automatically - just copy it from the dashboard
- Never commit your `.env` file with real credentials
