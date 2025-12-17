# Run LinkedIn bot using credentials from local .env (no secrets stored in repo config)
# Usage: .\automation\run-linkedin-bot.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$envPath = Join-Path $repoRoot '.env'

if (-not (Test-Path $envPath)) {
  throw ".env not found at $envPath. Create it from .env.example and add LINKEDIN_EMAIL / LINKEDIN_PASSWORD."
}

# Load .env into process env (simple parser)
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { return }
  $k = $line.Substring(0, $idx).Trim()
  $v = $line.Substring($idx + 1).Trim()
  if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
  if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length - 2) }
  [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
}

$email = $env:LINKEDIN_EMAIL
$pass = $env:LINKEDIN_PASSWORD

if (-not $email -or -not $pass) {
  throw 'LINKEDIN_EMAIL / LINKEDIN_PASSWORD not set in .env. Add them and re-run.'
}

$botDir = Join-Path $repoRoot 'automation\repos\linkedin-job-apply-automation'
$configPath = Join-Path $botDir 'config.json'

if (-not (Test-Path $configPath)) {
  throw "LinkedIn bot config.json not found at $configPath"
}

# Backup existing config.json
$backupPath = "$configPath.bak"
Copy-Item -Path $configPath -Destination $backupPath -Force

try {
  $config = Get-Content $configPath -Raw | ConvertFrom-Json
  $config.email = $email
  $config.password = $pass

  # Keep your current targeting (Flutter + Full Stack, Dubai)
  if (-not $config.keyword) { $config.keyword = 'Full Stack Developer Flutter' }
  if (-not $config.location) { $config.location = 'Dubai' }

  $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8

  Push-Location $botDir
  Write-Host "Starting LinkedIn bot (visible Chrome)..." -ForegroundColor Cyan
  node index.js
}
finally {
  # Restore the original config.json to avoid leaving secrets on disk
  if (Test-Path $backupPath) {
    Move-Item -Path $backupPath -Destination $configPath -Force
  }
  Pop-Location
}
