# CV & Job Search Toolkit

> **Node.js application for automated job search, email generation, and application tracking**
> Muhammed Fasil PV - Software Engineer - Dubai, UAE

## 🚀 Quick Start

```bash
# Install dependencies (if any are added)
npm install

# Show help menu
npm start

# Generate job application emails
npm run generate-emails

# View job search profile
npm run job-agent

# Clean Puppeteer cache
npm run clean-cache
```

## 📁 Project Structure

```
cv/
├── index.js                        # Main entry point
├── package.json                    # Node.js configuration
│
├── scripts/                        # Node.js utility scripts
│   ├── generate-job-emails.js      # Email generator CLI
│   ├── email-templates.js          # Email template library
│   ├── job-search-agent.js         # Profile & search config
│   └── delete-puppeteer-cache.js   # Cache cleanup
│
├── resumes/                        # Resume files
│   ├── resume.md                   # Master resume (ATS-friendly)
│   └── variants/                   # Role-specific variants
│
├── cover-letters/                  # Cover letter templates
│   ├── cover-letter-template.md
│   └── *.md                        # Role-specific letters
│
├── automation/                     # Job application bots
│   └── repos/                      # LinkedIn/Indeed bots
│
├── public/                         # Static website
│   ├── index.html                  # Landing page
│   ├── cv.html                     # Web resume
│   └── imgserver/                  # Image hosting service
│
└── docs/                          # Documentation
    ├── QUICK-START.md
    ├── AZURE-DEPLOYMENT.md
    └── *.md
```

## 🛠️ Features

### Email Generation

- **6 Professional Templates**: General, Referral, Follow-up, Recruiter, Executive, Thank You
- **Pre-configured Profile**: Auto-populated with your skills and experience
- **Dubai-focused**: Targeted at UAE tech companies (12K+ AED positions)
- **Copy-ready**: Generated emails ready to paste into email client

### Job Search Management

- **Target Companies**: Pre-loaded list of Dubai tech companies
- **Salary Tracking**: Configured for 12K+ AED positions
- **Multi-platform**: LinkedIn, Bayt, Indeed, GulfTalent support
- **Application Tracking**: Template for tracking applications

### Automation

- **LinkedIn Bot**: Automated job applications
- **Indeed Bot**: Automated job applications
- **Custom Scripts**: PowerShell utilities for setup

## 📧 Email Templates

### Available Templates

1. **General Application** - Standard job application email
2. **Referral Email** - Connection/referral requests
3. **Follow-up Email** - Post-application follow-up
4. **Recruiter Outreach** - LinkedIn InMail/recruiter contact
5. **Executive Outreach** - Direct CEO/CTO contact
6. **Thank You Email** - Post-interview thank you

### Usage Example

```javascript
const { generateEmail } = require('./scripts/email-templates');

const email = generateEmail('general', {
  company: 'Careem',
  position: 'Senior Software Engineer - AI',
  jobUrl: 'https://careers.careem.com/job/123'
});

console.log(email);
```

## 🎯 Target Profile

- **Name**: Muhammed Fasil PV
- **Title**: Software Engineer | AI & IoT Systems Engineer
- **Location**: Dubai, UAE
- **Experience**: 13+ years
- **Salary Range**: 12,000 - 18,000 AED
- **Skills**: Flutter, Node.js, AI/ML, IoT, Python, .NET, Docker

## 📝 Resume Management

### Master Resume

- **File**: `resumes/resume.md`
- **Format**: Markdown (ATS-friendly)
- **Purpose**: Single source of truth for all resume variants

### Resume Variants

Located in `resumes/variants/`:

- `resume-fasil-ai-2025.html` - AI/ML focused
- `resume-fasil-dotnet-wpf-2025.html` - .NET/WPF focused
- `resume-fasil-flutter-2025.html` - Flutter/Mobile focused
- `resume-fasil-iot-2025.html` - IoT focused
- `resume-fasil-nodejs-2025.html` - Node.js focused
- `resume-fasil-react-2025.html` - React focused

### Cover Letters

Located in `cover-letters/`:

- `cover-letter-template.md` - Base template
- Role-specific cover letters (AWS, Emirates, Oracle, etc.)

## 🖨️ Export to PDF (Windows, VS Code)

Option 1 — VS Code extension:

1. Install “Markdown PDF” (yzane.markdown-pdf).
2. Open `resumes/resume.md` (ATS) or `resumes/variants/resume-visual.md` (styled).
3. Right‑click → “Markdown PDF: Export (pdf)”.

Option 2 — Print to PDF:

1. Open the Markdown preview (Ctrl+Shift+V).
2. Use your browser’s Print → Save as PDF (set margins to Narrow, scale ~90–95% if needed).

Option 3 — Pandoc (if installed):

```powershell
# Export ATS master to PDF (requires pandoc + a PDF engine like wkhtmltopdf or LaTeX)
pandoc "e:\cv\resumes\resume.md" -o "e:\cv\resumes\resume.pdf"

# Export visual variant to PDF
pandoc "e:\cv\resumes\variants\resume-visual.md" -o "e:\cv\resumes\variants\resume-visual.pdf"
```

## ⚙️ Configuration

### Update Your Profile

Edit `scripts/job-search-agent.js` to customize:

```javascript
const profile = {
  name: "Your Name",
  title: "Your Title",
  location: "Your Location",
  email: "your@email.com",
  phone: "+971 XXX XXX XXX",
  // ... other settings
};
```

### Customize Email Templates

Edit `scripts/email-templates.js` to modify email templates, add new templates, or update messaging.

### Add Target Companies

Update the `targetCompanies` array in `scripts/job-search-agent.js`:

```javascript
targetCompanies: [
  "Your Target Company 1",
  "Your Target Company 2",
  // ...
]
```

## 🌐 Website Deployment

The `public/` folder contains a static website with your resume:

- **Landing Page**: `public/index.html`
- **Web Resume**: `public/cv.html`
- **Image Server**: `public/imgserver/` (Azure Function)

Deploy to Azure Static Web Apps:

```bash
cd scripts
.\deploy-azure.ps1
```

## 🤖 Automation Bots

Located in `automation/repos/`:

### LinkedIn Bot

- Automated LinkedIn Easy Apply
- Configuration: `automation/repos/EasyApplyBot/config.yaml`

### Indeed Bot

- Automated Indeed applications
- Configuration: `automation/repos/indeed_bot/config.yaml`

Setup instructions: See `automation/README.md`

## 📊 Job Tracking

Use `job-tracker-uae.csv` to track applications:

- Company name
- Position
- Application date
- Status
- Follow-up dates
- Notes

## 🔗 Quick Links

- **Website**: <https://faztrick.com>
- **LinkedIn**: <https://linkedin.com/in/faztrick>
- **GitHub**: <https://github.com/faztrick>
- **Email**: <faztrick@gmail.com>
- **Phone**: +971 555923545

## 💡 Tips for Success

1. **Customize Each Application**
   - Research the company before applying
   - Tailor email templates to specific roles
   - Highlight relevant experience

2. **Track Everything**
   - Update `job-tracker-uae.csv` after each application
   - Set follow-up reminders (5-7 days)
   - Keep notes on each interaction

3. **Optimize for ATS**
   - Use `resumes/resume.md` for job portals
   - Mirror job description keywords
   - Keep formatting simple

4. **Network Actively**
   - Use referral and recruiter email templates
   - Connect with hiring managers on LinkedIn
   - Engage with company content

5. **Follow Up**
   - Send follow-up emails after 5-7 days
   - Thank interviewers within 24 hours
   - Stay professional and persistent

## 📋 Next Steps

1. ✅ Update profile in `scripts/job-search-agent.js`
2. ✅ Generate test emails with `npm run generate-emails`
3. ✅ Create role-specific resume variants
4. ✅ Set up automation bots (optional)
5. ✅ Start applying and tracking applications
6. ✅ Follow up on applications regularly

## 🛠️ Development

### Requirements

- Node.js >= 14.0.0
- PowerShell (for automation scripts)
- Azure CLI (for deployment)

### Install Dependencies

```bash
npm install
```

### Run Scripts

```bash
# Email generation
npm run generate-emails

# Job agent
npm run job-agent

# Clean cache
npm run clean-cache
```

## 📄 License

ISC

---

**Built with ❤️ by Muhammed Fasil PV**
*Software Engineer | AI & IoT Systems Engineer*
