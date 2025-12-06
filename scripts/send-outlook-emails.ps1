# Send All Outreach Emails via Outlook with Attachments
# This script uses Outlook COM to send emails with CV attached

param(
    [string]$ResumeFile = "I:\projects\cv\resumes\resume-fasil-2025.pdf"
)

$targetCompanies = Get-Content "I:\projects\cv\data\target-companies.json" | ConvertFrom-Json

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  OUTLOOK EMAIL SENDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nResume: $ResumeFile"
Write-Host "Total Companies: $($targetCompanies.Count)"

# Check if resume exists
if (-not (Test-Path $ResumeFile)) {
    Write-Host "`n❌ Resume file not found: $ResumeFile" -ForegroundColor Red
    exit 1
}

# Create Outlook Application
try {
    $outlook = New-Object -ComObject Outlook.Application
    Write-Host "✅ Outlook connected!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect to Outlook: $_" -ForegroundColor Red
    Write-Host "Make sure Outlook is installed and running." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n----------------------------------------"
Write-Host "Sending emails..." -ForegroundColor Green
Write-Host "----------------------------------------`n"

$sent = 0

foreach ($company in $targetCompanies) {
    $emailFile = $company.generatedEmailPath
    $toEmail = $company.email
    $subject = "Application - $($company.jobTitle) - $($company.name) - Muhammed Fasil PV"

    if (-not (Test-Path $emailFile)) {
        Write-Host "⚠️  Skipping $($company.name): Email file not found" -ForegroundColor Yellow
        continue
    }

    # Read email body
    $bodyContent = Get-Content $emailFile -Raw
    # Remove Subject line from body if present
    $bodyContent = $bodyContent -replace "(?m)^Subject:.*`r?`n", ""

    Write-Host "📧 $($company.name) -> $toEmail" -ForegroundColor Cyan

    try {
        $mail = $outlook.CreateItem(0)
        $mail.To = $toEmail
        $mail.Subject = $subject
        $mail.Body = $bodyContent
        $mail.Attachments.Add($ResumeFile) | Out-Null
        $mail.Send()

        $sent++
        Write-Host "   ✅ Sent!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 500
}

# Also send to Easy2Touch (self-checkout provider)
$easy2touchEmail = "I:\projects\cv\emails\easy2touch-selfcheckout.txt"
if (Test-Path $easy2touchEmail) {
    $bodyContent = Get-Content $easy2touchEmail -Raw
    $bodyContent = $bodyContent -replace "(?m)^(To|Subject):.*`r?`n", ""

    Write-Host "`n📧 Easy2Touch -> info@easy2touch.com" -ForegroundColor Cyan

    $mail = $outlook.CreateItem(0)
    $mail.To = "info@easy2touch.com"
    $mail.CC = "support@easy2touch.com"
    $mail.Subject = "Software Engineer Application - Self-Checkout Solutions Specialist | Dubai-Based"
    $mail.Body = $bodyContent
    $mail.Attachments.Add($ResumeFile) | Out-Null
    $mail.Send()
    $sent++
    Write-Host "   ✅ Sent!" -ForegroundColor Green
}

Write-Host "`n========================================"
Write-Host "  ✅ TOTAL SENT: $sent emails" -ForegroundColor Green
Write-Host "========================================`n"
