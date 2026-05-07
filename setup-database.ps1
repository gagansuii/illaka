# Database Setup Script for Ilaaka
# This script helps set up and migrate the PostgreSQL database

Write-Host "=== Ilaaka Database Migration Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Read current DATABASE_URL
$envContent = Get-Content .env.local -Raw
if ($envContent -match 'DATABASE_URL=(.+)') {
    $currentDbUrl = $matches[1].Trim()
    Write-Host "Current DATABASE_URL: $currentDbUrl" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: DATABASE_URL not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Attempting to run Prisma migrations..." -ForegroundColor Green
Write-Host ""

# Run Prisma migrations
npx prisma migrate dev --name init

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Database migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your dev server: npm run dev" -ForegroundColor White
    Write-Host "2. Visit http://localhost:3000" -ForegroundColor White
    Write-Host "3. Create an account to start using the app" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL is not running" -ForegroundColor White
    Write-Host "2. Incorrect database credentials in .env.local" -ForegroundColor White
    Write-Host "3. Database 'ilaka_events' does not exist" -ForegroundColor White
    Write-Host ""
    Write-Host "To fix:" -ForegroundColor Cyan
    Write-Host "1. Make sure PostgreSQL is installed and running" -ForegroundColor White
    Write-Host "2. Update DATABASE_URL in .env.local with correct credentials" -ForegroundColor White
    Write-Host "3. Create the database: CREATE DATABASE ilaka_events;" -ForegroundColor White
    Write-Host "4. Enable PostGIS: CREATE EXTENSION IF NOT EXISTS postgis;" -ForegroundColor White
}
