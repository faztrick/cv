<#
.SYNOPSIS
    Automates the application for Emirates Group GenAI role.
.DESCRIPTION
    Uses Python SMTP script to send the application email with PDF attachment.
    Requires a Gmail App Password.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Resolve-Path (Join-Path $ScriptDir '..')
$PythonScript = Join-Path $WorkspaceRoot 'scripts\send_email.py'

# Load workspace .env (optional)
$envPath = Join-Path $WorkspaceRoot '.env'
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

# Application Details
$To = Read-Host "Enter Recipient Email (e.g., recruiter@emirates.com)"
if ([string]::IsNullOrWhiteSpace($To)) {
  Write-Error "Recipient email is required."
  exit 1
}

$Subject = "Application for Principal Solutions Architect – GenAI"
$BodyFile = Join-Path $WorkspaceRoot 'emails\emirates-genai.txt'
$Attachment = Join-Path $WorkspaceRoot 'resumes\resume-fasil-full-2025.pdf'

if (-not (Test-Path $Attachment)) {
  # fallback to software resume if full resume isn't present
  $fallback = Join-Path $WorkspaceRoot 'resumes\resume-fasil-software-2025.pdf'
  if (Test-Path $fallback) {
    $Attachment = $fallback
  }
}

Write-Host "Preparing to send application..."
Write-Host "To: $To"
Write-Host "Subject: $Subject"
Write-Host "Attachment: $Attachment"

# Check if Python is available
$pythonExe = Join-Path $WorkspaceRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $pythonExe)) {
  $pythonExe = (Get-Command python -ErrorAction SilentlyContinue)?.Source
}
if (-not $pythonExe) {
  Write-Error "Python not found. Create .venv or install Python and ensure it is in PATH."
  exit 1
}

if (-not (Test-Path $PythonScript)) {
  Write-Error "send_email.py not found at: $PythonScript"
  exit 1
}

if (-not (Test-Path $BodyFile)) {
  Write-Error "Email body file not found at: $BodyFile"
  exit 1
}

if (-not (Test-Path $Attachment)) {
  Write-Error "Resume attachment not found at: $Attachment"
  exit 1
}

# Run the Python script
$args = @(
  $PythonScript,
  '--to', $To,
  '--subject', $Subject,
  '--body', $BodyFile,
  '--attachment', $Attachment
)

if ($env:GMAIL_SENDER_EMAIL) {
  $args += @('--sender', $env:GMAIL_SENDER_EMAIL)
}

& $pythonExe @args
