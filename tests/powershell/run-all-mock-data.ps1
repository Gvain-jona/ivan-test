# Run all mock data scripts in the correct order

Write-Host "==================================================="
Write-Host "Running all mock data scripts in the correct order"
Write-Host "==================================================="

# Step 1: Run profiles mock data
Write-Host "`nStep 1: Creating profiles mock data..."
.\run-profiles-mock-data.ps1

# Step 2: Run clients mock data
Write-Host "`nStep 2: Creating clients mock data..."
.\run-clients-mock-data.ps1

# Step 3: Run orders mock data
Write-Host "`nStep 3: Creating orders mock data..."
.\run-orders-mock-data.ps1

Write-Host "`n==================================================="
Write-Host "All mock data scripts have been executed successfully!"
Write-Host "==================================================="
