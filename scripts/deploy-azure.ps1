# Azure Static Web Apps - Interactive Deployment Script
# Deploys your portfolio to Azure with custom domain support

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Azure Static Web Apps - Deployment Wizard" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration variables
$resourceGroupName = "cv-portfolio-rg"
$staticWebAppName = "cv-portfolio"
$location = "centralus"
$publicFolder = "./public"

# Function to check if a command exists
function Test-Command {
  param($Command)
  $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Command "az")) {
  Write-Host "✗ Azure CLI not found!" -ForegroundColor Red
  Write-Host ""
  Write-Host "Please install Azure CLI first:" -ForegroundColor Yellow
  Write-Host "  Option 1: From repo root, run .\\scripts\\setup-azure.ps1 (as Administrator)" -ForegroundColor White
  Write-Host "            Or if you're already in the scripts folder, run .\\setup-azure.ps1" -ForegroundColor White
  Write-Host "  Option 2: Download from https://aka.ms/installazurecliwindows" -ForegroundColor White
  Write-Host ""
  pause
  exit
}

Write-Host "✓ Azure CLI found" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "Step 1: Azure Login" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Checking Azure login status..." -NoNewline
az account show 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host " Not logged in" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Opening browser for Azure login..." -ForegroundColor Cyan
  az login
  if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Login failed" -ForegroundColor Red
    pause
    exit
  }
}
else {
  Write-Host " ✓ Already logged in" -ForegroundColor Green
}

Write-Host ""
Write-Host "Current subscription:" -ForegroundColor Cyan
az account show --query "{Name:name, ID:id, State:state}" --output table
Write-Host ""

$changeSubscription = Read-Host "Do you want to change subscription? (y/N)"
if ($changeSubscription -eq "y" -or $changeSubscription -eq "Y") {
  Write-Host ""
  Write-Host "Available subscriptions:" -ForegroundColor Cyan
  az account list --query "[].{Name:name, ID:id, State:state}" --output table
  Write-Host ""
  $subscriptionId = Read-Host "Enter subscription ID"
  az account set --subscription $subscriptionId
  Write-Host "✓ Subscription changed" -ForegroundColor Green
}

Write-Host ""

# Create Resource Group
Write-Host "Step 2: Create Resource Group" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Checking if resource group exists..." -NoNewline
$rgExists = az group exists --name $resourceGroupName
if ($rgExists -eq "true") {
  Write-Host " ✓ Already exists" -ForegroundColor Green
}
else {
  Write-Host " Creating..." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Resource Group: $resourceGroupName" -ForegroundColor White
  Write-Host "Location: $location" -ForegroundColor White
  Write-Host ""

  az group create --name $resourceGroupName --location $location --query "properties.provisioningState" --output tsv
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Resource group created successfully!" -ForegroundColor Green
  }
  else {
    Write-Host "✗ Failed to create resource group" -ForegroundColor Red
    pause
    exit
  }
}

Write-Host ""

# Register Microsoft.Web provider
Write-Host "Step 3: Register Azure Providers" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Registering Microsoft.Web provider..." -NoNewline
$providerState = az provider show --namespace Microsoft.Web --query "registrationState" --output tsv 2>$null
if ($providerState -ne "Registered") {
  Write-Host " Registering..." -ForegroundColor Yellow
  az provider register --namespace Microsoft.Web --wait
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Microsoft.Web provider registered" -ForegroundColor Green
  }
  else {
    Write-Host "⚠️  Provider registration initiated (may take 1-2 minutes)" -ForegroundColor Yellow
  }
}
else {
  Write-Host " ✓ Already registered" -ForegroundColor Green
}

Write-Host ""

# Create Static Web App
Write-Host "Step 4: Create Static Web App" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Checking if Static Web App exists..." -NoNewline
az staticwebapp show --name $staticWebAppName --resource-group $resourceGroupName 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Host " ✓ Already exists" -ForegroundColor Green
  $swaUrl = az staticwebapp show --name $staticWebAppName --resource-group $resourceGroupName --query "defaultHostname" --output tsv
  Write-Host "URL: https://$swaUrl" -ForegroundColor Cyan
}
else {
  Write-Host " Creating..." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Static Web App: $staticWebAppName" -ForegroundColor White
  Write-Host "Resource Group: $resourceGroupName" -ForegroundColor White
  Write-Host ""

  $swaUrl = az staticwebapp create --name $staticWebAppName --resource-group $resourceGroupName --location $location --query "defaultHostname" --output tsv
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Static Web App created successfully!" -ForegroundColor Green
    Write-Host "URL: https://$swaUrl" -ForegroundColor Cyan
  }
  else {
    Write-Host "✗ Failed to create Static Web App" -ForegroundColor Red
    pause
    exit
  }
}

Write-Host ""

# Deploy with SWA CLI
Write-Host "Step 5: Deploy Application" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

if (Test-Command "swa") {
  Write-Host "Getting deployment token..." -ForegroundColor Cyan
  $deploymentToken = az staticwebapp secrets list --name $staticWebAppName --resource-group $resourceGroupName --query "properties.apiKey" --output tsv

  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Deployment token retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deploying to Azure..." -ForegroundColor Cyan
    Write-Host "Source: $publicFolder" -ForegroundColor White
    Write-Host ""

    swa deploy $publicFolder --deployment-token $deploymentToken

    if ($LASTEXITCODE -eq 0) {
      Write-Host ""
      Write-Host "✓ Deployment successful!" -ForegroundColor Green
    }
    else {
      Write-Host ""
      Write-Host "⚠️  Deployment encountered issues" -ForegroundColor Yellow
    }
  }
  else {
    Write-Host "✗ Failed to get deployment token" -ForegroundColor Red
  }
}
else {
  Write-Host "⚠️  SWA CLI not found" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Install SWA CLI with: npm install -g @azure/static-web-apps-cli" -ForegroundColor White
  Write-Host "Then run this script again." -ForegroundColor White
  Write-Host ""
  Write-Host "Alternative: Set up GitHub Actions for automatic deployment" -ForegroundColor Cyan
  Write-Host "See docs/AZURE-DEPLOYMENT.md for instructions" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resource Group: $resourceGroupName" -ForegroundColor White
Write-Host "Static Web App: $staticWebAppName" -ForegroundColor White
Write-Host "URL: https://$swaUrl" -ForegroundColor Cyan
Write-Host ""

$openBrowser = Read-Host "Open portfolio in browser? (Y/n)"
if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
  Start-Process "https://$swaUrl"
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. View your portfolio at: https://$swaUrl" -ForegroundColor White
Write-Host "2. Set up custom domain (see docs/AZURE-DEPLOYMENT.md)" -ForegroundColor White
Write-Host "3. Configure GitHub Actions for auto-deployment (optional)" -ForegroundColor White
Write-Host ""

pause
