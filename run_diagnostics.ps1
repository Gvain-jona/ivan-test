# Script to run database diagnostics
Write-Host "Running database diagnostics..." -ForegroundColor Green

# Start the Supabase local development server if not already running
$supabaseStatus = supabase status
if ($supabaseStatus -match "not running") {
    Write-Host "Starting Supabase local development server..." -ForegroundColor Yellow
    supabase start
}

# Run the diagnostics SQL file
Write-Host "Running diagnostics queries..." -ForegroundColor Yellow
$sqlContent = Get-Content -Path supabase\diagnostics.sql -Raw
$output = $sqlContent | supabase db query

# Save the output to a file
$output | Out-File -FilePath "diagnostics_results.txt"

Write-Host "Diagnostics completed! Results saved to diagnostics_results.txt" -ForegroundColor Green

# Display the most important parts of the diagnostics
Write-Host "`nKey findings:" -ForegroundColor Cyan
Write-Host "1. Check if the profiles table exists in the output" -ForegroundColor Cyan
Write-Host "2. Check if the verify_user_code function exists and has the correct signature" -ForegroundColor Cyan
Write-Host "3. Check if there are any RLS policies on the profiles table" -ForegroundColor Cyan
Write-Host "4. Check the search_path settings" -ForegroundColor Cyan

Write-Host "`nTo fix the issue, we may need to:" -ForegroundColor Yellow
Write-Host "1. Ensure the profiles table is in the correct schema" -ForegroundColor Yellow
Write-Host "2. Fix any function signatures that reference the profiles table" -ForegroundColor Yellow
Write-Host "3. Update the search_path settings in functions" -ForegroundColor Yellow
Write-Host "4. Check for schema or permission issues" -ForegroundColor Yellow
