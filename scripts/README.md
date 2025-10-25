# Scripts Directory

This folder contains Node.js utility scripts for job search automation and email generation.

## Available Scripts

### 📧 generate-job-emails.js

Interactive CLI tool to generate personalized job application emails.

**Usage:**

```bash
npm run generate-emails
# or
node scripts/generate-job-emails.js
```

**Features:**

- Generates emails for sample Dubai tech companies
- Multiple email templates (general, recruiter, follow-up, etc.)
- Pre-configured with profile data
- Ready-to-copy email content

### 👤 job-search-agent.js

Profile configuration and job search data.

**Usage:**

```bash
npm run job-agent
# or
node scripts/job-search-agent.js
```

**Contains:**

- Personal profile and skills
- Target companies and roles
- Salary expectations
- Job search platforms
- Search query templates

### 📝 email-templates.js

Email template library for various job application scenarios.

**Templates:**

1. **General Application** - Standard job application
2. **Referral Email** - Connection/referral requests
3. **Follow-up Email** - Post-application follow-up
4. **Recruiter Outreach** - LinkedIn InMail/recruiter contact
5. **Executive Outreach** - Direct CEO/CTO contact
6. **Thank You Email** - Post-interview thank you

**Usage:**

```javascript
const { generateEmail } = require('./email-templates');

const email = generateEmail('general', {
  company: 'Careem',
  position: 'Senior Software Engineer',
  jobUrl: 'https://careers.careem.com/job/123'
});
```

### 🧹 delete-puppeteer-cache.js

Utility to clean Puppeteer cache directory.

**Usage:**

```bash
npm run clean-cache
# or
node scripts/delete-puppeteer-cache.js
```

## Configuration

### Updating Your Profile

Edit `job-search-agent.js` to update:

- Personal information
- Skills and expertise
- Target companies
- Salary expectations

### Customizing Email Templates

Edit `email-templates.js` to:

- Modify email templates
- Add new template types
- Customize messaging
- Update signature

## Integration

These scripts can be imported and used in other Node.js applications:

```javascript
const { profile } = require('./scripts/job-search-agent');
const { generateEmail } = require('./scripts/email-templates');

// Generate custom email
const email = generateEmail('general', {
  company: profile.targetCompanies[0],
  position: profile.targetRoles[0]
});

console.log(email);
```

## Development

All scripts use CommonJS modules (`require`/`module.exports`) for maximum compatibility.

## Requirements

- Node.js >= 14.0.0
- No external dependencies (uses Node.js built-ins only)

## License

ISC - See LICENSE file for details
