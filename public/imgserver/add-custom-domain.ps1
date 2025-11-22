#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Add custom domain to Azure App Service
.DESCRIPTION
    Configures custom domain (uaecodes.com) with HTTPS/SSL for the image server
#>

param(
  [Parameter(Mandatory = $false)]
  [string]$AppName,

  [Parameter(Mandatory = $false)]
  [string]$ResourceGroup = "image-server-rg",

  [Parameter(Mandatory = $false)]
  [string]$CustomDomain = "uaecodes.com"
)

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Add Custom Domain to Image Server" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

# Get App Service if not specified
if (-not $AppName) {
  Write-Host "`nFinding Web Apps in resource group..." -ForegroundColor Cyan
  $webApps = az webapp list --resource-group $ResourceGroup --query "[].name" -o json | ConvertFrom-Json

  if ($webApps.Count -eq 0) {
    Write-Host "✗ No web apps found in resource group: $ResourceGroup" -ForegroundColor Red
    exit 1
  }

  if ($webApps.Count -eq 1) {
    $AppName = $webApps[0]
    Write-Host "✓ Using web app: $AppName" -ForegroundColor Green
  }
  else {
    Write-Host "`nAvailable web apps:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $webApps.Count; $i++) {
      Write-Host "  $($i + 1). $($webApps[$i])" -ForegroundColor White
    }

    $selection = Read-Host "`nSelect web app (1-$($webApps.Count))"
    $AppName = $webApps[$selection - 1]
    Write-Host "✓ Selected: $AppName" -ForegroundColor Green
  }
}

# Get default hostname
Write-Host "`nStep 1: Getting Web App details..." -ForegroundColor Cyan
$webAppDetails = az webapp show `
  --name $AppName `
  --resource-group $ResourceGroup `
  --query "{defaultHostName:defaultHostNames[0], id:id}" `
  -o json | ConvertFrom-Json

$defaultHostname = $webAppDetails.defaultHostName
Write-Host "✓ Default hostname: $defaultHostname" -ForegroundColor Green

# Check DNS configuration
Write-Host "`nStep 2: Checking DNS configuration..." -ForegroundColor Cyan
Write-Host "Looking for CNAME or A record for $CustomDomain..." -ForegroundColor White

$dnsCheck = nslookup $CustomDomain 2>$null | Select-String "Address:"
if ($dnsCheck) {
  Write-Host "✓ DNS records found for $CustomDomain" -ForegroundColor Green
}
else {
  Write-Host "⚠ DNS not fully propagated yet" -ForegroundColor Yellow
}

# Get validation token
Write-Host "`nStep 3: Getting domain validation details..." -ForegroundColor Cyan
Write-Host "`nYou need to add DNS records for domain validation:" -ForegroundColor Yellow

Write-Host "`nFor apex domain ($CustomDomain):" -ForegroundColor White
Write-Host "1. TXT Record:" -ForegroundColor Cyan
Write-Host "   Name: asuid.$CustomDomain" -ForegroundColor Gray
Write-Host "   Value: " -ForegroundColor Gray -NoNewline

# Get custom verification ID
$verificationId = az webapp show `
  --name $AppName `
  --resource-group $ResourceGroup `
  --query "customDomainVerificationId" `
  -o tsv

Write-Host "$verificationId" -ForegroundColor Yellow

Write-Host "`n2. CNAME Record (alternative to A record):" -ForegroundColor Cyan
Write-Host "   Name: $CustomDomain" -ForegroundColor Gray
Write-Host "   Value: $defaultHostname" -ForegroundColor Yellow

Write-Host "`n   OR A Record:" -ForegroundColor Cyan
Write-Host "   Name: @" -ForegroundColor Gray
Write-Host "   Value: " -ForegroundColor Gray -NoNewline

# Get IP address
$ipAddress = az webapp show `
  --name $AppName `
  --resource-group $ResourceGroup `
  --query "outboundIpAddresses" `
  -o tsv | ForEach-Object { $_.Split(',')[0] }

Write-Host "$ipAddress" -ForegroundColor Yellow

# Add to Azure DNS if zone exists
Write-Host "`nStep 4: Checking Azure DNS zones..." -ForegroundColor Cyan
$dnsZoneExists = az network dns zone show `
  --name $CustomDomain `
  --resource-group cv-portfolio-rg `
  2>$null

if ($dnsZoneExists) {
  Write-Host "✓ Azure DNS zone found for $CustomDomain" -ForegroundColor Green

  Write-Host "`nAdding DNS records to Azure DNS..." -ForegroundColor Cyan

  # Add TXT record for verification
  Write-Host "Adding TXT record for verification..." -ForegroundColor White
  az network dns record-set txt add-record `
    --resource-group cv-portfolio-rg `
    --zone-name $CustomDomain `
    --record-set-name "asuid" `
    --value $verificationId `
    --output none

  Write-Host "✓ TXT record added" -ForegroundColor Green

  # Add CNAME record
  Write-Host "Adding CNAME record..." -ForegroundColor White

  # Check if apex domain
  $isApex = ($CustomDomain -notlike "www.*")

  if ($isApex) {
    # For apex domain, use ALIAS/ANAME or A record
    Write-Host "⚠ Apex domain detected. Using A record..." -ForegroundColor Yellow

    az network dns record-set a add-record `
      --resource-group cv-portfolio-rg `
      --zone-name $CustomDomain `
      --record-set-name "@" `
      --ipv4-address $ipAddress `
      --output none

    Write-Host "✓ A record added" -ForegroundColor Green
  }
  else {
    az network dns record-set cname set-record `
      --resource-group cv-portfolio-rg `
      --zone-name $CustomDomain `
      --record-set-name "@" `
      --cname $defaultHostname `
      --output none

    Write-Host "✓ CNAME record added" -ForegroundColor Green
  }

  Write-Host "`nWaiting for DNS propagation (30 seconds)..." -ForegroundColor Cyan
  Start-Sleep -Seconds 30
}
else {
  Write-Host "⚠ Azure DNS zone not found. Please add DNS records manually." -ForegroundColor Yellow
  Write-Host "`nPress Enter after adding DNS records..." -ForegroundColor Gray
  Read-Host
}

# Add custom domain to App Service
Write-Host "`nStep 5: Adding custom domain to App Service..." -ForegroundColor Cyan

try {
  az webapp config hostname add `
    --webapp-name $AppName `
    --resource-group $ResourceGroup `
    --hostname $CustomDomain `
    --output none

  Write-Host "✓ Custom domain added: $CustomDomain" -ForegroundColor Green
}
catch {
  Write-Host "✗ Failed to add custom domain. Check DNS records and try again." -ForegroundColor Red
  Write-Host "Error: $_" -ForegroundColor Red
  exit 1
}

# Configure SSL/TLS
Write-Host "`nStep 6: Configuring SSL certificate..." -ForegroundColor Cyan
Write-Host "Creating managed SSL certificate (free)..." -ForegroundColor White

try {
  az webapp config ssl create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --hostname $CustomDomain `
    --output none

  Write-Host "✓ SSL certificate created and bound" -ForegroundColor Green
}
catch {
  Write-Host "⚠ SSL certificate creation in progress. This may take 5-10 minutes." -ForegroundColor Yellow
}

# Bind SSL certificate
Write-Host "`nStep 7: Binding SSL certificate..." -ForegroundColor Cyan
Write-Host "SSL binding will complete automatically within 5-10 minutes." -ForegroundColor White

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Custom Domain Summary" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "`nCustom Domain: $CustomDomain" -ForegroundColor White
Write-Host "Status: Configured" -ForegroundColor Green
Write-Host "SSL: Provisioning (5-10 minutes)" -ForegroundColor Yellow

Write-Host "`nTest your domain:" -ForegroundColor White
Write-Host "  https://$CustomDomain/health" -ForegroundColor Cyan
Write-Host "  https://$CustomDomain/showallimg" -ForegroundColor Cyan

Write-Host "`nDNS Records Added:" -ForegroundColor White
Write-Host "  TXT asuid.$CustomDomain → $verificationId" -ForegroundColor Gray
if ($isApex) {
  Write-Host "  A @ → $ipAddress" -ForegroundColor Gray
}
else {
  Write-Host "  CNAME @ → $defaultHostname" -ForegroundColor Gray
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "==================================================`n" -ForegroundColor Cyan

Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host
