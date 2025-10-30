# Add uaecodes.com Domain to Azure Static Web Apps
# Quick script to add custom domain

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Add uaecodes.com Domain to Azure" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$staticWebAppName = "cv-portfolio"
$resourceGroupName = "cv-portfolio-rg"
$domain = "uaecodes.com"

# Check if Azure CLI is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$azInstalled = Get-Command az -ErrorAction SilentlyContinue

if (-not $azInstalled) {
  Write-Host "✗ Azure CLI not installed!" -ForegroundColor Red
  Write-Host ""
  Write-Host "Please install Azure CLI first:" -ForegroundColor Yellow
  Write-Host "  Download from: https://aka.ms/installazurecliwindows" -ForegroundColor White
  Write-Host ""
  Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor White
  Write-Host ""
  pause
  exit
}

Write-Host "✓ Azure CLI found" -ForegroundColor Green
Write-Host ""

# Check Azure login
Write-Host "Checking Azure login..." -NoNewline
az account show 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host " Not logged in" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Logging into Azure..." -ForegroundColor Cyan
  az login
  if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Login failed" -ForegroundColor Red
    pause
    exit
  }
}
Write-Host " ✓ Logged in" -ForegroundColor Green
Write-Host ""

# Display current subscription
Write-Host "Current subscription:" -ForegroundColor Cyan
az account show --query "{Name:name, ID:id}" --output table
Write-Host ""

# Add www subdomain (CNAME method - recommended)
Write-Host "Step 1: Adding www.$domain" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Adding subdomain to Static Web App..." -NoNewline
$wwwDomain = "www.$domain"
$result = az staticwebapp hostname set --name $staticWebAppName --resource-group $resourceGroupName --hostname $wwwDomain --no-wait 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host " ✓ Added" -ForegroundColor Green
}
else {
  if ($result -match "already exists") {
    Write-Host " ✓ Already configured" -ForegroundColor Green
  }
  else {
    Write-Host " ✗ Failed" -ForegroundColor Red
    Write-Host "Error: $result" -ForegroundColor Gray
    Write-Host ""
  }
}

Write-Host ""

# DNS Configuration Instructions
Write-Host "Step 2: Configure DNS Records" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Add these DNS records at your domain registrar:" -ForegroundColor Cyan
Write-Host ""
Write-Host "For www.$domain (CNAME):" -ForegroundColor White
Write-Host "  Type:  CNAME" -ForegroundColor Gray
Write-Host "  Name:  www" -ForegroundColor Gray
Write-Host "  Value: polite-pebble-0d82e8010.3.azurestaticapps.net" -ForegroundColor Yellow
Write-Host "  TTL:   3600" -ForegroundColor Gray
Write-Host ""

# Apex domain setup
Write-Host "Step 3: Add Apex Domain (uaecodes.com)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Apex domain requires validation via Azure Portal" -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps to add $domain (apex):" -ForegroundColor Cyan
Write-Host "1. Go to Azure Portal > Your Static Web App > Custom Domains" -ForegroundColor White
Write-Host "2. Click '+ Add'" -ForegroundColor White
Write-Host "3. Enter: $domain" -ForegroundColor White
Write-Host "4. Select 'TXT' validation method" -ForegroundColor White
Write-Host "5. Copy the TXT record value shown" -ForegroundColor White
Write-Host "6. Add TXT record at your registrar:" -ForegroundColor White
Write-Host ""
Write-Host "   Type:  TXT" -ForegroundColor Gray
Write-Host "   Name:  @ (or leave blank for apex)" -ForegroundColor Gray
Write-Host "   Value: [Copy from Azure Portal]" -ForegroundColor Yellow
Write-Host "   TTL:   3600" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Also add an A record for apex:" -ForegroundColor White
Write-Host ""
Write-Host "   Type:  A" -ForegroundColor Gray
Write-Host "   Name:  @ (or leave blank for apex)" -ForegroundColor Gray
Write-Host "   Value: [IP from Azure Portal]" -ForegroundColor Yellow
Write-Host "   TTL:   3600" -ForegroundColor Gray
Write-Host ""
Write-Host "8. Return to Portal and click 'Validate and add'" -ForegroundColor White
Write-Host ""

# SSL Certificate Info
Write-Host "Step 4: SSL Certificate" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ Azure automatically provisions free SSL certificates" -ForegroundColor Green
Write-Host "  This takes 5-10 minutes after domain validation" -ForegroundColor White
Write-Host ""

# Show current configured domains
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Current Configured Domains" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$domains = az staticwebapp hostname list `
  --name $staticWebAppName `
  --resource-group $resourceGroupName `
  --output table 2>$null

if ($domains) {
  Write-Host $domains
  Write-Host ""
}
else {
  Write-Host "Unable to retrieve configured domains." -ForegroundColor Yellow
  Write-Host ""
}

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ www.$domain added to Azure Static Web App" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add CNAME record for www.$domain at your registrar" -ForegroundColor White
Write-Host "2. Open Azure Portal to add apex domain ($domain)" -ForegroundColor White
Write-Host "3. Add TXT and A records for validation" -ForegroundColor White
Write-Host "4. Wait 5-10 minutes for SSL certificate provisioning" -ForegroundColor White
Write-Host "5. Test: https://www.$domain and https://$domain" -ForegroundColor White
Write-Host ""

# Open Azure Portal option
$openPortal = Read-Host "Open Azure Portal to complete apex domain setup? (Y/n)"
if ($openPortal -ne "n" -and $openPortal -ne "N") {
  Write-Host ""
  Write-Host "Opening Azure Portal..." -ForegroundColor Cyan
  $portalUrl = "https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FStaticSites"
  Start-Process $portalUrl
}

Write-Host ""
Write-Host "DNS Record Summary for $domain" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Gray
Write-Host "www.$domain → polite-pebble-0d82e8010.3.azurestaticapps.net (CNAME)" -ForegroundColor White
Write-Host "$domain → [Validate in Portal] (TXT + A)" -ForegroundColor White
Write-Host ""

pause
