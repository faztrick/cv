# Send All Emails via Outlook Web with Attachments
# Opens each email in browser for manual attachment and send

param(
    [string]$ResumeFile = "I:\projects\cv\resumes\resume-fasil-2025.pdf"
)

$targetCompanies = Get-Content "I:\projects\cv\data\target-companies.json" | ConvertFrom-Json

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  OUTLOOK WEB EMAIL COMPOSER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nResume to attach: $ResumeFile"
Write-Host "Total Companies: $($targetCompanies.Count)"
Write-Host "`n⚠️  Each email will open in Outlook Web."
Write-Host "   Please attach your CV and click Send for each." -ForegroundColor Yellow

# Copy resume path to clipboard for easy pasting
$ResumeFile | Set-Clipboard
Write-Host "`n📋 Resume path copied to clipboard!" -ForegroundColor Green

Write-Host "`nPress Enter to start opening emails..."
Read-Host

$count = 0

foreach ($company in $targetCompanies) {
    $emailFile = $company.generatedEmailPath
    $toEmail = $company.email
    $subject = "Application - $($company.jobTitle) - $($company.name) - Muhammed Fasil PV"

    if (-not (Test-Path $emailFile)) {
        continue
    }

    # Read and clean email body
    $bodyContent = Get-Content $emailFile -Raw
    $bodyContent = $bodyContent -replace "(?m)^Subject:.*`r?`n", ""
    $bodyContent = $bodyContent.Trim()

    # URL encode
    $encodedSubject = [System.Web.HttpUtility]::UrlEncode($subject)
    $encodedBody = [System.Web.HttpUtility]::UrlEncode($bodyContent)

    # Outlook Web compose URL
    $outlookUrl = "https://outlook.live.com/mail/0/deeplink/compose?to=$toEmail&subject=$encodedSubject&body=$encodedBody"

    $count++
    Write-Host "`n[$count/$($targetCompanies.Count)] $($company.name)" -ForegroundColor Cyan
    Write-Host "   To: $toEmail"

    Start-Process $outlookUrl

    Write-Host "   📧 Opened! Attach CV and Send." -ForegroundColor Green
    Write-Host "   Press Enter for next..." -ForegroundColor Yellow
    Read-Host
}

# Easy2Touch
$easy2touchEmail = "I:\projects\cv\emails\easy2touch-selfcheckout.txt"
if (Test-Path $easy2touchEmail) {
    $bodyContent = Get-Content $easy2touchEmail -Raw
    $bodyContent = $bodyContent -replace "(?m)^(To|Subject):.*`r?`n", ""
    $subject = "Software Engineer Application - Self-Checkout Solutions Specialist | Dubai-Based"

    $encodedSubject = [System.Web.HttpUtility]::UrlEncode($subject)
    $encodedBody = [System.Web.HttpUtility]::UrlEncode($bodyContent)

    $outlookUrl = "https://outlook.live.com/mail/0/deeplink/compose?to=info@easy2touch.com&cc=support@easy2touch.com&subject=$encodedSubject&body=$encodedBody"

    $count++
    Write-Host "`n[$count] Easy2Touch (Self-Checkout)" -ForegroundColor Cyan
    Write-Host "   To: info@easy2touch.com"

    Start-Process $outlookUrl
    Write-Host "   📧 Opened! Attach CV and Send." -ForegroundColor Green
}

Write-Host "`n========================================"
Write-Host "  ✅ All $count emails opened!" -ForegroundColor Green
Write-Host "  📎 Don't forget to attach: $ResumeFile" -ForegroundColor Yellow
Write-Host "========================================`n"
