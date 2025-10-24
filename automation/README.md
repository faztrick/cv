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

1) Run the helper script to clone and prepare your choice:
   - tools/setup-job-bot.ps1 (interactive)

2) Edit the repo’s config file:
   - EasyApplyBot (LinkedIn Python): config.yaml (email, password, positions, locations, filters, uploads)
   - LinkedIn Node (Puppeteer): config.json (creds and search criteria)
   - indeed_bot (Python): config.yaml (base_url search, language, user_data_dir)

3) Run locally (examples):
   - LinkedIn Python
     - Activate venv: .\.venv\Scripts\Activate.ps1
     - Run: python .\main.py
   - LinkedIn Node
     - Run: node index.js
   - Indeed Python
     - Activate venv: .\.venv\Scripts\Activate.ps1
     - Run: python .\indeed_bot.py

Repo notes

- EasyApplyBot (Python)
  - Reads config.yaml and applies to Easy Apply jobs
  - requirements.txt included
  - Warns about account risk; educational use only
- LinkedIn Puppeteer (Node)
  - config.json driven; basic bot that targets Easy Apply
- indeed_bot (Python)
  - Uses config.yaml; focuses on jobs with “Indeed Apply”
  - Stores session in user_data_dir to preserve login

Centralized secrets (optional)

- A shared .env template is provided at automation/.env.example for central storage of credentials. The selected repos may not read this file directly; it is just a convenience. Prefer each repo’s native config file first.

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
