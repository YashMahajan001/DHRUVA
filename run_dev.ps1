# Dhruva Platform Development Startup Script (PowerShell)
# Ensures backend runs in local virtual environment and frontend runs on Vite

$ProjectRoot = $PSScriptRoot
$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  DHRUVA MULTI-ENGINE DIGITAL TWIN PLATFORM (SIH 26054)   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Virtual Environment
if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Virtual environment not found at .venv\Scripts\python.exe!" -ForegroundColor Red
    Write-Host "Please create it using: python -m venv .venv && .\.venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Virtual environment verified: $VenvPython" -ForegroundColor Green

# 2. Check Port 8000 Availability
$Port8000Process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($Port8000Process) {
    Write-Host "[INFO] Backend already listening on port 8000 (PID: $Port8000Process)." -ForegroundColor Yellow
} else {
    Write-Host "[START] Launching FastAPI backend server on 0.0.0.0:8000..." -ForegroundColor Green
    Start-Process -FilePath $VenvPython -ArgumentList "-m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $ProjectRoot
    Start-Sleep -Seconds 2
}

# 3. Check Frontend Dependencies
$NodeModules = Join-Path $ProjectRoot "frontend\node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Host "[SETUP] Installing frontend npm packages..." -ForegroundColor Yellow
    npm --prefix frontend install
}

# 4. Launch Frontend Dev Server
Write-Host "[START] Launching Vite frontend server on port 3000..." -ForegroundColor Green
Set-Location (Join-Path $ProjectRoot "frontend")
npm run dev
