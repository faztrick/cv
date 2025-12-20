# Run Indeed bot using the workspace Python venv
# Usage: .\automation\run-indeed-bot.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$venvActivate = Join-Path $repoRoot '.venv\Scripts\Activate.ps1'
$venvPython = Join-Path $repoRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $venvActivate)) {
  throw "Python venv not found at $venvActivate. Create it and install requirements first."
}

if (-not (Test-Path $venvPython)) {
  throw "Python executable not found at $venvPython. Recreate the venv (.venv) first."
}

. $venvActivate

$botDir = Join-Path $repoRoot 'automation\repos\indeed_bot'
if (-not (Test-Path $botDir)) {
  throw "Indeed bot folder not found at $botDir"
}

$configPath = Join-Path $botDir 'config.yaml'
if (-not (Test-Path $configPath)) {
  throw "Indeed bot config.yaml not found at $configPath. Run .\automation\configure-indeed-bot.ps1 first."
}

Push-Location $botDir
Write-Host "Starting Indeed bot (first run may require manual login)..." -ForegroundColor Cyan
& $venvPython indeed_bot.py
Pop-Location
