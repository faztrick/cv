# 🔍 Job Search Agent - User Guide

## Overview

The Job Search Agent is an automated tool that scrapes job listings from multiple platforms (LinkedIn, Indeed UAE, Bayt.com) and saves them to a CSV file for easy tracking.

## Features

- ✅ **Multi-Platform Scraping**: LinkedIn, Indeed UAE, Bayt.com
- ✅ **Automated Search**: Search by keywords across all platforms
- ✅ **CSV Export**: Save results to CSV for tracking
- ✅ **Profile Management**: Pre-configured with your skills and preferences
- ✅ **Customizable**: Add more platforms or modify scrapers

## Installation

### Step 1: Install Puppeteer

```bash
npm run install-puppeteer
# or
npm install puppeteer
```

**Note**: Puppeteer download is ~170-300MB (includes Chromium browser).

### Step 2: Verify Installation

```bash
npm run job-agent
```

You should see your profile information displayed.

## Usage

### View Your Profile

```bash
npm run job-agent
```

This displays:

- Your name and contact info
- Skills and experience
- Target roles and companies
- Salary expectations
- Job platforms

### Search for Jobs

```bash
# Basic search
npm run job-search -- -s "Software Engineer Dubai"

# AI/ML roles
npm run job-search -- -s "AI Engineer Dubai"

# Senior positions
npm run job-search -- -s "Senior Software Engineer Dubai"

# IoT roles
npm run job-search -- -s "IoT Solutions Architect Dubai"

# Full Stack positions
npm run job-search -- -s "Full Stack Engineer Dubai"
```

### What Happens During Search

1. **Browser Launches**: Puppeteer opens a headless Chromium browser
2. **Platform Scraping**: Visits LinkedIn, Indeed, and Bayt.com
3. **Data Extraction**: Extracts job titles, companies, locations, URLs
4. **CSV Export**: Saves results to `job-search-results.csv`
5. **Console Display**: Shows found jobs in terminal

### Output Format

Results are saved to `job-search-results.csv`:

```csv
Title,Company,Location,Platform,URL,Date Scraped
"Senior Software Engineer","Careem","Dubai, UAE","LinkedIn","https://...","2025-10-25"
"AI Engineer","Noon","Dubai","Indeed UAE","https://...","2025-10-25"
...
```

## Configuration

### Modify Scraper Settings

Edit `scripts/job-search-agent.js`:

```javascript
const scraperConfig = {
  headless: true,        // Set to false to see browser
  timeout: 30000,        // Page load timeout (ms)
  userAgent: '...',      // Browser user agent
  viewport: {
    width: 1920,
    height: 1080
  }
};
```

### Add More Search Queries

Update pre-defined queries in `job-search-agent.js`:

```javascript
const searchQueries = {
  linkedin: [
    "Your custom query here",
    // ...
  ],
  // ...
};
```

### Customize Profile

Update your profile data:

```javascript
const profile = {
  name: "Your Name",
  email: "your@email.com",
  salary: {
    minimum: 12000,  // Your minimum salary
    currency: "AED"
  },
  targetRoles: [
    "Your target roles..."
  ]
  // ...
};
```

## Advanced Usage

### Use as a Module

Import and use in your own scripts:

```javascript
const { searchAllPlatforms } = require('./scripts/job-search-agent');

async function myJobSearch() {
  const jobs = await searchAllPlatforms('Software Engineer', {
    maxPerPlatform: 20,
    platforms: ['linkedin', 'indeed']
  });

  console.log(`Found ${jobs.length} jobs`);
  // Process jobs...
}

myJobSearch();
```

### Scrape Specific Platforms

```javascript
const { scrapeLinkedIn, scrapeIndeed, scrapeBayt } = require('./scripts/job-search-agent');

// LinkedIn only
const linkedInJobs = await scrapeLinkedIn('AI Engineer Dubai', 15);

// Indeed only
const indeedJobs = await scrapeIndeed('Full Stack Developer', 10);

// Bayt only
const baytJobs = await scrapeBayt('Software Architect', 10);
```

## Supported Platforms

### 1. LinkedIn

- **URL**: <https://www.linkedin.com/jobs>
- **Search**: Keywords + Location (Dubai)
- **Selectors**: `.base-card`, `.base-search-card__title`
- **Note**: May require login for full access

### 2. Indeed UAE

- **URL**: <https://ae.indeed.com>
- **Search**: Query + Location (Dubai)
- **Selectors**: `.job_seen_beacon`, `.jobTitle`
- **Note**: Works without login

### 3. Bayt.com

- **URL**: <https://www.bayt.com/en/uae/jobs>
- **Search**: Keyword-based URLs
- **Selectors**: `.has-pointer-d`
- **Note**: Works without login

## Troubleshooting

### "Puppeteer not installed" Error

```bash
npm run install-puppeteer
```

### Browser Crashes or Timeouts

1. Increase timeout in `scraperConfig`
2. Set `headless: false` to debug
3. Check your internet connection

### No Jobs Found

- Website structure may have changed
- Try different search keywords
- Check if website is accessible
- Update selectors in scraper functions

### Rate Limiting / Blocked

If you get blocked:

1. Add delays between requests
2. Use different user agents
3. Space out your searches
4. Consider using proxies (advanced)

## Best Practices

### 1. Respectful Scraping

- Don't scrape too frequently
- Add delays between requests
- Respect robots.txt
- Use reasonable timeouts

### 2. Search Strategy

- Use specific keywords
- Search multiple variations
- Run searches at different times
- Track which queries work best

### 3. Data Management

- Review CSV regularly
- Remove duplicates
- Add notes to interesting positions
- Update job tracker with applications

### 4. Maintenance

- Update selectors if scrapers break
- Check for platform changes
- Keep Puppeteer updated
- Monitor success rates

## Example Workflow

```bash
# 1. Install dependencies
npm run install-puppeteer

# 2. Search for jobs
npm run job-search -- -s "Senior Software Engineer Dubai AI"

# 3. Review results in job-search-results.csv

# 4. Pick interesting positions

# 5. Generate application emails
npm run generate-emails

# 6. Apply and track in job-tracker-uae.csv

# 7. Follow up after 5-7 days
```

## Adding New Platforms

To add a new job platform:

1. **Create scraper function**:

```javascript
async function scrapeNewPlatform(query, maxResults = 10) {
  const browser = await initBrowser();
  const page = await browser.newPage();

  // Your scraping logic here

  await browser.close();
  return jobs;
}
```

2. **Add to searchAllPlatforms**:

```javascript
if (platforms.includes('newplatform')) {
  const jobs = await scrapeNewPlatform(query, maxPerPlatform);
  allJobs.push(...jobs);
}
```

3. **Export function**:

```javascript
module.exports = {
  // ...
  scrapeNewPlatform
};
```

## Performance Tips

- **Headless mode**: Faster, uses less resources
- **Concurrent scraping**: Scrape platforms in parallel (advanced)
- **Selective platforms**: Only scrape platforms you need
- **Result limits**: Don't scrape more than you need

## Legal & Ethical Considerations

- ✅ **Use for personal job search only**
- ✅ **Don't scrape excessively**
- ✅ **Respect platform terms of service**
- ✅ **Don't resell or redistribute data**
- ❌ **Don't use for spam or harassment**
- ❌ **Don't overwhelm servers**

## Support

For issues or questions:

1. Check this guide
2. Review code comments
3. Check Puppeteer documentation
4. Inspect browser console (headless: false)

## Future Enhancements

Planned features:

- [ ] Salary filtering
- [ ] Email notifications
- [ ] Duplicate detection
- [ ] Company filtering
- [ ] Application tracking integration
- [ ] Scheduled searches
- [ ] Advanced analytics

---

**Happy Job Hunting! 🚀**

*Last Updated: October 25, 2025*
