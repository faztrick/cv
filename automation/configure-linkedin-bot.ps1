# Quick Configuration Helper for LinkedIn Job Bot
param(
    [string]$Keyword = "Full Stack Developer Flutter",
    [string]$Location = "United Arab Emirates",
    [ValidateSet("Past 24 hours", "Past Week")]
    [string]$Period = "Past Week",
    [int]$Pages = 3
)

$settingsPath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'data\linkedin-bot-settings.json'

Write-Host "`n=== LinkedIn Job Bot - Quick Configuration ===" -ForegroundColor Cyan
Write-Host "This helper stores only non-sensitive search preferences." -ForegroundColor Yellow
Write-Host "Add LINKEDIN_EMAIL and LINKEDIN_PASSWORD to the workspace .env file instead of writing them to disk.`n" -ForegroundColor Yellow

# If no parameters provided, prompt interactively
if (-not $PSBoundParameters.ContainsKey('Keyword')) {
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

$settings = [ordered]@{
    keyword = $Keyword
    location = $Location
    period = $Period
    pages = $Pages
    updatedAt = (Get-Date).ToString('o')
}

$settings | ConvertTo-Json -Depth 5 | Set-Content $settingsPath -Encoding UTF8

Write-Host "`n✅ Configuration saved!" -ForegroundColor Green
Write-Host "`nYour Settings:" -ForegroundColor Cyan
Write-Host "  Keyword: $Keyword" -ForegroundColor White
Write-Host "  Location: $Location" -ForegroundColor White
Write-Host "  Period: $Period" -ForegroundColor White
Write-Host "  Pages: $Pages" -ForegroundColor White

Write-Host "`nTo start the bot, run:" -ForegroundColor Yellow
Write-Host "  .\automation\run-linkedin-bot.ps1" -ForegroundColor White

Write-Host "`n⚠️  Important Reminders:" -ForegroundColor Red
Write-Host "  • This may violate LinkedIn ToS - use at your own risk" -ForegroundColor Yellow
Write-Host "  • Credentials are no longer written to config files" -ForegroundColor Yellow
Write-Host "  • The bot runs in visible mode - you can watch it work" -ForegroundColor Yellow
Write-Host "  • May require manual intervention for CAPTCHAs" -ForegroundColor Yellow
Write-Host "  • Start with few pages (3-5) to test" -ForegroundColor Yellow
Write-Host ""
