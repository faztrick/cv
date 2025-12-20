# Deploy the Call Center Report to Azure Static Web Apps

This repo contains a standalone HTML report at:

- `docs/reports/call_center_infrastructure_us_dubai_report.html`

The GitHub workflow `.github/workflows/deploy_callcenter_azure_swa.yml` deploys the report as a **static site** to Azure Static Web Apps, published under:

- `/callcenter/`

So your Azure URL will look like:

- `https://<your-app>.azurestaticapps.net/callcenter/`

## 1) Create the Azure Static Web App

1. In Azure Portal, create **Static Web App**.
2. Deployment source: **GitHub**.
3. Select this repo (`faztrick/bizeva`) and branch `main`.
4. Framework preset: **Custom** (we are uploading static files, no build).

After creation, Azure will give you a **deployment token**.

## 2) Add GitHub Secret

In GitHub:

- Repo → Settings → Secrets and variables → Actions → **New repository secret**

Create:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_CALLCENTER`

Value: paste the token from Azure.

## 3) Trigger deployment

Any push that changes files under `docs/reports/**` will trigger the workflow.

You can also run it manually:

- GitHub → Actions → **Deploy Call Center Report (Azure Static Web Apps)** → Run workflow

## 4) Custom domain notes

Azure Static Web Apps custom domains map to the app root. If you need:

- `https://uaecodes.com/callcenter/`

…you generally handle that using a front door / reverse proxy (e.g., Azure Front Door) that routes `/callcenter/*` to the SWA origin.

If you instead map `uaecodes.com` directly to the SWA, the report will be available at:

- `https://uaecodes.com/callcenter/`

…**only if** your fronting layer preserves the `/callcenter` path (recommended: Front Door path-based routing).

## 5) Sanity check

After deployment, verify:

- Mermaid diagrams render (and re-render on theme toggle)
- Language toggle works (EN/AR)
- All assets load under `/callcenter/` (CSS/JS/icons)
