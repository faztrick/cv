# 🚀 Quick Start - Job Search Automation

## Get Started in 3 Steps

### Step 1: Install Puppeteer

```bash
npm run install-puppeteer
```

This will download Puppeteer and Chromium browser (~170-300MB). **Be patient**, it may take a few minutes.

### Step 2: Search for Jobs

```bash
npm run job-search -- -s "Software Engineer Dubai"
```

This will:

- Open a headless browser
- Search LinkedIn, Indeed UAE, and Bayt.com
- Extract job listings
- Save results to `job-search-results.csv`
- Display jobs in your terminal

### Step 3: Review Results

Open `job-search-results.csv` in Excel or any spreadsheet app. You'll see:

- Job titles
- Company names
- Locations
- Platform (where it was found)
- Direct URLs to apply
- Date scraped

## Example Searches

```bash
# AI/ML positions
npm run job-search -- -s "AI Engineer Dubai"

# Senior roles
npm run job-search -- -s "Senior Software Engineer Dubai"

# Full Stack
npm run job-search -- -s "Full Stack Engineer Dubai Node.js"

# IoT positions
npm run job-search -- -s "IoT Solutions Architect Dubai"

# Flutter developers
npm run job-search -- -s "Flutter Developer Dubai"

# Tech Lead
npm run job-search -- -s "Technical Lead Dubai"
```

## What You Get

### Console Output

```
╔════════════════════════════════════════════════════════════════╗
║           AUTOMATED JOB SEARCH AGENT                          ║
╚════════════════════════════════════════════════════════════════╝

Searching for: "Software Engineer Dubai"
Platforms: linkedin, indeed, bayt
Max results per platform: 10

🔍 Scraping LinkedIn for: "Software Engineer Dubai"
📄 Loading: https://www.linkedin.com/jobs/search/...
✅ Found 10 jobs on LinkedIn

🔍 Scraping Indeed UAE for: "Software Engineer Dubai"
📄 Loading: https://ae.indeed.com/jobs?q=...
✅ Found 10 jobs on Indeed UAE

🔍 Scraping Bayt.com for: "Software Engineer Dubai"
📄 Loading: https://www.bayt.com/en/uae/jobs/...
✅ Found 8 jobs on Bayt.com

💾 Results saved to: E:\cv\job-search-results.csv
📊 Total jobs found: 28

[1] Senior Software Engineer - AI
    Company: Careem
    Location: Dubai, UAE
    Platform: LinkedIn
    URL: https://...

[2] Full Stack Developer
    Company: Noon
    Location: Dubai
    Platform: Indeed UAE
    URL: https://...

...
```

### CSV File (`job-search-results.csv`)

```csv
Title,Company,Location,Platform,URL,Date Scraped
"Senior Software Engineer - AI","Careem","Dubai, UAE","LinkedIn","https://...","2025-10-25"
"Full Stack Developer","Noon","Dubai","Indeed UAE","https://...","2025-10-25"
"Software Engineer","Bayt Company","Dubai, UAE","Bayt.com","https://...","2025-10-25"
```

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Search Jobs                                              │
│    npm run job-search -- -s "Your Query"                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Review Results                                           │
│    Open job-search-results.csv                              │
│    Filter by company, title, platform                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Generate Application Emails                              │
│    npm run generate-emails                                  │
│    Copy email templates                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Apply to Jobs                                            │
│    Visit URLs from CSV                                      │
│    Submit applications                                      │
│    Track in job-tracker-uae.csv                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Follow Up                                                │
│    After 5-7 days                                           │
│    Use follow-up email template                             │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### "Puppeteer not installed"

```bash
npm run install-puppeteer
```

### Installation Taking Too Long

- This is normal - Puppeteer downloads Chromium (~170-300MB)
- Check your internet connection
- Wait patiently, it will complete

### "Cannot find module 'puppeteer'"

```bash
cd e:\cv
npm install
```

### No Jobs Found

- Try different keywords
- Check your internet connection
- Website structure may have changed

### Browser Crashes

Edit `scripts/job-search-agent.js` and increase timeout:

```javascript
const scraperConfig = {
  timeout: 60000,  // Increase from 30000 to 60000
  // ...
};
```

## Tips for Better Results

### 1. Use Specific Keywords

❌ Bad: `npm run job-search -- -s "Engineer"`
✅ Good: `npm run job-search -- -s "Senior Software Engineer Dubai AI"`

### 2. Try Different Variations

```bash
npm run job-search -- -s "Software Engineer Dubai"
npm run job-search -- -s "Senior Developer Dubai"
npm run job-search -- -s "Full Stack Engineer Dubai"
```

### 3. Search Regularly

Run searches daily or weekly to catch new postings:

```bash
# Monday morning
npm run job-search -- -s "Software Engineer Dubai"

# Wednesday
npm run job-search -- -s "AI Engineer Dubai"

# Friday
npm run job-search -- -s "Technical Lead Dubai"
```

### 4. Track Everything

After finding jobs:

1. Open `job-search-results.csv`
2. Mark interesting positions
3. Copy to `job-tracker-uae.csv`
4. Add application status
5. Set follow-up dates

## Advanced Usage

### Search Specific Platforms

Edit `scripts/job-search-agent.js`:

```javascript
// LinkedIn only
const jobs = await searchAllPlatforms('AI Engineer Dubai', {
  maxPerPlatform: 20,
  platforms: ['linkedin']  // Only LinkedIn
});

// Indeed + Bayt only
const jobs = await searchAllPlatforms('Software Engineer', {
  maxPerPlatform: 15,
  platforms: ['indeed', 'bayt']  // Skip LinkedIn
});
```

### Get More Results Per Platform

```javascript
const jobs = await searchAllPlatforms('Developer Dubai', {
  maxPerPlatform: 25,  // Get 25 jobs from each platform
  platforms: ['linkedin', 'indeed', 'bayt']
});
```

### See the Browser (Debug Mode)

```javascript
const scraperConfig = {
  headless: false,  // Change from true to false
  // ...
};
```

## Next Steps

1. **Install Puppeteer**: `npm run install-puppeteer`
2. **Run First Search**: `npm run job-search -- -s "Software Engineer Dubai"`
3. **Check Results**: Open `job-search-results.csv`
4. **Generate Emails**: `npm run generate-emails`
5. **Start Applying**: Visit URLs and apply!

## Complete Documentation

For detailed information, see:

- **Full Guide**: `scripts/JOB-SEARCH-GUIDE.md`
- **Scripts README**: `scripts/README.md`
- **Main README**: `README.md`

---

**Happy Job Hunting! 🎯**

*Start with: `npm run install-puppeteer`*
