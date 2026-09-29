# CV portfolio and résumé

A public portfolio built with React, TypeScript, Vite and MobX MVVM, plus a printable, job-focused CV. Content is maintained in `data/cv-data.json` and was reviewed on 29 September 2026.

## Build the website

Use Node.js 22.12 or newer. From the repository root:

```powershell
npm ci --ignore-scripts --prefix frontend
npm run build --prefix frontend
```

The output is `frontend/dist`. It contains the public website, printable CV and PDF only. The build prerenders the page for immediate content and search indexing, then hydrates interactive project filters and dialogs. Use `npm run dev --prefix frontend` for local editing.

## Update CV content

Edit `data/cv-data.json`. Keep employment dates, achievements and technology claims grounded in actual work. To regenerate the HTML and PDF:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-cv.txt
.\.venv\Scripts\python.exe scripts/build-cv.py
npm run build --prefix frontend
```

The generated PDF is `output/pdf/Muhammed-Fasil-PV-CV.pdf`. The site also provides a printable `/cv.html` page. Review the exported layout after changing content.

## Architecture

- `frontend/src/models`: typed CV data and the content repository.
- `frontend/src/viewmodels`: MobX state, computed project filters and explicit user actions.
- `frontend/src/views`: React presentation, accessible navigation and project dialogs.
- `frontend/src/styles.css`: responsive layout, print styles and reduced-motion support.
- `scripts/build-cv.py`: HTML and PDF export from the same source data.
- `scripts/serve-portfolio.py`: loopback-only static serving with security headers.
- `deploy/portfolio.config.cjs`: dedicated portfolio process on ubuntu-server.

## Deployment

Publish `frontend/dist` only. The Ubuntu service listens on `127.0.0.1:18090` behind an HTTPS tunnel. Use `deploy/portfolio.config.cjs` for its dedicated PM2 process. DNS must route to the active Windows-hosted Ubuntu container; the stopped Azure VM is not the deployment target.

The intended public address is `https://faztrick.com`, with `www.faztrick.com` routed to the same portfolio. Copy `deploy/cloudflare.example.yml` to the server as `deploy/cloudflare.yml`, provision the tunnel credential separately with owner-only permissions, and use `deploy/tunnel.config.cjs`. Never commit tunnel credentials. The domain must be active in the tunnel's Cloudflare account, with proxied apex and www records pointing to the tunnel. DNS activation remains pending until the registrar nameservers are updated. No temporary `cnits.co` portfolio address is used.

The older local administration toolkit remains separate: install root dependencies with `npm ci --ignore-scripts`, configure `.env` from `.env.example`, and run `npm run panel`. Do not publish that server or the repository root as the public portfolio. See [security cleanup](docs/SECURITY-CLEANUP.md) for its access controls and limitations.

Automatic GitHub workflows are disabled. Main is the only active branch. No automated tests were run during this update, as requested; production compilation, dependency audits, and export inspection were used instead.
