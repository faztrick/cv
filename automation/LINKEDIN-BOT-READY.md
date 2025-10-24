# 🤖 LinkedIn Job Application Bot - Ready to Use!

## ✅ What's Set Up

Your workspace now has a **fully configured LinkedIn job application automation bot** with:

### 📁 Files Created
- `automation/repos/linkedin-job-apply-automation/` - Main bot (Puppeteer/Node.js)
- `automation/configure-linkedin-bot.ps1` - Quick config helper
- `automation/test-linkedin-bot.ps1` - Pre-flight check script
- `automation/repos/linkedin-job-apply-automation/QUICKSTART.md` - Detailed guide

### 🎯 Pre-configured Settings
- **Keyword**: Software Architect
- **Location**: United Arab Emirates  
- **Period**: Past Week
- **Pages**: 3 (to start safely)
- **Experience**: 5 years

---

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Your Credentials

**Option A - Interactive (Recommended)**
```powershell
.\automation\configure-linkedin-bot.ps1
```
Then follow the prompts to enter your email/password.

**Option B - Manual**
Edit `automation/repos/linkedin-job-apply-automation/config.json`:
```json
{
    "email": "your-linkedin-email@example.com",
    "password": "your-password",
    ...
}
```

### Step 2: Verify Setup
```powershell
.\automation\test-linkedin-bot.ps1
```
Should show all green checkmarks ✓

### Step 3: Run the Bot
```powershell
cd automation\repos\linkedin-job-apply-automation
node index.js
```

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
6. ✅ Submits applications automatically
7. ✅ Processes multiple pages (you control how many)

---

## ⚙️ Key Configuration Options

| Setting | Location | Default | Recommended |
|---------|----------|---------|-------------|
| Email/Password | `config.json` | (empty) | YOUR credentials |
| Job Keyword | `config.json` | Software Architect | Match your role |
| Location | `config.json` | UAE | Your target market |
| Pages | `config.json` | 3 | Start with 3-5 |
| Experience | `config.json` | 5 | Your YOE |

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
cd automation\repos\linkedin-job-apply-automation
npm install
```

### Chrome Not Found
```powershell
# Find your Chrome path
Get-ChildItem "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Update config.json with correct path
```

### Login Fails
- Check email/password in `config.json`
- LinkedIn may require 2FA (add manual step)
- Try logging in manually first

### Selectors Break
- LinkedIn updates UI frequently
- May need to update selectors in `index.js`
- Check GitHub repo for updates

---

## 📈 Advanced Usage

### Multiple Job Searches
Create separate config files:
```powershell
# config-architect.json
# config-engineer.json
node index.js config-architect.json
```

### Save Login Session (Optional)
In `index.js`, uncomment:
```javascript
userDataDir: "./userData",
```
Then change `baseURL` to `https://www.linkedin.com/feed`

### Schedule with Task Scheduler
Run daily at 9 AM to catch fresh postings

---

## 🔒 Security Checklist

- ✅ Never commit `config.json` with real credentials
- ✅ Use `.env` for production
- ✅ `.gitignore` is configured to exclude sensitive files
- ✅ Repos folder excluded from version control

---

## 📚 Documentation

- **Quick Start**: `automation/repos/linkedin-job-apply-automation/QUICKSTART.md`
- **Main README**: `automation/README.md`
- **Original Repo**: https://github.com/adnanedrief/linkedin-job-apply-automation

---

## 🎯 Your Next Actions

1. **Configure bot** with your LinkedIn credentials
   ```powershell
   .\automation\configure-linkedin-bot.ps1
   ```

2. **Run pre-flight check**
   ```powershell
   .\automation\test-linkedin-bot.ps1
   ```

3. **Test with 1 page first**
   - Edit `config.json`: Set `numberOfPagination: 1`
   - Run: `cd automation\repos\linkedin-job-apply-automation; node index.js`
   - Watch it work in the Chrome window

4. **Scale up gradually**
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

1. Check `QUICKSTART.md` in the bot folder
2. Review console output for errors
3. Run pre-flight check for diagnostics
4. Original repo issues: https://github.com/adnanedrief/linkedin-job-apply-automation/issues

---

**Good luck with your job search! 🚀**

Remember: This bot is a **tool to assist**, not replace your job search efforts. Always customize your applications for high-priority roles!
