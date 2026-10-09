@echo off
cd /d "%~dp0"
netstat -ano | findstr ":4173" | findstr "LISTENING" >nul && (echo Preview already running at http://localhost:4173 & timeout /t 2 >nul & exit /b 0)
where node >nul 2>nul || (echo Node.js is not installed on Windows. & pause & exit /b 1)
start "Team100 preview server" /min cmd /c "node server.mjs"
exit /b 0
