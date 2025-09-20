@echo off
echo Starting Auto Git Push Script...
echo This script will automatically push changes to GitHub every 5 minutes
echo Press Ctrl+C to stop
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0auto-push.ps1"
pause