# What's New - CV Integration & Job Search Support

This workspace is now focused on safe, manual-review job search support for UAE roles. The old unattended auto-apply flows are disabled; the useful parts remain: CV parsing, profile text, application tracking, email generation, and form-fill assistance that stops before submission.

---

## Current Status

- Latest premium CV PDF is ready at `resumes/variants/resume-fasil-react-2025.pdf`.
- Upload-friendly copy is ready at `resumes/variants/Muhammed-Fasil-PV-Senior-Full-Stack-Engineer-UAE.pdf`.
- Platform copy for LinkedIn, Indeed, Bayt, Naukrigulf, GulfTalent and direct portals is in `docs/PLATFORM-CV-UPDATE.md`.
- UAE visa wording is updated to Visit Visa.
- LinkedIn/Indeed auto-submit automation is disabled for safety.
- Browser extension/form-fill tooling is manual review only.

---

## Active Capabilities

### CV Parser

Extracts structured profile data from the resume source for matching, form-fill support and generated summaries.

```bash
npm run parse-cv
```

### Smart Email Generator

Creates draft outreach emails from your CV data and job details. Review every draft before sending.

```bash
npm run smart-email "AI Engineer" "Careem"
npm run email-variants "Senior Developer" "Noon"
npm run batch-emails jobs-to-apply.json
```

### Manual Form-Fill Support

Helps fill common application fields on supported job portals, then leaves final review and submission to you.

```bash
npm run auto-fill apply "https://www.bayt.com/job/..."
npm run auto-fill batch job-urls.txt
```

### Platform Profile Updates

Use `docs/PLATFORM-CV-UPDATE.md` for ready-to-paste platform text:

- LinkedIn headline
- LinkedIn About
- Current experience block
- Indeed/Bayt/Naukrigulf summary
- Preferred roles and locations
- Skills to pin on job platforms

---

## Disabled Historical Automation

The following historical entrypoints remain only as disabled placeholders or reference files:

- `scripts/indeed-auto-apply.js`
- `scripts/linkedin-auto-apply.js`
- `scripts/job-search-playwright.js`
- `automation/run-linkedin-bot.ps1`
- `automation/test-linkedin-bot.ps1`

Do not use this workspace for unattended job applications, stealth browser behavior, credential storage, or automatic submission. Applications should be reviewed manually before sending.

---

## Recommended Daily Workflow

### Morning

1. Search jobs manually on LinkedIn, Indeed, Bayt, Naukrigulf, GulfTalent and direct company portals.
2. Save good job URLs and job descriptions.
3. Compare each role against the latest CV and target skills.

### Afternoon

1. Generate tailored email or cover-letter drafts.
2. Update each draft with company-specific details.
3. Upload the premium PDF and complete forms manually.

### Evening

1. Track submitted applications.
2. Follow up with recruiters where appropriate.
3. Improve CV/project wording based on recurring job requirements.

---

## Current Resume Positioning

- Senior Full-Stack Engineer
- React, Flutter, Node.js, TypeScript and Python
- AI, IoT, ERP, POS, QMS and retail technology platforms
- Dubai based, Visit Visa, immediately available
- Target locations: Dubai, Abu Dhabi and Sharjah

---

## Key Files

- `resumes/variants/resume-fasil-react-2025.html` - premium HTML CV source
- `resumes/variants/resume-fasil-react-2025.pdf` - main generated PDF
- `resumes/variants/Muhammed-Fasil-PV-Senior-Full-Stack-Engineer-UAE.pdf` - upload-friendly PDF copy
- `resumes/variants/resume-uae.md` - UAE-targeted markdown variant
- `data/cv-data.json` - structured CV data
- `cv-parsed-data.json` - parsed profile data
- `docs/PLATFORM-CV-UPDATE.md` - platform copy and profile text

---

## Notes

Keep generated emails and platform text truthful and specific. Public GitHub work can support credibility, but private/client project claims should stay grounded in real delivery experience and should not expose confidential details.
