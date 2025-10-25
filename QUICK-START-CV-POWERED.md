# Quick Start: CV-Powered Job Search

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Parse Your CV
```bash
npm run parse-cv
```
This reads your [resumes/resume.md](resumes/resume.md) and extracts all skills, experience, and keywords.

### 3. Search Jobs
```bash
# Search Indeed UAE
npm run indeed-search "Software Engineer"

# Search LinkedIn
npm run linkedin-search "AI Engineer"
```

### 4. Generate Personalized Email
```bash
npm run smart-email "Senior Developer" "Careem" "Full-stack with AI experience"
```

### 5. Auto-Fill Application
```bash
npm run auto-fill apply "https://www.bayt.com/job/..."
```

---

## 📋 Common Commands

### Job Search
```bash
# All platforms
npm run job-search "Software Engineer Dubai"

# Indeed only
npm run indeed-search "AI Engineer"

# LinkedIn only
npm run linkedin-search "Flutter Developer"
```

### Auto-Apply
```bash
# Indeed (DRY RUN - won't submit)
npm run indeed-apply

# LinkedIn Easy Apply
npm run linkedin-apply

# Any job URL with auto-fill
npm run auto-fill apply "<job-url>"
```

### Email Generation
```bash
# Single email (professional tone)
npm run smart-email "Position" "Company" "Description"

# Multiple tones (professional, enthusiastic, technical)
npm run email-variants "Position" "Company"

# Batch emails from JSON file
npm run batch-emails jobs-to-apply.json
```

### Application Tracking
```bash
# View statistics
npm run indeed-stats

# Check saved data
cat indeed-applications.json
cat linkedin-applications.json

# View generated emails
ls emails/generated/
```

---

## 🎯 Recommended Workflow

### Daily Job Search Routine

**Morning (30 min):**
```bash
# 1. Search jobs
npm run indeed-search "Software Engineer"
npm run linkedin-search "AI Engineer"

# 2. Review results in:
# - job-search-results.csv
# - indeed-matches.json
# - linkedin-matches.json
```

**Afternoon (1 hour):**
```bash
# 3. Collect 5-10 job URLs in job-urls.txt

# 4. Batch generate emails
npm run batch-emails jobs-to-apply.json

# 5. Review and send emails from emails/generated/
```

**Evening (1 hour):**
```bash
# 6. Apply to jobs with auto-fill
npm run auto-fill batch job-urls.txt

# 7. Review forms before submitting

# 8. Track progress
npm run indeed-stats
```

---

## 📝 File Structure

```
cv/
├── resumes/
│   ├── resume.md                    # Your main CV (source)
│   └── resume-fasil-2025.pdf        # PDF for uploads (create this)
├── scripts/
│   ├── cv-parser.js                 # CV data extraction
│   ├── indeed-auto-apply.js         # Indeed automation
│   ├── linkedin-auto-apply.js       # LinkedIn automation
│   ├── universal-auto-fill.js       # Universal form filler
│   └── smart-email-generator.js     # Email generator
├── emails/
│   └── generated/                   # Auto-generated emails
├── indeed-applications.json         # Indeed tracking
├── linkedin-applications.json       # LinkedIn tracking
├── job-search-results.csv          # Search results
├── job-urls.txt                    # Jobs to apply (create this)
└── jobs-to-apply.json              # Jobs for emails (create this)
```

---

## ⚙️ Configuration

### Set Your Preferences

Edit `scripts/job-search-agent.js`:
```javascript
salary: {
  minimum: 12000,    // Your minimum salary
  currency: "AED",
  preferred: 18000
}

targetRoles: [
  "Senior Software Engineer",
  "AI Engineer"
  // Add your target roles
]
```

### LinkedIn Credentials (Optional)

Set environment variables for LinkedIn automation:
```bash
export LINKEDIN_EMAIL=your@email.com
export LINKEDIN_PASSWORD=yourpassword
```

Or login manually when browser opens.

---

## 🎨 Email Tone Examples

### Professional (Default)
> I'm a Dubai-based Software Architect with 13+ years building production systems...

### Enthusiastic
> I'm thrilled to apply for this role! With 13+ years of hands-on experience...

### Technical
> As a Software Architect specializing in TypeScript/Node.js, Flutter, and AI/ML systems...

Generate all 3:
```bash
npm run email-variants "AI Engineer" "Careem"
```

---

## 📊 Understanding Match Scores

When searching jobs, each job gets a **match score** (0-100%):

- **70-100%**: 🎯 Excellent match - Apply immediately!
- **50-69%**: ✅ Good match - Strong candidate
- **30-49%**: 🤔 Possible match - Worth considering
- **<30%**: ⚠️ Weak match - Skip or customize heavily

Match score based on:
- Your CV skills vs. job requirements
- Experience level match
- Keyword overlap
- Industry relevance

---

## 🛠️ Troubleshooting

### "Resume not found"
```bash
# Ensure resume exists
ls resumes/resume.md

# Or create it from template
cp resumes/resume.md resumes/resume.md
```

### "Puppeteer not installed"
```bash
npm run install-puppeteer
```

### Form fields not filling
- Check if page loaded (wait longer)
- Try headless: false in script
- Inspect field names in browser

### LinkedIn login required
- Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD
- Or wait for browser, login manually

---

## 💡 Pro Tips

1. **Always test with dry run first**
   ```bash
   npm run indeed-apply  # Dry run by default
   ```

2. **Batch process for efficiency**
   - Collect 10-20 URLs
   - Run batch auto-fill
   - Review all, then submit

3. **Personalize emails**
   - Generated emails are templates
   - Add company research
   - Customize opening

4. **Track everything**
   ```bash
   npm run indeed-stats
   cat indeed-applications.json
   ```

5. **Update CV regularly**
   - Edit `resumes/resume.md`
   - Re-run `npm run parse-cv`
   - Better matching!

---

## 📈 Success Metrics

Track your job search success:

```javascript
// Applications
{
  "total": 45,
  "byStatus": {
    "applied": 35,
    "interview": 8,
    "offer": 2
  },
  "byPlatform": {
    "LinkedIn": 20,
    "Indeed": 15,
    "Bayt": 10
  }
}
```

View with:
```bash
npm run indeed-stats
```

---

## 🎯 Next Steps

1. ✅ Parse your CV
2. ✅ Search 3 platforms
3. ✅ Generate 5 personalized emails
4. ✅ Auto-fill 3 applications
5. ✅ Track everything

Then repeat daily!

---

## 📚 Full Documentation

For detailed information, see:
- [JOB-SEARCH-CV-INTEGRATION.md](JOB-SEARCH-CV-INTEGRATION.md) - Complete guide
- [README-JOB-SEARCH.md](README-JOB-SEARCH.md) - Job search overview
- Individual script help: `node scripts/<script>.js`

---

**Happy job hunting!** 🎉
