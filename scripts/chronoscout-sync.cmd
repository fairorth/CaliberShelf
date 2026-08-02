@echo off
REM ChronoScout catalog sync — run this manually on your local machine.
REM
REM Why local: ChronoScout sits behind Cloudflare, which blocks GitHub Actions
REM runner IPs with a "Just a moment..." challenge (HTTP 403). Your own machine
REM is not blocked, so run it here whenever you want to refresh the mirror.
REM
REM Usage:
REM   double-click this file            (incremental sync)
REM   chronoscout-sync.cmd --full       (force a full re-pull)
REM   chronoscout-sync.cmd --dry-run    (fetch + report, no DB writes)

cd /d "%~dp0.."
echo Running: npm run chronoscout-sync -- %*
echo.
call npm run chronoscout-sync -- %*
echo.
echo ---- done (exit code %ERRORLEVEL%) ----
pause
