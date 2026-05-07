# Interactive PostgreSQL Setup Script for Ilaaka
# This script guides you through PostgreSQL setup step by step

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ilaaka PostgreSQL Setup Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if PostgreSQL is installed
Write-Host "Step 1: Checking PostgreSQL installation..." -ForegroundColor Yellow

function Try-ResolvePgBinPathFromRoot($root) {
    if (-not $root) { return $null }
    if (-not (Test-Path $root)) { return $null }

    # Typical EnterpriseDB layout: <root>\<major>\bin (e.g. C:\Program Files\PostgreSQL\15\bin)
    $versions = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^\d+$' }
    if ($versions) {
        $latest = ($versions | Sort-Object Name -Descending | Select-Object -First 1).Name
        $bin = Join-Path $root "$latest\\bin"
        if (Test-Path (Join-Path $bin "psql.exe")) { return $bin }
    }

    # Some installs are directly rooted at <root>\bin (e.g. D:\postgresql\bin)
    $bin2 = Join-Path $root "bin"
    if (Test-Path (Join-Path $bin2 "psql.exe")) { return $bin2 }

    return $null
}

function Try-ResolvePgInstallLocationFromRegistry() {
    # Check standard uninstall keys for an InstallLocation
    $keys = @(
        "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
    )

    foreach ($k in $keys) {
        $apps = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -match 'PostgreSQL' -and $_.InstallLocation }
        foreach ($a in $apps) {
            if ($a.InstallLocation -and (Test-Path $a.InstallLocation)) { return $a.InstallLocation }
        }
    }

    # Check PostgreSQL EDB registry key if present
    $installs = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\PostgreSQL\\Installations\\*" -ErrorAction SilentlyContinue
    foreach ($i in @($installs)) {
        if ($i.InstallationDirectory -and (Test-Path $i.InstallationDirectory)) { return $i.InstallationDirectory }
    }

    return $null
}

$pgBinPath = $null

# Default locations
if (-not $pgBinPath) { $pgBinPath = Try-ResolvePgBinPathFromRoot "C:\\Program Files\\PostgreSQL" }
if (-not $pgBinPath) { $pgBinPath = Try-ResolvePgBinPathFromRoot "C:\\Program Files (x86)\\PostgreSQL" }

# Registry-based install location (handles custom drives like D:\postgresql)
if (-not $pgBinPath) {
    $installRoot = Try-ResolvePgInstallLocationFromRegistry
    $pgBinPath = Try-ResolvePgBinPathFromRoot $installRoot
}

if ($pgBinPath) {
    Write-Host ("[OK] PostgreSQL bin detected at: " + $pgBinPath) -ForegroundColor Green
} else {
    Write-Host "[ERR] PostgreSQL not found" -ForegroundColor Red
}

if (-not $pgBinPath) {
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Run the installer" -ForegroundColor White
    Write-Host "3. Remember the password you set for 'postgres' user" -ForegroundColor White
    Write-Host "4. Run this script again after installation" -ForegroundColor White
    Write-Host ""
    $install = Read-Host "Have you installed PostgreSQL? (y/n)"
    if ($install -ne 'y') {
        Write-Host "Please install PostgreSQL and run this script again." -ForegroundColor Yellow
        exit
    }

    # Re-check after user confirms installation
    $pgBinPath = $null
    if (-not $pgBinPath) { $pgBinPath = Try-ResolvePgBinPathFromRoot "C:\\Program Files\\PostgreSQL" }
    if (-not $pgBinPath) { $pgBinPath = Try-ResolvePgBinPathFromRoot "C:\\Program Files (x86)\\PostgreSQL" }
    if (-not $pgBinPath) {
        $installRoot = Try-ResolvePgInstallLocationFromRegistry
        $pgBinPath = Try-ResolvePgBinPathFromRoot $installRoot
    }
}

if (-not $pgBinPath) {
    Write-Host "" 
    Write-Host "[ERR] Could not determine PostgreSQL bin path (psql.exe/createdb.exe)." -ForegroundColor Red
    Write-Host "If PostgreSQL is installed, ensure it's under $pgPath (e.g. $pgPath\\15\\bin)." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Database Configuration" -ForegroundColor Yellow
Write-Host ""

# Get PostgreSQL credentials
$pgUsername = Read-Host "PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($pgUsername)) {
    $pgUsername = "postgres"
}

$pgPassword = Read-Host "PostgreSQL password" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))

$dbName = Read-Host "Database name (default: ilaka_events)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "ilaka_events"
}

$pgPort = Read-Host "PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($pgPort)) {
    $pgPort = "5432"
}

Write-Host ""
Write-Host "Step 3: Creating database..." -ForegroundColor Yellow

# Set environment variable for password
$env:PGPASSWORD = $pgPasswordPlain

# Try to create database
$createDbCmd = Join-Path $pgBinPath "createdb.exe"
if (Test-Path $createDbCmd) {
    try {
        & $createDbCmd -U $pgUsername -h localhost -p $pgPort $dbName 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Database '$dbName' created successfully" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Database might already exist, continuing..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[WARN] Could not create database automatically. Please create it manually in pgAdmin." -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] Could not find createdb.exe. Please create database manually:" -ForegroundColor Yellow
    Write-Host "  In pgAdmin: Right-click Databases -> Create -> Database -> Name: $dbName" -ForegroundColor White
}

Write-Host ""
Write-Host "Step 4: Enabling PostGIS extension..." -ForegroundColor Yellow

$psqlCmd = Join-Path $pgBinPath "psql.exe"
if (Test-Path $psqlCmd) {
    try {
        $postgisResult = & $psqlCmd -U $pgUsername -h localhost -p $pgPort -d $dbName -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] PostGIS extension enabled" -ForegroundColor Green
        } else {
            Write-Host "[WARN] PostGIS might not be installed. Install it from: https://postgis.net/windows_downloads/" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[WARN] Could not enable PostGIS automatically. Enable it manually in pgAdmin Query Tool:" -ForegroundColor Yellow
        Write-Host "  CREATE EXTENSION IF NOT EXISTS postgis;" -ForegroundColor White
    }
} else {
    Write-Host "[WARN] Could not find psql.exe. Enable PostGIS manually:" -ForegroundColor Yellow
    Write-Host "  In pgAdmin: Right-click $dbName -> Query Tool -> Run: CREATE EXTENSION IF NOT EXISTS postgis;" -ForegroundColor White
}

Write-Host ""
Write-Host "Step 5: Updating .env.local..." -ForegroundColor Yellow

# Update .env.local
$dbUrl = "postgresql://${pgUsername}:${pgPasswordPlain}@localhost:${pgPort}/${dbName}?schema=public"
$shadowDbUrl = "postgresql://${pgUsername}:${pgPasswordPlain}@localhost:${pgPort}/ilaka_shadow?schema=public"

$envContent = @"
DATABASE_URL=$dbUrl
SHADOW_DATABASE_URL=$shadowDbUrl
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
"@

$envContent | Out-File -FilePath .env.local -Encoding utf8 -Force
Write-Host "[OK] .env.local updated with database credentials" -ForegroundColor Green

# Prisma CLI loads environment variables from .env by default (not .env.local).
# Write .env too so `npx prisma ...` works without extra flags.
$envContent | Out-File -FilePath .env -Encoding utf8 -Force
Write-Host "[OK] .env updated for Prisma CLI" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Running Prisma migrations..." -ForegroundColor Yellow
Write-Host ""

npx prisma migrate dev --name init

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  [OK] Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start your dev server: npm run dev" -ForegroundColor White
    Write-Host "2. Visit http://localhost:3000" -ForegroundColor White
    Write-Host "3. Create an account to start using Ilaaka!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[WARN] Migration had issues. Check the error above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "- Make sure PostgreSQL service is running" -ForegroundColor White
    Write-Host "- Verify database '$dbName' exists" -ForegroundColor White
    Write-Host "- Check PostGIS extension is enabled" -ForegroundColor White
    Write-Host ""
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
