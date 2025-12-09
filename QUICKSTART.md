# Quick Start - CV Job Search Toolkit

## 🚀 You're All Set!

Everything is installed and ready to use. Here's how to get started:

## Start the Web Panel (Recommended)

```bash
npm run panel
```

Then open your browser to: **http://localhost:3000/panel**

This gives you a modern web interface to:
- Manage target companies
- Generate personalized emails
- Run automation scripts
- Track applications
- View your CV data

## Essential Commands

### 1. Update Your CV Data
```bash
# After editing resumes/resume.md
npm run parse-cv
```

### 2. Generate Emails
```bash
# AI-powered personalized email
npm run smart-email "Software Engineer" "Tech Company"

# Template-based emails
npm run generate-emails

# Three tone variants (professional, enthusiastic, technical)
npm run email-variants "AI Engineer" "Startup Inc"
```

### 3. Search for Jobs
```bash
# Search Indeed UAE
npm run indeed-search "Software Engineer Dubai"

# Search LinkedIn Easy Apply
npm run linkedin-search "AI Engineer"

# Search all platforms
npm run job-search "Senior Developer"
```

### 4. Auto-fill Applications
```bash
# Universal auto-fill for any platform
npm run auto-fill apply "https://www.bayt.com/job/xyz"

# Indeed automation
npm run indeed-apply

# LinkedIn Easy Apply
npm run linkedin-apply
```

### 5. Track Applications
```bash
# View Indeed application stats
npm run indeed-stats

# Manage outreach campaigns
npm run outreach
```

## Your First 5 Minutes

1. **Start the panel**: `npm run panel`
2. **Open browser**: http://localhost:3000/panel
3. **Add a target company** in the Companies section
4. **Generate an email** for that company
5. **Check the emails/outreach/ folder** for your generated email

## What Each Command Does

| Command | What It Does |
|---------|--------------|
| `npm start` | Shows help menu |
| `npm run panel` | Starts web dashboard |
| `npm run parse-cv` | Extracts data from resume.md |
| `npm run generate-emails` | Creates template emails |
| `npm run smart-email` | AI-powered personalized email |
| `npm run job-agent` | Shows your profile |
| `npm run outreach` | Manages outreach campaigns |
| `npm run auto-fill` | Auto-fills job applications |
| `npm run clean-cache` | Cleans browser cache |

## Customization

### Update Your Profile
Edit `scripts/job-search-agent.js` to change:
- Your name, title, location
- Target salary range
- Skills and experience
- Target companies

### Customize Email Templates
Edit `scripts/email-templates.js` to modify email templates or add new ones.

### Configure Job Searches
Edit `scripts/job-search-agent.js` to adjust:
- Target roles
- Preferred platforms
- Search filters
- Company preferences

## Optional Features

### Enable AI-Powered Features
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### Enable WhatsApp Integration
```bash
npm install puppeteer
# Then restart the panel
```

## Troubleshooting

**Panel won't start?**
- Check if port 3000 is already in use
- Make sure all dependencies are installed: `npm install`

**No emails generated?**
- Check the `emails/generated/` or `emails/outreach/` directories
- Verify your CV is parsed: `npm run parse-cv`

**WhatsApp warning?**
- This is normal - WhatsApp integration is optional
- The panel works fine without it

## Need Help?

- **Full Documentation**: See `README.md`
- **Implementation Details**: See `IMPLEMENTATION-COMPLETE.md`
- **Recent Fixes**: See `FIXES-APPLIED.md`
- **Quick Reference**: See `QUICK-REFERENCE.md`

## Pro Tips

1. **Keep CV Updated**: Edit `resumes/resume.md` and run `npm run parse-cv` regularly
2. **Use the Panel**: The web interface is easier than command line for most tasks
3. **Track Everything**: Use the panel to track which companies you've contacted
4. **Personalize Emails**: AI-powered emails (`npm run smart-email`) are more effective
5. **Batch Process**: Generate emails for multiple companies at once in the panel

---

**You're ready to go! Start with `npm run panel` and explore the web interface.** 🎉
