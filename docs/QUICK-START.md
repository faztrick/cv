# 🚀 Quick Start - Deploy Your Portfolio to Azure

## ⚡ 3-Step Deployment

### Step 1: Install Azure CLI

**Run PowerShell as Administrator**, then:

```powershell
cd E:\cv
.\scripts\setup-azure.ps1
```

This installs Azure CLI and Static Web Apps CLI automatically.

**Alternative:** Manual install from <https://aka.ms/installazurecliwindows>

---

### Step 2: Deploy Your Portfolio

**Close and reopen PowerShell** (normal user, no admin needed), then:

```powershell
cd E:\cv
.\scripts\deploy-azure.ps1
```

The interactive wizard will:

- Log you into Azure
- Create all resources
- Deploy your portfolio
- Give you the live URL

---

### Step 3: View Your Live Site

Your portfolio will be live at:

```
https://cv-portfolio.azurestaticapps.net
```

---

## 📦 What's Included

- ✅ **Free Azure hosting** (100GB bandwidth/month)
- ✅ **Automatic HTTPS** with free SSL certificate
- ✅ **Global CDN** for fast loading worldwide
- ✅ **Custom domain support** (optional)
- ✅ **Security headers** configured
- ✅ **SEO optimized** routing

---

## 🎯 Quick Commands

If you already have Azure CLI installed:

```powershell
# Login
az login

# Deploy (one command!)
cd E:\cv
.\scripts\deploy-azure.ps1
```

---

## 📚 Need More Details?

- **Full deployment guide**: See `AZURE-DEPLOYMENT.md`
- **Custom domain setup**: See `AZURE-DEPLOYMENT.md` section "Custom Domain Setup"
- **GitHub Actions**: See `AZURE-DEPLOYMENT.md` section "GitHub Actions"

---

## 🆘 Troubleshooting

**Azure CLI not found?**

- Run `.\scripts\setup-azure.ps1` as Administrator
- Or download from <https://aka.ms/installazurecliwindows>

**Node.js not installed?**

- Download from <https://nodejs.org/>
- Required for SWA CLI deployment

**Deployment failed?**

- Check your Azure subscription is active
- Verify you have permissions to create resources
- See detailed logs in terminal output

---

## 🎉 That's It

Your portfolio is now:

- ✅ Live on Azure
- ✅ Secured with HTTPS
- ✅ Globally distributed
- ✅ Ready for custom domain

**Next:** Add your custom domain (optional) - see `AZURE-DEPLOYMENT.md`
