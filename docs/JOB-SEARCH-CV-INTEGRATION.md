# Job Search CV Integration Guide

## Overview

Your job search automation toolkit now includes **CV-powered features** that automatically use your resume data for:

- **Smart job matching** - Finds jobs that match your skills
- **Auto-fill application forms** - Fills forms across Indeed, LinkedIn, Bayt, and more
- **Personalized emails** - Generates custom emails highlighting relevant experience
- **Application tracking** - Tracks all applications with analytics

## New Features

### 1. CV Parser (`cv-parser.js`)

Extracts structured data from your [resume.md](resumes/resume.md):

- Personal information (name, email, phone, location)
- Skills categorized by type (languages, frameworks, AI, IoT, etc.)
- Work experience with responsibilities
- Projects and achievements
- Keywords for job matching

**Usage:**
```bash
npm run parse-cv
```

**Output:**
- Displays parsed CV data
- Saves to `cv-parsed-data.json`
- Shows recommended job search keywords

---

### 2. Indeed Automation

The old Indeed auto-apply flow has been disabled in this workspace.
Keep using CV parsing, resume generation, and manual application tracking instead.

**What gets auto-filled:**
- Name, email, phone
- Current job title
- Location (Dubai, UAE)
- LinkedIn, GitHub, portfolio URLs
- Years of experience (13+)
- Expected salary (12,000+ AED)
- Skills summary
- Work authorization status

---

### 3. LinkedIn Automation

The old LinkedIn auto-apply flow has been disabled in this workspace.
Use manual applications and keep this repository focused on resume data, matching, and outreach support.

**LinkedIn Auto-Fill:**
- Phone number
- LinkedIn profile
- Portfolio website
- Work authorization
- All multi-step form fields

---

### 4. Universal Auto-Fill (`universal-auto-fill.js`)

Works across **all job platforms**: Bayt, Naukrigulf, GulfTalent, and generic forms.

**Features:**
- Platform-agnostic form detection
- Smart field matching
- Resume upload
- Batch processing

**Usage:**
```bash
# Auto-fill a single job application
npm run auto-fill apply "https://www.bayt.com/job/..."

# Batch apply from a file
npm run auto-fill batch job-urls.txt

# Test CV extraction
npm run auto-fill test-cv
```

**Create `job-urls.txt`:**
```
https://www.bayt.com/en/uae/jobs/software-engineer-12345/
https://www.naukrigulf.com/job-listing-123456
https://www.gulftalent.com/job/12345
```

**Supported Fields:**
- Personal: First name, last name, email, phone
- Location: City, country
- Professional: Job title, years of experience
- Links: LinkedIn, GitHub, portfolio
- Salary: Expected salary
- Notice period
- Summary/cover letter

---

### 5. Smart Email Generator (`smart-email-generator.js`)

Generates **personalized job application emails** with CV-based skill matching.

**Features:**
- Analyzes job description vs. your CV
- Highlights relevant skills and experience
- Selects matching projects
- Multiple tone options (professional, enthusiastic, technical)
- Batch email generation

**Usage:**
```bash
# Generate a single email
npm run smart-email "AI Engineer" "Careem" "Looking for AI/ML developer"

# Generate 3 tone variants
npm run email-variants "Senior Developer" "Noon"

# Batch generate from jobs file
npm run batch-emails jobs-to-apply.json
```

**Create `jobs-to-apply.json`:**
```json
[
  {
    "title": "Senior Software Engineer",
    "company": "Careem",
    "description": "Full-stack engineer with AI/ML experience",
    "requirements": "Node.js, Python, Docker, AI"
  },
  {
    "title": "Flutter Developer",
    "company": "Noon",
    "description": "Mobile app development with MVVM",
    "requirements": "Flutter, Dart, Firebase"
  }
]
```

**Email Customization:**
- **Professional tone**: Balanced, concise
- **Enthusiastic tone**: Energetic, passionate
- **Technical tone**: Deep technical focus

**Output:**
- Emails saved to `emails/generated/`
- Preview shown in console
- Ready to copy-paste into email client

---

## Complete Workflow

### Step 1: Parse Your CV
```bash
npm run parse-cv
```
This extracts all your skills, experience, and keywords.

### Step 2: Search Jobs
```bash
# Search Indeed
npm run indeed-search "Software Engineer Dubai"

# Search LinkedIn
npm run linkedin-search "AI Engineer Dubai"

# Search all platforms
npm run job-search "Senior Developer Dubai"
```

### Step 3: Apply to Jobs

**Option A: Automated (DRY RUN recommended first)**
```bash
# Indeed (dry run by default)
npm run indeed-apply

# LinkedIn Easy Apply
npm run linkedin-apply
```

**Option B: Manual with Auto-Fill**
```bash
# Single application
npm run auto-fill apply "https://www.bayt.com/job/..."

# Batch applications
npm run auto-fill batch job-urls.txt
```

### Step 4: Generate Personalized Emails
```bash
# For each job, generate custom email
npm run smart-email "Position Title" "Company Name" "Job description..."

# Or batch generate
npm run batch-emails jobs-to-apply.json
```

### Step 5: Track Applications
```bash
# View Indeed applications
npm run indeed-stats

# Check generated emails
ls emails/generated/

# View application data
cat indeed-applications.json
cat linkedin-applications.json
```

---

## Configuration

### Resume Location
All scripts read from: `resumes/resume.md`

For resume upload, uses: `resumes/resume-fasil-2025.pdf` (create this file)

### Customization

**Edit your search preferences in:**
- `scripts/job-search-agent.js` - Main profile and search queries
- Disabled automation entrypoints remain only as placeholders and should not be used

**Salary expectations:**
```javascript
salary: {
  minimum: 12000,
  currency: "AED",
  preferred: 18000
}
```

**Target roles:**
```javascript
targetRoles: [
  "Senior Software Engineer",
  "AI Engineer",
  "Solutions Architect"
  // Add more...
]
```

---

## Application Tracking

### Indeed Applications
**File:** `indeed-applications.json`

**Fields tracked:**
- Job title, company, location
- Application date
- Status (applied, interview, rejected, offer)
- Match score
- Matched skills
- Job URL

### LinkedIn Applications
**File:** `linkedin-applications.json`

**Fields tracked:**
- Same as Indeed
- Easy Apply method
- Connection requests sent

### View Statistics
```bash
npm run indeed-stats
```

---

## Tips for Success

### 1. Keep Resume Updated
Update `resumes/resume.md` regularly. The CV parser extracts:
- All your skills
- Recent projects
- Current experience
- Contact information

### 2. Use Match Scores
Jobs with 40%+ match score are good candidates:
- 70-100%: Excellent match
- 50-69%: Good match
- 30-49%: Possible match
- <30%: Weak match

### 3. Test First (Dry Run)
All automation scripts support dry run mode:
```bash
# Forms filled but NOT submitted
npm run indeed-apply  # Dry run by default
npm run linkedin-apply  # Dry run by default
```

### 4. Customize Emails
Generated emails are templates. Always:
- Review before sending
- Add company-specific research
- Personalize the greeting
- Attach your PDF resume

### 5. Batch Processing
For efficiency:
1. Collect 10-20 job URLs
2. Save to `job-urls.txt`
3. Run batch auto-fill
4. Generate batch emails
5. Review and submit

---

## Troubleshooting

### CV Parser Issues
**Problem:** Skills not detected correctly

**Solution:** Check `resumes/resume.md` formatting:
- Skills should be in "Core Competencies" or "Technical Skills" sections
- Use bullet points or tables
- Keywords should be clearly separated

### Auto-Fill Not Working
**Problem:** Form fields not filled

**Solution:**
- Check if page loaded completely (increase timeout)
- Inspect form field names (different per platform)
- Try manual fill first, then check browser console

### LinkedIn Login Required
**Problem:** LinkedIn asks for manual login

**Solution:**
1. Set environment variables OR
2. Wait for browser to open, login manually
3. Script continues after login

### Resume Upload Fails
**Problem:** PDF not uploaded

**Solution:**
- Ensure `resumes/resume-fasil-2025.pdf` exists
- Check file size (<2MB recommended)
- Verify file path in config

---

## Advanced Features

### Custom Form Field Mapping
Edit `scripts/universal-auto-fill.js`:

```javascript
const FIELD_SELECTORS = {
  customField: [
    'input[name*="custom" i]',
    'input[id*="custom" i]'
  ]
}
```

### Job Match Algorithm
Customize in `scripts/cv-parser.js`:

```javascript
function matchJobWithCV(jobDescription, cvData) {
  // Adjust scoring logic
  // Add custom keyword weights
  // Filter by categories
}
```

### Email Template Customization
Edit `scripts/smart-email-generator.js`:

```javascript
function buildOpening(jobData, cvData, tone) {
  // Customize opening paragraph
  // Add company-specific intros
}
```

---

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run parse-cv` | Parse resume.md and extract CV data |
| `npm run indeed-search` | Search jobs on Indeed UAE |
| `npm run indeed-apply` | Auto-apply to Indeed jobs (dry run) |
| `npm run indeed-stats` | View Indeed application statistics |
| `npm run linkedin-search` | Search LinkedIn Easy Apply jobs |
| `npm run linkedin-apply` | Auto-apply to LinkedIn jobs |
| `npm run auto-fill` | Universal form auto-fill for any platform |
| `npm run smart-email` | Generate personalized job email |
| `npm run email-variants` | Generate email in 3 different tones |
| `npm run batch-emails` | Generate emails for multiple jobs |
| `npm run job-search` | Search all platforms (LinkedIn, Indeed, Bayt) |
| `npm run clean-cache` | Clean Puppeteer cache |

---

## Next Steps

1. **Create PDF Resume**
   - Export `resumes/resume.md` to PDF
   - Save as `resumes/resume-fasil-2025.pdf`

2. **Test CV Parser**
   ```bash
   npm run parse-cv
   ```

3. **Test Auto-Fill**
   ```bash
   npm run auto-fill test-cv
   ```

4. **Search Jobs**
   ```bash
   npm run indeed-search "Software Engineer"
   ```

5. **Generate Sample Email**
   ```bash
   npm run smart-email "AI Engineer" "Careem"
   ```

6. **Start Applying!**
   - Collect job URLs
   - Use auto-fill for applications
   - Generate personalized emails
   - Track everything

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review individual script help: `node scripts/<script-name>.js`
- Inspect browser console during automation

**Good luck with your job search!** 🚀
