#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Setup FREE email forwarding for uaecodes.com, faztrick.com and fzbiz.com using ImprovMX
.DESCRIPTION
    Configures Azure DNS records for email forwarding to faztrick@gmail.com
#>

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Email Forwarding Setup (ImprovMX - FREE)" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

$resourceGroup = "cv-portfolio-rg"
$forwardToEmail = "faztrick@gmail.com"
$domains = @("uaecodes.com", "faztrick.com", "fzbiz.com")

Write-Host "`nForward emails to: $forwardToEmail" -ForegroundColor Green
Write-Host "`nStep 1: Sign up at ImprovMX (FREE)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "1. Go to: https://improvmx.com/" -ForegroundColor White
Write-Host "2. Click 'Get Started Free'" -ForegroundColor White
Write-Host "3. Sign up with: $forwardToEmail" -ForegroundColor White
Write-Host "4. Keep the browser open - you'll need it to add domains`n" -ForegroundColor White

Write-Host "Press Enter when you've signed up..." -ForegroundColor Yellow
Read-Host

Write-Host "`nStep 2: Configure DNS Records in Azure" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($domain in $domains) {
  Write-Host "Configuring $domain..." -ForegroundColor Yellow
  Write-Host "----------------------------------------`n" -ForegroundColor Gray

  # Add MX records for ImprovMX
  Write-Host "  Adding MX records..." -ForegroundColor White

  # Delete existing MX records if any
  az network dns record-set mx delete `
    --resource-group $resourceGroup `
    --zone-name $domain `
    --name "@" `
    --yes 2>$null | Out-Null

  # Add primary MX record (priority 10)
  az network dns record-set mx add-record `
    --resource-group $resourceGroup `
    --zone-name $domain `
    --record-set-name "@" `
    --preference 10 `
    --exchange "mx1.improvmx.com" | Out-Null

  # Add secondary MX record (priority 20)
  az network dns record-set mx add-record `
    --resource-group $resourceGroup `
    --zone-name $domain `
    --record-set-name "@" `
    --preference 20 `
    --exchange "mx2.improvmx.com" | Out-Null

  Write-Host "  ✓ MX records added" -ForegroundColor Green

  # Add SPF record
  Write-Host "  Adding SPF record..." -ForegroundColor White

  az network dns record-set txt add-record `
    --resource-group $resourceGroup `
    --zone-name $domain `
    --record-set-name "@" `
    --value "v=spf1 include:spf.improvmx.com ~all" 2>$null | Out-Null

  Write-Host "  ✓ SPF record added" -ForegroundColor Green

  Write-Host "  ✓ $domain DNS configured!`n" -ForegroundColor Green
}

Write-Host "`nStep 3: Add Domains to ImprovMX" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "For each domain:" -ForegroundColor White
Write-Host "1. In ImprovMX dashboard, click 'Add Domain'" -ForegroundColor White
Write-Host "2. Enter domain name (uaecodes.com, faztrick.com or fzbiz.com)" -ForegroundColor White
Write-Host "3. ImprovMX will verify DNS records automatically" -ForegroundColor White
Write-Host "4. Add email aliases:`n" -ForegroundColor White

foreach ($domain in $domains) {
  Write-Host "   Domain: $domain" -ForegroundColor Yellow
  Write-Host "   Aliases to create:" -ForegroundColor White
  Write-Host "   - info@$domain → $forwardToEmail" -ForegroundColor Cyan
  Write-Host "   - contact@$domain → $forwardToEmail" -ForegroundColor Cyan
  Write-Host "   - hello@$domain → $forwardToEmail" -ForegroundColor Cyan
  Write-Host "   - support@$domain → $forwardToEmail" -ForegroundColor Cyan
  Write-Host ""
}

Write-Host "`nStep 4: Verify DNS Records" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Checking DNS propagation..." -ForegroundColor White
Start-Sleep -Seconds 2

foreach ($domain in $domains) {
  Write-Host "`nChecking $domain MX records:" -ForegroundColor Yellow
  nslookup -type=MX $domain 8.8.8.8 | Select-String "mail exchanger"
}

Write-Host "`n`nStep 5: Test Email Forwarding" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "After DNS propagation (5-30 minutes):" -ForegroundColor White
Write-Host "1. Send test email to: info@uaecodes.com" -ForegroundColor Cyan
Write-Host "2. Check your inbox: $forwardToEmail" -ForegroundColor Cyan
Write-Host "3. Send test email to: info@uaecodes.com" -ForegroundColor Cyan
Write-Host "4. Check your inbox: $forwardToEmail`n" -ForegroundColor Cyan

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Email Aliases Available (FREE)" -ForegroundColor Yellow
Write-Host "==================================================`n" -ForegroundColor Cyan

Write-Host "uaecodes.com:" -ForegroundColor Yellow
Write-Host "  ✓ info@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ contact@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ hello@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ support@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ *@uaecodes.com (catch-all - optional)`n" -ForegroundColor Green

Write-Host "uaecodes.com:" -ForegroundColor Yellow
Write-Host "  ✓ info@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ contact@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ hello@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ support@uaecodes.com" -ForegroundColor Green
Write-Host "  ✓ *@uaecodes.com (catch-all - optional)`n" -ForegroundColor Green

Write-Host "fzbiz.com:" -ForegroundColor Yellow
Write-Host "  ✓ info@fzbiz.com" -ForegroundColor Green
Write-Host "  ✓ contact@fzbiz.com" -ForegroundColor Green
Write-Host "  ✓ hello@fzbiz.com" -ForegroundColor Green
Write-Host "  ✓ support@fzbiz.com" -ForegroundColor Green
Write-Host "  ✓ *@fzbiz.com (catch-all - optional)`n" -ForegroundColor Green

Write-Host "All emails forward to: $forwardToEmail" -ForegroundColor Cyan

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Bonus: Send Emails FROM Your Custom Domain" -ForegroundColor Yellow
Write-Host "==================================================`n" -ForegroundColor Cyan
uaecodes
Write-Host "Option 1: ImprovMX SMTP (FREE)" -ForegroundColor White
Write-Host "  - Get SMTP credentials from ImprovMX dashboard" -ForegroundColor Gray
Write-Host "  - Configure in Gmail/Outlook as 'Send As' address`n" -ForegroundColor Gray

Write-Host "Option 2: Gmail 'Send As' (FREE)" -ForegroundColor White
Write-Host "  1. Gmail Settings → Accounts → 'Add another email address'" -ForegroundColor Gray
Write-Host "  2. Enter: info@uaecodes.com" -ForegroundColor Gray
Write-Host "  3. Use ImprovMX SMTP settings" -ForegroundColor Gray
Write-Host "  4. Verify and start sending!`n" -ForegroundColor Gray

Write-Host "`nOpen ImprovMX dashboard? (Y/n): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -ne "n" -and $response -ne "N") {
  Start-Process "https://improvmx.com/"
  Write-Host "`n✓ Browser opened to ImprovMX" -ForegroundColor Green
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  DNS Configuration Complete!" -ForegroundColor Green
Write-Host "==================================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. ✓ DNS records configured in Azure" -ForegroundColor Green
Write-Host "2. ⏳ Add domains in ImprovMX dashboard" -ForegroundColor Yellow
Write-Host "3. ⏳ Wait 5-30 minutes for DNS propagation" -ForegroundColor Yellow
Write-Host "4. ⏳ Test email forwarding" -ForegroundColor Yellow
Write-Host "5. ⏳ Configure 'Send As' in Gmail (optional)`n" -ForegroundColor Yellow

Write-Host "Cost: $0 (FREE forever)" -ForegroundColor Green
Write-Host "Limits: Unlimited email forwarding!" -ForegroundColor Green

Write-Host "`nPress Enter to exit..." -ForegroundColor Gray
Read-Host
