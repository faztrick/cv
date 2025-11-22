#!/usr/bin/env node

/**
 * Job Search Agent for Dubai - Above 12k AED
 * Based on Muhammed Fasil PV's Skills
 *
 * Features:
 * - Profile configuration
 * - Web scraping with Puppeteer
 * - Job listing extraction
 * - Automated job search across platforms
 */

const fs = require('fs');
const path = require('path');

// Check if Puppeteer is available
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.log("Note: Puppeteer not installed. Install with: npm install puppeteer");
  console.log("Running in profile-only mode...\n");
}

const profile = {
  name: "MUHAMMED FASIL PV",
  title: "Software Engineer | AI & IoT Systems Engineer",
  location: "Dubai, UAE",
  experience: "13+ years",
  email: "faztrick@gmail.com",
  phone: "+971 555923545",
  website: "https://uaecodes.com",
  linkedin: "https://linkedin.com/in/faztrick",
  github: "https://github.com/faztrick",

  // Core Skills
  skills: {
    primary: [
      "Flutter (MVVM)", "Node.js", "AI/ML", "IoT Systems", "WPF (.NET)",
      "Python", "TypeScript", "Dart", "C#", "PHP"
    ],
    ai: [
      "OpenAI", "LangChain", "YOLOv8", "TensorFlow", "PyTorch",
      "Whisper", "Stable Diffusion", "Qwen3", "Computer Vision"
    ],
    iot: [
      "ESP32", "ESP-S3", "Raspberry Pi", "Arduino", "MQTT",
      "ESL", "OEPL", "Edge Computing", "Embedded Systems"
    ],
    networking: [
      "MikroTik RouterOS", "WireGuard VPN", "NAT", "VLAN",
      "Firewall", "Network Architecture"
    ],
    devops: [
      "Docker", "Docker Compose", "GitHub Actions", "PM2", "Nginx",
      "CI/CD", "GCP", "AWS", "Azure", "Cloudflare"
    ],
    database: [
      "MySQL", "Hive", "ObjectBox", "Firebase", "MongoDB"
    ],
    automation: [
      "WhatsApp Business API", "Telegram Bot API", "Webhooks",
      "Process Automation", "RPA"
    ]
  },

  // Salary Expectations
  salary: {
    minimum: 12000,
    currency: "AED",
    preferred: 18000,
    negotiable: true
  },

  // Target Roles
  targetRoles: [
    "Senior Software Engineer",
    "Lead Software Engineer",
    "Software Architect",
    "AI Engineer",
    "IoT Solutions Architect",
    "Full Stack Engineer",
    "Technical Lead",
    "Engineering Manager",
    "Solutions Architect",
    "Principal Engineer"
  ],

  // Target Industries
  targetIndustries: [
    "Retail Technology",
    "FinTech",
    "E-commerce",
    "Smart City/IoT",
    "AI/ML Solutions",
    "Enterprise Software",
    "SaaS",
    "Healthcare Technology",
    "Logistics & Supply Chain",
    "EdTech"
  ],

  // Target Companies (Dubai)
  targetCompanies: [
    "Careem", "Noon", "Fetchr", "Dubizzle", "Souq (Amazon)",
    "Talabat", "Deliveroo", "SmartDubai", "DIFC", "Emirates NBD",
    "Mashreq Bank", "Network International", "Tabby", "Postpay",
    "Bayzat", "Kitopi", "Pure Harvest", "Swvl", "Sarwa"
  ],

  // Job Search Platforms
  platforms: [
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/jobs/search/?location=Dubai&salary=12000",
      keywords: "Software Engineer Dubai AI IoT Flutter"
    },
    {
      name: "Bayt.com",
      url: "https://www.bayt.com/en/uae/jobs/",
      keywords: "Software Engineer AI Flutter Node.js"
    },
    {
      name: "GulfTalent",
      url: "https://www.gulftalent.com/",
      keywords: "Software Engineer Dubai"
    },
    {
      name: "Indeed UAE",
      url: "https://ae.indeed.com/",
      keywords: "Software Engineer Dubai salary:12000"
    },
    {
      name: "Naukrigulf",
      url: "https://www.naukrigulf.com/",
      keywords: "Software Engineer Dubai"
    },
    {
      name: "Dubizzle Jobs",
      url: "https://dubai.dubizzle.com/jobs/",
      keywords: "Software Engineer"
    }
  ]
};

// Job Search Queries
const searchQueries = {
  linkedin: [
    "Senior Software Engineer Dubai AI",
    "Lead Software Engineer Dubai Flutter",
    "Software Architect Dubai IoT",
    "AI Engineer Dubai",
    "Full Stack Engineer Dubai Node.js",
    "Technical Lead Dubai",
    "IoT Solutions Architect Dubai"
  ],

  bayt: [
    "Software Engineer Dubai 12000+",
    "Senior Developer Dubai AI",
    "Flutter Developer Dubai Senior",
    "Full Stack Engineer Dubai"
  ],

  indeed: [
    "Software Engineer Dubai salary:12000",
    "AI Engineer Dubai",
    "Senior Developer Dubai IoT"
  ]
};

// Job Application Tracking Template
const applicationTemplate = {
  company: "",
  position: "",
  platform: "",
  jobUrl: "",
  salary: "",
  appliedDate: "",
  status: "Applied",
  notes: "",
  contactPerson: "",
  followUpDate: ""
};

// Scraper configuration
const scraperConfig = {
  headless: true,
  timeout: 30000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: {
    width: 1920,
    height: 1080
  }
};

/**
 * Initialize Puppeteer browser
 */
async function initBrowser() {
  if (!puppeteer) {
    throw new Error('Puppeteer is not installed. Run: npm install puppeteer');
  }

  const browser = await puppeteer.launch({
    headless: scraperConfig.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  return browser;
}

/**
 * Scrape jobs from LinkedIn
 */
async function scrapeLinkedIn(query, maxResults = 10) {
  console.log(`\n🔍 Scraping LinkedIn for: "${query}"`);

  const browser = await initBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(scraperConfig.userAgent);
  await page.setViewport(scraperConfig.viewport);

  try {
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=Dubai%2C%20United%20Arab%20Emirates`;

    console.log(`📄 Loading: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: scraperConfig.timeout });

    // Wait for job listings to load
    await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 }).catch(() => {
      console.log('⚠️  No jobs found or page structure changed');
    });

    // Extract job listings
    const jobs = await page.evaluate((max) => {
      const jobCards = document.querySelectorAll('.base-card');
      const results = [];

      for (let i = 0; i < Math.min(jobCards.length, max); i++) {
        const card = jobCards[i];
        const titleEl = card.querySelector('.base-search-card__title');
        const companyEl = card.querySelector('.base-search-card__subtitle');
        const locationEl = card.querySelector('.job-search-card__location');
        const linkEl = card.querySelector('a.base-card__full-link');

        if (titleEl && companyEl) {
          results.push({
            title: titleEl.textContent.trim(),
            company: companyEl.textContent.trim(),
            location: locationEl ? locationEl.textContent.trim() : 'Dubai, UAE',
            url: linkEl ? linkEl.href : '',
            platform: 'LinkedIn'
          });
        }
      }

      return results;
    }, maxResults);

    console.log(`✅ Found ${jobs.length} jobs on LinkedIn`);
    return jobs;

  } catch (error) {
    console.error('❌ Error scraping LinkedIn:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Scrape jobs from Indeed UAE
 */
async function scrapeIndeed(query, maxResults = 10) {
  console.log(`\n🔍 Scraping Indeed UAE for: "${query}"`);

  const browser = await initBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(scraperConfig.userAgent);
  await page.setViewport(scraperConfig.viewport);

  try {
    const searchUrl = `https://ae.indeed.com/jobs?q=${encodeURIComponent(query)}&l=Dubai`;

    console.log(`📄 Loading: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: scraperConfig.timeout });

    // Wait for job listings
    await page.waitForSelector('.job_seen_beacon', { timeout: 10000 }).catch(() => {
      console.log('⚠️  No jobs found or page structure changed');
    });

    // Extract job listings
    const jobs = await page.evaluate((max) => {
      const jobCards = document.querySelectorAll('.job_seen_beacon');
      const results = [];

      for (let i = 0; i < Math.min(jobCards.length, max); i++) {
        const card = jobCards[i];
        const titleEl = card.querySelector('h2.jobTitle span[title]');
        const companyEl = card.querySelector('.companyName');
        const locationEl = card.querySelector('.companyLocation');
        const linkEl = card.querySelector('h2.jobTitle a');

        if (titleEl && companyEl) {
          results.push({
            title: titleEl.getAttribute('title') || titleEl.textContent.trim(),
            company: companyEl.textContent.trim(),
            location: locationEl ? locationEl.textContent.trim() : 'Dubai',
            url: linkEl ? `https://ae.indeed.com${linkEl.getAttribute('href')}` : '',
            platform: 'Indeed UAE'
          });
        }
      }

      return results;
    }, maxResults);

    console.log(`✅ Found ${jobs.length} jobs on Indeed UAE`);
    return jobs;

  } catch (error) {
    console.error('❌ Error scraping Indeed:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Scrape jobs from Bayt.com
 */
async function scrapeBayt(query, maxResults = 10) {
  console.log(`\n🔍 Scraping Bayt.com for: "${query}"`);

  const browser = await initBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(scraperConfig.userAgent);
  await page.setViewport(scraperConfig.viewport);

  try {
    const searchUrl = `https://www.bayt.com/en/uae/jobs/${encodeURIComponent(query.replace(/\s+/g, '-'))}-jobs/`;

    console.log(`📄 Loading: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: scraperConfig.timeout });

    // Wait for job listings
    await page.waitForSelector('.has-pointer-d', { timeout: 10000 }).catch(() => {
      console.log('⚠️  No jobs found or page structure changed');
    });

    // Extract job listings
    const jobs = await page.evaluate((max) => {
      const jobCards = document.querySelectorAll('.has-pointer-d');
      const results = [];

      for (let i = 0; i < Math.min(jobCards.length, max); i++) {
        const card = jobCards[i];
        const titleEl = card.querySelector('h2 a, .t-default a');
        const companyEl = card.querySelector('.t-mute');

        if (titleEl) {
          results.push({
            title: titleEl.textContent.trim(),
            company: companyEl ? companyEl.textContent.trim() : 'Company not listed',
            location: 'Dubai, UAE',
            url: titleEl.href || '',
            platform: 'Bayt.com'
          });
        }
      }

      return results;
    }, maxResults);

    console.log(`✅ Found ${jobs.length} jobs on Bayt.com`);
    return jobs;

  } catch (error) {
    console.error('❌ Error scraping Bayt:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Search jobs across all platforms
 */
async function searchAllPlatforms(query, options = {}) {
  const { maxPerPlatform = 10, platforms = ['linkedin', 'indeed', 'bayt'] } = options;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           AUTOMATED JOB SEARCH AGENT                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nSearching for: "${query}"`);
  console.log(`Platforms: ${platforms.join(', ')}`);
  console.log(`Max results per platform: ${maxPerPlatform}\n`);

  const allJobs = [];

  if (platforms.includes('linkedin')) {
    const linkedInJobs = await scrapeLinkedIn(query, maxPerPlatform);
    allJobs.push(...linkedInJobs);
  }

  if (platforms.includes('indeed')) {
    const indeedJobs = await scrapeIndeed(query, maxPerPlatform);
    allJobs.push(...indeedJobs);
  }

  if (platforms.includes('bayt')) {
    const baytJobs = await scrapeBayt(query, maxPerPlatform);
    allJobs.push(...baytJobs);
  }

  // Save results to CSV
  if (allJobs.length > 0) {
    const csvPath = path.join(__dirname, '..', 'job-search-results.csv');
    saveToCSV(allJobs, csvPath);
  }

  return allJobs;
}

function parseCliOptions(args) {
  const defaultPlatforms = ['linkedin', 'indeed', 'bayt'];
  const consumedIndexes = new Set();

  const options = {
    searchMode: false,
    queryTokens: [],
    maxPerPlatform: 10,
    platforms: defaultPlatforms
  };

  const collectTokens = (startIndex) => {
    const tokens = [];
    let index = startIndex;

    while (index < args.length && !args[index].startsWith('-')) {
      tokens.push(args[index]);
      consumedIndexes.add(index);
      index += 1;
    }

    return { tokens, nextIndex: index - 1 };
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    switch (arg) {
      case '--search':
      case '-s':
      case '--query': {
        options.searchMode = true;
        consumedIndexes.add(i);

        const { tokens, nextIndex } = collectTokens(i + 1);
        if (tokens.length > 0) {
          options.queryTokens.push(...tokens);
        }

        i = nextIndex;
        break;
      }

      case '--max': {
        consumedIndexes.add(i);

        const value = args[i + 1];
        if (value && !value.startsWith('-')) {
          const parsed = parseInt(value, 10);
          if (!Number.isNaN(parsed) && parsed > 0) {
            options.maxPerPlatform = parsed;
          }
          consumedIndexes.add(i + 1);
          i += 1;
        }

        break;
      }

      case '--platforms': {
        consumedIndexes.add(i);

        const value = args[i + 1];
        if (value && !value.startsWith('-')) {
          const parsedPlatforms = value
            .split(',')
            .map((platform) => platform.trim().toLowerCase())
            .filter(Boolean);

          if (parsedPlatforms.length > 0) {
            options.platforms = parsedPlatforms;
          }

          consumedIndexes.add(i + 1);
          i += 1;
        }

        break;
      }

      default:
        break;
    }
  }

  if (options.queryTokens.length === 0) {
    const fallbackTokens = args.filter((arg, index) => !consumedIndexes.has(index) && !arg.startsWith('-'));

    if (fallbackTokens.length > 0) {
      options.searchMode = true;
      options.queryTokens.push(...fallbackTokens);
    }
  }

  const query = options.queryTokens.join(' ').trim() || 'Software Engineer Dubai';
  const platforms = Array.isArray(options.platforms) && options.platforms.length > 0
    ? options.platforms
    : defaultPlatforms;

  return {
    searchMode: options.searchMode,
    query,
    maxPerPlatform: options.maxPerPlatform,
    platforms
  };
}

/**
 * Save jobs to CSV file
 */
function saveToCSV(jobs, filePath) {
  const header = 'Title,Company,Location,Platform,URL,Date Scraped\n';
  const rows = jobs.map(job => {
    const date = new Date().toISOString().split('T')[0];
    return `"${job.title}","${job.company}","${job.location}","${job.platform}","${job.url}","${date}"`;
  }).join('\n');

  fs.writeFileSync(filePath, header + rows, 'utf8');
  console.log(`\n💾 Results saved to: ${filePath}`);
  console.log(`📊 Total jobs found: ${jobs.length}`);
}

/**
 * Display jobs in console
 */
function displayJobs(jobs) {
  console.log('\n' + '='.repeat(80));
  console.log(`FOUND ${jobs.length} JOBS`);
  console.log('='.repeat(80) + '\n');

  jobs.forEach((job, index) => {
    console.log(`[${index + 1}] ${job.title}`);
    console.log(`    Company: ${job.company}`);
    console.log(`    Location: ${job.location}`);
    console.log(`    Platform: ${job.platform}`);
    console.log(`    URL: ${job.url}`);
    console.log('');
  });
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);

  const cliOptions = parseCliOptions(args);

  if (cliOptions.searchMode) {
    if (!puppeteer) {
      console.error('\n❌ Puppeteer is required for job search functionality');
      console.log('📦 Install with: npm install puppeteer\n');
      process.exit(1);
    }

    try {
      const jobs = await searchAllPlatforms(cliOptions.query, {
        maxPerPlatform: cliOptions.maxPerPlatform,
        platforms: cliOptions.platforms
      });

      displayJobs(jobs);

    } catch (error) {
      console.error('❌ Error during job search:', error.message);
      process.exit(1);
    }
  } else {
    // Default: Show profile
    console.log("=== Job Search Agent Initialized ===");
    console.log(`Profile: ${profile.name}`);
    console.log(`Target: Dubai positions above ${profile.salary.minimum} ${profile.salary.currency}`);
    console.log(`Key Skills: ${profile.skills.primary.join(", ")}`);
    console.log("\nTarget Roles:");
    profile.targetRoles.forEach(role => console.log(`  - ${role}`));
    console.log("\nRecommended Job Platforms:");
    profile.platforms.forEach(p => console.log(`  - ${p.name}: ${p.url}`));

    if (puppeteer) {
      console.log("\n💡 Usage:");
      console.log("  npm run job-agent -- --search \"Senior Software Engineer Dubai\"");
      console.log("  npm run job-agent -- -s \"AI Engineer Dubai\"\n");
    }
  }
}

// Export profile and functions
module.exports = {
  profile,
  searchQueries,
  applicationTemplate,
  scrapeLinkedIn,
  scrapeIndeed,
  scrapeBayt,
  searchAllPlatforms
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
