# Add uaecodes.com Domain to Azure Static Web App

## Quick Setup Guide

Since Azure CLI is not currently installed, here are the manual steps to add your domain:

---

## Step 1: Install Azure CLI (If not already done)

Download and install from: <https://aka.ms/installazurecliwindows>

After installation, restart PowerShell.

---

## Step 2: Login to Azure

```powershell
az login
```

---

## Step 3: Add <www.uaecodes.com> (Subdomain)

```powershell
az staticwebapp hostname set `
    --name cv-portfolio `
    --resource-group cv-portfolio-rg `
    --hostname "www.uaecodes.com" `
    --no-wait
```

---

## Step 4: Configure DNS Records at Your Registrar

### For <www.uaecodes.com> (CNAME Record)

| Type  | Name | Value                                           | TTL  |
|-------|------|-------------------------------------------------|------|
| CNAME | www  | polite-pebble-0d82e8010.3.azurestaticapps.net  | 3600 |

---

## Step 5: Add Apex Domain (uaecodes.com) via Azure Portal

### Method A: Using Azure Portal (Recommended)

1. Go to: <https://portal.azure.com>
2. Navigate to: **Resource Groups** → **cv-portfolio-rg** → **cv-portfolio** (Static Web App)
3. In the left menu, click **Custom domains**
4. Click **+ Add**
5. Enter: `uaecodes.com`
6. Select validation method: **TXT record**
7. Azure will provide a TXT record value
8. Add the TXT record at your registrar:

| Type | Name | Value                    | TTL  |
|------|------|--------------------------|------|
| TXT  | @    | [Value from Azure]       | 3600 |

9. Also add an A record:

| Type | Name | Value               | TTL  |
|------|------|---------------------|------|
| A    | @    | [IP from Azure]     | 3600 |

10. Click **Validate and add** in Azure Portal
11. Wait 5-10 minutes for DNS propagation

### Method B: Using Azure CLI

```powershell
# First, get the validation TXT record
az staticwebapp hostname set `
    --name cv-portfolio `
    --resource-group cv-portfolio-rg `
    --hostname "uaecodes.com"

# The command will return the TXT record to add
# Add it to your DNS, then run the command again to confirm
```

---

## Step 6: SSL Certificate (Automatic)

✅ Azure automatically provisions **free SSL certificates** for all custom domains.

This process takes **5-10 minutes** after DNS validation completes.

---

## Step 7: Verify Your Domains

After DNS propagation (usually 5-30 minutes), test:

- ✅ <https://www.uaecodes.com> (recommended canonical)
- ✅ <https://uaecodes.com> (optional apex)

---

## DNS Configuration Summary

### Records to add at your domain registrar

```
www.uaecodes.com → polite-pebble-0d82e8010.3.azurestaticapps.net (CNAME)
uaecodes.com     → [Get TXT & A records from Azure Portal]
```

---

## Check Current Configured Domains

```powershell
az staticwebapp hostname list `
    --name cv-portfolio `
    --resource-group cv-portfolio-rg `
    --output table
```

---

## Troubleshooting

### DNS not propagating?

Check DNS propagation: <https://dnschecker.org/#CNAME/www.uaecodes.com>

### SSL certificate not provisioning?

- Wait 10-15 minutes
- Ensure DNS records are correct
- Check Azure Portal → Custom domains → Status

### Need help?

Azure Static Web Apps Documentation:
<https://docs.microsoft.com/en-us/azure/static-web-apps/custom-domain>

---

## Quick Commands Reference

```powershell
# Check Azure login
az account show

# List static web apps
az staticwebapp list --output table

# Add subdomain
az staticwebapp hostname set --name cv-portfolio --resource-group cv-portfolio-rg --hostname "www.uaecodes.com"

# List configured domains
az staticwebapp hostname list --name cv-portfolio --resource-group cv-portfolio-rg

# Delete a domain (if needed)
az staticwebapp hostname delete --name cv-portfolio --resource-group cv-portfolio-rg --hostname "www.uaecodes.com"
```

---

## Next Steps

1. ✅ Add CNAME record for <www.uaecodes.com>
2. ✅ Use Azure Portal to add apex domain (uaecodes.com)
3. ✅ Add TXT + A records for validation
4. ✅ Wait for SSL certificate (5-10 min)
5. ✅ Test both www and apex domains with HTTPS

---

**Your portfolio will be live at:**

- <https://www.uaecodes.com>
- <https://uaecodes.com> (optional)
