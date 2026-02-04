# Switch to Internal Database URL on Render

## Why Use Internal URL?

When your backend service and database are both hosted on Render, you should use the **Internal Database URL** instead of the External URL because:

1. **Faster**: Internal URLs use Render's private network (no internet routing)
2. **More Secure**: Traffic stays within Render's network
3. **No Bandwidth Costs**: Internal traffic doesn't count against external bandwidth limits
4. **Better Performance**: Lower latency and more reliable connections

## How to Switch to Internal URL

### Step 1: Get Internal Database URL

1. Go to **Render Dashboard** → Your **PostgreSQL database**
2. Click **"Connect"** button
3. You'll see two URLs:
   - **Internal Database URL** ⭐ (Use this one!)
   - **External Database URL** (Only for services outside Render)

4. **Copy the Internal Database URL** - it looks like:
   ```
   postgresql://user:password@dpg-xxxxx-a.singapore-postgres.render.com:5432/database
   ```
   
   Note: Internal URLs typically don't have a different format, but Render routes them internally.

### Step 2: Update Render Environment Variable

1. Go to **Render Dashboard** → Your **backend service** (not the database)
2. Click **"Environment"** tab
3. Find the `DATABASE_URL` variable
4. Click **"Use Internal URL"** button (shown in the warning)
   - OR manually replace the value with the Internal URL from Step 1
5. Click **"Save Changes"**
6. Render will automatically restart your service

### Step 3: Verify Connection

After the service restarts:

1. Check the **Logs** tab - should see: `✅ Database connected successfully`
2. Visit your health endpoint: `https://your-backend.onrender.com/health`
   - Should show: `"database": "connected"`
3. Test a database operation (register a user, etc.)

## Important Notes

- **Internal URLs only work** for services hosted on Render
- **External URLs** are for connecting from:
  - Your local development machine
  - Other cloud providers
  - External tools/services

- **For local development**, keep using the External URL in your `backend/.env` file
- **For production** (Render service), use the Internal URL in Render's environment variables

## Local vs Production Configuration

### Local Development (`backend/.env`)
```env
# Use External URL for local development
DATABASE_URL=postgresql://user:password@dpg-xxxxx-a.singapore-postgres.render.com:5432/database
```

### Production (Render Environment Variables)
```env
# Use Internal URL for Render-hosted services
DATABASE_URL=postgresql://user:password@dpg-xxxxx-a.singapore-postgres.render.com:5432/database
```

Even though they look similar, Render routes Internal URLs through its private network when both services are on Render.

## Troubleshooting

### If "Use Internal URL" button doesn't work:

1. Manually copy the Internal URL from your database's "Connect" page
2. Paste it into the `DATABASE_URL` environment variable
3. Save changes

### If connection fails after switching:

1. Verify you copied the complete Internal URL (including port if shown)
2. Check that both services are in the same region (if possible)
3. Review logs for connection errors
4. Try the External URL temporarily to verify the database is accessible

---

**After switching to Internal URL, your database connections will be faster and more secure!**
