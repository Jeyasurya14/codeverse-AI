# PostgreSQL Database Setup for Render

This guide explains how to set up PostgreSQL database on Render and configure the backend to save user credentials.

## 🗄️ Database Setup on Render

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `codeverse-db` (or your preferred name)
   - **Database**: `codeverse` (or your preferred name)
   - **User**: Auto-generated
   - **Region**: Choose closest to your backend
   - **PostgreSQL Version**: 15 or higher
4. Click **"Create Database"**

### Step 2: Get Connection String

After creation, Render will show:
- **Internal Database URL** (for services in same region) ⭐ **Use this one**
- **External Database URL** (for external connections)

**Copy the Internal Database URL** - it looks like:
```
postgresql://codeverse_user:abc123xyz@dpg-xxxxx-a.singapore-postgres.render.com/codeverse_db
```

**Important:** The connection string must include:
- `postgresql://` protocol
- Username and password
- Host (e.g., `dpg-xxxxx-a.singapore-postgres.render.com`)
- Database name

If you only see a hostname, click **"Connect"** → **"Connect with psql"** to see the full connection string.

### Step 3: Run Database Schema

You have **3 options** to run the schema:

#### Option A: Use Render's Built-in SQL Editor (Easiest) ⭐

1. In Render dashboard, go to your PostgreSQL database
2. Click **"Connect"** → **"Connect with psql"** or **"SQL Editor"**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL editor and click **"Run"**
5. Verify tables were created

#### Option B: Use Node.js Setup Script (Recommended for Windows)

1. Make sure you have `DATABASE_URL` set in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. Run the setup script:
   ```bash
   cd backend
   node ../scripts/setup-database.js
   ```

   The script will:
   - Connect to your database
   - Execute all SQL statements
   - Verify tables were created
   - Show a summary

#### Option C: Install psql on Windows (Advanced)

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install PostgreSQL (includes `psql` command-line tool)
3. Add PostgreSQL `bin` folder to your PATH
4. Run:
   ```bash
   psql <your-database-url> < database/schema.sql
   ```

### Step 4: Configure Backend Environment Variable

In your Render backend service:

1. Go to **Environment** tab
2. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string from Step 2
3. Click **"Save Changes"**

The backend will automatically:
- Connect to PostgreSQL on startup
- Save all user registrations to the database
- Store passwords securely (bcrypt hashed)
- Track MFA settings, email verification, etc.

## ✅ Verification

### Check Database Connection

1. Visit: `https://your-backend.onrender.com/health`
2. Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "database": "connected"
   }
   ```

### Test User Registration

1. Register a new user via the app
2. Check Render logs - should see:
   ```
   ✅ User created in database: user@example.com (ID: ...)
   ```
3. Query database:
   ```sql
   SELECT id, email, name, email_verified, mfa_enabled, created_at 
   FROM users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## 🔒 Security Features

All user credentials are stored securely:

- **Passwords**: Hashed with bcrypt (cost factor 12)
- **Email Verification**: Tokens stored separately
- **MFA Secrets**: Encrypted in database
- **Refresh Tokens**: Stored securely, auto-expire
- **Security Audit**: All events logged

## 📊 Database Tables

The schema includes:

- `users` - User accounts with credentials
- `refresh_tokens` - Session management
- `magic_link_tokens` - Passwordless login
- `email_verification_tokens` - Email verification
- `password_reset_tokens` - Password reset
- `security_audit_logs` - Security event tracking

## 🚨 Troubleshooting

### Database Not Connecting

1. Check `DATABASE_URL` is set correctly
2. Verify database is running (Render dashboard)
3. Check backend logs for connection errors
4. Ensure database allows connections from Render IPs

### Users Not Saving

1. Check backend logs for errors
2. Verify database schema is created (`\dt` in psql)
3. Check `/health` endpoint - should show `"database": "connected"`
4. Verify `DATABASE_URL` format is correct

### Connection Pool Errors

- Increase `max` connections in pool config
- Check database connection limits in Render
- Monitor connection usage in Render dashboard
