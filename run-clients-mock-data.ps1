# Run the clients mock data SQL file with Supabase
# This script reads the clients_mock_data.sql file and sends it to the Supabase database

$sqlFile = "supabase/clients_mock_data.sql"
$sqlContent = Get-Content -Path $sqlFile -Raw

Write-Host "Running clients mock data file: $sqlFile"
Write-Host "--------------------------------------"

# Run the SQL through npx supabase with stdin
$sqlContent | npx supabase sql

Write-Host "--------------------------------------"
Write-Host "Clients mock data execution completed"
