# Azure Static Web Apps Deployment Guide

## Overview

This guide walks you through deploying your portfolio to **Azure Static Web Apps** with a custom domain.

---

## Prerequisites

- **Azure Subscription**: [Create a free account](https://azure.microsoft.com/free)
- **Azure CLI**: [Install Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (version 2.29.0+)
- **Node.js & npm**: [Download Node.js](https://nodejs.org/) (for SWA CLI)
- **GitHub Account**: Repository with your portfolio code
- **Custom Domain** (optional): For custom domain setup

---

## Deployment Methods

You can deploy using either:

1. **Azure CLI** (recommended for simple deployment)
2. **SWA CLI** (recommended for development workflow)

---

## Method 1: Deploy with Azure CLI

### Step 1: Login to Azure

```powershell
az login
```

This opens a browser window to complete authentication.

### Step 2: Select Your Subscription (if you have multiple)

```powershell
# View current subscription
az account show

# List all subscriptions
az account list --output table

# Set subscription (replace with your subscription ID)
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### Step 3: Create Resource Group

```powershell
# Create resource group
az group create `
  --name cv-portfolio-rg `
  --location centralus `
  --query "properties.provisioningState"
```

**Parameters:**

- `--name`: Resource group name (change as needed)
- `--location`: Azure region (options: eastus, westus, centralus, westeurope, etc.)

### Step 4: Create Static Web App

```powershell
# Create Static Web App
az staticwebapp create `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --location centralus `
  --query "defaultHostname"
```

This command returns your Azure-generated URL (e.g., `cv-portfolio.azurestaticapps.net`).

### Step 5: Deploy Your Files

#### Option A: Manual Upload (using SWA CLI)

```powershell
# Install SWA CLI globally
npm install -g @azure/static-web-apps-cli

# Navigate to your project root
cd e:\cv

# Get deployment token from Azure portal
az staticwebapp secrets list `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --query "properties.apiKey" `
  --output tsv

# Deploy with token (replace YOUR_DEPLOYMENT_TOKEN)
swa deploy ./public --deployment-token YOUR_DEPLOYMENT_TOKEN
```

#### Option B: GitHub Actions (automated)

1. **Get GitHub token:**
   - Go to GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` and `workflow` permissions

2. **Link GitHub repo:**

```powershell
az staticwebapp create `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --location centralus `
  --source https://github.com/YOUR_USERNAME/cv `
  --branch main `
  --app-location "/public" `
  --token YOUR_GITHUB_TOKEN
```

This automatically creates a GitHub Actions workflow in `.github/workflows/`.

---

## Method 2: Deploy with SWA CLI (Development Workflow)

### Step 1: Install SWA CLI in Your Project

```powershell
cd e:\cv
npm init -y
npm install -D @azure/static-web-apps-cli
```

### Step 2: Initialize SWA Configuration

```powershell
npx swa init --yes
```

This creates `swa-cli.config.json`.

### Step 3: Update Configuration

Edit `swa-cli.config.json`:

```json
{
  "configurations": {
    "cv-portfolio": {
      "appLocation": "./public",
      "outputLocation": "./public",
      "appBuildCommand": "",
      "apiBuildCommand": "",
      "apiLocation": "",
      "run": {
        "command": ""
      }
    }
  }
}
```

### Step 4: Login to Azure

```powershell
npx swa login `
  --resource-group cv-portfolio-rg `
  --app-name cv-portfolio
```

### Step 5: Deploy

```powershell
npx swa deploy --env production
```

---

## Custom Domain Setup

### Option 1: Using Azure DNS (Recommended)

#### Step 1: Create Azure DNS Zone

```powershell
# Create DNS zone for your domain
az network dns zone create `
  --resource-group cv-portfolio-rg `
  --name yourdomain.com
```

#### Step 2: Get Name Servers

```powershell
az network dns zone show `
  --resource-group cv-portfolio-rg `
  --name yourdomain.com `
  --query "nameServers" `
  --output json
```

**Update your domain registrar** with these name servers (takes 24-72 hours to propagate).

#### Step 3: Add Custom Domain to Static Web App

```powershell
# Add apex domain
az staticwebapp hostname set `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --hostname yourdomain.com
```

#### Step 4: Create DNS Records

Azure automatically creates the necessary DNS records when you add a custom domain:

- **TXT record**: `_dnsauth.yourdomain.com` (for validation)
- **ALIAS record**: `yourdomain.com` → Static Web App endpoint

To verify:

```powershell
# List DNS records
az network dns record-set list `
  --resource-group cv-portfolio-rg `
  --zone-name yourdomain.com `
  --output table
```

#### Step 5: Add WWW Subdomain (Optional)

```powershell
# Add www subdomain
az staticwebapp hostname set `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --hostname www.yourdomain.com

# Create CNAME record
az network dns record-set cname set-record `
  --resource-group cv-portfolio-rg `
  --zone-name yourdomain.com `
  --record-set-name www `
  --cname cv-portfolio.azurestaticapps.net
```

### Option 2: Using External DNS Provider (GoDaddy, Namecheap, etc.)

If your registrar doesn't support ALIAS/ANAME records:

#### Step 1: Get Static IP Address

```powershell
az staticwebapp show `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --query "customDomains[0].stableInboundIP" `
  --output tsv
```

#### Step 2: Add DNS Records at Your Registrar

**For Apex Domain (`yourdomain.com`):**

- Type: **A Record**
- Name: `@` (or leave blank)
- Value: `[STATIC_IP_FROM_STEP_1]`
- TTL: `3600`

**For Validation:**

- Type: **TXT Record**
- Name: `_dnsauth` (or `_dnsauth.yourdomain.com`)
- Value: `[GET_FROM_AZURE_PORTAL]`
- TTL: `3600`

**For WWW Subdomain:**

- Type: **CNAME Record**
- Name: `www`
- Value: `cv-portfolio.azurestaticapps.net`
- TTL: `3600`

#### Step 3: Validate in Azure Portal

1. Go to Azure Portal → Your Static Web App
2. Navigate to **Custom domains** → **Add**
3. Enter your domain → Follow validation steps
4. Wait for DNS propagation (up to 48 hours)

---

## Verification & Testing

### Check Deployment Status

```powershell
az staticwebapp show `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --query "{name:name, status:repositoryUrl, url:defaultHostname}" `
  --output table
```

### Test Your Site

```powershell
# Test Azure URL
Start-Process "https://cv-portfolio.azurestaticapps.net"

# Test custom domain (after DNS propagation)
Start-Process "https://yourdomain.com"
```

### Verify SSL Certificate

```powershell
# Check SSL certificate
curl -I https://yourdomain.com
```

Azure automatically provisions free SSL/TLS certificates (Let's Encrypt).

### DNS Propagation Check

```powershell
# Check DNS records
nslookup yourdomain.com

# Or use online tool:
Start-Process "https://www.whatsmydns.net/#A/yourdomain.com"
```

---

## Troubleshooting

### Issue: DNS Not Propagating

**Solution:**

- Wait 24-72 hours for full propagation
- Clear DNS cache: `ipconfig /flushdns`
- Use `nslookup` to verify records

### Issue: 404 Errors on Refresh

**Solution:**
Ensure `staticwebapp.config.json` is configured with `navigationFallback`.

### Issue: Deployment Token Expired

**Solution:**

```powershell
# Get new token
az staticwebapp secrets list `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --query "properties.apiKey" `
  --output tsv
```

### Issue: GitHub Actions Failing

**Solution:**

- Check workflow file in `.github/workflows/`
- Verify `app_location` points to `/public`
- Ensure GitHub token has correct permissions

---

## Clean Up (Optional)

To remove all Azure resources:

```powershell
az group delete `
  --name cv-portfolio-rg `
  --yes `
  --no-wait
```

**Warning:** This deletes everything in the resource group!

---

## Cost Estimate

**Azure Static Web Apps Pricing:**

- **Free Tier**: 100 GB bandwidth/month, 0.5 GB storage
- **Standard Tier**: $9/month + usage

For a simple portfolio, the **Free tier** is sufficient.

---

## Next Steps

1. ✅ Deploy portfolio to Azure
2. ✅ Configure custom domain
3. ✅ Verify HTTPS certificate
4. 🔄 Set up CI/CD with GitHub Actions (optional)
5. 🔄 Add Azure Application Insights for analytics (optional)

---

## Useful Commands

```powershell
# List all Static Web Apps
az staticwebapp list --output table

# View logs
az staticwebapp show `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg

# Reset deployment token
az staticwebapp secrets reset-api-key `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg

# Delete Static Web App (keep resource group)
az staticwebapp delete `
  --name cv-portfolio `
  --resource-group cv-portfolio-rg `
  --yes
```

---

## Resources

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [SWA CLI Documentation](https://azure.github.io/static-web-apps-cli/)
- [Custom Domain Setup Guide](https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain)
- [Azure DNS Documentation](https://learn.microsoft.com/en-us/azure/dns/)

---

**Last Updated:** 2025-01-18
