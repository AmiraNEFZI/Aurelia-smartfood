Set-Location "c:\Users\Admin\Desktop\Aurelia-SmartFood\frontend"
Write-Host "Checking TypeScript..." -ForegroundColor Cyan
& npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "TypeScript: OK - No errors found" -ForegroundColor Green
} else {
    Write-Host "TypeScript: Errors found above" -ForegroundColor Red
}
