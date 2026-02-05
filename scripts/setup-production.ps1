# CodeVerse Production Setup Script (PowerShell)
# This script helps set up production environment variables

Write-Host "🚀 CodeVerse Production Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
}

# Check if logged in to EAS
Write-Host "Checking EAS login status..." -ForegroundColor Yellow
try {
    eas whoami | Out-Null
} catch {
    Write-Host "Not logged in. Please login:" -ForegroundColor Yellow
    eas login
}

Write-Host ""
Write-Host "✅ EAS CLI ready" -ForegroundColor Green
Write-Host ""

# Production API URL
$PROD_API_URL = "https://codeverse-api-429f.onrender.com"

Write-Host "Setting production environment variables..." -ForegroundColor Yellow
Write-Host ""

# Set EXPO_PUBLIC_API_URL
Write-Host "Setting EXPO_PUBLIC_API_URL..." -ForegroundColor Yellow
eas env:create --name EXPO_PUBLIC_API_URL `
    --value $PROD_API_URL `
    --environment production `
    --visibility plaintext `
    --force

# Set OAuth Client IDs (optional)
$setOAuth = Read-Host "Do you want to set OAuth Client IDs? (y/n)"
if ($setOAuth -eq "y" -or $setOAuth -eq "Y") {
    Write-Host "Setting Google Client ID..." -ForegroundColor Yellow
    eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID `
        --value "436868027669-k90ua4c64llls5bk0pmqlimd8d9sdt4g.apps.googleusercontent.com" `
        --environment production `
        --visibility plaintext `
        --force
    
    Write-Host "Setting GitHub Client ID..." -ForegroundColor Yellow
    eas env:create --name EXPO_PUBLIC_GITHUB_CLIENT_ID `
        --value "Ov23li12lOljFCToSg2E" `
        --environment production `
        --visibility plaintext `
        --force
}

Write-Host ""
Write-Host "✅ Production environment variables set!" -ForegroundColor Green
Write-Host ""
Write-Host "Verify with: eas env:list" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Build production: eas build --platform android --profile production"
Write-Host "  2. Test the build"
Write-Host "  3. Submit to Play Store"
