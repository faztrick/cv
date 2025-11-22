<#
.SYNOPSIS
    Automates the application for Emirates Group GenAI role.
.DESCRIPTION
    Uses Python SMTP script to send the application email with PDF attachment.
    Requires a Gmail App Password.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = "$ScriptDir\.."
$PythonScript = "$WorkspaceRoot\scripts\send_email.py"

# Application Details
$To = Read-Host "Enter Recipient Email (e.g., recruiter@emirates.com)"
if ([string]::IsNullOrWhiteSpace($To)) {
  Write-Error "Recipient email is required."
  exit 1
}

$Subject = "Application for Principal Solutions Architect – GenAI"
$BodyFile = "$WorkspaceRoot\emails\emirates-genai.txt"
$Attachment = "$WorkspaceRoot\resumes\resume-fasil-full-2025.pdf"

Write-Host "Preparing to send application..."
Write-Host "To: $To"
Write-Host "Subject: $Subject"
Write-Host "Attachment: $Attachment"

# Check if Python is available
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Error "Python is not installed or not in PATH."
  exit 1
}

# Run the Python script
python $PythonScript --to "$To" --subject "$Subject" --body "$BodyFile" --attachment "$Attachment"
