# Run the seed.sql file with Supabase
# This script reads the seed.sql file and sends it to the Supabase database

$seedFile = "supabase/seed.sql"
$seedContent = Get-Content -Path $seedFile -Raw

Write-Host "Running seed file: $seedFile"
Write-Host "--------------------------------------"

# Try running the seed SQL through npx supabase with stdin
# The script can be run as:
# .\run-seed-sql.ps1
$seedContent | npx supabase sql

Write-Host "--------------------------------------"
Write-Host "Seed execution completed" 