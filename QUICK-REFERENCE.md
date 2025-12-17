# Quick Start Guide - CV Job Search Toolkit

## ✅ All Systems Operational

All modules have been tested and are working correctly!

## Quick Commands

### 📧 Email Generation

```bash
# Generate sample job emails
npm run generate-emails

# Generate personalized email for specific job
npm run smart-email "Software Engineer" "Company Name"

# Generate 3 tone variants (professional, enthusiastic, technical)
npm run email-variants "AI Engineer" "Tech Company"
```

### 📄 CV Management

```bash
# Parse your CV and extract data
npm run parse-cv

# View job search profile
npm run job-agent
```

### 🌐 Web Panel

```bash
# Start the web dashboard
npm run panel

# Then open: http://localhost:3000/panel
```

### 🤖 Job Automation

```bash
# Auto-fill job application
npm run auto-fill apply "https://www.bayt.com/job/..."

# Search jobs (headless mode in CI, visible mode if DISPLAY available)
npm run playwright-indeed
npm run playwright-linkedin
npm run playwright-bayt
```

### 📊 Outreach Management

```bash
# Manage outreach campaigns
npm run outreach
```

### 🧹 Maintenance

```bash
# Clean browser cache
npm run clean-cache
```

## Recent Fixes (December 2025)

✅ Fixed syntax error in email generator
✅ Fixed server crash when Chromium missing
✅ Fixed Playwright headless mode detection
✅ All 33 JavaScript files validated
✅ All npm scripts tested and working

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Email Generation | ✅ Working | 6 templates available |
| CV Parser | ✅ Working | Extracts all data from resume.md |
| Smart Email | ✅ Working | AI-powered personalization |
| Job Matching | ✅ Working | Skill-based scoring |
| Web Panel | ✅ Working | Dashboard at :3000/panel |
| Playwright Automation | ✅ Working | Auto-detects headless mode |
| Auto-fill | ✅ Working | Multiple platforms supported |
| WhatsApp Integration | ⚠️ Optional | Requires Chromium installation |

## Optional Setup

### Enable AI Features

```bash
# Set OpenAI API key
export OPENAI_API_KEY="your-api-key-here"
```

### Enable WhatsApp Integration

```bash
# Install Chromium
npm install
# (without PUPPETEER_SKIP_DOWNLOAD)
```

### MCP (VS Code + Docker MCP Toolkit)

This repo includes a workspace-level MCP configuration at `cv/.vscode/mcp.json` that runs the Docker MCP gateway.

- Recommended: enable only the MCP servers you need in Docker Desktop (MCP Toolkit) and run the gateway without `--enable-all-servers`.
- If you run with `--enable-all-servers`, Docker may log many "couldn't read secret ..." warnings for catalog servers you haven't configured.
- To enable “dynamic agent” behavior (agents can discover/add MCP servers on-demand), enable Docker’s Dynamic MCP tools:
 	- `docker mcp feature enable dynamic-tools`
 	- Restart VS Code after enabling.
- Copilot Chat tool sets (optional): this repo includes `cv/.vscode/toolsets.jsonc` with a few handy tool groups (`#reader`, `#dockerMcpAdmin`, `#safeFix`).
- If you use Sentry MCP, use Streamable HTTP at `https://mcp.sentry.dev/mcp` (the legacy SSE endpoint `/sse` was removed).

## Support

- 📖 Full documentation in README.md
- 🔧 Detailed fixes in FIXES-APPLIED.md
- 💡 Quick start guides in QUICK-START-*.md files

## Next Steps

1. Update your resume in `resumes/resume.md`
2. Run `npm run parse-cv` to extract data
3. Start the web panel: `npm run panel`
4. Generate personalized emails for your target jobs
5. Track applications in the dashboard

Happy job hunting! 🚀
