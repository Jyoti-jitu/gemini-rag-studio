Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Starting Gemini RAG Backend...                    " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

if (-not (Test-Path -Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1

Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Starting Uvicorn Server at http://localhost:8000..." -ForegroundColor Cyan
uvicorn app.main:app --reload
