#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy Image Server to Azure App Service
.DESCRIPTION
    Creates Azure resources and deploys the Node.js image server with custom domain support
#>

param(
  [string]$AppName = "image-server-$(Get-Random -Maximum 9999)",
  [string]$ResourceGroup = "image-server-rg",
  [string]$Location = "centralus",
  [string]$CustomDomain = "faztrick.com"
)

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Azure Image Server Deployment" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

# Check if logged in to Azure
Write-Host "`nStep 1: Checking Azure login..." -ForegroundColor Cyan
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
  Write-Host "Not logged in. Opening Azure login..." -ForegroundColor Yellow
  az login
  $account = az account show | ConvertFrom-Json
}

Write-Host "✓ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "  Subscription: $($account.name)" -ForegroundColor Gray

# Select subscription if multiple available
$subscriptions = az account list --query "[].{Name:name, Id:id, IsDefault:isDefault}" -o json | ConvertFrom-Json
if ($subscriptions.Count -gt 1) {
  Write-Host "`nAvailable subscriptions:" -ForegroundColor Cyan
  for ($i = 0; $i -lt $subscriptions.Count; $i++) {
    $default = if ($subscriptions[$i].IsDefault) { " (current)" } else { "" }
    Write-Host "  $($i + 1). $($subscriptions[$i].Name)$default" -ForegroundColor White
  }

  $selection = Read-Host "`nSelect subscription (1-$($subscriptions.Count)) or press Enter to use current"
  if ($selection) {
    $selectedSub = $subscriptions[$selection - 1]
    az account set --subscription $selectedSub.Id
    Write-Host "✓ Using subscription: $($selectedSub.Name)" -ForegroundColor Green
  }
}

# Create Resource Group
Write-Host "`nStep 2: Creating resource group..." -ForegroundColor Cyan
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "true") {
  Write-Host "✓ Resource group '$ResourceGroup' already exists" -ForegroundColor Green
}
else {
  az group create --name $ResourceGroup --location $Location --output none
  Write-Host "✓ Created resource group: $ResourceGroup" -ForegroundColor Green
}

# Register providers
Write-Host "`nStep 3: Registering Azure providers..." -ForegroundColor Cyan
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.Storage --wait
Write-Host "✓ Providers registered" -ForegroundColor Green

# Create App Service Plan
Write-Host "`nStep 4: Creating App Service Plan..." -ForegroundColor Cyan
$planName = "$AppName-plan"
$planExists = az appservice plan show --name $planName --resource-group $ResourceGroup 2>$null

if ($planExists) {
  Write-Host "✓ App Service Plan already exists" -ForegroundColor Green
}
else {
  Write-Host "Creating App Service Plan (B1 - Basic)..." -ForegroundColor White
  az appservice plan create `
    --name $planName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku B1 `
    --is-linux `
    --output none

  Write-Host "✓ App Service Plan created: $planName" -ForegroundColor Green
}

# Create Web App
Write-Host "`nStep 5: Creating Web App..." -ForegroundColor Cyan
$webAppExists = az webapp show --name $AppName --resource-group $ResourceGroup 2>$null

if ($webAppExists) {
  Write-Host "✓ Web App already exists" -ForegroundColor Green
}
else {
  Write-Host "Creating Web App with Node.js 20..." -ForegroundColor White
  az webapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --plan $planName `
    --runtime "NODE:20-lts" `
    --output none

  Write-Host "✓ Web App created: $AppName" -ForegroundColor Green
}

# Configure App Settings
Write-Host "`nStep 6: Configuring application settings..." -ForegroundColor Cyan
az webapp config appsettings set `
  --name $AppName `
  --resource-group $ResourceGroup `
  --settings `
  NODE_ENV=production `
  APP_DOMAIN=$CustomDomain `
  MAX_FILE_SIZE=30mb `
  WEBSITE_NODE_DEFAULT_VERSION=~20 `
  SCM_DO_BUILD_DURING_DEPLOYMENT=true `
  --output none

Write-Host "✓ Application settings configured" -ForegroundColor Green

# Enable HTTPS Only
Write-Host "`nStep 7: Enabling HTTPS only..." -ForegroundColor Cyan
az webapp update `
  --name $AppName `
  --resource-group $ResourceGroup `
  --set httpsOnly=true `
  --output none

Write-Host "✓ HTTPS enforced" -ForegroundColor Green

# Deploy application
Write-Host "`nStep 8: Deploying application..." -ForegroundColor Cyan
Write-Host "Zipping application files..." -ForegroundColor White

$zipPath = ".\deploy.zip"
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

# Create deployment package (exclude node_modules, .env, etc.)
$files = @(
  "server.js",
  "package.json",
  "host.json",
  ".env.example"
)

Compress-Archive -Path $files -DestinationPath $zipPath -Force
Write-Host "✓ Application packaged" -ForegroundColor Green

Write-Host "Uploading to Azure..." -ForegroundColor White
az webapp deployment source config-zip `
  --name $AppName `
  --resource-group $ResourceGroup `
  --src $zipPath `
  --output none

Write-Host "✓ Application deployed" -ForegroundColor Green

# Get default hostname
$webAppDetails = az webapp show `
  --name $AppName `
  --resource-group $ResourceGroup `
  --query "{defaultHostName:defaultHostNames[0]}" `
  -o json | ConvertFrom-Json

$defaultUrl = "https://$($webAppDetails.defaultHostName)"

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "`nResource Group: $ResourceGroup" -ForegroundColor White
Write-Host "App Service: $AppName" -ForegroundColor White
Write-Host "Default URL: $defaultUrl" -ForegroundColor Cyan
Write-Host "Location: $Location" -ForegroundColor White

Write-Host "`nEndpoints:" -ForegroundColor Yellow
Write-Host "  Health Check: $defaultUrl/health" -ForegroundColor Cyan
Write-Host "  Gallery: $defaultUrl/showallimg" -ForegroundColor Cyan
Write-Host "  Upload API: $defaultUrl/v1/savebese64file" -ForegroundColor Cyan

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "`n1. Test the deployment:" -ForegroundColor White
Write-Host "   Invoke-WebRequest $defaultUrl/health" -ForegroundColor Gray

Write-Host "`n2. Add custom domain ($CustomDomain):" -ForegroundColor White
Write-Host "   Run: .\add-custom-domain.ps1" -ForegroundColor Gray

Write-Host "`n3. View logs:" -ForegroundColor White
Write-Host "   az webapp log tail --name $AppName --resource-group $ResourceGroup" -ForegroundColor Gray

Write-Host "`n4. Configure environment variables:" -ForegroundColor White
Write-Host "   az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings KEY=VALUE" -ForegroundColor Gray

Write-Host "`nOpen Azure Portal? (Y/n): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -ne "n" -and $response -ne "N") {
  $portalUrl = "https://portal.azure.com/#@/resource/subscriptions/$($account.id)/resourceGroups/$ResourceGroup/providers/Microsoft.Web/sites/$AppName/appServices"
  Start-Process $portalUrl
  Write-Host "✓ Azure Portal opened" -ForegroundColor Green
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================`n" -ForegroundColor Cyan

Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host
