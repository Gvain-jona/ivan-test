# Run the migration to fix RLS policies
Write-Host "Running migration to fix RLS policies..." -ForegroundColor Green

# Navigate to the project directory
$projectDir = Get-Location

# Run the migration using Supabase CLI
supabase migration up --db-url "postgresql://postgres:postgres@localhost:54322/postgres"

Write-Host "Migration completed successfully!" -ForegroundColor Green
