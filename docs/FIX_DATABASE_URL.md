# Fix DATABASE_URL Connection Error

## ❌ Error You're Seeing

```
getaddrinfo ENOTFOUND dpg-d61ioavgi27c73c9o5b0-a
```

This means your `DATABASE_URL` hostname is **incomplete**.

## 🔍 Current Issue

Your `DATABASE_URL` in `backend/.env` is:
```
postgresql://codeverse_c42e_user:8kn05XxMExInxTOBRIb3cLc6TbesNSzg@dpg-d61ioavgi27c73c9o5b0-a/codeverse_c42e
```

The hostname `dpg-d61ioavgi27c73c9o5b0-a` is missing the `.singapore-postgres.render.com` suffix.

## ✅ Solution: Get Complete Connection String from Render

### Step 1: Go to Render Dashboard

1. Visit [Render Dashboard](https://dashboard.render.com)
2. Click on your **PostgreSQL database**

### Step 2: Get Internal Database URL

1. Click **"Connect"** button
2. You'll see **"Internal Database URL"** - it should look like:
   ```
   postgresql://codeverse_c42e_user:8kn05XxMExInxTOBRIb3cLc6TbesNSzg@dpg-d61ioavgi27c73c9o5b0-a.singapore-postgres.render.com:5432/codeverse_c42e
   ```
   
   **Notice:** It includes `.singapore-postgres.render.com:5432` (or similar region)

### Step 3: Update backend/.env

Replace the `DATABASE_URL` line in `backend/.env` with the **complete** connection string:

```env
DATABASE_URL=postgresql://codeverse_c42e_user:8kn05XxMExInxTOBRIb3cLc6TbesNSzg@dpg-d61ioavgi27c73c9o5b0-a.singapore-postgres.render.com:5432/codeverse_c42e
```

**Important:** 
- Must include the full hostname (with `.singapore-postgres.render.com` or your region)
- Port `:5432` is usually included (PostgreSQL default)
- The format is: `postgresql://user:password@host:port/database`

### Step 4: Test Connection

Run the setup script again:
```bash
cd backend
node ../scripts/setup-database.js
```

## 🎯 Alternative: Use Render SQL Editor (No Connection String Needed)

If you just want to create the tables quickly:

1. Go to Render Dashboard → Your PostgreSQL database
2. Click **"Connect"** → **"SQL Editor"**
3. Copy entire contents of `database/schema.sql`
4. Paste and click **"Run"**
5. Done! ✅

This method doesn't require fixing the connection string - you can do that later for the backend to connect.

## 🔍 How to Identify Your Database Region

Render PostgreSQL databases use different regions. Common patterns:
- `*.singapore-postgres.render.com` - Singapore
- `*.oregon-postgres.render.com` - Oregon, USA
- `*.frankfurt-postgres.render.com` - Frankfurt, Germany
- `*.ohio-postgres.render.com` - Ohio, USA

Check your Render dashboard to see which region your database is in.
