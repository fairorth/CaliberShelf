# Read-only follow-up: MSIX package health + GPU/display events
Write-Output "=== Claude MSIX package state ==="
try {
  Get-AppxPackage -Name *Claude* -ErrorAction Stop |
    Select-Object Name, Version, Status, SignatureKind, InstallLocation |
    Format-List | Out-String -Width 240
} catch { Write-Output "Get-AppxPackage failed: $($_.Exception.Message)" }

Write-Output "=== Does the CodeIntegrity catalog exist on disk? ==="
$pkg = Get-AppxPackage -Name *Claude* -ErrorAction SilentlyContinue
if ($pkg) {
  $cat = Join-Path $pkg.InstallLocation "AppxMetadata\CodeIntegrity.cat"
  Write-Output ("catalog path: {0}" -f $cat)
  Write-Output ("exists: {0}" -f (Test-Path $cat))
  $dll = Join-Path $pkg.InstallLocation "app\vk_swiftshader.dll"
  Write-Output ("vk_swiftshader.dll exists: {0}" -f (Test-Path $dll))
}

Write-Output "=== Display/GPU driver events (last 36h, System log) ==="
try {
  $ev = Get-WinEvent -FilterHashtable @{LogName='System'; StartTime=(Get-Date).AddHours(-36)} -MaxEvents 400 -ErrorAction Stop
  $gpu = $ev | Where-Object { $_.Id -in 4101,4113 -or $_.ProviderName -match 'Display|nvlddmkm|amdkmdag|igfx' }
  if (-not $gpu) { Write-Output "(no display-driver reset/TDR events found)" }
  foreach ($e in ($gpu | Select-Object -First 6)) {
    Write-Output ("--- {0}  [{1} Id {2}] ---" -f $e.TimeCreated, $e.ProviderName, $e.Id)
    (($e.Message -split "`r?`n") | Select-Object -First 3) | ForEach-Object { Write-Output $_ }
  }
} catch { Write-Output "System log query failed: $($_.Exception.Message)" }
