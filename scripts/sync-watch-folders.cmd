@echo off
REM Create/refresh per-watch image folders under your Watch Images parent folder.
REM Safe to run anytime (idempotent). Used by the scheduled task and for manual runs.
REM Manual with pruning of deleted-watch folders:  sync-watch-folders.cmd --prune
cd /d "%~dp0.."
call npm run sync-watch-folders -- %*
