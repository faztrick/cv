# Quick Configuration Helper for Indeed Job Bot
param(
  [string]$JobTitle = "Full Stack Developer Flutter",
  [string]$Location = "Dubai",
  [ValidateSet("ae", "us", "uk", "fr", "de", "sa")]
  [string]$Country = "ae",
  [int]$StartPage = 0,
  [int]$EndPage = 100,
  [int]$PostedWithinDays = 14
)

$configPath = Join-Path $PSScriptRoot "repos\indeed_bot\config.yaml"

Write-Host "`n=== Indeed Job Bot - Quick Configuration ===" -ForegroundColor Cyan

# If no parameters provided, prompt interactively
if (-not $PSBoundParameters.ContainsKey('JobTitle')) {
  Write-Host "`nEnter your job search preferences:" -ForegroundColor Yellow

  $titleInput = Read-Host "Job Title (default: Full Stack Developer Flutter)"
  if ($titleInput) { $JobTitle = $titleInput }

  $locationInput = Read-Host "Location (default: Dubai)"
  if ($locationInput) { $Location = $locationInput }

  Write-Host "`nCountry Options:"
  Write-Host "  ae - United Arab Emirates (indeed.ae)"
  Write-Host "  sa - Saudi Arabia (indeed.sa)"
  Write-Host "  us - United States (indeed.com)"
  Write-Host "  uk - United Kingdom (indeed.co.uk)"
  Write-Host "  fr - France (indeed.fr)"
  Write-Host "  de - Germany (indeed.de)"
  $countryInput = Read-Host "Country code (default: ae)"
  if ($countryInput) { $Country = $countryInput.ToLower() }

  $endInput = Read-Host "Jobs to process (default: 100)"
  if ($endInput) { $EndPage = [int]$endInput }

  $daysInput = Read-Host "Posted within how many days? (default: 14)"
  if ($daysInput) { $PostedWithinDays = [int]$daysInput }
}

# Build Indeed URL based on country
$domainMap = @{
  "ae" = "ae.indeed.com"
  "sa" = "sa.indeed.com"
  "us" = "www.indeed.com"
  "uk" = "uk.indeed.com"
  "fr" = "fr.indeed.com"
  "de" = "de.indeed.com"
}

$domain = $domainMap[$Country]
$encodedJob = [System.Web.HttpUtility]::UrlEncode($JobTitle)
$encodedLocation = [System.Web.HttpUtility]::UrlEncode($Location)
$baseUrl = "https://$domain/jobs?q=$encodedJob&l=$encodedLocation&fromage=$PostedWithinDays"

# Create config content
$configContent = @"
# Indeed Auto-Apply Bot Configuration
# Edit these fields to customize your job search and application process

search:
  base_url: "$baseUrl"

  start: $StartPage
  end: $EndPage # Number of jobs to process (multiples of 10)

camoufox:
  user_data_dir: "user_data_dir"
  language: "$Country" # Country code: ae, uk, us, fr, de, sa, etc.
"@

# Save config
$configContent | Set-Content $configPath -Encoding UTF8

Write-Host "`n✅ Configuration saved!" -ForegroundColor Green
Write-Host "`nYour Settings:" -ForegroundColor Cyan
Write-Host "  Job Title: $JobTitle" -ForegroundColor White
Write-Host "  Location: $Location" -ForegroundColor White
Write-Host "  Country: $Country ($domain)" -ForegroundColor White
Write-Host "  Pages: $StartPage to $EndPage" -ForegroundColor White
Write-Host "  Posted within: $PostedWithinDays days" -ForegroundColor White
Write-Host "`n  Search URL:" -ForegroundColor Cyan
Write-Host "  $baseUrl" -ForegroundColor Gray

Write-Host "`n⚙️  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Install dependencies:" -ForegroundColor White
Write-Host "     cd automation\repos\indeed_bot" -ForegroundColor Gray
Write-Host "     pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "`n  2. Upload CV to Indeed.ae and fill profile" -ForegroundColor White
Write-Host "`n  3. Run bot (first time - manual login):" -ForegroundColor White
Write-Host "     python indeed_bot.py" -ForegroundColor Gray
Write-Host "`n  4. Login manually when browser opens, then restart bot" -ForegroundColor White

Write-Host "`n⚠️  Important Notes:" -ForegroundColor Red
Write-Host "  • Only works with 'Indeed Apply' / 'Candidature simplifiée' jobs" -ForegroundColor Yellow
Write-Host "  • CV must be uploaded to Indeed beforehand" -ForegroundColor Yellow
Write-Host "  • Profile (name, phone, address) must be complete" -ForegroundColor Yellow
Write-Host "  • Uses Camoufox to bypass bot detection" -ForegroundColor Yellow
Write-Host "  • May violate Indeed Terms of Service" -ForegroundColor Yellow
Write-Host ""

# Verify Python installation
Write-Host "`n🔍 Checking Python..." -ForegroundColor Yellow
try {
  $pythonVersion = python --version 2>&1
  Write-Host "  ✓ $pythonVersion" -ForegroundColor Green
}
catch {
  Write-Host "  ✗ Python not found! Install Python 3.8+ first" -ForegroundColor Red
}

Write-Host ""
