# Check Environment Configuration
# Verifies both local and production environment setup

Write-Host "Checking Environment Configuration" -ForegroundColor Cyan
Write-Host ""

# Check local .env
Write-Host "1. Local Development (.env):" -ForegroundColor Yellow
if (Test-Path ".env") {
    $envLine = Select-String -Path .env -Pattern "^EXPO_PUBLIC_API_URL=" | Select-Object -First 1
    if ($envLine) {
        $url = ($envLine.Line -split "=")[1]
        Write-Host "   [OK] Found: EXPO_PUBLIC_API_URL=$url" -ForegroundColor Green
        
        if ($url -match "localhost|192\.168\.") {
            Write-Host "   [OK] URL is configured for local development" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] URL does not look like local development" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [ERROR] EXPO_PUBLIC_API_URL not found in .env" -ForegroundColor Red
    }
} else {
    Write-Host "   [ERROR] .env file not found" -ForegroundColor Red
}

Write-Host ""

# Check EAS environment variables
Write-Host "2. Production (EAS Environment Variables):" -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if ($easInstalled) {
    Write-Host "   Checking EAS environment variables..." -ForegroundColor Gray
    try {
        $envList = eas env:list 2>&1 | Out-String
        if ($envList -match "EXPO_PUBLIC_API_URL") {
            Write-Host "   [OK] EXPO_PUBLIC_API_URL found in EAS" -ForegroundColor Green
            Write-Host "   Run: eas env:list to see details" -ForegroundColor Gray
        } else {
            Write-Host "   [WARN] EXPO_PUBLIC_API_URL not found in EAS" -ForegroundColor Yellow
            Write-Host "   Run: eas env:create --name EXPO_PUBLIC_API_URL --value https://codeverse-api-429f.onrender.com --environment production --visibility plaintext" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   [WARN] Could not check EAS environment variables" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [WARN] EAS CLI not installed" -ForegroundColor Yellow
    Write-Host "   Install: npm install -g eas-cli" -ForegroundColor Gray
}

Write-Host ""

# Check backend connectivity
Write-Host "3. Backend Connectivity:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   [OK] Local backend is running" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   [ERROR] Local backend is NOT running" -ForegroundColor Red
    Write-Host "   Start it with: cd backend && npm start" -ForegroundColor Gray
}

Write-Host ""
try {
    $response = Invoke-WebRequest -Uri "https://codeverse-api-429f.onrender.com/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Production backend is accessible" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   [WARN] Production backend check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Environment check complete!" -ForegroundColor Green
