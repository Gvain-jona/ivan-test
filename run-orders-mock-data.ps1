# Run the orders mock data SQL file with Supabase
# This script reads the orders_mock_data.sql file and sends it to the Supabase database

$sqlFile = "supabase/orders_mock_data.sql"
$sqlContent = Get-Content -Path $sqlFile -Raw

Write-Host "Running orders mock data file: $sqlFile"
Write-Host "--------------------------------------"

# Run the SQL through npx supabase with stdin
$sqlContent | npx supabase sql

Write-Host "--------------------------------------"
Write-Host "Orders mock data execution completed"
