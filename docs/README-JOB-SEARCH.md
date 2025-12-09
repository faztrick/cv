# Job Search Agent - Dubai Positions (12k+ AED)

Automated job search and email generation system for **Muhammed Fasil PV**

## Overview

This system helps you:

- Target Dubai tech companies with positions above 12k AED
- Generate personalized job application emails
- Track applications and follow-ups
- Optimize for your skills: AI, IoT, Flutter, Node.js, Enterprise Systems

## Files

- **job-search-agent.js** - Profile, skills, target companies, and platforms
- **email-templates.js** - Professional email templates for various scenarios
- **generate-job-emails.js** - CLI tool to generate emails for specific jobs

## Quick Start

### 1. Generate Emails

```bash
node generate-job-emails.js
```

This will generate:

- Application emails for top Dubai tech companies
- Recruiter outreach templates
- Executive/CTO direct contact emails
- Follow-up email samples

### 2. Customize for Specific Jobs

Edit `generate-job-emails.js` and add your target companies:

```javascript
const myJobs = [
  {
    company: "Target Company",
    position: "Senior Software Engineer",
    salary: "15000-20000 AED",
    url: "https://company.com/careers"
  }
];
```

### 3. Use Email Templates

```javascript
const { generateEmail } = require('./email-templates');

// General application
const email = generateEmail('general', {
  company: 'Careem',
  position: 'Senior Software Engineer',
  jobUrl: 'https://careers.careem.com/job/123'
});

// Recruiter outreach
const recruiterEmail = generateEmail('recruiter', {
  recruiterName: 'Sarah',
  position: 'AI Engineer'
});

// Follow-up (7 days after application)
const followUp = generateEmail('followup', {
  company: 'Noon',
  position: 'Lead Engineer',
  days: 7
});
```

## Target Companies (Dubai - 12k+ AED)

### Tier 1 - Top Tech Unicorns

- **Careem** (Uber subsidiary) - Engineering, AI, Platform
- **Noon** - E-commerce, Full-stack, Backend
- **Tabby** (BNPL) - FinTech, AI, Full-stack

### Tier 2 - Scale-ups

- **Fetchr** - Logistics, IoT, Mobile
- **Dubizzle** (OLX Group) - Classifieds, Backend, AI
- **Talabat** (Delivery Hero) - Food delivery, Microservices
- **Bayzat** - HR Tech, SaaS, Full-stack

### Tier 3 - FinTech & Banking

- **Emirates NBD** - Digital banking, AI, Cloud
- **Network International** - Payments, FinTech
- **Mashreq Bank** - Neo banking, AI, Platform
- **Postpay / Spotii** - BNPL, FinTech

### Tier 4 - Smart City & Gov Tech

- **Smart Dubai** - IoT, AI, Smart City Solutions
- **DIFC Innovation Hub** - FinTech, RegTech
- **Dubai Electricity & Water Authority (DEWA)** - IoT, Smart Grid

### Tier 5 - Cloud Kitchens & Logistics

- **Kitopi** - Cloud kitchen, IoT, Automation
- **Swvl** - Mobility, Backend, Platform
- **Pure Harvest** - AgriTech, IoT, Automation

## Job Search Platforms

### 1. LinkedIn

```
Search: "Senior Software Engineer Dubai AI"
Filters:
- Location: Dubai, UAE
- Experience: 10+ years
- Salary: 12000+ AED
```

### 2. Bayt.com

```
https://www.bayt.com/en/uae/jobs/
Keywords: Software Engineer, AI, Flutter, Node.js
Salary: 12000+ AED
```

### 3. GulfTalent

```
https://www.gulftalent.com/
Advanced search: Dubai + Software Engineer + 12000+
```

### 4. Indeed UAE

```
https://ae.indeed.com/
Search: "Software Engineer Dubai salary:12000"
```

### 5. Company Career Pages

Direct applications often have better response rates:

- <https://careers.careem.com>
- <https://careers.noon.com>
- <https://tabby.ai/careers>
- <https://www.bayzat.com/careers>

## Email Templates Available

### 1. General Application

Professional introduction with key achievements and skills alignment.

### 2. Referral/Connection

For reaching out through mutual connections or LinkedIn.

### 3. Follow-up

Send 5-7 days after initial application.

### 4. Recruiter Outreach

Concise LinkedIn InMail format for recruiters.

### 5. Executive Outreach

Direct approach to CTO/CEO for strategic positions.

### 6. Thank You

Post-interview appreciation and reinforcement.

## Your Key Selling Points

### Technical Depth

- 13+ years software engineering
- AI/ML: OpenAI, LangChain, YOLO, TensorFlow
- Full-stack: Flutter (MVVM), Node.js, Python, .NET
- IoT: ESP32, MQTT, embedded systems, edge computing

### Production Systems

- Built AI self-checkout with computer vision
- Architected multi-branch ERP with hybrid sync
- Designed WireGuard VPN mesh (8+ nodes)
- Created WhatsApp/Telegram automation bots

### Business Impact

- Retail automation reducing theft and improving efficiency
- Real-time queue management (i-QMS)
- Offline-first architecture for business continuity
- Cross-location team leadership (India/UAE)

### Current Status

- Based in Dubai (Company Visa)
- Currently employed at Idol Technology LLC
- Available for new opportunities
- Salary expectation: 12k-18k AED

## Application Tracking Template

| Date | Company | Position | Platform | Salary | Status | Follow-up | Notes |
|------|---------|----------|----------|--------|--------|-----------|-------|
| 2025-10-25 | Careem | Sr. Engineer | LinkedIn | 15-20k | Applied | 2025-11-01 | - |
| 2025-10-25 | Noon | Lead Engineer | Direct | 18-25k | Applied | 2025-11-01 | - |

## Daily Action Plan

### Week 1

- [ ] Apply to 5 positions on LinkedIn
- [ ] Apply to 3 positions on Bayt.com
- [ ] Reach out to 5 recruiters on LinkedIn
- [ ] Update LinkedIn profile with recent projects

### Week 2

- [ ] Follow up on Week 1 applications
- [ ] Apply to 5 new positions
- [ ] Direct outreach to 3 company CTOs
- [ ] Attend 1 tech meetup/networking event

### Week 3

- [ ] Follow up on Week 2 applications
- [ ] Apply to 5 new positions
- [ ] Prepare for technical interviews
- [ ] Practice system design questions

## Interview Preparation

### Common Questions

1. **AI/ML Experience**: YOLO vision, LangChain, OpenAI integration
2. **System Design**: Multi-branch ERP, VPN mesh architecture
3. **IoT Projects**: ESP32, MQTT, embedded systems
4. **Leadership**: Cross-location team management
5. **Problem-Solving**: Offline-first sync, edge computing

### Projects to Discuss

- IdolMEA ERP architecture
- AI self-checkout kiosk
- WireGuard VPN mesh network
- Hybrid cloud-local sync engine

## Salary Negotiation

### Your Position

- 13+ years experience
- Specialized skills (AI + IoT + Full-stack)
- Dubai-based (no relocation costs)
- Current employment (negotiating from strength)

### Range

- Minimum: 12,000 AED
- Target: 15,000-18,000 AED
- Senior/Lead: 18,000-25,000 AED
- Architect/Principal: 25,000-35,000 AED

### Benefits to Negotiate

- Performance bonus
- Stock options (if startup)
- Professional development budget
- Remote work flexibility
- Health insurance coverage

## Next Steps

1. **Run Email Generator**

   ```bash
   node generate-job-emails.js > my-job-emails.txt
   ```

2. **Customize Emails**
   - Research each company
   - Add specific project mentions
   - Align with job description

3. **Apply Daily**
   - Target: 3-5 applications/day
   - Mix: Direct applications + recruiter outreach

4. **Track Everything**
   - Use spreadsheet template above
   - Set calendar reminders for follow-ups

5. **Network Actively**
   - Connect with Dubai tech community
   - Attend meetups (Dubai Tech Community, Flutter Dubai)
   - Engage on LinkedIn (comment, share insights)

## Resources

- **Portfolio**: <https://uaecodes.com>
- **GitHub**: <https://github.com/faztrick>
- **LinkedIn**: <https://linkedin.com/in/faztrick>
- **Email**: <faztrick@gmail.com>
- **Phone**: +971 555923545

## Tips for Success

1. **Customize Each Application**: Research the company and role
2. **Follow Up Consistently**: 5-7 days after application
3. **Network First**: Try to get referrals before applying
4. **Show Projects**: Link to GitHub, portfolio, live demos
5. **Be Specific**: Mention exact technologies from job description
6. **Highlight Business Impact**: Not just tech, but results
7. **Stay Organized**: Track all applications and responses

---

**Good luck with your job search! 🚀**

Remember: You have strong skills, proven experience, and are based in Dubai. Target roles that value your unique combination of AI, IoT, and enterprise system expertise.
