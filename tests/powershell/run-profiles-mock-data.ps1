# Run the profiles mock data SQL file with Supabase
# This script reads the profiles_mock_data.sql file and sends it to the Supabase database

$sqlFile = "supabase/profiles_mock_data.sql"
$sqlContent = Get-Content -Path $sqlFile -Raw

Write-Host "Running profiles mock data file: $sqlFile"
Write-Host "--------------------------------------"

# Run the SQL through npx supabase with stdin
$sqlContent | npx supabase sql

Write-Host "--------------------------------------"
Write-Host "Profiles mock data execution completed"
