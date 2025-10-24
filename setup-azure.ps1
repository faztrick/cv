# Azure Static Web Apps Deployment Setup Script
# This script helps you install required tools and deploy your portfolio

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Azure Static Web Apps - Setup & Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Host "⚠️  This script requires Administrator privileges to install Azure CLI" -ForegroundColor Yellow
  Write-Host "   Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "   Alternative: Install manually from https://aka.ms/installazurecliwindows" -ForegroundColor White
  Write-Host ""
  pause
  exit
}

# Function to check if a command exists
function Test-Command {
  param($Command)
  $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Green
Write-Host ""

# Check Azure CLI
Write-Host "Checking Azure CLI..." -NoNewline
if (Test-Command "az") {
  Write-Host " ✓ Installed" -ForegroundColor Green
  az --version | Select-String "azure-cli"
}
else {
  Write-Host " ✗ Not installed" -ForegroundColor Red
  Write-Host ""
  Write-Host "Installing Azure CLI..." -ForegroundColor Yellow

  # Download and install Azure CLI
  $ProgressPreference = 'SilentlyContinue'
  Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
  Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'
  Remove-Item .\AzureCLI.msi

  # Refresh environment variables
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

  Write-Host "✓ Azure CLI installed successfully!" -ForegroundColor Green
}

Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
if (Test-Command "node") {
  Write-Host " ✓ Installed" -ForegroundColor Green
  $nodeVersion = node --version
  Write-Host "  Version: $nodeVersion" -ForegroundColor Gray
}
else {
  Write-Host " ✗ Not installed" -ForegroundColor Red
  Write-Host ""
  Write-Host "⚠️  Node.js is required for SWA CLI deployment" -ForegroundColor Yellow
  Write-Host "   Please install from: https://nodejs.org/" -ForegroundColor White
  Write-Host ""
}

Write-Host ""
Write-Host "Step 2: Installing SWA CLI..." -ForegroundColor Green
Write-Host ""

if (Test-Command "node") {
  npm install -g @azure/static-web-apps-cli
  Write-Host "✓ SWA CLI installed successfully!" -ForegroundColor Green
}
else {
  Write-Host "⚠️  Skipping SWA CLI installation (Node.js not found)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Close and reopen PowerShell (to refresh environment variables)" -ForegroundColor White
Write-Host "2. Run: .\deploy-azure.ps1" -ForegroundColor White
Write-Host "3. Follow the prompts to deploy your portfolio" -ForegroundColor White
Write-Host ""

pause
