@echo off
echo ===================================================
echo Starting Gemini RAG Backend...
echo ===================================================

IF NOT EXIST "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing / checking requirements...
pip install -r requirements.txt

echo Starting Uvicorn Server on http://localhost:8000 ...
uvicorn app.main:app --reload
pause
