# Run the enhanced seed.sql file with Supabase
# This script reads the enhanced seed.sql file and sends it to the Supabase database

$seedFile = "supabase/enhanced_seed.sql"
$seedContent = Get-Content -Path $seedFile -Raw

Write-Host "Running enhanced seed file: $seedFile"
Write-Host "--------------------------------------"

# Run the seed SQL through npx supabase with stdin
$seedContent | npx supabase sql

Write-Host "--------------------------------------"
Write-Host "Enhanced seed execution completed"
