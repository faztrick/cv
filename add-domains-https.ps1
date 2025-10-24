# Add Custom Domains with HTTPS to Azure Static Web Apps
# Automated script for faztrick.com, fzbiz.com, bookznow.com

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Add Custom Domains with HTTPS/SSL" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$staticWebAppName = "cv-portfolio"
$resourceGroupName = "cv-portfolio-rg"
$defaultHostname = "polite-pebble-0d82e8010.3.azurestaticapps.net"

# Check DNS propagation first
Write-Host "Step 1: Checking DNS Propagation" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

$domains = @("faztrick.com", "fzbiz.com", "bookznow.com")
$readyDomains = @()

foreach ($domain in $domains) {
  Write-Host "Checking $domain..." -NoNewline
  $ns = nslookup -type=NS $domain 8.8.8.8 2>$null | Select-String "azure-dns"
  if ($ns) {
    Write-Host " ✓ Azure DNS active" -ForegroundColor Green
    $readyDomains += $domain
  }
  else {
    Write-Host " ⏳ Waiting for DNS propagation" -ForegroundColor Yellow
  }
}

Write-Host ""

if ($readyDomains.Count -eq 0) {
  Write-Host "⚠️  No domains are ready yet" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Please update name servers at your registrar first." -ForegroundColor White
  Write-Host "See NAME-SERVERS.md for details." -ForegroundColor White
  Write-Host ""
  pause
  exit
}

Write-Host "Ready domains: $($readyDomains -join ', ')" -ForegroundColor Cyan
Write-Host ""

# Add domains to Static Web App
Write-Host "Step 2: Adding Domains to Static Web App" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

foreach ($domain in $readyDomains) {
  Write-Host "Configuring $domain..." -ForegroundColor Yellow
  Write-Host ""

  # For www subdomain (uses CNAME - easier)
  Write-Host "  Adding www.$domain..." -NoNewline
  $result = az staticwebapp hostname set `
    --name $staticWebAppName `
    --resource-group $resourceGroupName `
    --hostname "www.$domain" `
    --no-wait 2>&1

  if ($LASTEXITCODE -eq 0) {
    Write-Host " ✓" -ForegroundColor Green
  }
  else {
    if ($result -match "already exists") {
      Write-Host " ✓ (already added)" -ForegroundColor Green
    }
    else {
      Write-Host " ✗" -ForegroundColor Red
      Write-Host "    Error: $result" -ForegroundColor Gray
    }
  }

  Write-Host ""
}

Write-Host ""
Write-Host "Step 3: HTTPS/SSL Certificate Provisioning" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Azure is automatically provisioning free SSL certificates..." -ForegroundColor Cyan
Write-Host "This process takes 5-10 minutes." -ForegroundColor White
Write-Host ""

# For apex domains, we need to use Azure Portal for validation
Write-Host "Step 4: Apex Domain Setup (Manual)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Apex domains require validation in Azure Portal" -ForegroundColor Yellow
Write-Host ""

foreach ($domain in $readyDomains) {
  Write-Host "For $domain (apex domain):" -ForegroundColor Cyan
  Write-Host "1. Go to Azure Portal > Custom Domains" -ForegroundColor White
  Write-Host "2. Click '+ Add'" -ForegroundColor White
  Write-Host "3. Enter: $domain" -ForegroundColor White
  Write-Host "4. Select 'TXT' validation method" -ForegroundColor White
  Write-Host "5. Copy the TXT record value" -ForegroundColor White
  Write-Host "6. Add TXT record with this command:" -ForegroundColor White
  Write-Host ""
  Write-Host "   az network dns record-set txt add-record ``" -ForegroundColor Gray
  Write-Host "     --resource-group $resourceGroupName ``" -ForegroundColor Gray
  Write-Host "     --zone-name $domain ``" -ForegroundColor Gray
  Write-Host "     --record-set-name `"@`" ``" -ForegroundColor Gray
  Write-Host "     --value `"PASTE-VALUE-FROM-PORTAL`"" -ForegroundColor Gray
  Write-Host ""
  Write-Host "7. Return to Portal and click 'Validate and add'" -ForegroundColor White
  Write-Host ""
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Current Status" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check current domains
Write-Host "Checking configured domains..." -ForegroundColor Cyan
$configuredDomains = az staticwebapp hostname list `
  --name $staticWebAppName `
  --resource-group $resourceGroupName `
  --query "[].{Domain:name, Status:status}" `
  --output table 2>$null

if ($configuredDomains) {
  Write-Host $configuredDomains
}
else {
  Write-Host "No domains configured yet." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Complete apex domain validation in Azure Portal" -ForegroundColor White
Write-Host "2. Wait 5-10 minutes for SSL certificates" -ForegroundColor White
Write-Host "3. Test HTTPS access to your domains" -ForegroundColor White
Write-Host ""

$openPortal = Read-Host "Open Azure Portal to add apex domains? (Y/n)"
if ($openPortal -ne "n" -and $openPortal -ne "N") {
  $portalUrl = "https://portal.azure.com/#@/resource/subscriptions/734a4dab-5e6f-4c2d-900d-e3577fce0291/resourceGroups/$resourceGroupName/providers/Microsoft.Web/staticSites/$staticWebAppName/customDomains"
  Start-Process $portalUrl
}

Write-Host ""
Write-Host "Test your domains after setup:" -ForegroundColor Cyan
foreach ($domain in $readyDomains) {
  Write-Host "  https://www.$domain" -ForegroundColor White
  Write-Host "  https://$domain" -ForegroundColor White
}
Write-Host ""

pause
