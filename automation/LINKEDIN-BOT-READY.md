# LinkedIn Job Application Bot - Disabled

## Status

This LinkedIn job application automation flow has been disabled in this workspace.
The helper files remain only as placeholders so old links do not break.

### Current State

- `scripts/linkedin-auto-apply.js` - Disabled stub
- `automation/configure-linkedin-bot.ps1` - Non-sensitive preference helper
- `automation/test-linkedin-bot.ps1` - Disabled stub
- `automation/run-linkedin-bot.ps1` - Disabled stub

### 🎯 Pre-configured Settings

- **Keyword**: Software Architect
- **Location**: United Arab Emirates
- **Period**: Past Week
- **Pages**: 3 (to start safely)
- **Experience**: 5 years

---

## Recommended Use

Use the workspace for:

- CV parsing
- outreach email generation
- manual application support
- resume export and portfolio hosting

Do not use it for unattended LinkedIn automation.

---

## 🎨 Customize Your Search

### Popular UAE Keywords

- Software Architect
- Solutions Architect
- Cloud Architect (AWS/Azure)
- Senior Software Engineer
- Principal Engineer
- Technical Lead

### UAE Locations

- United Arab Emirates (all UAE)
- Dubai, United Arab Emirates
- Abu Dhabi, United Arab Emirates

### Search Period

- `"Past 24 hours"` - Latest jobs only
- `"Past Week"` - More results (recommended)

---

## 📊 What the Bot Does

1. ✅ Logs into your LinkedIn account
2. ✅ Searches for jobs with your keyword + location
3. ✅ Filters for **Easy Apply** jobs only
4. ✅ Filters by time period (24 hours or past week)
5. ✅ Auto-fills application forms
6. ✅ Stops for manual review before you submit
7. ✅ Processes multiple pages (you control how many)

---

## ⚙️ Key Configuration Options

| Setting | Location | Default | Recommended |
|---------|----------|---------|-------------|
| Email/Password | `.env` | (empty) | YOUR credentials |
| Job Keyword | `data\linkedin-bot-settings.json` | Software Architect | Match your role |
| Location | `data\linkedin-bot-settings.json` | UAE | Your target market |
| Pages | `data\linkedin-bot-settings.json` | 3 | Start with 3-5 |
| Experience | Repo defaults | 5 | Your YOE |

---

## ⚠️ Important Warnings

### Legal/ToS

- ⚠️ **May violate LinkedIn Terms of Service**
- ⚠️ **LinkedIn may suspend your account**
- ⚠️ **Use at your own risk**

### Technical Limitations

- 🔴 Requires manual CAPTCHA solving
- 🟡 May need intervention for complex forms
- 🟡 Cannot upload custom resume per job
- 🟢 Runs in visible mode (you can watch)

### Best Practices

- ✅ Start with **3 pages** to test
- ✅ Monitor the **first 5-10 applications**
- ✅ Check for **CAPTCHAs** frequently
- ✅ Use during **off-peak hours**
- ✅ Don't run 24/7 (looks suspicious)

---

## 🐛 Troubleshooting

### Bot Won't Start

```powershell
# Check Node.js installed
node --version

# Reinstall dependencies
npm install
```

### Chrome Not Found

```powershell
# Find your Chrome path
Get-ChildItem "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Update your local settings only if your workflow needs a custom Chrome path
```

### Login Fails

- Check `LINKEDIN_EMAIL` / `LINKEDIN_PASSWORD` in `.env`
- LinkedIn may require 2FA (add manual step)
- Try logging in manually first

### Selectors Break

- LinkedIn updates UI frequently
- The old LinkedIn automation script is disabled in this workspace
- Check GitHub repo for updates

---

## 📈 Advanced Usage

### Multiple Job Searches

Create separate local settings files:

```powershell
# data\linkedin-bot-settings-architect.json
# data\linkedin-bot-settings-engineer.json
```

### Save Login Session (Optional)

If you choose to persist browser state locally, keep the profile directory outside git and treat it like credentials.

### Schedule with Task Scheduler

Run daily at 9 AM to catch fresh postings

---

## 🔒 Security Checklist

- ✅ Never commit `.env`, cookies, or browser profile/session directories
- ✅ Use `.env` for production
- ✅ `.gitignore` is configured to exclude sensitive files
- ✅ Repos folder excluded from version control

---

## 📚 Documentation

- **Main README**: `automation/README.md`
- **Local runner**: `automation/run-linkedin-bot.ps1`
- **Original Repo**: <https://github.com/adnanedrief/linkedin-job-apply-automation>

---

## 🎯 Your Next Actions

1. **Add credentials** to the workspace `.env`

   ```env
   LINKEDIN_EMAIL=your-linkedin-email@example.com
   LINKEDIN_PASSWORD=your-password
   ```

2. **Optionally update search settings**

   ```powershell
   .\automation\configure-linkedin-bot.ps1
   ```

3. **Run pre-flight check**

   ```powershell
   .\automation\test-linkedin-bot.ps1
   ```

4. **Test with 1 page first**
   - Edit `data\linkedin-bot-settings.json`: Set `pages: 1`
   - Run: `.\automation\run-linkedin-bot.ps1`
   - Watch it work in the Chrome window

5. **Scale up gradually**
   - If successful, increase to 3-5 pages
   - Monitor for CAPTCHAs
   - Check applied jobs on LinkedIn

---

## 💡 Pro Tips

✨ **Timing**: Run early morning UAE time (6-8 AM) when fresh jobs post
✨ **Keywords**: Try variations like "Software Engineer" vs "Software Developer"
✨ **Review**: Manually review auto-applied jobs weekly
✨ **Customize**: Keep your LinkedIn profile updated - bot uses that data
✨ **Backup**: Apply manually to high-priority jobs

---

## 🆘 Need Help?

1. Check `automation/README.md` and `automation/run-linkedin-bot.ps1`
2. Review console output for errors
3. Run pre-flight check for diagnostics
4. Original repo issues: <https://github.com/adnanedrief/linkedin-job-apply-automation/issues>

---

**Good luck with your job search! 🚀**

Remember: This bot is a **tool to assist**, not replace your job search efforts. Always customize your applications for high-priority roles!
