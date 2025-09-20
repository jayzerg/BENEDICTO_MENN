@echo off
echo Starting Watch and Push Script...
echo This script will watch for file changes and automatically push to GitHub
echo Press Ctrl+C to stop
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0watch-and-push.ps1"
pause