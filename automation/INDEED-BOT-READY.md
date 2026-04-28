# Indeed Bot - Ready to Use! 🚀

## ✅ Installation Complete

- **Python Dependencies**: ✅ Installed
- **Playwright Browsers**: ✅ Installed (Firefox)
- **Configuration**: ✅ Set for Dubai React Developer jobs
- **Bot Status**: 🔵 Waiting for first-time login

---

## 📋 Configuration

```yaml
Search Terms: React Developer
Location: Dubai
Website: ae.indeed.com
Job Volume: 50 jobs (5 pages)
Filter: Easily apply jobs only
```

---

## 🚀 Quick Start

### First Run (Manual Login)

1. **Open Terminal** in bot directory:

   ```powershell
   cd E:\cv\automation\repos\indeed_bot
   ```

2. **Launch Bot**:

   ```powershell
   python indeed_bot.py
   ```

3. **Firefox will open** showing Indeed login page

4. **Log in manually**:
   - Enter your Indeed email/password
   - Complete any security checks
   - **Upload your CV** if not already done
   - **Complete your profile** (name, phone, Dubai address)

5. **Press `Ctrl+C`** in the terminal when logged in
   - Bot will save your session automatically
   - Message will confirm: "Session saved to user_data_dir/cookies.json"

### Subsequent Runs (Auto-Apply)

1. **Launch bot again**:

   ```powershell
   cd E:\cv\automation\repos\indeed_bot
   python indeed_bot.py
   ```

2. **Bot will**:
   - Load your saved session (no login needed)
   - Search for "React Developer" jobs in Dubai
   - Filter for "Easily apply" jobs only
   - Auto-apply to up to 50 jobs
   - Save results to `indeed_apply.log`

3. **Duration**: Approximately 15-30 minutes for 50 jobs

---

## 🛠️ How It Works

### Job Detection

- Searches `ae.indeed.com` for React Developer jobs in Dubai
- Only processes jobs with "Easily apply" button
- Skips jobs requiring external applications

### Application Process

1. Opens each "Easily apply" job
2. Clicks "Apply now" button
3. Navigates through application wizard
4. Auto-selects uploaded resume
5. Submits application
6. Logs success/failure
7. Moves to next job

### Session Management

- First run: Manual login → saves cookies
- Next runs: Loads saved cookies (no login)
- Session persists across runs
- Stored in: `user_data_dir/cookies.json`

---

## 📊 Output & Logs

### Terminal Output

```
Token found, proceeding with job search...
Visiting URL: https://ae.indeed.com/jobs?q=React+Developer&l=Dubai&start=0
Waiting for page to load...
Found 8 Indeed Apply jobs on this page.
Applying to: https://ae.indeed.com/viewjob?jk=abc123
Applied successfully to https://ae.indeed.com/viewjob?jk=abc123
...
Total Indeed Apply jobs found: 42
Session saved. Applied to 42 jobs!
```

### Log File

- Location: `indeed_apply.log`
- Format: Timestamped entries
- Contains: URLs, success/failure, errors

Example:

```
2025-01-24 14:30:15 INFO: Applied successfully to https://ae.indeed.com/viewjob?jk=abc123
2025-01-24 14:32:48 WARNING: No Indeed Apply button found for https://ae.indeed.com/viewjob?jk=def456
2025-01-24 14:35:22 ERROR: Error applying to https://ae.indeed.com/viewjob?jk=ghi789: Timeout
```

---

## ⚙️ Customization

### Change Search Parameters

Edit `config.yaml`:

```yaml
search:
  # Modify search terms (URL encoded)
  base_url: "https://ae.indeed.com/jobs?q=Flutter+Developer&l=Abu+Dhabi"

  start: 0
  end: 100  # Process up to 100 jobs (10 pages)

camoufox:
  user_data_dir: "user_data_dir"
  language: "ae"  # Change for different countries: us, uk, sa, etc.
```

### Common Search Modifications

**Different Job Title**:

```yaml
base_url: "https://ae.indeed.com/jobs?q=Full+Stack+Developer&l=Dubai"
```

**Different Location**:

```yaml
base_url: "https://ae.indeed.com/jobs?q=React+Developer&l=Abu+Dhabi"
```

**More Jobs**:

```yaml
end: 200  # Process 200 jobs (20 pages)
```

**Different Country**:

```yaml
base_url: "https://sa.indeed.com/jobs?q=React+Developer&l=Riyadh"
language: "sa"
```

---

## 🐛 Troubleshooting

### Issue: "Token not found"

**Solution**: You need to log in first. Run bot, log in manually, press Ctrl+C, then run again.

### Issue: "Found 0 Indeed Apply jobs"

**Solutions**:

1. Try broader search terms (e.g., "Developer" instead of "React Developer")
2. Remove date filters from URL
3. Check if jobs exist manually on Indeed
4. Not all jobs have "Easily apply" - this is normal

### Issue: Browser closes immediately

**Solution**: This was fixed! Bot now uses regular Firefox (not Camoufox). Session is saved via cookies.

### Issue: "Navigation interrupted"

**Solution**: This is normal for Indeed redirects. Bot handles it automatically with `domcontentloaded` wait.

### Issue: Applications failing

**Solutions**:

1. Ensure CV is uploaded to Indeed
2. Complete your Indeed profile fully
3. Check `indeed_apply.log` for specific errors
4. Some jobs may have additional questions - bot will skip these

---

## ⚠️ Important Notes

### Requirements

- ✅ Indeed account with completed profile
- ✅ CV uploaded to Indeed
- ✅ Profile must have: name, phone, address in Dubai
- ✅ Firefox browser (installed automatically by Playwright)

### Limitations

- **Only "Easily apply" jobs**: Cannot apply to jobs requiring external applications
- **Simple forms only**: Jobs with extensive questionnaires may be skipped
- **Rate limiting**: Indeed may slow down or block after many applications
- **Detection**: Using regular Firefox (not anti-detection), so apply in moderation

### Best Practices

1. **Start small**: Test with 20-30 jobs first (`end: 30`)
2. **Monitor first run**: Watch Firefox to ensure applications work correctly
3. **Check logs**: Review `indeed_apply.log` after each run
4. **Pace yourself**: Don't apply to 100s of jobs daily (may trigger Indeed limits)
5. **Update profile**: Keep CV and Indeed profile current

### Terms of Service Warning

⚠️ **Using automation bots may violate Indeed's Terms of Service**

- Use at your own risk
- Indeed may detect and block automated applications
- Your account could be suspended
- Consider using manually for important applications

---

## 📞 Quick Commands

```powershell
# Navigate to bot directory
cd E:\cv\automation\repos\indeed_bot

# First run (manual login)
python indeed_bot.py
# Then Ctrl+C after login

# Auto-apply run
python indeed_bot.py

# View logs
cat indeed_apply.log

# Clear session (force new login)
Remove-Item user_data_dir/cookies.json

# Reconfigure bot
cd E:\cv\automation
.\configure-indeed-bot.ps1

# Run pre-flight check
.\test-indeed-bot.ps1
```

---

## 🎯 Both Bots Overview

| Bot | Status | Search | Location | Volume | Notes |
|-----|--------|--------|----------|--------|-------|
| **LinkedIn** | ✅ Ready | React/Flutter/AI Developer | Dubai | 125 jobs | Uses Puppeteer + Chrome |
| **Indeed** | ✅ Ready | React Developer | Dubai | 50 jobs | Uses Playwright + Firefox |

### Running Both Bots

**Option 1: Sequential** (safer, easier to monitor)

```powershell
# Run LinkedIn bot first
.\automation\run-linkedin-bot.ps1

# After LinkedIn finishes, run Indeed bot
.\automation\run-indeed-bot.ps1
```

**Option 2: Parallel** (faster, but harder to monitor)

```powershell
# Terminal 1: LinkedIn
.\automation\run-linkedin-bot.ps1

# Terminal 2: Indeed (new terminal window)
.\automation\run-indeed-bot.ps1
```

---

## 📚 Additional Resources

- **Configuration Helper**: `automation\configure-indeed-bot.ps1`
- **Pre-flight Check**: `automation\test-indeed-bot.ps1`
- **Main README**: `automation\README.md`
- **Action Plan**: `automation\ACTION-PLAN.md`
- **Original Repo**: [meteor314/indeed_bot](https://github.com/meteor314/indeed_bot)

---

## ✨ Success Checklist

- [ ] Python 3.10+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Playwright browsers installed (`playwright install`)
- [ ] Config updated for your search preferences
- [ ] Indeed account created
- [ ] CV uploaded to Indeed
- [ ] Profile completed (name, phone, Dubai address)
- [ ] First run completed (manual login + Ctrl+C)
- [ ] Session saved (`user_data_dir/cookies.json` exists)
- [ ] Auto-apply run successful
- [ ] Logs reviewed (`indeed_apply.log`)

---

🎉 **You're all set! The Indeed bot is ready to auto-apply to React Developer jobs in Dubai!**

Run `python indeed_bot.py` to start applying! 🚀
