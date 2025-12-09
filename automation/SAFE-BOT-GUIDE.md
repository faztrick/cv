# 🛡️ SAFE Job Application Automation - Quick Reference

## ✅ What's Set Up

| Bot | Platform | Language | Status | Safety Level |
|-----|----------|----------|--------|--------------|
| **LinkedIn SAFE** | LinkedIn Easy Apply | Node.js | ✅ Ready | 🛡️ HIGHEST |
| **EasyApplyBot** | LinkedIn Easy Apply | Python | ✅ Ready | 🟡 Medium |
| **Indeed Bot** | Indeed Apply | Python | ✅ Ready | 🛡️ HIGH |

---

## 🚀 Quick Start

### Option 1: Use the Launcher (RECOMMENDED)

```powershell
cd I:\projects\cv\automation
.\launch-safe-bots.ps1
```

### Option 2: Run Individual Bots

**LinkedIn SAFE Bot (Best for avoiding bans):**

```powershell
cd I:\projects\cv\automation\repos\linkedin-job-apply-automation
# First: Edit config.json with your credentials
node index-safe.js
```

**LinkedIn EasyApplyBot (More features):**

```powershell
cd I:\projects\cv\automation\repos\EasyApplyBot
# First: Edit config.yaml with your credentials
python main.py
```

**Indeed Bot:**

```powershell
cd I:\projects\cv\automation\repos\indeed_bot
python indeed_bot.py
```

---

## ⚙️ Configuration Files

### 1. LinkedIn Node.js Bot

**File:** `automation/repos/linkedin-job-apply-automation/config.json`

```json
{
    "email": "YOUR_LINKEDIN_EMAIL",      ← Add your email
    "password": "YOUR_LINKEDIN_PASSWORD", ← Add your password
    "keyword": "Software Engineer",       ← Change job title
    "location": "United Arab Emirates",   ← Change location
    "numberOfPagination": 3               ← Keep low (3-5)
}
```

### 2. LinkedIn Python Bot

**File:** `automation/repos/EasyApplyBot/config.yaml`

```yaml
email: YOUR_EMAIL           ← Add your email
password: YOUR_PASSWORD     ← Add your password
positions:
  - Software Engineer       ← Add more job titles
  - Senior Software Engineer
locations:
  - United Arab Emirates    ← Add more locations
  - Dubai
```

### 3. Indeed Bot

**File:** `automation/repos/indeed_bot/config.yaml`

```yaml
search:
  base_url: "https://ae.indeed.com/jobs?q=software+engineer&l=Dubai..."
  end: 20                   ← Keep low (20-30)
```

---

## 🛡️ Anti-Ban Features

### LinkedIn SAFE Bot (index-safe.js)

- ✅ **Stealth Plugin** - Bypasses bot detection
- ✅ **Random Delays** - 2-10 seconds between actions
- ✅ **Human-like Typing** - Variable typing speed
- ✅ **Session Persistence** - Saves login (fewer logins = safer)
- ✅ **Max 10 Applications** - Auto-stops after limit
- ✅ **Break Every 5 Apps** - 30-60 second pause

### Indeed Bot

- ✅ **Camoufox** - Anti-detection browser
- ✅ **Session Storage** - Remembers login
- ✅ **Low Volume** - Max 20 per session

---

## 📋 Daily Safe Schedule

| Time | Action | Bot | Volume |
|------|--------|-----|--------|
| 8-9 AM | LinkedIn Easy Apply | SAFE Bot | 5-10 jobs |
| 12-1 PM | Indeed Apply | Indeed Bot | 10-15 jobs |
| 6-7 PM | LinkedIn (different keyword) | SAFE Bot | 5-10 jobs |

**Total: ~20-35 applications/day** (SAFE limit)

---

## ⚠️ Critical Rules to Avoid Bans

1. **Never run more than 1 bot at a time**
2. **Maximum 20-30 applications per platform per day**
3. **Wait 2-3 hours between sessions**
4. **Run during business hours (looks natural)**
5. **Solve CAPTCHAs immediately when they appear**
6. **Review and customize high-priority applications manually**
7. **Don't run 7 days a week - take breaks**

---

## 🔧 Troubleshooting

### "Credentials not found"

- Edit the config file with your actual email/password

### "Chrome not found"

- Install Chrome or update the path in config

### "CAPTCHA appeared"

- Solve it manually, bot will continue

### "Account locked"

- Stop bot immediately
- Log in manually and verify identity
- Wait 24-48 hours before running again

### "Bot stopped/crashed"

- Check console for error message
- LinkedIn may have changed their UI
- Update selectors or wait for bot update

---

## 📊 Your Configured Settings

**Target Positions:**

- Software Engineer
- Senior Software Engineer
- Full Stack Developer
- AI Engineer
- Flutter Developer
- Solutions Architect
- IoT Engineer

**Target Location:** United Arab Emirates, Dubai

**Your Profile:**

- Name: Muhammed Fasil PV
- Experience: 13+ years
- Phone: +971 555923545
- Website: uaecodes.com
- LinkedIn: linkedin.com/in/faztrick

---

## 📂 File Locations

```
I:\projects\cv\automation\
├── launch-safe-bots.ps1          ← START HERE
├── repos\
│   ├── linkedin-job-apply-automation\
│   │   ├── config.json           ← LinkedIn Node config
│   │   ├── index.js              ← Original bot
│   │   └── index-safe.js         ← SAFE bot ⭐
│   ├── EasyApplyBot\
│   │   ├── config.yaml           ← LinkedIn Python config
│   │   └── main.py               ← Run this
│   └── indeed_bot\
│       ├── config.yaml           ← Indeed config
│       └── indeed_bot.py         ← Run this
```

---

## 🎯 Next Steps

1. ✅ **Add your LinkedIn credentials** to config files
2. ✅ **Run the launcher:** `.\automation\launch-safe-bots.ps1`
3. ✅ **Watch first 5 applications** to ensure it works
4. ✅ **Solve any CAPTCHAs** that appear
5. ✅ **Track applied jobs** in your tracker

Good luck with your job search! 🚀
