@echo off
REM Photo-scoring agent — run this manually on your local machine.
REM
REM Why local: the CV layer needs raw pixel access to the capture files under
REM your \WatchImages folder, which no cloud runner can see.
REM
REM Usage:
REM   double-click this file            (score all watches with folders)
REM   photo-score.cmd --dry-run         (compute + print, write nothing)
REM   photo-score.cmd --limit 2         (only the first N watches)
REM   photo-score.cmd --watch <uuid>    (a single watch)
REM   photo-score.cmd --force           (re-score already-scored frames)

cd /d "%~dp0.."
echo Running: npm run photo-score -- %*
echo.
call npm run photo-score -- %*
echo.
echo ---- done (exit code %ERRORLEVEL%) ----
pause
