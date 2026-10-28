Write-Host "Starting SentinelMesh FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
$env:PYTHONPATH="backend"
& ".\venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
