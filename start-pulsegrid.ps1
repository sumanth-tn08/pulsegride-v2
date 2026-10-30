# PulseGrid V2 - Launch Script (Windows PowerShell)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting PulseGrid V2 - Bengaluru Healthcare Grid" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "."

# Start Backend on Port 8000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:PYTHONPATH='.'; python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend on Port 5173
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"

Write-Host "PulseGrid V2 is booting up:" -ForegroundColor Green
Write-Host "  Backend API:   http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  Frontend App:  http://localhost:5173" -ForegroundColor Yellow
Write-Host "  Portals:       /phc (PHC Operator) | /admin (Health Administrator)" -ForegroundColor Yellow

