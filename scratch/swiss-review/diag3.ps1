# Read-only: fresh-install package state, DLL signature, and any new CI blocks
Write-Output "=== Fresh package ==="
$pkg = Get-AppxPackage -Name *Claude* -ErrorAction SilentlyContinue
$pkg | Select-Object Name, Version, Status, SignatureKind, InstallLocation | Format-List | Out-String -Width 240

if ($pkg) {
  $dll = Join-Path $pkg.InstallLocation "app\vk_swiftshader.dll"
  Write-Output ("vk_swiftshader.dll exists: {0}" -f (Test-Path $dll))
  if (Test-Path $dll) {
    $sig = Get-AuthenticodeSignature $dll
    Write-Output ("  signature status: {0}" -f $sig.Status)
    Write-Output ("  signer: {0}" -f $sig.SignerCertificate.Subject)
  }
  $exe = Join-Path $pkg.InstallLocation "app\claude.exe"
  if (Test-Path $exe) {
    $sig2 = Get-AuthenticodeSignature $exe
    Write-Output ("claude.exe signature status: {0}" -f $sig2.Status)
    Write-Output ("  signer: {0}" -f $sig2.SignerCertificate.Subject)
  }
  Write-Output "=== AppxMetadata contents ==="
  $meta = Join-Path $pkg.InstallLocation "AppxMetadata"
  if (Test-Path $meta) {
    Get-ChildItem $meta -Recurse | Select-Object FullName, Length | Format-Table -AutoSize | Out-String -Width 240
  } else { Write-Output "(no AppxMetadata folder at all)" }
}

Write-Output "=== CodeIntegrity events in the last 2 hours ==="
try {
  $ev = Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-CodeIntegrity/Operational'; StartTime=(Get-Date).AddHours(-2)} -MaxEvents 60 -ErrorAction Stop
  $hits = $ev | Where-Object { $_.Message -match 'claude|anthropic' }
  Write-Output ("claude-related: {0}" -f @($hits).Count)
  foreach ($e in ($hits | Select-Object -First 6)) {
    Write-Output ("--- {0}  Id {1} ---" -f $e.TimeCreated, $e.Id)
    (($e.Message -split "`r?`n") | Select-Object -First 4) | ForEach-Object { Write-Output $_ }
  }
} catch { Write-Output "query failed or log empty: $($_.Exception.Message)" }
