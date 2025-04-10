# Script to fix the verification function
Write-Host "Fixing verification function..." -ForegroundColor Green

# Start the Supabase local development server if not already running
$supabaseStatus = supabase status
if ($supabaseStatus -match "not running") {
    Write-Host "Starting Supabase local development server..." -ForegroundColor Yellow
    supabase start
}

# Run the fix SQL file
Write-Host "Applying verification function fix..." -ForegroundColor Yellow
$sqlContent = Get-Content -Path supabase\fix_verification_function.sql -Raw
$sqlContent | supabase db query

Write-Host "Verification function fix applied!" -ForegroundColor Green

# Provide instructions for testing
Write-Host "You can now test the authentication flow by:" -ForegroundColor Cyan
Write-Host "1. Start the Next.js development server with 'npm run dev'" -ForegroundColor Cyan
Write-Host "2. Navigate to http://localhost:3000/auth/login" -ForegroundColor Cyan
Write-Host "3. Enter a test email (e.g., admin@example.com)" -ForegroundColor Cyan
Write-Host "4. Enter the verification code shown in the response" -ForegroundColor Cyan
Write-Host "5. Set up or enter your PIN" -ForegroundColor Cyan

Write-Host "If you encounter any issues, run the diagnostics script to gather more information." -ForegroundColor Yellow
