# Check for Exposed Secrets in Git

## ✅ Good News

Your `.env` files are **NOT currently tracked** in git. Only `.env.example` files are tracked, which is correct.

## PowerShell Commands (Windows)

Since you're on Windows, use PowerShell commands instead of Unix commands:

### Check Tracked .env Files
```powershell
# Check what .env files are tracked
git ls-files | Select-String "\.env"

# Should only show .env.example files (safe)
```

### Check Git History for Secrets
```powershell
# Search git history for the exposed password
git log --all -p -S "YOUR_PASSWORD_HERE" --source --all

# Search for database URL pattern
git log --all -p | Select-String "postgresql://"

# Search for common secret patterns
git log --all -p | Select-String "password|secret|api_key|token"
```

### Check Current Status
```powershell
# See what's changed but not committed
git status --short | Select-String "\.env"

# Should only show .env.example files
```

## What the Results Mean

### ✅ Safe (Current Status)
- Only `.env.example` files are tracked ✅
- Actual `.env` files are NOT in git ✅
- `.gitignore` is properly configured ✅

### ⚠️ Still Need to Check
- Git history might contain the secret from past commits
- Even if files are removed, history still has them

## Next Steps

1. **Change database password** (most important!)
2. **Check git history** for exposed secrets (see commands above)
3. **Remove from history** if found (see `SECURITY_FIX_EXPOSED_SECRET.md`)

## Quick Check Script

Save this as `check-secrets.ps1`:

```powershell
# Check for exposed secrets in git
Write-Host "Checking for .env files in git..." -ForegroundColor Yellow
git ls-files | Select-String "\.env$" | Where-Object { $_ -notmatch "\.example" }

Write-Host "`nChecking git history for database URLs..." -ForegroundColor Yellow
$results = git log --all -p | Select-String "postgresql://"
if ($results) {
    Write-Host "⚠️  Found database URLs in git history!" -ForegroundColor Red
    Write-Host "Review: git log --all -p | Select-String 'postgresql://'" -ForegroundColor Yellow
} else {
    Write-Host "✅ No database URLs found in recent history" -ForegroundColor Green
}
```

Run it:
```powershell
.\check-secrets.ps1
```
