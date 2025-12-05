Write-Host "⚠️  Closing all Chrome instances to unlock the profile..." -ForegroundColor Yellow
Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
  $chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

if (Test-Path $chromePath) {
  Write-Host "🚀 Launching Chrome in Debug Mode..." -ForegroundColor Green
  # We use the default User Data Dir so you have all your logins
  Start-Process -FilePath $chromePath -ArgumentList "--remote-debugging-port=9222", "--user-data-dir=$env:LOCALAPPDATA\Google\Chrome\User Data"

  Write-Host ""
  Write-Host "✅ Chrome Launched!" -ForegroundColor Green
  Write-Host "1. Log in to Indeed/LinkedIn in this new window." -ForegroundColor White
  Write-Host "2. Run the automation script with '--connect'" -ForegroundColor White
}
else {
  Write-Host "❌ Chrome executable not found." -ForegroundColor Red
}
