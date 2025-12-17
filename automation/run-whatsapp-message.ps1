# Send a single personal WhatsApp message via the local panel integration
# Usage:
#   .\automation\run-whatsapp-message.ps1
#   .\automation\run-whatsapp-message.ps1 -Number "+9715XXXXXXXX" -Message "Hi ..." -Yes
#   .\automation\run-whatsapp-message.ps1 -Number "+9715XXXXXXXX" -Message "CV attached" -Pdf "resumes\resume-fasil-software-2025.pdf" -Yes

param(
  [string]$Number,
  [string]$Message,
  [string]$Pdf,
  [switch]$Yes
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

# Ensure panel server is running for WhatsApp integration
Write-Host "Tip: WhatsApp sending uses the local panel server. If not running, start it with: npm run panel" -ForegroundColor DarkGray

if (-not $Number) { $Number = Read-Host 'Enter WhatsApp number (with country code, e.g. +9715XXXXXXXX)' }
if (-not $Message) { $Message = Read-Host 'Enter message text' }

$scriptPath = Join-Path $repoRoot 'scripts\whatsapp-send-cli.js'
if (-not (Test-Path $scriptPath)) {
  throw "Missing script: $scriptPath"
}

$args = @(
  $scriptPath,
  '--number', $Number,
  '--message', $Message
)

if ($Pdf) {
  $args += @('--pdf', $Pdf)
}

if ($Yes) {
  $args += '--yes'
}
else {
  Write-Host "DRY RUN by default. Add -Yes to actually send." -ForegroundColor Yellow
}

Push-Location $repoRoot
node @args
Pop-Location
