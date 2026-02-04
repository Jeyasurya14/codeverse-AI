# 🚨 URGENT: Fix Exposed Database Credentials

## ⚠️ Critical Security Issue

Your PostgreSQL database connection string (including password) has been exposed in your GitHub repository `Jeyasurya14/codeverse-Al`. This means **anyone with access to that repository can see your database credentials**.

## Immediate Actions Required

### Step 1: Change Database Password in Render (DO THIS FIRST!)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Navigate to your PostgreSQL database**
3. **Click on "Settings"** tab
4. **Find "Reset Password"** or "Change Password" option
5. **Generate a new password** (Render can auto-generate a secure one)
6. **Save the new password securely** (you'll need it for Step 2)

**⚠️ Important**: After changing the password, the old connection string will stop working. This is intentional - it prevents unauthorized access.

### Step 2: Update Local Environment Files

After changing the password in Render, get the new connection string:

1. In Render dashboard → Your PostgreSQL database
2. Click **"Connect"** → Copy the **"Internal Database URL"**
3. Update your local `.env` files:

**Update `backend/.env`:**
```env
DATABASE_URL=postgresql://codeverse_c42e_user:NEW_PASSWORD_HERE@dpg-d61ioavgi27c73c9o5b0-a.singapore-postgres.render.com:5432/codeverse_c42e
```

**Update Render Environment Variables:**
1. Go to Render → Your backend service
2. Click **"Environment"** tab
3. Update `DATABASE_URL` with the new connection string
4. **Save Changes** (this will restart your service)

### Step 3: Verify .gitignore is Working

Your `.gitignore` already includes `.env` files, which is good. Verify:

```bash
# Check if .env is tracked
git ls-files | grep .env

# If .env files show up, remove them from git (but keep locally)
git rm --cached backend/.env
git rm --cached .env
git commit -m "Remove .env files from git tracking"
```

### Step 4: Remove Secret from Git History

**⚠️ Warning**: This requires force-pushing and will rewrite history. Only do this if:
- You're the only one working on this repository, OR
- You've coordinated with your team

**Option A: Using git-filter-repo (Recommended)**

```bash
# Install git-filter-repo if needed
pip install git-filter-repo

# Remove the secret from all history
git filter-repo --path backend/.env --invert-paths
git filter-repo --path .env --invert-paths

# Force push (WARNING: This rewrites history!)
git push origin --force --all
```

**Option B: Using BFG Repo-Cleaner**

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Create a file with the secret to remove
echo "8kn05XxMExInxTOBRIb3cLc6TbesNSzg" > secrets.txt

# Remove from history
java -jar bfg.jar --replace-text secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

**Option C: If Secret is Only in Recent Commits**

If the secret was only added recently, you can:

```bash
# Find the commit that added it
git log --all --full-history -- backend/.env

# Interactive rebase to remove that commit
git rebase -i HEAD~N  # N = number of commits back

# Mark the commit as 'drop' or edit it to remove the secret
# Then force push
git push origin --force
```

### Step 5: Create .env.example Files

Create example files (without real secrets) that can be safely committed:

**Create `backend/.env.example`:**
```env
# CodeVerse backend – copy to .env and fill in your values
NODE_ENV=production
OPENAI_API_KEY=your_openai_key_here
DATABASE_URL=postgresql://user:password@host:port/database
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret_here_min_32_chars
PORT=3000
CORS_ORIGINS=https://expo.dev
```

**Create `.env.example`:**
```env
# CodeVerse – copy this file to .env and fill in your values
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com
OPENAI_API_KEY=your_openai_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

### Step 6: Verify No Other Secrets Are Exposed

Check for other exposed secrets:

```bash
# Search for common secret patterns
git log --all -p | grep -i "password\|secret\|api_key\|token" | less

# Check current files
grep -r "password\|secret\|api_key" --include="*.js" --include="*.ts" --include="*.json" .
```

### Step 7: Enable GitHub Secret Scanning

1. Go to your GitHub repository settings
2. Navigate to **"Security"** → **"Code security and analysis"**
3. Enable **"Secret scanning"** (GitHub automatically scans for exposed secrets)

## Prevention for Future

### ✅ Best Practices

1. **Never commit `.env` files**: Always use `.gitignore`
2. **Use environment variables**: Store secrets in environment variables, not code
3. **Use secret management**: Consider using services like:
   - GitHub Secrets (for CI/CD)
   - AWS Secrets Manager
   - HashiCorp Vault
   - Render Environment Variables (already using this)
4. **Review before committing**: Use `git diff` before committing
5. **Use pre-commit hooks**: Install tools like `git-secrets` or `pre-commit` hooks

### 🔒 Pre-commit Hook Example

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent committing .env files
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "❌ Error: Attempting to commit .env file!"
    echo "   .env files should never be committed."
    exit 1
fi

# Check for common secret patterns
if git diff --cached | grep -E "(password|secret|api_key|token)\s*=\s*['\"][^'\"]+['\"]"; then
    echo "⚠️  Warning: Potential secret detected in commit!"
    echo "   Please review your changes."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## After Fixing

1. ✅ Database password changed in Render
2. ✅ Local `.env` files updated with new credentials
3. ✅ Render environment variables updated
4. ✅ Secret removed from git history (if possible)
5. ✅ `.env.example` files created
6. ✅ Verified no other secrets exposed
7. ✅ GitHub secret scanning enabled

## Monitoring

- **GitGuardian**: Will notify you if secrets are detected again
- **GitHub Security**: Check the "Security" tab regularly
- **Render Logs**: Monitor for unauthorized access attempts

## If You Can't Remove from History

If you can't safely rewrite git history (e.g., shared repository):

1. **Change the password immediately** (most important!)
2. **Document the exposure** in your repository's SECURITY.md
3. **Monitor database access logs** for suspicious activity
4. **Consider rotating all secrets** (API keys, OAuth secrets, JWT secrets)

The exposed password is now invalid, so immediate risk is mitigated. However, removing it from history is still recommended.

---

**Remember**: The most important step is **changing the database password immediately**. Everything else can be done afterward, but the password change prevents unauthorized access.
