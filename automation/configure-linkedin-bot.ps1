# Quick Configuration Helper for LinkedIn Job Bot
param(
    [string]$Email,
    [string]$Password,
    [string]$Keyword = "Full Stack Developer Flutter",
    [string]$Location = "United Arab Emirates",
    [ValidateSet("Past 24 hours", "Past Week")]
    [string]$Period = "Past Week",
    [int]$Pages = 3
)

$configPath = Join-Path $PSScriptRoot "repos\linkedin-job-apply-automation\config.json"

Write-Host "`n=== LinkedIn Job Bot - Quick Configuration ===" -ForegroundColor Cyan

# If no parameters provided, prompt interactively
if (-not $Email) {
    Write-Host "`nEnter your LinkedIn credentials and job preferences:" -ForegroundColor Yellow
    $Email = Read-Host "LinkedIn Email"
    $Password = Read-Host "LinkedIn Password" -AsSecureString
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    )

    Write-Host "`nJob Search Preferences:" -ForegroundColor Yellow
    $keywordInput = Read-Host "Job Keyword (default: Full Stack Developer Flutter)"
    if ($keywordInput) { $Keyword = $keywordInput }

    $locationInput = Read-Host "Location (default: United Arab Emirates)"
    if ($locationInput) { $Location = $locationInput }

    Write-Host "`nTime Period Options:"
    Write-Host "  1. Past 24 hours"
    Write-Host "  2. Past Week (recommended)"
    $periodChoice = Read-Host "Select (1 or 2, default: 2)"
    if ($periodChoice -eq "1") { $Period = "Past 24 hours" }

    $pagesInput = Read-Host "Number of pages to process (default: 3)"
    if ($pagesInput) { $Pages = [int]$pagesInput }
}

# Load existing config
$config = Get-Content $configPath | ConvertFrom-Json

# Update config
$config.email = $Email
$config.password = $Password
$config.keyword = $Keyword
$config.location = $Location
$config.Period = $Period
$config.numberOfPagination = $Pages

# Save config
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath

Write-Host "`n✅ Configuration saved!" -ForegroundColor Green
Write-Host "`nYour Settings:" -ForegroundColor Cyan
Write-Host "  Email: $Email" -ForegroundColor White
Write-Host "  Keyword: $Keyword" -ForegroundColor White
Write-Host "  Location: $Location" -ForegroundColor White
Write-Host "  Period: $Period" -ForegroundColor White
Write-Host "  Pages: $Pages" -ForegroundColor White

Write-Host "`nTo start the bot, run:" -ForegroundColor Yellow
Write-Host "  cd automation\repos\linkedin-job-apply-automation" -ForegroundColor White
Write-Host "  node index.js" -ForegroundColor White

Write-Host "`n⚠️  Important Reminders:" -ForegroundColor Red
Write-Host "  • This may violate LinkedIn ToS - use at your own risk" -ForegroundColor Yellow
Write-Host "  • The bot runs in visible mode - you can watch it work" -ForegroundColor Yellow
Write-Host "  • May require manual intervention for CAPTCHAs" -ForegroundColor Yellow
Write-Host "  • Start with few pages (3-5) to test" -ForegroundColor Yellow
Write-Host ""
