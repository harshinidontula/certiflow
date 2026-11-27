@echo off
echo ===================================================
echo Starting CertiFlow - Bulk Certificate SaaS Platform
echo ===================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000...
start cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting React Vite Frontend on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo CertiFlow services launched!
echo Access the Application at: http://localhost:5173
echo Public Verification at:    http://localhost:5173/verify
echo Backend API Docs at:       http://127.0.0.1:8000/docs
echo ===================================================
pause
