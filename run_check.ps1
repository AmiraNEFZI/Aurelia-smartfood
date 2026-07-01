Set-Location "c:\Users\Admin\Desktop\Aurelia-SmartFood\frontend"
Write-Host "=== TypeScript Check ===" -ForegroundColor Cyan
$result = & npx tsc --noEmit 2>&1
if ($result) {
    Write-Host $result -ForegroundColor Red
    Write-Host "=== ERRORS FOUND ===" -ForegroundColor Red
} else {
    Write-Host "=== NO ERRORS - OK ===" -ForegroundColor Green
}
