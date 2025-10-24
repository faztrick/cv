# LinkedIn Job Bot - Pre-Flight Check
# Run this before using the bot to verify everything is configured correctly

Write-Host "`n=== LinkedIn Job Application Bot - Pre-Flight Check ===" -ForegroundColor Cyan

# Check 1: Chrome Installation
Write-Host "`n[1/5] Checking Chrome installation..." -ForegroundColor Yellow
$chromePaths = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

$chromeFound = $false
foreach ($path in $chromePaths) {
  if (Test-Path $path) {
    Write-Host "  ✓ Chrome found at: $path" -ForegroundColor Green
    $chromeFound = $true
    $chromeExePath = $path
    break
  }
}

if (-not $chromeFound) {
  Write-Host "  ✗ Chrome not found! Please install Google Chrome." -ForegroundColor Red
  exit 1
}

# Check 2: Node.js and npm
Write-Host "`n[2/5] Checking Node.js..." -ForegroundColor Yellow
try {
  $nodeVersion = node --version
  Write-Host "  ✓ Node.js version: $nodeVersion" -ForegroundColor Green
}
catch {
  Write-Host "  ✗ Node.js not found! Please install Node.js." -ForegroundColor Red
  exit 1
}

# Check 3: Dependencies
Write-Host "`n[3/5] Checking npm packages..." -ForegroundColor Yellow
$repoPath = "E:\cv\automation\repos\linkedin-job-apply-automation"
if (Test-Path "$repoPath\node_modules") {
  Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

  # Check specific packages
  if (Test-Path "$repoPath\node_modules\puppeteer") {
    Write-Host "  ✓ Puppeteer installed" -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠ Puppeteer not found - run: npm install" -ForegroundColor Yellow
  }
}
else {
  Write-Host "  ✗ Dependencies not installed!" -ForegroundColor Red
  Write-Host "    Run: cd automation\repos\linkedin-job-apply-automation && npm install" -ForegroundColor Yellow
  exit 1
}

# Check 4: Configuration
Write-Host "`n[4/5] Checking configuration..." -ForegroundColor Yellow
$configPath = "$repoPath\config.json"
if (Test-Path $configPath) {
  $config = Get-Content $configPath | ConvertFrom-Json

  if ($config.email -eq "your-linkedin-email@example.com" -or $config.email -eq "your-email@example.com") {
    Write-Host "  ⚠ Email not configured in config.json" -ForegroundColor Yellow
    Write-Host "    Please update: email, password, and keyword" -ForegroundColor Yellow
  }
  else {
    Write-Host "  ✓ Email configured: $($config.email)" -ForegroundColor Green
  }

  Write-Host "  ℹ Job Keyword: $($config.keyword)" -ForegroundColor Cyan
  Write-Host "  ℹ Location: $($config.location)" -ForegroundColor Cyan
  Write-Host "  ℹ Period: $($config.Period)" -ForegroundColor Cyan
  Write-Host "  ℹ Pages to process: $($config.numberOfPagination)" -ForegroundColor Cyan

  # Update Chrome path if different
  if ($config.ChromePath -ne $chromeExePath) {
    Write-Host "  ⚠ Updating Chrome path in config.json..." -ForegroundColor Yellow
    $config.ChromePath = $chromeExePath
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    Write-Host "  ✓ Chrome path updated" -ForegroundColor Green
  }
}
else {
  Write-Host "  ✗ config.json not found!" -ForegroundColor Red
  exit 1
}

# Check 5: Quickstart Guide
Write-Host "`n[5/5] Documentation..." -ForegroundColor Yellow
if (Test-Path "$repoPath\QUICKSTART.md") {
  Write-Host "  ✓ Quickstart guide available" -ForegroundColor Green
}
else {
  Write-Host "  ⚠ Quickstart guide not found" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Pre-Flight Check Complete ===" -ForegroundColor Cyan
Write-Host "`n✅ System is ready to run the LinkedIn Job Bot!`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Edit config.json with your LinkedIn credentials" -ForegroundColor White
Write-Host "  2. Customize job search (keyword, location, etc.)" -ForegroundColor White
Write-Host "  3. Run: cd automation\repos\linkedin-job-apply-automation" -ForegroundColor White
Write-Host "  4. Run: node index.js" -ForegroundColor White

Write-Host "`n⚠️  WARNING: This may violate LinkedIn's Terms of Service!" -ForegroundColor Red
Write-Host "    Use at your own risk. Monitor the first few runs carefully.`n" -ForegroundColor Yellow

Write-Host "📚 Read QUICKSTART.md for detailed instructions`n" -ForegroundColor Cyan
