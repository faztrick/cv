# Run outreach emails using credentials from workspace .env (no secrets committed)
# Usage: .\automation\run-email-outreach.ps1 [-ResumeFile "resumes\\resume-fasil-software-2025.pdf"]

param(
  [string]$ResumeFile = "resumes\\resume-fasil-software-2025.pdf"
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$envPath = Join-Path $repoRoot '.env'

if (Test-Path $envPath) {
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
}

$scriptPath = Join-Path $repoRoot 'scripts\send-all-outreach-emails.ps1'
if (-not (Test-Path $scriptPath)) {
  throw "Email sender script not found at $scriptPath"
}

Write-Host "Starting outreach email sender..." -ForegroundColor Cyan
Write-Host "Tip: Set GMAIL_APP_PASSWORD and GMAIL_SENDER_EMAIL in .env to avoid prompts." -ForegroundColor DarkGray

& $scriptPath -ResumeFile $ResumeFile
