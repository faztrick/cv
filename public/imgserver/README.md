# Azure Image Server Deployment

Complete guide for deploying the image server to Azure App Service with custom domain support.

## 📋 Prerequisites

- Azure CLI installed and configured
- Azure subscription
- Custom domain (e.g., uaecodes.com) with DNS access
- Node.js 18+ locally (for testing)

## 🚀 Quick Start

### Option 1: Automated Deployment

```powershell
# Deploy to Azure
.\deploy-azure.ps1

# Add custom domain with HTTPS
.\add-custom-domain.ps1
```

### Option 2: Manual Deployment

See detailed steps below.

---

## 📦 Application Structure

```
imgserver/
├── server.js              # Main application (Azure-optimized)
├── image_server.js        # Original server (local development)
├── package.json           # Dependencies
├── host.json              # Azure Functions config
├── deploy-azure.ps1       # Automated deployment script
├── add-custom-domain.ps1  # Custom domain setup script
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file (or configure in Azure):

```env
NODE_ENV=production
HTTP_PORT=80
HTTPS_PORT=443
APP_DOMAIN=uaecodes.com
MAX_FILE_SIZE=30mb
```

### Azure App Settings

The deployment script automatically configures:

- `NODE_ENV=production`
- `APP_DOMAIN=uaecodes.com`
- `MAX_FILE_SIZE=30mb`
- `WEBSITE_NODE_DEFAULT_VERSION=~20`
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true`

---

## 📝 Manual Deployment Steps

### Step 1: Create Azure Resources

```powershell
# Variables
$ResourceGroup = "image-server-rg"
$Location = "centralus"
$AppName = "image-server-$(Get-Random -Maximum 9999)"
$PlanName = "$AppName-plan"

# Login to Azure
az login

# Create resource group
az group create --name $ResourceGroup --location $Location

# Register providers
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.Storage --wait

# Create App Service Plan (B1 - Basic tier, $13/month)
az appservice plan create `
    --name $PlanName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku B1 `
    --is-linux

# Create Web App
az webapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --plan $PlanName `
    --runtime "NODE:20-lts"
```

### Step 2: Configure Application

```powershell
# Set environment variables
az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings `
        NODE_ENV=production `
        APP_DOMAIN=uaecodes.com `
        MAX_FILE_SIZE=30mb `
        WEBSITE_NODE_DEFAULT_VERSION=~20 `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Enable HTTPS only
az webapp update `
    --name $AppName `
    --resource-group $ResourceGroup `
    --set httpsOnly=true
```

### Step 3: Deploy Application

```powershell
# Package application
Compress-Archive -Path server.js,package.json,host.json -DestinationPath deploy.zip -Force

# Deploy to Azure
az webapp deployment source config-zip `
    --name $AppName `
    --resource-group $ResourceGroup `
    --src deploy.zip
```

### Step 4: Custom Domain Setup

#### Get Verification Details

```powershell
# Get verification ID
$verificationId = az webapp show `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query "customDomainVerificationId" `
    -o tsv

# Get default hostname
$defaultHostname = az webapp show `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query "defaultHostNames[0]" `
    -o tsv
```

#### Add DNS Records

**For Azure DNS:**

```powershell
# Add TXT record for verification
az network dns record-set txt add-record `
    --resource-group cv-portfolio-rg `
    --zone-name uaecodes.com `
    --record-set-name "asuid" `
    --value $verificationId

# Add CNAME record (or A record for apex domain)
az network dns record-set cname set-record `
    --resource-group cv-portfolio-rg `
    --zone-name uaecodes.com `
    --record-set-name "@" `
    --cname $defaultHostname
```

**For External DNS (GoDaddy, Namecheap, etc.):**

| Type | Name | Value |
|------|------|-------|
| TXT | asuid.uaecodes.com | [verification ID from above] |
| CNAME | @ or uaecodes.com | [default hostname].azurewebsites.net |

#### Add Domain to App Service

```powershell
# Add custom domain
az webapp config hostname add `
    --webapp-name $AppName `
    --resource-group $ResourceGroup `
    --hostname uaecodes.com

# Create managed SSL certificate (free)
az webapp config ssl create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --hostname uaecodes.com

# Verify SSL binding
az webapp config ssl list `
    --resource-group $ResourceGroup `
    --query "[].{Hostname:name, Thumbprint:thumbprint, State:state}" `
    --output table
```

---

## 🧪 Testing

### Test Default Azure URL

```powershell
$webApp = az webapp show --name $AppName --resource-group $ResourceGroup | ConvertFrom-Json
$url = "https://$($webApp.defaultHostNames[0])"

# Test health endpoint
Invoke-WebRequest "$url/health"

# Test gallery
Start-Process "$url/showallimg"
```

### Test Custom Domain

```powershell
# Test HTTPS
Invoke-WebRequest "https://uaecodes.com/health"

# Test gallery
Start-Process "https://uaecodes.com/showallimg"
```

### Test API Endpoints

```powershell
# Upload image (example)
$body = @{
    api_key = "test-key"
    filename = "test.jpg"
    file = "base64-encoded-image-data"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "https://uaecodes.com/v1/savebese64file" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## 🔍 Monitoring & Logs

### View Live Logs

```powershell
# Stream application logs
az webapp log tail `
    --name $AppName `
    --resource-group $ResourceGroup

# Download logs
az webapp log download `
    --name $AppName `
    --resource-group $ResourceGroup `
    --log-file logs.zip
```

### Configure Logging

```powershell
# Enable application logging
az webapp log config `
    --name $AppName `
    --resource-group $ResourceGroup `
    --application-logging filesystem `
    --detailed-error-messages true `
    --failed-request-tracing true `
    --web-server-logging filesystem
```

### View Metrics in Azure Portal

1. Go to Azure Portal
2. Navigate to your Web App
3. Click "Metrics" in the left menu
4. View:
   - Response Time
   - Requests
   - Errors
   - Data In/Out
   - CPU/Memory usage

---

## 🛠️ Management Commands

### Restart Application

```powershell
az webapp restart --name $AppName --resource-group $ResourceGroup
```

### Update Application Settings

```powershell
az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings KEY=VALUE
```

### Scale Application

```powershell
# Scale up to S1 tier
az appservice plan update `
    --name $PlanName `
    --resource-group $ResourceGroup `
    --sku S1

# Scale out to 2 instances
az appservice plan update `
    --name $PlanName `
    --resource-group $ResourceGroup `
    --number-of-workers 2
```

### Delete Resources

```powershell
# Delete entire resource group (caution!)
az group delete --name $ResourceGroup --yes --no-wait
```

---

## 📊 Pricing

### Azure App Service B1 (Basic)

- **Cost**: ~$13/month
- **Resources**: 1.75 GB RAM, 1 vCPU
- **Features**:
  - Custom domains
  - SSL/TLS certificates
  - 10 GB storage
  - Manual scaling up to 3 instances

### Additional Costs

- **Bandwidth**: First 5 GB free, then $0.087/GB
- **Storage**: Included (10 GB), additional $0.05/GB/month
- **SSL Certificates**: Free managed certificates included

---

## 🚦 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/v1/savebese64file` | POST | Upload base64 image |
| `/showallimg` | GET | Image gallery with pagination |
| `/delete_image/:filename` | DELETE | Delete single image |
| `/delete_images_by_date` | DELETE | Delete images by date range |
| `/delete_images_by_uid/:uid` | DELETE | Delete images by UID |

---

## 🔐 Security Features

- ✅ HTTPS enforced
- ✅ CORS enabled
- ✅ File size limits (30MB default)
- ✅ Input validation
- ✅ Error handling
- ✅ Managed SSL certificates

---

## 📞 Support & Resources

- **Azure Documentation**: <https://docs.microsoft.com/azure/app-service/>
- **Node.js on Azure**: <https://docs.microsoft.com/azure/app-service/quickstart-nodejs>
- **Custom Domains**: <https://docs.microsoft.com/azure/app-service/app-service-web-tutorial-custom-domain>
- **SSL Certificates**: <https://docs.microsoft.com/azure/app-service/configure-ssl-certificate>

---

## ✅ Next Steps

1. ✅ Deploy application to Azure
2. ✅ Configure custom domain
3. ✅ Enable HTTPS/SSL
4. ⏳ Add Azure Blob Storage for scalable file storage
5. ⏳ Configure Application Insights for monitoring
6. ⏳ Set up CI/CD with GitHub Actions

---

## 🎯 Production Checklist

- [ ] Application deployed successfully
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS propagated (24-72 hours)
- [ ] Health endpoint responding
- [ ] Gallery page accessible
- [ ] Upload API tested
- [ ] Logs configured
- [ ] Monitoring enabled
- [ ] Backup strategy defined

---

**Created**: October 24, 2025
**Author**: Majed Faisal
**License**: MIT
