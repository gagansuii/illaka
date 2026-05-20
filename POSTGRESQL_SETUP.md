# PostgreSQL Setup Guide for Ilaka

## Step 1: Install PostgreSQL

### Download PostgreSQL
1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer" from EnterpriseDB
3. Download PostgreSQL 15 or 16 (latest stable version)

### Install PostgreSQL
1. Run the installer
2. **Important settings during installation:**
   - Installation Directory: Use default (C:\Program Files\PostgreSQL\15)
   - Data Directory: Use default
   - **Password**: Set a password for the `postgres` superuser (remember this!)
   - Port: 5432 (default)
   - Locale: Use default
   - Pre-installed components: Make sure "PostGIS" is selected (if available)

3. Complete the installation

### Verify Installation
- PostgreSQL should start automatically as a Windows service
- Check Windows Services (services.msc) to confirm "postgresql-x64-15" is running

## Step 2: Install PostGIS Extension

PostGIS is required for geospatial features in Ilaka.

### Option A: If PostGIS wasn't installed
1. Download PostGIS from: https://postgis.net/windows_downloads/
2. Run the installer
3. Select the same PostgreSQL installation directory

### Option B: Enable PostGIS manually
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on your database → Query Tool
4. Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

## Step 3: Create Database

### Using pgAdmin (GUI):
1. Open pgAdmin
2. Connect to PostgreSQL server (password you set during installation)
3. Right-click "Databases" → Create → Database
4. Name: `ilaka_events`
5. Click Save

### Using Command Line:
1. Open Command Prompt or PowerShell
2. Navigate to PostgreSQL bin directory:
   ```powershell
   cd "C:\Program Files\PostgreSQL\15\bin"
   ```
3. Create database:
   ```powershell
   .\createdb.exe -U postgres ilaka_events
   ```
4. Enter your PostgreSQL password when prompted

## Step 4: Configure .env.local

Update your `.env.local` file with your PostgreSQL credentials:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ilaka_events?schema=public
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ilaka_events?schema=public
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

**Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.**

> Note: For a local setup, `DATABASE_URL` and `DIRECT_URL` can point to the same database. `DIRECT_URL` is used by Prisma for migrations (bypasses connection poolers like PgBouncer).

## Step 5: Enable PostGIS Extension

Run this SQL command in your database:

### Using pgAdmin:
1. Right-click `ilaka_events` database → Query Tool
2. Run: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Click Execute (F5)

### Using Command Line:
```powershell
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U postgres -d ilaka_events -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## Step 6: Run Prisma Migrations

In your project directory, run:

```powershell
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Set up relationships
- Create indexes

## Step 7: Verify Setup

Test the connection:

```powershell
npx prisma studio
```

This opens a database browser. If it works, your setup is complete!

## Troubleshooting

### "Authentication failed" error:
- Check your password in `.env.local`
- Make sure PostgreSQL service is running
- Verify username is `postgres` (or your custom username)

### "Database does not exist" error:
- Create the database first (Step 3)
- Check database name matches in `.env.local`

### "Extension postgis does not exist":
- Install PostGIS (Step 2)
- Make sure you're running the command in the correct database

### PostgreSQL service not running:
1. Open Services (Win+R → services.msc)
2. Find "postgresql-x64-15"
3. Right-click → Start

### Can't find psql/createdb commands:
- Add PostgreSQL bin to PATH:
  - Add `C:\Program Files\PostgreSQL\15\bin` to System PATH
  - Or use full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe"`

## Next Steps

After successful setup:
1. Restart your dev server: `npm run dev`
2. Visit http://localhost:3000
3. Create an account to start using Ilaka!
