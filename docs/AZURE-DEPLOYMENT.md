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
az group create \
  --name cv-portfolio-rg \
  --location centralus \
  --query "properties.provisioningState"
```

**Parameters:**

- `--name`: Resource group name (change as needed)
- `--location`: Azure region (options: eastus, westus, centralus, westeurope, etc.)

### Step 4: Create Static Web App

```powershell
# Create Static Web App
az staticwebapp create \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --location centralus \
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
az staticwebapp secrets list \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --query "properties.apiKey" \
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
az staticwebapp create \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --location centralus \
  --source https://github.com/YOUR_USERNAME/cv \
  --branch main \
  --app-location "/public" \
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
npx swa login \
  --resource-group cv-portfolio-rg \
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
az network dns zone create \
  --resource-group cv-portfolio-rg \
  --name yourdomain.com
```

#### Step 2: Get Name Servers

```powershell
az network dns zone show \
  --resource-group cv-portfolio-rg \
  --name yourdomain.com \
  --query "nameServers" \
  --output json
```

**Update your domain registrar** with these name servers (takes 24-72 hours to propagate).

#### Step 3: Add Custom Domain to Static Web App

```powershell
# Add apex domain
az staticwebapp hostname set \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --hostname yourdomain.com
```

#### Step 4: Create DNS Records

Azure automatically creates the necessary DNS records when you add a custom domain:

- **TXT record**: `_dnsauth.yourdomain.com` (for validation)
- **ALIAS record**: `yourdomain.com` → Static Web App endpoint

To verify:

```powershell
# List DNS records
az network dns record-set list \
  --resource-group cv-portfolio-rg \
  --zone-name yourdomain.com \
  --output table
```

#### Step 5: Add WWW Subdomain (Optional)

```powershell
# Add www subdomain
az staticwebapp hostname set \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --hostname www.yourdomain.com

# Create CNAME record
az network dns record-set cname set-record \
  --resource-group cv-portfolio-rg \
  --zone-name yourdomain.com \
  --record-set-name www \
  --cname cv-portfolio.azurestaticapps.net
```

### Option 2: Using External DNS Provider (GoDaddy, Namecheap, etc.)

If your registrar doesn't support ALIAS/ANAME records:

#### Step 1: Get Static IP Address

```powershell
az staticwebapp show \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --query "customDomains[0].stableInboundIP" \
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
az staticwebapp show \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --query "{name:name, status:repositoryUrl, url:defaultHostname}" \
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
az staticwebapp secrets list \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --query "properties.apiKey" \
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
az group delete \
  --name cv-portfolio-rg \
  --yes \
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

## Useful Commands

```powershell
# List all Static Web Apps
az staticwebapp list --output table

# View logs
az staticwebapp show \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg

# Reset deployment token
az staticwebapp secrets reset-api-key \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg

# Delete Static Web App (keep resource group)
az staticwebapp delete \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --yes
```

---

## Resources

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [SWA CLI Documentation](https://azure.github.io/static-web-apps-cli/)
- [Custom Domain Setup Guide](https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain)
- [Azure DNS Documentation](https://learn.microsoft.com/en-us/azure/dns/)

---

## Observability (Application Insights)

You can add end-to-end telemetry and live metrics with Azure Application Insights.

### App Service (Image Server)

```powershell
# Create (or reuse) an Application Insights resource
$AiName = "image-server-ai"
az monitor app-insights component create \
  --app $AiName \
  --location $Location \
  --resource-group $ResourceGroup \
  --application-type web

# Get the connection string
$AIConn = az monitor app-insights component show \
  --app $AiName \
  --resource-group $ResourceGroup \
  --query connectionString -o tsv

# Add to App Service as an app setting
az webapp config appsettings set \
  --name $AppName \
  --resource-group $ResourceGroup \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING=$AIConn

# Optional: enable logging to filesystem for quick diagnosis
az webapp log config \
  --name $AppName \
  --resource-group $ResourceGroup \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem
```

### Static Web Apps (Frontend)

Static Web Apps integrates with Azure Monitor logs via "Diagnostic settings" in the Portal. To enable:

1. Go to your Static Web App → Monitoring → Diagnostic settings
2. Create a diagnostic setting and send logs/metrics to a Log Analytics workspace
3. Use Kusto (KQL) queries to analyze requests, errors, and performance

References: Static Web Apps diagnostics and logging documentation.

---

## CI/CD with GitHub Actions (Static Web Apps)

Automate deployments from GitHub whenever you push to your branch.

1. Generate a deployment token:

```powershell
az staticwebapp secrets list \
  --name cv-portfolio \
  --resource-group cv-portfolio-rg \
  --query "properties.apiKey" -o tsv
```

2. Add the token as a repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`.

3. Create `.github/workflows/swa-deploy.yml` in your repo:

```yaml
name: Deploy Static Web App

on:
  push:
    branches: [ cv ]
  workflow_dispatch: {}

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          #### App paths
          app_location: "/public"
          output_location: "/public"
```

This mirrors your local `swa-cli.config.json` which points to `/public`.

---

## Store Images in Azure Blob Storage (Recommended)

For production, store uploaded images in Blob Storage instead of the App Service filesystem.

### Create storage account and container

```powershell
$StorageName = ("imgstore" + (Get-Random -Maximum 99999))
az storage account create \
  --name $StorageName \
  --resource-group $ResourceGroup \
  --location $Location \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
$Conn = az storage account show-connection-string \
  --name $StorageName \
  --resource-group $ResourceGroup \
  --query connectionString -o tsv

# Create a private container for images
az storage container create \
  --name images \
  --connection-string $Conn \
  --auth-mode key

# Save connection string to App Service settings
az webapp config appsettings set \
  --name $AppName \
  --resource-group $ResourceGroup \
  --settings BLOB_CONNECTION_STRING="$Conn" BLOB_CONTAINER=images
```

### App changes (high-level)

- Use `@azure/storage-blob` to upload/download images
- Generate short-lived SAS URLs for secure access if needed
- Keep existing endpoints (`/v1/savebese64file`, gallery) but back them with Blob APIs

This improves durability, scalability, and avoids quota limits of the App Service filesystem.

---

## Next Steps (updated)

1. ✅ Deploy portfolio to Azure
2. ✅ Configure custom domain
3. ✅ Verify HTTPS certificate
4. 🔄 Set up CI/CD with GitHub Actions
5. 🔄 Enable Diagnostic settings / Application Insights
6. 🔄 Migrate images to Azure Blob Storage
7. 🔄 Add Log Analytics dashboards and alerts

---

**Last Updated:** 2025-11-12

```javascript
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const path = require("path");

app.use(bodyParser.json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
app.use(express.json());
app.use(cors());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Static files
app.use(express.static('public'));
app.use(express.static('./data'));
app.use('/data', express.static('data'));

// Save base64 image file
app.post('/v1/savebese64file', async (req, res) => {
  const { body } = req;
  try {
    const api_key = body.api_key;
    let filename = body.filename ?? "image.jpg";
    const base64Data = body.file ?? "";
    const basePath = 'data/';
    const userPath = path.join(basePath, api_key);

    console.log(`Filename= ${filename}`);

    // Ensure user path exists
    if (!fs.existsSync(userPath)) {
      console.log('Folder not found. Creating.');
      fs.mkdirSync(userPath, { recursive: true });
    }

    // Ensure destination path exists
    const destinationPath = path.join(userPath, 'documents');
    if (!fs.existsSync(destinationPath)) {
      console.log(`Folder ${destinationPath} not found. Creating.`);
      fs.mkdirSync(destinationPath, { recursive: true });
    }

    // Decode base64 and save the file
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(destinationPath, filename), buffer);

    return res.status(200).json({
      message: "File saved successfully.",
      url: `https://uaecodes.com:2211/${api_key}/documents/${filename}`
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ msg: "Internal server error" });
  }
});

// Show all images with pagination and delete option
app.get('/showallimg', (req, res) => {
  const folderPath = './data/key/documents';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const sortOrder = req.query.sort || 'desc'; // 'asc' or 'desc'

  fs.readdir(folderPath, (err, items) => {
    if (err) {
      console.error(`Error reading the folder: ${err}`);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Filter only image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const imageFiles = items.filter(item => {
      const ext = path.extname(item).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Get file stats and sort by date
    const itemsWithStats = imageFiles.map(item => {
      const filePath = path.join(folderPath, item);
      const stats = fs.statSync(filePath);
      return {
        item,
        mtime: stats.mtime,
        size: stats.size,
        formattedDate: stats.mtime.toLocaleDateString(),
        formattedTime: stats.mtime.toLocaleTimeString()
      };
    });

    // Sort by date
    itemsWithStats.sort((a, b) => {
      return sortOrder === 'desc' ? b.mtime - a.mtime : a.mtime - b.mtime;
    });

    // Pagination
    const totalItems = itemsWithStats.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = itemsWithStats.slice(startIndex, endIndex);

    // Generate HTML
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Image Gallery</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .stats { display: flex; justify-content: center; gap: 30px; margin-top: 15px; }
    .stat { text-align: center; }
    .stat-number { font-size: 1.5em; font-weight: bold; }
    .stat-label { font-size: 0.9em; opacity: 0.9; }
    .controls { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
    .sort-controls select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 5px; background: white; }
    .pagination-info { color: #666; font-size: 0.9em; }
    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 30px; }
    .grid-item { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .grid-item:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
    .image-container { position: relative; overflow: hidden; }
    .image { width: 100%; height: 200px; object-fit: cover; transition: transform 0.3s ease; }
    .image:hover { transform: scale(1.05); }
    .image-overlay { position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 0 0 0 10px; }
    .image-info { padding: 15px; }
    .image-name { font-weight: bold; margin-bottom: 8px; color: #333; word-break: break-all; }
    .image-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.8em; color: #666; margin-bottom: 10px; }
    .image-actions { display: flex; gap: 10px; }
    .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; text-align: center; font-size: 0.9em; transition: all 0.3s ease; }
    .btn-view { background: #007BFF; color: white; }
    .btn-view:hover { background: #0056b3; }
    .btn-delete { background: #dc3545; color: white; }
    .btn-delete:hover { background: #c82333; }
    .pagination { padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .pagination a, .pagination span { display: inline-block; padding: 10px 15px; margin: 0 5px; text-decoration: none; border-radius: 5px; transition: all 0.3s ease; }
    .pagination a { background: #f8f9fa; color: #007BFF; border: 1px solid #dee2e6; }
    .pagination a:hover { background: #007BFF; color: white; }
    .pagination .current { background: #007BFF; color: white; font-weight: bold; }
    .pagination .disabled { background: #f8f9fa; color: #6c757d; cursor: not-allowed; }
    .empty-state { text-align: center; padding: 60px 20px; color: #666; }
    .empty-state i { font-size: 4em; margin-bottom: 20px; color: #ddd; }
    .delete-controls { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e9ecef; }
    @media (max-width: 768px) {
      .controls { flex-direction: column; align-items: stretch; }
      .stats { flex-direction: column; gap: 15px; }
      .grid-container { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); padding: 20px; }
    }
    </style>
    <script>
    function deleteImage(filename) {
      if (confirm('Are you sure you want to delete this image?')) {
        fetch('/delete_image/' + encodeURIComponent(filename), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert('Image deleted successfully');
            location.reload();
          } else {
            alert('Error deleting image: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error deleting image');
        });
      }
    }
    function deleteByDateRange() {
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;

      if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after end date');
        return;
      }

      const confirmation = confirm('Are you sure you want to delete all images between ' + startDate + ' and ' + endDate + '?');
      if (confirmation) {
        fetch('/delete_images_by_date', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: startDate, endDate: endDate })
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.deletedCount + ' images deleted successfully');
            location.reload();
          } else {
            alert('Error deleting images: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error deleting images by date range');
        });
      }
    }

    function deleteByUID() {
      const uid = document.getElementById('uidInput').value;

      if (!uid) {
        alert('Please enter a UID');
        return;
      }

      const confirmation = confirm('Are you sure you want to delete all images with UID: ' + uid + '?');
      if (confirmation) {
        fetch('/delete_images_by_uid/' + encodeURIComponent(uid), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.deletedCount + ' images deleted successfully');
            location.reload();
          } else {
            alert('Error deleting images: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error deleting images by UID');
        });
      }
    }
    function changeSort() {
      const sortValue = document.getElementById('sortSelect').value;
      const url = new URL(window.location);
      url.searchParams.set('sort', sortValue);
      url.searchParams.set('page', '1');
      window.location.href = url.toString();
    }
    </script>
    </head>
    <body>
    <div class="container">
      <div class="header">
        <h1>📸 Image Gallery</h1>
        <div class="stats">
          <div class="stat">
            <div class="stat-number">${totalItems}</div>
            <div class="stat-label">Total Images</div>
          </div>
          <div class="stat">
            <div class="stat-number">${totalPages}</div>
            <div class="stat-label">Pages</div>
          </div>
          <div class="stat">
            <div class="stat-number">${page}</div>
            <div class="stat-label">Current Page</div>
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="sort-controls">
          <label for="sortSelect">Sort by date: </label>
          <select id="sortSelect" onchange="changeSort()" value="${sortOrder}">
            <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>Newest first</option>
            <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>Oldest first</option>
          </select>
        </div>
        <div class="pagination-info">
          Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} images
        </div>
      </div>

      <div class="delete-controls">
        <div style="font-weight: bold; color: #495057;">🗑️ Bulk Delete Options:</div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label for="startDate">From:</label>
          <input type="date" id="startDate" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
          <label for="endDate">To:</label>
          <input type="date" id="endDate" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
          <button onclick="deleteByDateRange()" class="btn" style="background: #dc3545; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">🗓️ Delete by Date</button>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label for="uidInput">UID:</label>
          <input type="text" id="uidInput" placeholder="Enter UID" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px; width: 120px;">
          <button onclick="deleteByUID()" class="btn" style="background: #dc3545; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">🆔 Delete by UID</button>
        </div>
      </div>`;

    if (paginatedItems.length === 0) {
      html += `
      <div class="empty-state">
        <div style="font-size: 4em; margin-bottom: 20px;">📷</div>
        <h3>No images found</h3>
        <p>The gallery is empty or no images match your criteria.</p>
      </div>`;
    } else {
      html += '<div class="grid-container">';
      paginatedItems.forEach(({ item, formattedDate, formattedTime, size }) => {
        const uidMatch = item.match(/([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif|bmp|webp)$/i);
        const extractedUID = uidMatch ? uidMatch[1] : 'N/A';
        const fileSizeKB = Math.round(size / 1024);
        html += `
        <div class="grid-item">
          <div class="image-container">
            <img class="image" src="/data/key/documents/${encodeURIComponent(item)}" alt="${item}" loading="lazy">
            <div class="image-overlay">${fileSizeKB} KB</div>
          </div>
          <div class="image-info">
            <div class="image-name">${item}</div>
            <div class="image-uid" style="font-size: 0.8em; color: #007BFF; font-weight: bold; margin-bottom: 5px; padding: 3px 6px; background: #e3f2fd; border-radius: 3px; display: inline-block;">UID: ${extractedUID}</div>
            <div class="image-meta">
              <span>📅 ${formattedDate}</span>
              <span>🕒 ${formattedTime}</span>
            </div>
            <div class="image-actions">
              <a href="/data/key/documents/${encodeURIComponent(item)}" target="_blank" class="btn btn-view">👁️ View</a>
              <button onclick="deleteImage('${item.replace(/'/g, "\'")}')" class="btn btn-delete">🗑️ Delete</button>
            </div>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    // Pagination
    if (totalPages > 1) {
      html += '<div class="pagination">';

      // Previous button
      if (page > 1) {
        html += `<a href="?page=${page - 1}&sort=${sortOrder}&limit=${limit}">« Previous</a>`;
      } else {
        html += '<span class="disabled">« Previous</span>';
      }

      // Page numbers
      const maxVisiblePages = 5;
      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      if (startPage > 1) {
        html += `<a href="?page=1&sort=${sortOrder}&limit=${limit}">1</a>`;
        if (startPage > 2) html += '<span>...</span>';
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i === page) {
          html += `<span class="current">${i}</span>`;
        } else {
          html += `<a href="?page=${i}&sort=${sortOrder}&limit=${limit}">${i}</a>`;
        }
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span>...</span>';
        html += `<a href="?page=${totalPages}&sort=${sortOrder}&limit=${limit}">${totalPages}</a>`;
      }

      // Next button
      if (page < totalPages) {
        html += `<a href="?page=${page + 1}&sort=${sortOrder}&limit=${limit}">Next »</a>`;
      } else {
        html += '<span class="disabled">Next »</span>';
      }

      html += '</div>';
    }

    html += `
    </div>
    </body>
    </html>`;

    res.send(html);
  });
});

// Delete single image
app.delete('/delete_image/:filename', (req, res) => {
  const folderPath = './data/key/documents';
  const filename = req.params.filename;
  const filePath = path.join(folderPath, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting file: ${err}`);
      return res.status(500).json({ error: 'Failed to delete image' });
    }
    res.json({ message: 'Image deleted successfully' });
  });
});

// Delete images by date range
app.delete('/delete_images_by_date', (req, res) => {
  const folderPath = './data/key/documents';
  const { startDate, endDate } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  fs.readdir(folderPath, (err, items) => {
    if (err) {
      console.error(`Error reading folder: ${err}`);
      return res.status(500).json({ error: 'Failed to read folder' });
    }

    let deletedCount = 0;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    items.forEach(item => {
      const ext = path.extname(item).toLowerCase();
      if (imageExtensions.includes(ext)) {
        const filePath = path.join(folderPath, item);
        const stats = fs.statSync(filePath);

        if (stats.mtime >= start && stats.mtime <= end) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    });

    res.json({ message: 'Images deleted successfully', deletedCount });
  });
});

// Delete images by UID
app.delete('/delete_images_by_uid/:uid', (req, res) => {
  const folderPath = './data/key/documents';
  const uid = req.params.uid;

  fs.readdir(folderPath, (err, items) => {
    if (err) {
      console.error(`Error reading folder: ${err}`);
      return res.status(500).json({ error: 'Failed to read folder' });
    }

    let deletedCount = 0;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    items.forEach(item => {
      const ext = path.extname(item).toLowerCase();
      if (imageExtensions.includes(ext)) {
        const uidMatch = item.match(/([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif|bmp|webp)$/i);
        const extractedUID = uidMatch ? uidMatch[1] : '';

        if (extractedUID === uid) {
          const filePath = path.join(folderPath, item);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    });

    res.json({ message: 'Images deleted successfully', deletedCount });
  });
});

// SSL Configuration
const privateKeyPath = '/etc/letsencrypt/live/uaecodes.com/privkey.pem';
const certificatePath = '/etc/letsencrypt/live/uaecodes.com/fullchain.pem';
const environment = process.env.NODE_ENV || 'development';

if (environment !== 'production' && environment !== 'development' && environment !== 'testing') {
  console.error(`NODE_ENV is set to ${environment}, but only production and development are valid.`);
  process.exit(1);
}

// HTTPS Server
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);
const httpsPort = process.env.HTTPS_PORT || 2212;
httpsServer.listen(httpsPort, () => {
  console.log(`HTTPS Image API server is running on port ${httpsPort}`);
});

// HTTP Server
const httpPort = process.env.HTTP_PORT || 2213;
app.listen(httpPort, () => {
  console.log(`HTTP Image API server is running on port ${httpPort}`);
});
