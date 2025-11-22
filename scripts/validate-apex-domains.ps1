#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Validate apex domains (uaecodes.com, faztrick.com, fzbiz.com) for Azure Static Web Apps with HTTPS
.DESCRIPTION
    This script helps add and validate apex domains using TXT records in Azure DNS
#>

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Apex Domain Validation for HTTPS" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

$resourceGroup = "cv-portfolio-rg"
$staticWebApp = "cv-portfolio"
$apexDomains = @("uaecodes.com", "faztrick.com", "fzbiz.com")

Write-Host "`nStep 1: Get Custom Domain Validation Token" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

foreach ($domain in $apexDomains) {
  Write-Host "Domain: $domain" -ForegroundColor Yellow
  Write-Host "----------------------------------------`n"

  # Get the default hostname
  $swaDetails = az staticwebapp show --name $staticWebApp --resource-group $resourceGroup --query "{url:defaultHostname}" -o json | ConvertFrom-Json
  $defaultHostname = $swaDetails.url

  Write-Host "Default hostname: $defaultHostname" -ForegroundColor White
  Write-Host "`n1. Go to Azure Portal:" -ForegroundColor White
  Write-Host "   https://portal.azure.com/#@/resource/subscriptions/734a4dab-5e6f-4c2d-900d-e3577fce0291/resourceGroups/$resourceGroup/providers/Microsoft.Web/staticSites/$staticWebApp/customDomains" -ForegroundColor Cyan

  Write-Host "`n2. Click '+ Add' button" -ForegroundColor White

  Write-Host "`n3. Enter domain: $domain" -ForegroundColor White

  Write-Host "`n4. Select validation method: 'TXT record (for apex domain)'" -ForegroundColor White

  Write-Host "`n5. Copy the validation token value shown" -ForegroundColor White

  Write-Host "`n6. Add TXT record in Azure DNS:" -ForegroundColor White
  Write-Host "   Run this command (replace TOKEN with value from Portal):`n" -ForegroundColor Cyan
  Write-Host "   az network dns record-set txt add-record ``" -ForegroundColor Yellow
  Write-Host "     --resource-group $resourceGroup ``" -ForegroundColor Yellow
  Write-Host "     --zone-name $domain ``" -ForegroundColor Yellow
  Write-Host "     --record-set-name '@' ``" -ForegroundColor Yellow
  Write-Host "     --value 'PASTE-TOKEN-HERE'" -ForegroundColor Yellow

  Write-Host "`n7. Wait 1-2 minutes for DNS propagation" -ForegroundColor White

  Write-Host "`n8. Return to Azure Portal and click 'Validate and add'`n" -ForegroundColor White

  Write-Host "========================================`n" -ForegroundColor Gray
}

Write-Host "`nStep 2: Alternative Method - Manual TXT Record" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

Write-Host "If you already have the validation token, run:" -ForegroundColor White
Write-Host "`nFor uaecodes.com:" -ForegroundColor Yellow
Write-Host "az network dns record-set txt add-record --resource-group $resourceGroup --zone-name uaecodes.com --record-set-name '@' --value 'YOUR-TOKEN-HERE'" -ForegroundColor Gray

Write-Host "`nFor faztrick.com:" -ForegroundColor Yellow
Write-Host "az network dns record-set txt add-record --resource-group $resourceGroup --zone-name faztrick.com --record-set-name '@' --value 'YOUR-TOKEN-HERE'" -ForegroundColor Gray

Write-Host "`nFor fzbiz.com:" -ForegroundColor Yellow
Write-Host "az network dns record-set txt add-record --resource-group $resourceGroup --zone-name fzbiz.com --record-set-name '@' --value 'YOUR-TOKEN-HERE'" -ForegroundColor Gray

Write-Host "`n`nStep 3: Verify HTTPS After Validation" -ForegroundColor Cyan
Write-Host "==========uaecodes.com" -ForegroundColor Cyan
Write-Host "  https://uaecodes.com" -ForegroundColor Cyan
Write-Host "  https://www.uaecodes.com" -ForegroundColor Cyan

Write-Host "After successful validation, test your domains:" -ForegroundColor White
Write-Host "  https://faztrick.com" -ForegroundColor Cyan
Write-Host "  https://www.faztrick.com" -ForegroundColor Cyan
Write-Host "  https://fzbiz.com" -ForegroundColor Cyan
Write-Host "  https://www.fzbiz.com" -ForegroundColor Cyan

Write-Host "`n`nNote: SSL certificate provisioning takes 5-10 minutes after validation" -ForegroundColor Yellow

Write-Host "`nOpen Azure Portal now? (Y/n): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -ne "n" -and $response -ne "N") {
  $portalUrl = "https://portal.azure.com/#@/resource/subscriptions/734a4dab-5e6f-4c2d-900d-e3577fce0291/resourceGroups/$resourceGroup/providers/Microsoft.Web/staticSites/$staticWebApp/customDomains"
  Start-Process $portalUrl
  Write-Host "`n✓ Azure Portal opened in browser" -ForegroundColor Green
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Summary - What's Working Now" -ForegroundColor Yellow
Write-Host "✓ uaecodes.com - HTTPS Ready" -ForegroundColor Green
Write-Host "✓ www.uaecodes.com - HTTPS Ready" -ForegroundColor Green
Write-Host "✓ www.fzbiz.com - HTTPS Ready" -ForegroundColor Green
Write-Host "⏳ uaecodes.com - Waiting for validation" -ForegroundColor Yellow
Write-Host "✓ www.faztrick.com - HTTPS Ready" -ForegroundColor Green
Write-Host "✓ www.fzbiz.com - HTTPS Ready" -ForegroundColor Green
Write-Host "⏳ faztrick.com - Waiting for validation" -ForegroundColor Yellow
Write-Host "⏳ fzbiz.com - Waiting for validation" -ForegroundColor Yellow
Write-Host "⏳ bookznow.com - Update name servers first`n" -ForegroundColor Yellow

Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host
