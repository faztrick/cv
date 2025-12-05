#!/usr/bin/env node

/**
 * Indeed UAE Auto-Apply Agent
 * Automated job search and application assistant for Indeed UAE
 * Features:
 * - CV-based form auto-fill
 * - Smart job matching
 * - Application tracking
 * - Resume upload automation
 */

const fs = require('fs');
const path = require('path');
// Load env vars if present
try { require('dotenv').config(); } catch (_) {}

// Check if Puppeteer is available
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.log("Note: Puppeteer not installed. Install with: npm install puppeteer");
  console.log("Running in limited mode...\n");
}

const { parseResume, generateApplicationFormData, matchJobWithCV } = require('./cv-parser');

// Configuration
const config = {
  location: 'Dubai',
  minSalary: 12000,
  currency: 'AED',
  searchQueries: [
    'Software Engineer',
    'Senior Software Engineer',
    'Full Stack Engineer',
    'AI Engineer',
    'Flutter Developer',
    'Node.js Developer',
    'IoT Engineer',
    'Solutions Architect',
    'Technical Lead'
  ],
  jobBoards: {
    indeed: {
      baseUrl: 'https://ae.indeed.com',
      searchUrl: 'https://ae.indeed.com/jobs',
      loginUrl: 'https://secure.indeed.com/account/login'
    }
  },
  resumePath: path.join(__dirname, '..', 'resumes', 'resume.md'),
  resumePdfPath: path.join(__dirname, '..', 'resumes', 'resume-fasil-2025.pdf'),
  trackingFile: path.join(__dirname, '..', 'indeed-applications.json'),
  // Browser
  headless: false,
  useSystemChrome: true,
  chromeProfileDir: path.join(__dirname, '..', '.cache', 'chrome-profile')
};

/** Resolve Chrome executable if available */
function resolveChromeExecutable() {
  if (!config.useSystemChrome) return undefined;
  const candidates = [];
  if (process.platform === 'win32') {
    candidates.push(
      'C\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
      'C\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe'
    );
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/snap/bin/chromium');
  }
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch (_) {}
  }
  return undefined;
}

/** Launch Puppeteer with optional persistent profile */
async function launchBrowser({ headless = config.headless, persistProfile = true } = {}) {
  if (!puppeteer) {
    throw new Error('Puppeteer is required. Install with: npm install puppeteer');
  }
  let userDataDir = process.env.CHROME_USER_DATA_DIR && process.env.CHROME_USER_DATA_DIR.trim()
    ? process.env.CHROME_USER_DATA_DIR.trim()
    : undefined;
  if (!userDataDir && persistProfile) {
    userDataDir = config.chromeProfileDir;
  }
  if (userDataDir) {
    try { fs.mkdirSync(userDataDir, { recursive: true }); } catch (_) {}
  }
  const executablePath = resolveChromeExecutable();
  const browser = await puppeteer.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath,
    userDataDir
  });
  return browser;
}

/** Ensure resume PDF exists; if not, generate from public/cv.html */
async function ensureResumePdf() {
  if (fs.existsSync(config.resumePdfPath)) return config.resumePdfPath;
  const publicDir = path.join(__dirname, '..', 'public');
  const candidates = ['cv-full.html', 'cv.html'];
  let htmlPath;
  for (const name of candidates) {
    const p = path.join(publicDir, name);
    if (fs.existsSync(p)) { htmlPath = p; break; }
  }
  if (!htmlPath) return null;
  const browser = await launchBrowser({ headless: true, persistProfile: false });
  try {
    const page = await browser.newPage();
    const fileUrl = 'file:///' + htmlPath.replace(/\\\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    fs.mkdirSync(path.dirname(config.resumePdfPath), { recursive: true });
    await page.pdf({ path: config.resumePdfPath, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
    console.log(`📄 Generated resume PDF → ${config.resumePdfPath}`);
    return config.resumePdfPath;
  } catch (err) {
    console.log('⚠️  Failed to generate resume PDF:', err.message);
    return null;
  } finally {
    await browser.close();
  }
}

/** Login to Indeed using env credentials */
async function loginIndeed(page, { email, password } = {}) {
  email = email || process.env.INDEED_EMAIL;
  password = password || process.env.INDEED_PASSWORD;
  if (!email || !password) {
    console.log('⚠️  INDEED_EMAIL/INDEED_PASSWORD not set. Skipping login.');
    return false;
  }
  console.log('🔐 Logging into Indeed...');
  await page.goto(config.jobBoards.indeed.loginUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  try {
    await page.waitForSelector('input[type="email"], input[name*="email"]', { timeout: 15000 });
    await page.type('input[type="email"], input[name*="email"]', email, { delay: 50 });
    const cont = await page.$('button[type="submit"], button:has-text("Continue")');
    if (cont) await cont.click();
    await page.waitForTimeout(800);
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.type('input[type="password"]', password, { delay: 50 });
    const signin = await page.$('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');
    if (signin) await signin.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
    console.log('✅ Login flow completed (may require verification).');
    return true;
  } catch (e) {
    console.log('⚠️  Login encountered an issue:', e.message);
    return false;
  }
}

/**
 * Load parsed CV data
 */
function loadCVData() {
  if (!fs.existsSync(config.resumePath)) {
    throw new Error(`Resume not found at: ${config.resumePath}`);
  }

  const cvData = parseResume(config.resumePath);
  const formData = generateApplicationFormData(cvData);

  return { cvData, formData };
}

/**
 * Search jobs on Indeed UAE
 */
async function searchIndeedJobs(query, options = {}) {
  if (!puppeteer) {
    throw new Error('Puppeteer is required. Install with: npm install puppeteer');
  }

  const {
    location = config.location,
    maxResults = 20,
    minMatchScore = 30
  } = options;

  console.log(`\n🔍 Searching Indeed UAE: "${query}" in ${location}`);

  const browser = await launchBrowser({ headless: config.headless });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    const searchUrl = `${config.jobBoards.indeed.searchUrl}?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
    console.log(`📄 Loading: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for job listings
    await page.waitForSelector('.job_seen_beacon', { timeout: 10000 }).catch(() => {
      console.log('⚠️  No jobs found');
    });

    // Extract job listings with detailed information
    const jobs = await page.evaluate((max) => {
      const jobCards = document.querySelectorAll('.job_seen_beacon');
      const results = [];

      for (let i = 0; i < Math.min(jobCards.length, max); i++) {
        const card = jobCards[i];

        const titleEl = card.querySelector('h2.jobTitle span[title]');
        const companyEl = card.querySelector('.companyName');
        const locationEl = card.querySelector('.companyLocation');
        const salaryEl = card.querySelector('.salary-snippet-container, .metadata.salary-snippet-container');
        const descEl = card.querySelector('.job-snippet');
        const linkEl = card.querySelector('h2.jobTitle a');
        const jobKeyEl = card.querySelector('[data-jk]');

        if (titleEl && companyEl) {
          results.push({
            title: titleEl.getAttribute('title') || titleEl.textContent.trim(),
            company: companyEl.textContent.trim(),
            location: locationEl ? locationEl.textContent.trim() : 'Dubai',
            salary: salaryEl ? salaryEl.textContent.trim() : 'Not specified',
            description: descEl ? descEl.textContent.trim() : '',
            url: linkEl ? `https://ae.indeed.com${linkEl.getAttribute('href')}` : '',
            jobKey: jobKeyEl ? jobKeyEl.getAttribute('data-jk') : '',
            platform: 'Indeed UAE',
            searchQuery: query,
            scrapedDate: new Date().toISOString()
          });
        }
      }

      return results;
    }, maxResults);

    console.log(`✅ Found ${jobs.length} jobs`);

    // Match jobs with CV
    const { cvData } = loadCVData();
    const matchedJobs = jobs.map(job => {
      const matchScore = matchJobWithCV(job.description + ' ' + job.title, cvData);
      return {
        ...job,
        matchScore: matchScore.total,
        matchedSkills: matchScore.matched
      };
    }).filter(job => job.matchScore >= minMatchScore);

    console.log(`🎯 ${matchedJobs.length} jobs match your skills (${minMatchScore}%+ match)`);

    await browser.close();
    return matchedJobs;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Auto-fill Indeed application form
 */
async function fillIndeedApplicationForm(page, formData) {
  console.log('📝 Auto-filling application form...');

  try {
    // Common Indeed form field selectors
    const fieldMappings = {
      // Personal info
      'input[name*="firstName"], input[id*="firstName"]': formData.firstName,
      'input[name*="lastName"], input[id*="lastName"]': formData.lastName,
      'input[name*="email"], input[id*="email"]': formData.email,
      'input[name*="phone"], input[id*="phoneNumber"]': formData.phone,
      'input[name*="city"], input[id*="city"]': formData.city,

      // Professional
      'input[name*="jobTitle"], input[id*="jobTitle"]': formData.currentTitle,
      'textarea[name*="summary"], textarea[id*="summary"]': formData.summary,

      // Links
      'input[name*="linkedin"], input[id*="linkedin"]': formData.linkedin,
      'input[name*="portfolio"], input[id*="portfolio"]': formData.portfolio,

      // Salary
      'input[name*="salary"], input[id*="expectedSalary"]': '12000'
    };

    for (const [selector, value] of Object.entries(fieldMappings)) {
      try {
        const element = await page.$(selector);
        if (element && value) {
          await element.type(value, { delay: 50 });
          console.log(`   ✓ Filled: ${selector.substring(0, 30)}...`);
        }
      } catch (err) {
        // Field might not exist, skip
      }
    }

    // Handle dropdowns (years of experience, etc.)
    try {
      const expSelector = 'select[name*="experience"], select[id*="experience"]';
      const expElement = await page.$(expSelector);
      if (expElement) {
        await expElement.select('10'); // 10+ years
        console.log('   ✓ Selected years of experience');
      }
    } catch (err) {
      // Skip if not found
    }

    // Handle checkboxes (work authorization, etc.)
    try {
      const authCheckbox = await page.$('input[type="checkbox"][name*="authorization"]');
      if (authCheckbox) {
        await authCheckbox.click();
        console.log('   ✓ Checked work authorization');
      }
    } catch (err) {
      // Skip if not found
    }

    console.log('✅ Form auto-fill completed');
    return true;

  } catch (error) {
    console.error('❌ Error auto-filling form:', error.message);
    return false;
  }
}

/**
 * Apply to a job on Indeed
 */
async function applyToJob(job, options = {}) {
  if (!puppeteer) {
    throw new Error('Puppeteer is required. Install with: npm install puppeteer');
  }

  const { dryRun = true } = options;

  console.log(`\n📤 ${dryRun ? '[DRY RUN]' : 'Applying to'}: ${job.title} at ${job.company}`);

  const browser = await launchBrowser({ headless: config.headless });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Attempt login for authenticated apply flow
    await loginIndeed(page).catch(() => {});
    // Navigate to job page
    await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check if "Apply Now" button exists
    const applyButton = await page.$('button:has-text("Apply now"), a:has-text("Apply now"), .indeed-apply-button');

    if (!applyButton) {
      console.log('⚠️  No "Apply Now" button found - may redirect to company site');
      await browser.close();
      return { success: false, reason: 'External application' };
    }

    // Click apply button
    await applyButton.click();
    await page.waitForTimeout(2000);

    // Load CV data
    const { formData } = loadCVData();

    // Fill form
    await fillIndeedApplicationForm(page, formData);

    // Ensure resume PDF exists; attempt generation if missing
    const resumePdf = await ensureResumePdf();
    if (resumePdf && fs.existsSync(resumePdf)) {
      try {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.uploadFile(resumePdf);
          console.log('📎 Resume uploaded');
        }
      } catch (err) {
        console.log('⚠️  Could not upload resume');
      }
    }

    if (!dryRun) {
      // Find and click submit button
      const submitButton = await page.$('button[type="submit"], button:has-text("Submit"), button:has-text("Apply")');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Application submitted!');

        // Track application
        trackApplication(job, { status: 'applied', date: new Date().toISOString() });

        await page.waitForTimeout(3000);
      }
    } else {
      console.log('🔍 DRY RUN: Form filled but not submitted');
    }

    await browser.close();
    return { success: true };

  } catch (error) {
    console.error('❌ Error applying to job:', error.message);
    await browser.close();
    return { success: false, reason: error.message };
  }
}

/**
 * Track job application
 */
function trackApplication(job, applicationData) {
  let applications = [];

  if (fs.existsSync(config.trackingFile)) {
    applications = JSON.parse(fs.readFileSync(config.trackingFile, 'utf8'));
  }

  applications.push({
    ...job,
    ...applicationData,
    appliedDate: new Date().toISOString()
  });

  fs.writeFileSync(config.trackingFile, JSON.stringify(applications, null, 2), 'utf8');
  console.log('📊 Application tracked');
}

/**
 * Get application statistics
 */
function getApplicationStats() {
  if (!fs.existsSync(config.trackingFile)) {
    return { total: 0, byStatus: {}, byCompany: {} };
  }

  const applications = JSON.parse(fs.readFileSync(config.trackingFile, 'utf8'));

  const stats = {
    total: applications.length,
    byStatus: {},
    byCompany: {},
    byPlatform: {},
    recent: applications.slice(-10)
  };

  applications.forEach(app => {
    stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;
    stats.byCompany[app.company] = (stats.byCompany[app.company] || 0) + 1;
    stats.byPlatform[app.platform] = (stats.byPlatform[app.platform] || 0) + 1;
  });

  return stats;
}

/**
 * Update Indeed profile resume by uploading latest PDF
 */
async function updateIndeedProfileResume() {
  if (!puppeteer) {
    throw new Error('Puppeteer is required. Install with: npm install puppeteer');
  }

  const resumePdf = await ensureResumePdf();
  if (!resumePdf || !fs.existsSync(resumePdf)) {
    throw new Error('Resume PDF not found and could not be generated.');
  }

  const browser = await launchBrowser({ headless: config.headless });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  try {
    // Login
    await loginIndeed(page);

    // Candidate profile/resume management URLs to try
    const profileUrls = [
      'https://resumes.indeed.com/',
      'https://profile.indeed.com/?hl=en&co=AE',
      'https://my.indeed.com/p/myfiles'
    ];

    for (const url of profileUrls) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});

      // Try direct file input first
      let fileInput = await page.$('input[type="file"], input[name*="file"], input[id*="file"]');
      if (!fileInput) {
        // Click upload triggers to reveal the input
        const triggers = await page.$$('button:has-text("Upload"), a:has-text("Upload"), label:has-text("Upload"), button[aria-label*="Upload"]');
        if (triggers && triggers.length) {
          await triggers[0].click().catch(() => {});
          await page.waitForTimeout(1200);
          fileInput = await page.$('input[type="file"]');
        }
      }

      if (fileInput) {
        await fileInput.uploadFile(resumePdf);
        console.log('📎 Uploaded resume PDF to Indeed profile');
        const saveBtn = await page.$('button:has-text("Save"), button:has-text("Upload"), button[type="submit"], div[role="dialog"] button:has-text("Done")');
        if (saveBtn) { await saveBtn.click().catch(() => {}); }
        await page.waitForTimeout(2000);
        await browser.close();
        return true;
      }
    }

    console.log('⚠️  Could not locate resume upload area on profile');
    await browser.close();
    return false;
  } catch (err) {
    console.error('❌ Error updating profile resume:', err.message);
    await browser.close();
    return false;
  }
}

/**
 * Display job matches
 */
function displayMatches(jobs) {
  console.log('\n' + '='.repeat(80));
  console.log(`FOUND ${jobs.length} MATCHING JOBS`);
  console.log('='.repeat(80) + '\n');

  jobs.forEach((job, index) => {
    console.log(`[${index + 1}] ${job.title} - ${job.company}`);
    console.log(`    📍 ${job.location}`);
    console.log(`    💰 ${job.salary}`);
    console.log(`    🎯 Match Score: ${Math.round(job.matchScore)}%`);
    console.log(`    ✅ Matched Skills: ${job.matchedSkills.slice(0, 5).join(', ')}`);
    console.log(`    🔗 ${job.url}`);
    console.log('');
  });
}

/**
 * Main automation workflow
 */
async function autoJobSearch(options = {}) {
  const {
    queries = config.searchQueries,
    autoApply = false,
    maxApplications = 5
  } = options;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         INDEED UAE AUTO-APPLY AGENT                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const allJobs = [];
  let applicationsSubmitted = 0;

  for (const query of queries) {
    if (applicationsSubmitted >= maxApplications) {
      console.log(`\n⚠️  Reached max applications limit (${maxApplications})`);
      break;
    }

    try {
      const jobs = await searchIndeedJobs(query, { maxResults: 10, minMatchScore: 40 });
      allJobs.push(...jobs);

      if (autoApply) {
        // Apply to top matches
        const topMatches = jobs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 2);

        for (const job of topMatches) {
          if (applicationsSubmitted >= maxApplications) break;

          const result = await applyToJob(job, { dryRun: false });
          if (result.success) {
            applicationsSubmitted++;
          }

          // Wait between applications
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

    } catch (error) {
      console.error(`❌ Error with query "${query}":`, error.message);
    }
  }

  // Display all matches
  displayMatches(allJobs);

  // Save results
  const resultsFile = path.join(__dirname, '..', 'indeed-matches.json');
  fs.writeFileSync(resultsFile, JSON.stringify(allJobs, null, 2), 'utf8');
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  // Show stats
  const stats = getApplicationStats();
  console.log('\n📊 Application Statistics:');
  console.log(`   Total applications: ${stats.total}`);
  console.log(`   By status:`, stats.byStatus);

  return allJobs;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'search':
        const query = args[1] || 'Software Engineer';
        const jobs = await searchIndeedJobs(query);
        displayMatches(jobs);
        break;

      case 'apply':
        // Check for --real flag to enable actual applications
        const isReal = args.includes('--real');
        const maxApps = args.includes('--max') ? parseInt(args[args.indexOf('--max') + 1]) : 10;

        console.log(isReal ? '🚀 STARTING REAL APPLICATION MODE' : 'ℹ️  DRY RUN MODE (Use --real to apply)');

        // Auto-search and apply
        await autoJobSearch({
          autoApply: isReal,
          maxApplications: maxApps
        });
        break;

      case 'stats':
        const stats = getApplicationStats();
        console.log('\n📊 Application Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        break;

      case 'test-cv':
        const { cvData, formData } = loadCVData();
        console.log('\n📄 CV Data Loaded:');
        console.log('Personal:', cvData.personal);
        console.log('Skills:', cvData.skills.all.slice(0, 10));
        console.log('\n📝 Form Data:');
        console.log(formData);
        break;

      case 'update-profile':
        // Ensure resume and upload it to Indeed profile
        await ensureResumePdf();
        const updated = await updateIndeedProfileResume();
        console.log(updated ? '✅ Profile resume updated' : '⚠️  Could not update profile resume');
        break;

      default:
        console.log('\n📖 Usage:');
        console.log('  node indeed-auto-apply.js search "Software Engineer"');
        console.log('  node indeed-auto-apply.js apply');
        console.log('  node indeed-auto-apply.js stats');
        console.log('  node indeed-auto-apply.js test-cv');
        console.log('  node indeed-auto-apply.js update-profile');
        console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export
module.exports = {
  searchIndeedJobs,
  applyToJob,
  fillIndeedApplicationForm,
  trackApplication,
  getApplicationStats,
  autoJobSearch,
  loginIndeed,
  updateIndeedProfileResume
};

if (require.main === module) {
  main();
}
