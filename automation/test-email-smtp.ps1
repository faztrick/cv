# Email (Gmail SMTP) - Pre-Flight Check
# Validates that the workspace is ready to send outreach emails
# Usage: .\automation\test-email-smtp.ps1

$ErrorActionPreference = 'Stop'

Write-Host "`n=== Email (Gmail SMTP) - Pre-Flight Check ===" -ForegroundColor Cyan

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

# Load .env if present (optional)
$envPath = Join-Path $repoRoot '.env'
if (Test-Path $envPath) {
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
}

# Check Python (prefer venv)
Write-Host "`n[1/5] Checking Python..." -ForegroundColor Yellow
$pythonExe = Join-Path $repoRoot '.venv\Scripts\python.exe'
if (Test-Path $pythonExe) {
  Write-Host "  ✓ Using venv Python: $pythonExe" -ForegroundColor Green
}
else {
  $pythonExe = (Get-Command python -ErrorAction SilentlyContinue)?.Source
  if (-not $pythonExe) {
    Write-Host "  ✗ Python not found. Create .venv or install Python." -ForegroundColor Red
    exit 1
  }
  Write-Host "  ⚠ Using system Python: $pythonExe" -ForegroundColor Yellow
}

# Check core script exists
Write-Host "`n[2/5] Checking scripts..." -ForegroundColor Yellow
$sendEmailPy = Join-Path $repoRoot 'scripts\send_email.py'
$sendAllPs1 = Join-Path $repoRoot 'scripts\send-all-outreach-emails.ps1'
if (Test-Path $sendEmailPy) { Write-Host "  ✓ send_email.py found" -ForegroundColor Green } else { Write-Host "  ✗ Missing: $sendEmailPy" -ForegroundColor Red; exit 1 }
if (Test-Path $sendAllPs1) { Write-Host "  ✓ send-all-outreach-emails.ps1 found" -ForegroundColor Green } else { Write-Host "  ✗ Missing: $sendAllPs1" -ForegroundColor Red; exit 1 }

# Check config/data
Write-Host "`n[3/5] Checking data files..." -ForegroundColor Yellow
$targetsJson = Join-Path $repoRoot 'data\target-companies.json'
if (-not (Test-Path $targetsJson)) {
  Write-Host "  ✗ Missing: $targetsJson" -ForegroundColor Red
  exit 1
}
Write-Host "  ✓ target-companies.json found" -ForegroundColor Green

# Check resume
Write-Host "`n[4/5] Checking resume..." -ForegroundColor Yellow
$resume = Join-Path $repoRoot 'resumes\resume-fasil-software-2025.pdf'
if (Test-Path $resume) {
  Write-Host "  ✓ Resume found: $resume" -ForegroundColor Green
}
else {
  Write-Host "  ⚠ Default resume not found: $resume" -ForegroundColor Yellow
  Write-Host "    You can pass -ResumeFile to run-email-outreach.ps1" -ForegroundColor DarkGray
}

# Check env vars (optional)
Write-Host "`n[5/5] Checking environment variables..." -ForegroundColor Yellow
if ($env:GMAIL_SENDER_EMAIL) {
  Write-Host "  ✓ GMAIL_SENDER_EMAIL set" -ForegroundColor Green
}
else {
  Write-Host "  ℹ GMAIL_SENDER_EMAIL not set (send_email.py will use its default or you can set it in .env)" -ForegroundColor Cyan
}

if ($env:GMAIL_APP_PASSWORD) {
  Write-Host "  ✓ GMAIL_APP_PASSWORD set" -ForegroundColor Green
}
else {
  Write-Host "  ℹ GMAIL_APP_PASSWORD not set (you will be prompted)" -ForegroundColor Cyan
}

Write-Host "`n=== Pre-Flight Check Complete ===" -ForegroundColor Cyan
Write-Host "Next: .\automation\run-email-outreach.ps1" -ForegroundColor Green
