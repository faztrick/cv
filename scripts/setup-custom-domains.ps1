# Custom Domain Setup Script for Azure Static Web Apps
# Configures multiple custom domains: uaecodes.com, bookznow.com, faztrick.com, fzbiz.com

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Azure Static Web Apps - Custom Domain Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$staticWebAppName = "cv-portfolio"
$resourceGroupName = "cv-portfolio-rg"
$domains = @(
  "uaecodes.com",
  "bookznow.com",
  "faztrick.com",
  "fzbiz.com"
)

Write-Host "Domains to configure:" -ForegroundColor Cyan
foreach ($domain in $domains) {
  Write-Host "  - $domain" -ForegroundColor White
  Write-Host "  - www.$domain" -ForegroundColor White
}
Write-Host ""

# Get Static Web App default hostname
Write-Host "Getting Static Web App details..." -ForegroundColor Yellow
$defaultHostname = az staticwebapp show `
  --name $staticWebAppName `
  --resource-group $resourceGroupName `
  --query "defaultHostname" `
  --output tsv

Write-Host "✓ Default URL: https://$defaultHostname" -ForegroundColor Green
Write-Host ""

# Choose DNS setup method
Write-Host "DNS Setup Options:" -ForegroundColor Cyan
Write-Host "1. Azure DNS (Recommended - Automatic setup)" -ForegroundColor White
Write-Host "2. External DNS (GoDaddy, Namecheap, etc. - Manual setup)" -ForegroundColor White
Write-Host ""

$dnsChoice = Read-Host "Choose option (1 or 2)"

if ($dnsChoice -eq "1") {
  # Azure DNS Setup
  Write-Host ""
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host "  Azure DNS Setup" -ForegroundColor Cyan
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host ""

  foreach ($domain in $domains) {
    Write-Host "Configuring $domain..." -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""

    # Create DNS Zone
    Write-Host "Creating DNS zone for $domain..." -NoNewline
    az network dns zone show --name $domain --resource-group $resourceGroupName 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
      az network dns zone create `
        --resource-group $resourceGroupName `
        --name $domain | Out-Null
      Write-Host " ✓ Created" -ForegroundColor Green
    }
    else {
      Write-Host " ✓ Already exists" -ForegroundColor Green
    }

    # Get name servers
    Write-Host "Name servers for $domain" ":" -ForegroundColor Cyan
    az network dns zone show `
      --resource-group $resourceGroupName `
      --name $domain `
      --query "nameServers" `
      --output table

    Write-Host ""
    Write-Host "⚠️  ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "Update your domain registrar with the above name servers" -ForegroundColor White
    Write-Host "This can take 24-72 hours to propagate" -ForegroundColor White
    Write-Host ""

    # Add apex domain
    Write-Host "Adding apex domain $domain to Static Web App..." -NoNewline
    az staticwebapp hostname set `
      --name $staticWebAppName `
      --resource-group $resourceGroupName `
      --hostname $domain 2>$null | Out-Null

    if ($LASTEXITCODE -eq 0) {
      Write-Host " ✓ Added" -ForegroundColor Green
    }
    else {
      Write-Host " (may already exist)" -ForegroundColor Yellow
    }

    # Add www subdomain
    Write-Host "Adding www.$domain to Static Web App..." -NoNewline
    az staticwebapp hostname set `
      --name $staticWebAppName `
      --resource-group $resourceGroupName `
      --hostname "www.$domain" 2>$null | Out-Null

    if ($LASTEXITCODE -eq 0) {
      Write-Host " ✓ Added" -ForegroundColor Green
    }
    else {
      Write-Host " (may already exist)" -ForegroundColor Yellow
    }

    # Create CNAME for www
    Write-Host "Creating CNAME record for www.$domain..." -NoNewline
    az network dns record-set cname set-record `
      --resource-group $resourceGroupName `
      --zone-name $domain `
      --record-set-name www `
      --cname $defaultHostname 2>$null | Out-Null

    if ($LASTEXITCODE -eq 0) {
      Write-Host " ✓ Created" -ForegroundColor Green
    }
    else {
      Write-Host " (may already exist)" -ForegroundColor Yellow
    }

    Write-Host ""
  }

}
else {
  # External DNS Setup - Show instructions
  Write-Host ""
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host "  External DNS Setup Instructions" -ForegroundColor Cyan
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host ""

  foreach ($domain in $domains) {
    Write-Host "Domain: $domain" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""

    # Add domains to Static Web App
    Write-Host "Adding $domain to Static Web App..." -NoNewline
    az staticwebapp hostname set `
      --name $staticWebAppName `
      --resource-group $resourceGroupName `
      --hostname $domain 2>$null | Out-Null
    Write-Host " ✓" -ForegroundColor Green

    Write-Host "Adding www.$domain to Static Web App..." -NoNewline
    az staticwebapp hostname set `
      --name $staticWebAppName `
      --resource-group $resourceGroupName `
      --hostname "www.$domain" 2>$null | Out-Null
    Write-Host " ✓" -ForegroundColor Green

    Write-Host ""
    Write-Host "DNS Records to add at your registrar:" -ForegroundColor Cyan
    Write-Host ""

    # TXT record for validation
    Write-Host "1. TXT Record (for validation):" -ForegroundColor White
    Write-Host "   Type: TXT" -ForegroundColor Gray
    Write-Host "   Name: _dnsauth" -ForegroundColor Gray
    Write-Host "   Value: [Get from Azure Portal > Custom Domains]" -ForegroundColor Gray
    Write-Host "   TTL: 3600" -ForegroundColor Gray
    Write-Host ""

    # A record for apex
    Write-Host "2. A Record (for $domain)" ":" -ForegroundColor White
    Write-Host "   Type: A" -ForegroundColor Gray
    Write-Host "   Name: @ (or leave blank)" -ForegroundColor Gray
    Write-Host "   Value: [Get from Azure Portal > Custom Domains]" -ForegroundColor Gray
    Write-Host "   TTL: 3600" -ForegroundColor Gray
    Write-Host ""

    # CNAME for www
    Write-Host "3. CNAME Record (for www.$domain)" ":" -ForegroundColor White
    Write-Host "   Type: CNAME" -ForegroundColor Gray
    Write-Host "   Name: www" -ForegroundColor Gray
    Write-Host "   Value: $defaultHostname" -ForegroundColor Gray
    Write-Host "   TTL: 3600" -ForegroundColor Gray
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
  }

  Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
  Write-Host "1. Add the DNS records above at your domain registrar" -ForegroundColor White
  Write-Host "2. Go to Azure Portal > Static Web Apps > Custom Domains" -ForegroundColor White
  Write-Host "3. Validate each domain (provides TXT and A record values)" -ForegroundColor White
  Write-Host "4. DNS propagation can take up to 48 hours" -ForegroundColor White
  Write-Host ""
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Domain Setup Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configured domains:" -ForegroundColor Green
foreach ($domain in $domains) {
  Write-Host "  ✓ $domain" -ForegroundColor White
  Write-Host "  ✓ www.$domain" -ForegroundColor White
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update name servers at your registrar (if using Azure DNS)" -ForegroundColor White
Write-Host "2. Wait for DNS propagation (24-72 hours)" -ForegroundColor White
Write-Host "3. Verify domains in Azure Portal" -ForegroundColor White
Write-Host "4. SSL certificates will be automatically provisioned" -ForegroundColor White
Write-Host ""

Write-Host "Check DNS propagation:" -ForegroundColor Cyan
Write-Host "  nslookup uaecodes.com" -ForegroundColor Gray
Write-Host "  nslookup bookznow.com" -ForegroundColor Gray
Write-Host "  nslookup faztrick.com" -ForegroundColor Gray
Write-Host "  nslookup fzbiz.com" -ForegroundColor Gray
Write-Host ""

$openPortal = Read-Host "Open Azure Portal to view custom domains? (Y/n)"
if ($openPortal -ne "n" -and $openPortal -ne "N") {
  $portalUrl = "https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$resourceGroupName/providers/Microsoft.Web/staticSites/$staticWebAppName/customDomains"
  Start-Process $portalUrl
}

Write-Host ""
pause
