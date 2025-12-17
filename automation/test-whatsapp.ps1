# Preflight check for WhatsApp integration (single-message helper)
#
# Validates:
# - Node.js is installed
# - Panel server is reachable at http://localhost:3000
# - WhatsApp client status (CONNECTED / AUTHENTICATED / QR_READY / UNAVAILABLE)
#
# Usage:
#   .\automation\test-whatsapp.ps1
#   .\automation\test-whatsapp.ps1 -StartPanel

[CmdletBinding()]
param(
  [switch]$StartPanel
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Dim($msg) { Write-Host $msg -ForegroundColor DarkGray }

Write-Info "WhatsApp preflight (panel integration)"
Write-Dim "Repo: $repoRoot"

# 1) Node.js check
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js not found on PATH. Install Node.js (recommended: Node 18+), then retry.'
}

# 2) Check server reachability
$statusUrl = 'http://localhost:3000/api/whatsapp/status'

function Try-GetWhatsAppStatus {
  try {
    # Invoke-RestMethod can hang on some network issues; keep it snappy.
    return Invoke-RestMethod -Method Get -Uri $statusUrl -TimeoutSec 3
  }
  catch {
    return $null
  }
}

$status = Try-GetWhatsAppStatus
if (-not $status) {
  Write-Warn "Panel server not reachable at http://localhost:3000"
  Write-Dim "Start it from the repo root with: npm run panel"

  if ($StartPanel) {
    Write-Info 'Starting the panel in a new terminal window...'
    $cmd = "Set-Location -LiteralPath '$repoRoot'; npm run panel"
    Start-Process -FilePath 'pwsh' -ArgumentList @('-NoExit', '-Command', $cmd) | Out-Null
    Start-Sleep -Seconds 2

    $status = Try-GetWhatsAppStatus
    if (-not $status) {
      Write-Warn 'Panel still not reachable yet. Give it a few seconds, then re-run this preflight.'
      exit 1
    }
  }
  else {
    exit 1
  }
}

$waStatus = $status.status
Write-Info "Panel reachable ✅  WhatsApp status: $waStatus"

switch ($waStatus) {
  'CONNECTED' {
    Write-Info 'WhatsApp is connected. You can send a message now.'
  }
  'AUTHENTICATED' {
    Write-Info 'WhatsApp is authenticated (almost/also ready). If sending fails, wait a few seconds for CONNECTED.'
  }
  'QR_READY' {
    Write-Warn 'QR is ready. Open the panel and scan it to connect WhatsApp.'
    Write-Dim 'Panel: http://localhost:3000/panel  → WhatsApp tab'
  }
  'UNAVAILABLE' {
    Write-Warn 'WhatsApp client is UNAVAILABLE. This usually means Chromium/Chrome is missing for Puppeteer.'
    Write-Dim 'Fix options:'
    Write-Dim '- Install Chrome/Chromium on this machine'
    Write-Dim '- Or install Puppeteer browser bundle (optionalDependency) and retry'
  }
  default {
    Write-Warn "WhatsApp status is $waStatus. Check server console logs for details."
    Write-Dim 'Panel: http://localhost:3000/panel  → WhatsApp tab'
  }
}

Write-Dim ''
Write-Dim 'Dry-run send example (no message sent):'
Write-Dim '  node scripts/whatsapp-send-cli.js --number "+9715XXXXXXXX" --message "Hi ..."'
Write-Dim 'Real send example:'
Write-Dim '  .\automation\run-whatsapp-message.ps1 -Number "+9715XXXXXXXX" -Message "Hi ..." -Yes'
