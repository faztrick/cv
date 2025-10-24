# Indeed Job Bot - Pre-Flight Check
# Run this before using the bot to verify everything is configured correctly

Write-Host "`n=== Indeed Job Application Bot - Pre-Flight Check ===" -ForegroundColor Cyan

$repoPath = "E:\cv\automation\repos\indeed_bot"

# Check 1: Python Installation
Write-Host "`n[1/5] Checking Python installation..." -ForegroundColor Yellow
try {
  $pythonVersion = python --version 2>&1
  Write-Host "  ✓ Python installed: $pythonVersion" -ForegroundColor Green

  # Check Python version (needs 3.8+)
  if ($pythonVersion -match "Python (\d+)\.(\d+)") {
    $major = [int]$matches[1]
    $minor = [int]$matches[2]
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 8)) {
      Write-Host "  ⚠ Python 3.8+ required (you have $pythonVersion)" -ForegroundColor Yellow
    }
  }
}
catch {
  Write-Host "  ✗ Python not found! Please install Python 3.8+" -ForegroundColor Red
  exit 1
}

# Check 2: Indeed Bot Files
Write-Host "`n[2/5] Checking Indeed bot files..." -ForegroundColor Yellow
if (Test-Path $repoPath) {
  Write-Host "  ✓ Indeed bot folder found" -ForegroundColor Green

  if (Test-Path "$repoPath\indeed_bot.py") {
    Write-Host "  ✓ Main script found (indeed_bot.py)" -ForegroundColor Green
  }
  else {
    Write-Host "  ✗ indeed_bot.py not found!" -ForegroundColor Red
  }

  if (Test-Path "$repoPath\requirements.txt") {
    Write-Host "  ✓ Requirements file found" -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠ requirements.txt not found" -ForegroundColor Yellow
  }
}
else {
  Write-Host "  ✗ Indeed bot folder not found!" -ForegroundColor Red
  exit 1
}

# Check 3: Python Dependencies
Write-Host "`n[3/5] Checking Python packages..." -ForegroundColor Yellow
try {
  # Check for key packages
  $packages = python -c "import pkg_resources; print('\n'.join([f'{d.key}=={d.version}' for d in pkg_resources.working_set]))" 2>&1

  if ($packages -match "camoufox") {
    Write-Host "  ✓ Camoufox installed" -ForegroundColor Green
  }
  else {
    Write-Host "  ✗ Camoufox not installed" -ForegroundColor Red
    Write-Host "    Run: pip install -r requirements.txt" -ForegroundColor Yellow
  }

  if ($packages -match "pyyaml" -or $packages -match "PyYAML") {
    Write-Host "  ✓ PyYAML installed" -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠ PyYAML not installed" -ForegroundColor Yellow
    Write-Host "    Run: pip install -r requirements.txt" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "  ⚠ Could not check packages" -ForegroundColor Yellow
  Write-Host "    Run: pip install -r requirements.txt" -ForegroundColor Yellow
}

# Check 4: Configuration
Write-Host "`n[4/5] Checking configuration..." -ForegroundColor Yellow
$configPath = "$repoPath\config.yaml"
if (Test-Path $configPath) {
  Write-Host "  ✓ config.yaml found" -ForegroundColor Green

  $configContent = Get-Content $configPath -Raw

  if ($configContent -match 'base_url:\s*"([^"]+)"') {
    $url = $matches[1]
    Write-Host "  ℹ Search URL: $url" -ForegroundColor Cyan

    if ($url -match "ae\.indeed\.com") {
      Write-Host "  ✓ Configured for UAE (indeed.ae)" -ForegroundColor Green
    }
    elseif ($url -match "fr\.indeed\.com") {
      Write-Host "  ℹ Configured for France (indeed.fr)" -ForegroundColor Cyan
    }
  }

  if ($configContent -match 'language:\s*"([^"]+)"') {
    Write-Host "  ℹ Language: $($matches[1])" -ForegroundColor Cyan
  }

  if ($configContent -match 'end:\s*(\d+)') {
    Write-Host "  ℹ Jobs to process: $($matches[1])" -ForegroundColor Cyan
  }
}
else {
  Write-Host "  ✗ config.yaml not found!" -ForegroundColor Red
  exit 1
}

# Check 5: User Data Directory
Write-Host "`n[5/5] Checking browser profile..." -ForegroundColor Yellow
if (Test-Path "$repoPath\user_data_dir") {
  Write-Host "  ✓ User data directory exists (session will be saved)" -ForegroundColor Green
}
else {
  Write-Host "  ℹ User data directory will be created on first run" -ForegroundColor Cyan
}

# Summary
Write-Host "`n=== Pre-Flight Check Complete ===" -ForegroundColor Cyan

$configContent = Get-Content $configPath -Raw
if ($configContent -match 'base_url:\s*"https://fr\.indeed\.com' -or
  $configContent -match 'base_url:\s*"https://www\.indeed\.com') {
  Write-Host "`n⚠️  Configuration still has default values!" -ForegroundColor Yellow
  Write-Host "   Run: .\automation\configure-indeed-bot.ps1" -ForegroundColor White
}
else {
  Write-Host "`n✅ System ready for Indeed Job Bot!`n" -ForegroundColor Green
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Configure for your job search:" -ForegroundColor White
Write-Host "     .\automation\configure-indeed-bot.ps1" -ForegroundColor Gray
Write-Host "`n  2. Install dependencies:" -ForegroundColor White
Write-Host "     cd automation\repos\indeed_bot" -ForegroundColor Gray
Write-Host "     pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "`n  3. Upload CV to Indeed and complete profile" -ForegroundColor White
Write-Host "`n  4. Run bot (first time - manual login):" -ForegroundColor White
Write-Host "     python indeed_bot.py" -ForegroundColor Gray
Write-Host "`n  5. After login, restart bot to auto-apply" -ForegroundColor White

Write-Host "`n⚠️  WARNING: May violate Indeed's Terms of Service!" -ForegroundColor Red
Write-Host "    Use at your own risk. Start with small batches.`n" -ForegroundColor Yellow

Write-Host "📚 Read README.md in indeed_bot folder for details`n" -ForegroundColor Cyan
