# Start Local Development Environment
# This script starts both backend and frontend for local development

Write-Host "🚀 Starting Local Development Environment" -ForegroundColor Cyan
Write-Host ""

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

# Check API URL in .env
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "EXPO_PUBLIC_API_URL=http://localhost:3000" -and 
    $envContent -notmatch "EXPO_PUBLIC_API_URL=http://192\.168\.") {
    Write-Host "⚠️  Warning: EXPO_PUBLIC_API_URL in .env might not be set for local development" -ForegroundColor Yellow
    Write-Host "   Expected: http://localhost:3000 (emulator) or http://YOUR_IP:3000 (device)" -ForegroundColor Yellow
}

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "   Backend: http://localhost:3000"
Write-Host "   Frontend: Expo Dev Server"
Write-Host ""

Write-Host "📝 Instructions:" -ForegroundColor Green
Write-Host "   1. Open a NEW terminal and run: cd backend && npm start"
Write-Host "   2. Wait for backend to start (you'll see 'CodeVerse API listening on port 3000')"
Write-Host "   3. Then run: npm start"
Write-Host ""

$startBackend = Read-Host "Do you want to start the backend now? (y/n)"
if ($startBackend -eq "y" -or $startBackend -eq "Y") {
    Write-Host ""
    Write-Host "Starting backend..." -ForegroundColor Yellow
    Write-Host "⚠️  Keep this terminal open while backend is running" -ForegroundColor Yellow
    Write-Host ""
    Set-Location backend
    npm start
} else {
    Write-Host ""
    Write-Host "✅ Ready! Now run these commands:" -ForegroundColor Green
    Write-Host "   Terminal 1: cd backend && npm start"
    Write-Host "   Terminal 2: npm start"
}
