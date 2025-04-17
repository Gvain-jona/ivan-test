# Fix RLS policies directly using psql
Write-Host "Fixing RLS policies directly..." -ForegroundColor Green

# Path to the SQL file
$sqlFile = "fix_profiles_rls.sql"

# Execute the SQL file using psql
psql -h localhost -p 54322 -U postgres -d postgres -f $sqlFile

Write-Host "RLS policies fixed successfully!" -ForegroundColor Green
