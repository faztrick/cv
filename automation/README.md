# Job Application Automation (LinkedIn & Indeed)

Use at your own risk. Automating interactions with job sites may violate their Terms of Service. Accounts can be rate-limited, restricted, or banned. Expect CAPTCHAs, anti-bot challenges, and UI changes that break bots. Keep volumes reasonable and review each application for accuracy.

What you’ll set up

- LinkedIn (Python, Selenium): Easy Apply automation via the EasyApplyBot repository (actively maintained fork)
  Repo: <https://github.com/madingess/EasyApplyBot>
- LinkedIn (Node.js, Puppeteer): LinkedIn Easy Apply bot
  Repo: <https://github.com/adnanedrief/linkedin-job-apply-automation>
- Indeed (Python, Selenium): Indeed Auto-Apply bot with config.yaml
  Repo: <https://github.com/meteor314/indeed_bot>

Quick start (Windows PowerShell)

1) Clone the repos (one-time setup):

   ```powershell
   # LinkedIn Node.js (Puppeteer) - Recommended for beginners
   .\tools\setup-job-bot.ps1 -RepoChoice LinkedInNode

   # LinkedIn Python (Selenium) - More features
   .\tools\setup-job-bot.ps1 -RepoChoice LinkedInPython

   # Indeed Python
   .\tools\setup-job-bot.ps1 -RepoChoice IndeedPython
   ```

2) Configure bots with helper scripts:

   ```powershell
   # LinkedIn Bot (Interactive config)
   .\automation\configure-linkedin-bot.ps1

   # Indeed Bot (Interactive config)
   .\automation\configure-indeed-bot.ps1
   ```

   **Or edit config files manually:**
   - EasyApplyBot (LinkedIn Python): `config.yaml` (email, password, positions, locations)
   - LinkedIn Node (Puppeteer): `config.json` (creds and search criteria)
   - Indeed Bot (Python): `config.yaml` (base_url search, language)

3) Verify setup:

   ```powershell
   # Test LinkedIn bot
   .\automation\test-linkedin-bot.ps1

   # Test Indeed bot
   .\automation\test-indeed-bot.ps1
   ```

4) Run the bots:

   ```powershell

# LinkedIn Node.js (recommended): reads LINKEDIN_EMAIL/LINKEDIN_PASSWORD from the workspace .env

# injects them into config.json at runtime, then restores the original file

  .\automation\run-linkedin-bot.ps1

# Indeed Python: activates the workspace .venv and runs the bot using automation\repos\indeed_bot\config.yaml

  .\automation\run-indeed-bot.ps1

# Email outreach (Gmail SMTP): sends emails listed in data\target-companies.json

  .\automation\run-email-outreach.ps1

   ```

Repo notes

- EasyApplyBot (Python)
  - Reads config.yaml and applies to Easy Apply jobs
  - requirements.txt included
  - Warns about account risk; educational use only
- LinkedIn Puppeteer (Node)
  - config.json driven; basic bot that targets Easy Apply
  - ⭐ **Recommended for beginners** - easier setup than Python version
  - Full guide: `automation/LINKEDIN-BOT-READY.md`
- indeed_bot (Python)
  - Uses config.yaml; focuses on jobs with "Indeed Apply"
  - Stores session in user_data_dir to preserve login
  - Uses Camoufox to bypass bot detection

Helper scripts

Located in `automation/`:

- `configure-linkedin-bot.ps1` - Interactive LinkedIn bot configuration
- `configure-indeed-bot.ps1` - Interactive Indeed bot configuration
- `test-linkedin-bot.ps1` - Pre-flight check for LinkedIn bot
- `test-indeed-bot.ps1` - Pre-flight check for Indeed bot
- `test-whatsapp.ps1` - Pre-flight check for WhatsApp panel integration (QR/connection status)
- `run-linkedin-bot.ps1` - Run LinkedIn bot using credentials from workspace `.env` (secrets are not left in config)
- `run-indeed-bot.ps1` - Run Indeed bot using workspace Python `.venv`
- `run-email-outreach.ps1` - Send outreach emails via Gmail SMTP using `.env` (see `automation/README-SMTP.md`)
- `run-whatsapp-message.ps1` - Send a single personal WhatsApp message via the local panel WhatsApp integration
- `LINKEDIN-BOT-READY.md` - Complete LinkedIn bot guide (UAE-focused)

Located in `tools/`:

- `setup-job-bot.ps1` - Clone and setup repos (one-time)

Centralized secrets (optional)

- A shared .env template is provided at `automation/.env.example` for central storage of credentials.
- The secure runner scripts (`run-linkedin-bot.ps1`) read from the **workspace root** `.env`.
- The selected repos may not read `.env` directly; the runner scripts exist to avoid hard-coding credentials into repo config files.

Compliance & safety checklist

- Review each site’s ToS and legal guidelines; do not spam
- Keep realistic pacing and add random delays when possible
- Expect to solve CAPTCHAs manually
- Run in a visible, non-headless browser until stable
- Validate every application and logs before scaling up

Troubleshooting

- Element not found: the site UI likely changed; update selectors in the repo code
- CAPTCHA/blocks: slow down, add randomized waits, consider manual intervention
- Login loops: clear cookies, ensure correct user_data_dir (indeed_bot), or re-authenticate
- Dependencies: ensure Python 3.10+ or Node 18+, and Chrome/Chromedriver compatibility where required

Links

- EasyApplyBot (Python): <https://github.com/madingess/EasyApplyBot>
- LinkedIn Puppeteer (Node): <https://github.com/adnanedrief/linkedin-job-apply-automation>
- Indeed Auto-Apply (Python): <https://github.com/meteor314/indeed_bot>
