@echo off
REM Local static server + auto-open browser. Double-click to run.
REM Stop: close this window or press Ctrl+C.
cd /d "%~dp0"
node serve.js 8080
pause
