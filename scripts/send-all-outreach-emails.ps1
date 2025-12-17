# Send All Outreach Emails with Attachments
# This script sends all job application emails with CV attached

param(
    [string]$ResumeFile = "resumes\resume-fasil-software-2025.pdf",
    [string]$SenderEmail = $env:GMAIL_SENDER_EMAIL
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

$pythonExe = Join-Path $repoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $pythonExe)) {
    $pythonExe = 'python'
}

$targetCompaniesPath = Join-Path $repoRoot 'data\target-companies.json'
if (-not (Test-Path $targetCompaniesPath)) {
    Write-Host "`n❌ target-companies.json not found: $targetCompaniesPath" -ForegroundColor Red
    exit 1
}

$targetCompanies = Get-Content $targetCompaniesPath | ConvertFrom-Json

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOB APPLICATION EMAIL SENDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nResume: $ResumeFile"
Write-Host "Total Companies: $($targetCompanies.Count)"

# Resolve resume path if relative
if (-not [System.IO.Path]::IsPathRooted($ResumeFile)) {
    $ResumeFile = Join-Path $repoRoot $ResumeFile
}

# Check if resume exists
if (-not (Test-Path $ResumeFile)) {
    Write-Host "`n❌ Resume file not found: $ResumeFile" -ForegroundColor Red
    exit 1
}

# Check for Gmail App Password
$password = $env:GMAIL_APP_PASSWORD
if (-not $password) {
    Write-Host "`n⚠️  Gmail App Password Required" -ForegroundColor Yellow
    Write-Host "Generate one at: https://myaccount.google.com/apppasswords"
    $securePassword = Read-Host "Enter Gmail App Password" -AsSecureString
    $password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
}

$env:GMAIL_APP_PASSWORD = $password

Write-Host "`n----------------------------------------"
Write-Host "Starting email sends..." -ForegroundColor Green
Write-Host "----------------------------------------`n"

$sent = 0
$failed = 0

foreach ($company in $targetCompanies) {
    $emailFile = $company.generatedEmailPath
    $toEmail = $company.email
    if ([string]::IsNullOrWhiteSpace($toEmail)) {
        Write-Host "⚠️  Skipping $($company.name): missing recipient email" -ForegroundColor Yellow
        continue
    }

    $jobTitle = $company.jobTitle
    if ([string]::IsNullOrWhiteSpace($jobTitle)) { $jobTitle = 'Role' }
    $companyName = $company.name
    if ([string]::IsNullOrWhiteSpace($companyName)) { $companyName = 'Company' }
    $subject = "Application - $jobTitle - $companyName - Muhammed Fasil PV"

    if ([string]::IsNullOrWhiteSpace($emailFile)) {
        Write-Host "⚠️  Skipping ${companyName}: Email file path missing" -ForegroundColor Yellow
        continue
    }

    # Resolve email body path if relative
    if (-not [System.IO.Path]::IsPathRooted($emailFile)) {
        $emailFile = Join-Path $repoRoot $emailFile
    }

    if (-not (Test-Path $emailFile)) {
        Write-Host "⚠️  Skipping ${companyName}: Email file not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "📧 Sending to $companyName ($toEmail)..." -ForegroundColor Cyan

    try {
        $sendEmailScript = Join-Path $repoRoot 'scripts\send_email.py'
        if (-not (Test-Path $sendEmailScript)) {
            throw "send_email.py not found at $sendEmailScript"
        }

        $pyArgs = @(
            $sendEmailScript,
            '--to', $toEmail,
            '--subject', $subject,
            '--body', $emailFile,
            '--attachment', $ResumeFile
        )

        if (-not [string]::IsNullOrWhiteSpace($SenderEmail)) {
            $pyArgs += @('--sender', $SenderEmail)
        }

        & $pythonExe @pyArgs

        $sent++
        Write-Host "   ✅ Sent!" -ForegroundColor Green
    }
    catch {
        $failed++
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }

    # Small delay between emails to avoid rate limiting
    Start-Sleep -Seconds 2
}

# Also send to Easy2Touch (self-checkout provider)
$easy2touchEmail = Join-Path $repoRoot 'emails\easy2touch-selfcheckout.txt'
if (Test-Path $easy2touchEmail) {
    Write-Host "`n📧 Sending to Easy2Touch (info@easy2touch.com)..." -ForegroundColor Cyan
    $sendEmailScript = Join-Path $repoRoot 'scripts\send_email.py'
    $pyArgs = @(
        $sendEmailScript,
        '--to', 'info@easy2touch.com',
        '--subject', 'Software Engineer Application - Self-Checkout Solutions Specialist | Dubai-Based',
        '--body', $easy2touchEmail,
        '--attachment', $ResumeFile
    )
    if (-not [string]::IsNullOrWhiteSpace($SenderEmail)) {
        $pyArgs += @('--sender', $SenderEmail)
    }
    & $pythonExe @pyArgs
    $sent++
}

Write-Host "`n========================================"
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host "✅ Sent: $sent" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "========================================`n"
