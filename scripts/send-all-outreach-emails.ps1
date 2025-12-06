# Send All Outreach Emails with Attachments
# This script sends all job application emails with CV attached

param(
    [string]$ResumeFile = "I:\projects\cv\resumes\resume-fasil-2025.pdf"
)

$targetCompanies = Get-Content "I:\projects\cv\data\target-companies.json" | ConvertFrom-Json

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOB APPLICATION EMAIL SENDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nResume: $ResumeFile"
Write-Host "Total Companies: $($targetCompanies.Count)"

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
    $subject = "Application - $($company.jobTitle) - $($company.name) - Muhammed Fasil PV"

    if (-not (Test-Path $emailFile)) {
        Write-Host "⚠️  Skipping $($company.name): Email file not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "📧 Sending to $($company.name) ($toEmail)..." -ForegroundColor Cyan

    try {
        python "I:\projects\cv\scripts\send_email.py" `
            --to $toEmail `
            --subject $subject `
            --body $emailFile `
            --attachment $ResumeFile

        $sent++
        Write-Host "   ✅ Sent!" -ForegroundColor Green
    } catch {
        $failed++
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }

    # Small delay between emails to avoid rate limiting
    Start-Sleep -Seconds 2
}

# Also send to Easy2Touch (self-checkout provider)
$easy2touchEmail = "I:\projects\cv\emails\easy2touch-selfcheckout.txt"
if (Test-Path $easy2touchEmail) {
    Write-Host "`n📧 Sending to Easy2Touch (info@easy2touch.com)..." -ForegroundColor Cyan
    python "I:\projects\cv\scripts\send_email.py" `
        --to "info@easy2touch.com" `
        --subject "Software Engineer Application - Self-Checkout Solutions Specialist | Dubai-Based" `
        --body $easy2touchEmail `
        --attachment $ResumeFile
    $sent++
}

Write-Host "`n========================================"
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host "✅ Sent: $sent" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "========================================`n"
