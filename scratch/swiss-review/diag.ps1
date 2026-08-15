# Read-only crash diagnostics for the Claude Desktop crashes (2026-08-13)
$since = (Get-Date).AddHours(-36)

Write-Output "=== 1. Claude install footprint (update evidence) ==="
foreach ($p in @("$env:LOCALAPPDATA\AnthropicClaude", "$env:LOCALAPPDATA\Programs")) {
  if (Test-Path $p) {
    Get-ChildItem $p -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match 'claude|anthropic|app-' } |
      Select-Object FullName, LastWriteTime | Format-Table -AutoSize | Out-String -Width 200
  }
}
if (Test-Path "$env:LOCALAPPDATA\AnthropicClaude") {
  Get-ChildItem "$env:LOCALAPPDATA\AnthropicClaude" -Directory -ErrorAction SilentlyContinue |
    Select-Object Name, LastWriteTime | Format-Table -AutoSize | Out-String -Width 200
  Get-ChildItem "$env:LOCALAPPDATA\AnthropicClaude" -Filter *.log -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 5 Name, LastWriteTime, Length |
    Format-Table -AutoSize | Out-String -Width 200
}

Write-Output "=== 2. Application crash events (last 36h, claude/electron) ==="
try {
  $ev = Get-WinEvent -FilterHashtable @{LogName='Application'; Id=1000,1001,1002; StartTime=$since} -MaxEvents 60 -ErrorAction Stop
  $hits = $ev | Where-Object { $_.Message -match 'claude|anthropic|electron' }
  if (-not $hits) { Write-Output "(no claude-related crash events found)" }
  foreach ($e in $hits) {
    Write-Output ("--- {0}  [{1}  Id {2}] ---" -f $e.TimeCreated, $e.ProviderName, $e.Id)
    $lines = ($e.Message -split "`r?`n") | Select-Object -First 14
    $lines | ForEach-Object { Write-Output $_ }
  }
} catch { Write-Output "Application log query failed: $($_.Exception.Message)" }

Write-Output "=== 3. Local crash dumps ==="
$cd = "$env:LOCALAPPDATA\CrashDumps"
if (Test-Path $cd) {
  Get-ChildItem $cd -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending |
    Select-Object -First 10 Name, LastWriteTime, @{n='MB';e={[math]::Round($_.Length/1MB,1)}} |
    Format-Table -AutoSize | Out-String -Width 200
} else { Write-Output "(no $cd folder)" }

Write-Output "=== 4. Code Integrity / Smart App Control block events (last 36h) ==="
foreach ($log in @('Microsoft-Windows-CodeIntegrity/Operational', 'Microsoft-Windows-AppLocker/EXE and DLL')) {
  try {
    $ev = Get-WinEvent -FilterHashtable @{LogName=$log; StartTime=$since} -MaxEvents 80 -ErrorAction Stop
    $hits = $ev | Where-Object { $_.Message -match 'claude|anthropic' }
    Write-Output ("[{0}] total events: {1}, claude-related: {2}" -f $log, $ev.Count, @($hits).Count)
    foreach ($e in ($hits | Select-Object -First 8)) {
      Write-Output ("--- {0}  Id {1} ---" -f $e.TimeCreated, $e.Id)
      $lines = ($e.Message -split "`r?`n") | Select-Object -First 6
      $lines | ForEach-Object { Write-Output $_ }
    }
  } catch { Write-Output "[$log] query failed or log empty: $($_.Exception.Message)" }
}

Write-Output "=== 5. Windows Error Reporting queue (report names only) ==="
$wer = "$env:LOCALAPPDATA\Microsoft\Windows\WER\ReportArchive"
if (Test-Path $wer) {
  Get-ChildItem $wer -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match 'claude|anthropic' -and $_.LastWriteTime -gt $since } |
    Sort-Object LastWriteTime -Descending | Select-Object -First 10 Name, LastWriteTime |
    Format-Table -AutoSize | Out-String -Width 240
} else { Write-Output "(no ReportArchive folder)" }
