#!/usr/bin/env node

/**
 * LinkedIn Auto-Apply Agent
 * Automated job search and "Easy Apply" automation for LinkedIn
 * Features:
 * - CV-based profile sync
 * - Easy Apply automation
 * - Connection request automation
 * - Job alerts and tracking
 */

const fs = require('fs');
const path = require('path');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.log("Note: Puppeteer not installed. Install with: npm install puppeteer");
}

const { parseResume, generateApplicationFormData, matchJobWithCV } = require('./cv-parser');

const config = {
  location: 'Dubai, United Arab Emirates',
  searchQueries: [
    'Software Engineer',
    'Senior Software Engineer',
    'AI Engineer',
    'Full Stack Engineer',
    'Flutter Developer',
    'Solutions Architect'
  ],
  linkedin: {
    jobsUrl: 'https://www.linkedin.com/jobs',
    loginUrl: 'https://www.linkedin.com/login'
  },
  resumePath: path.join(__dirname, '..', 'resumes', 'resume.md'),
  trackingFile: path.join(__dirname, '..', 'linkedin-applications.json'),
  // Credentials (should be in environment variables in production)
  credentials: {
    email: process.env.LINKEDIN_EMAIL || '',
    password: process.env.LINKEDIN_PASSWORD || ''
  }
};

/**
 * Login to LinkedIn
 */
async function loginToLinkedIn(page) {
  console.log('🔐 Logging in to LinkedIn...');

  if (!config.credentials.email || !config.credentials.password) {
    console.log('⚠️  LinkedIn credentials not set');
    console.log('   Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD environment variables');
    console.log('   Or manually login when browser opens...');
    await page.waitForTimeout(30000); // Wait for manual login
    return;
  }

  await page.goto(config.linkedin.loginUrl, { waitUntil: 'networkidle2' });

  // Fill login form
  await page.type('#username', config.credentials.email);
  await page.type('#password', config.credentials.password);

  // Click sign in
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
    console.log('⚠️  Manual verification may be required');
  });

  console.log('✅ Logged in');
}

/**
 * Search jobs on LinkedIn
 */
async function searchLinkedInJobs(query, options = {}) {
  if (!puppeteer) {
    throw new Error('Puppeteer is required');
  }

  const {
    location = config.location,
    easyApplyOnly = true,
    maxResults = 25
  } = options;

  console.log(`\n🔍 Searching LinkedIn: "${query}" in ${location}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Login
    await loginToLinkedIn(page);

    // Build search URL
    let searchUrl = `${config.linkedin.jobsUrl}/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    if (easyApplyOnly) {
      searchUrl += '&f_AL=true'; // Easy Apply filter
    }

    console.log(`📄 Loading: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for job listings
    await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 }).catch(() => {
      console.log('⚠️  No jobs found');
    });

    // Scroll to load more jobs
    await autoScroll(page, maxResults);

    // Extract job listings
    const jobs = await page.evaluate((max) => {
      const jobCards = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item');
      const results = [];

      for (let i = 0; i < Math.min(jobCards.length, max); i++) {
        const card = jobCards[i];

        const titleEl = card.querySelector('.job-card-list__title, h3.base-search-card__title');
        const companyEl = card.querySelector('.job-card-container__company-name, .base-search-card__subtitle');
        const locationEl = card.querySelector('.job-card-container__metadata-item, .job-search-card__location');
        const linkEl = card.querySelector('a.job-card-list__title, a.base-card__full-link');
        const easyApplyEl = card.querySelector('.job-card-container__apply-method');

        if (titleEl && companyEl) {
          const jobData = {
            title: titleEl.textContent.trim(),
            company: companyEl.textContent.trim(),
            location: locationEl ? locationEl.textContent.trim() : 'Dubai, UAE',
            url: linkEl ? linkEl.href : '',
            easyApply: easyApplyEl && easyApplyEl.textContent.includes('Easy Apply'),
            platform: 'LinkedIn',
            searchQuery: query,
            scrapedDate: new Date().toISOString()
          };

          results.push(jobData);
        }
      }

      return results;
    }, maxResults);

    console.log(`✅ Found ${jobs.length} jobs (${jobs.filter(j => j.easyApply).length} with Easy Apply)`);

    // Match with CV
    const { cvData } = loadCVData();
    const matchedJobs = jobs.map(job => {
      const matchScore = matchJobWithCV(job.title + ' ' + job.company, cvData);
      return {
        ...job,
        matchScore: matchScore.total,
        matchedSkills: matchScore.matched
      };
    });

    await browser.close();
    return matchedJobs;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Auto-scroll to load more jobs
 */
async function autoScroll(page, targetCount = 25) {
  await page.evaluate(async (target) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        const jobCount = document.querySelectorAll('.job-card-container').length;

        if (totalHeight >= scrollHeight || jobCount >= target) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }, targetCount);
}

/**
 * Apply to LinkedIn job using Easy Apply
 */
async function easyApplyToJob(job, options = {}) {
  if (!puppeteer) {
    throw new Error('Puppeteer is required');
  }

  const { dryRun = true } = options;

  console.log(`\n📤 ${dryRun ? '[DRY RUN]' : 'Easy Applying to'}: ${job.title} at ${job.company}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Login
    await loginToLinkedIn(page);

    // Navigate to job
    await page.goto(job.url, { waitUntil: 'networkidle2' });

    // Click Easy Apply button
    const easyApplyBtn = await page.$('button.jobs-apply-button, button:has-text("Easy Apply")');
    if (!easyApplyBtn) {
      console.log('⚠️  No Easy Apply button found');
      await browser.close();
      return { success: false, reason: 'No Easy Apply' };
    }

    await easyApplyBtn.click();
    await page.waitForTimeout(2000);

    // Load CV data
    const { formData } = loadCVData();

    // Multi-step form handling
    let step = 1;
    const maxSteps = 5;

    while (step <= maxSteps) {
      console.log(`   Step ${step}...`);

      // Fill current form step
      await fillLinkedInFormStep(page, formData);

      // Check for Next or Submit button
      const nextBtn = await page.$('button[aria-label="Continue to next step"], button:has-text("Next")');
      const submitBtn = await page.$('button[aria-label="Submit application"], button:has-text("Submit")');

      if (submitBtn && !dryRun) {
        await submitBtn.click();
        console.log('✅ Application submitted!');

        // Track application
        trackApplication(job, { status: 'applied', method: 'Easy Apply' });

        await page.waitForTimeout(3000);
        break;
      } else if (submitBtn && dryRun) {
        console.log('🔍 DRY RUN: Would submit here');
        break;
      } else if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        step++;
      } else {
        console.log('⚠️  Unexpected form state');
        break;
      }
    }

    await browser.close();
    return { success: true };

  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
    return { success: false, reason: error.message };
  }
}

/**
 * Fill LinkedIn form step
 */
async function fillLinkedInFormStep(page, formData) {
  try {
    // Phone number
    const phoneInput = await page.$('input[id*="phoneNumber"], input[name*="phoneNumber"]');
    if (phoneInput) {
      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(formData.phone);
    }

    // Text inputs
    const inputs = await page.$$('input[type="text"]');
    for (const input of inputs) {
      const name = await page.evaluate(el => el.name || el.id, input);
      if (name && name.toLowerCase().includes('linkedin')) {
        await input.type(formData.linkedin);
      } else if (name && name.toLowerCase().includes('website')) {
        await input.type(formData.website);
      }
    }

    // Radio buttons (work authorization, etc.)
    const yesRadio = await page.$('input[type="radio"][value="Yes"]');
    if (yesRadio) {
      await yesRadio.click();
    }

    // Dropdowns
    const selects = await page.$$('select');
    for (const select of selects) {
      const options = await select.$$('option');
      if (options.length > 1) {
        await select.select(await page.evaluate(opt => opt.value, options[1]));
      }
    }

  } catch (error) {
    console.log('   ⚠️  Some fields could not be filled');
  }
}

/**
 * Load CV data
 */
function loadCVData() {
  const cvData = parseResume(config.resumePath);
  const formData = generateApplicationFormData(cvData);
  return { cvData, formData };
}

/**
 * Track application
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
 * Send connection request to recruiter
 */
async function connectWithRecruiter(profileUrl, message) {
  if (!puppeteer) {
    throw new Error('Puppeteer is required');
  }

  console.log(`\n🤝 Connecting with recruiter: ${profileUrl}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    await loginToLinkedIn(page);

    await page.goto(profileUrl, { waitUntil: 'networkidle2' });

    // Click Connect button
    const connectBtn = await page.$('button:has-text("Connect")');
    if (!connectBtn) {
      console.log('⚠️  Connect button not found');
      await browser.close();
      return false;
    }

    await connectBtn.click();
    await page.waitForTimeout(1000);

    // Add note if message provided
    if (message) {
      const addNoteBtn = await page.$('button:has-text("Add a note")');
      if (addNoteBtn) {
        await addNoteBtn.click();
        await page.waitForTimeout(500);

        const noteTextarea = await page.$('textarea[name="message"]');
        if (noteTextarea) {
          await noteTextarea.type(message);
        }
      }
    }

    // Send invitation
    const sendBtn = await page.$('button:has-text("Send")');
    if (sendBtn) {
      await sendBtn.click();
      console.log('✅ Connection request sent');
    }

    await browser.close();
    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
    return false;
  }
}

/**
 * Main automation workflow
 */
async function autoLinkedInJobSearch(options = {}) {
  const {
    queries = config.searchQueries,
    autoApply = false,
    maxApplications = 3
  } = options;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         LINKEDIN AUTO-APPLY AGENT                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const allJobs = [];
  let applicationsSubmitted = 0;

  for (const query of queries) {
    if (applicationsSubmitted >= maxApplications) break;

    try {
      const jobs = await searchLinkedInJobs(query, { easyApplyOnly: true, maxResults: 25 });
      allJobs.push(...jobs);

      if (autoApply) {
        const easyApplyJobs = jobs
          .filter(j => j.easyApply && j.matchScore > 40)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 2);

        for (const job of easyApplyJobs) {
          if (applicationsSubmitted >= maxApplications) break;

          const result = await easyApplyToJob(job, { dryRun: false });
          if (result.success) applicationsSubmitted++;

          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

    } catch (error) {
      console.error(`❌ Error with query "${query}":`, error.message);
    }
  }

  // Save results
  const resultsFile = path.join(__dirname, '..', 'linkedin-matches.json');
  fs.writeFileSync(resultsFile, JSON.stringify(allJobs, null, 2), 'utf8');
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  console.log(`📊 Total jobs found: ${allJobs.length}`);
  console.log(`✅ Applications submitted: ${applicationsSubmitted}`);

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
        const jobs = await searchLinkedInJobs(query);
        console.log(`\n📊 Found ${jobs.length} jobs`);
        jobs.slice(0, 10).forEach((job, i) => {
          console.log(`${i + 1}. ${job.title} at ${job.company} (Match: ${Math.round(job.matchScore)}%)`);
        });
        break;

      case 'apply':
        await autoLinkedInJobSearch({ autoApply: false, maxApplications: 3 });
        break;

      case 'test-cv':
        const { cvData, formData } = loadCVData();
        console.log('\n📄 CV Data Loaded:');
        console.log(JSON.stringify(formData, null, 2));
        break;

      default:
        console.log('\n📖 Usage:');
        console.log('  node linkedin-auto-apply.js search "AI Engineer"');
        console.log('  node linkedin-auto-apply.js apply');
        console.log('  node linkedin-auto-apply.js test-cv');
        console.log('');
        console.log('Set environment variables:');
        console.log('  LINKEDIN_EMAIL=your@email.com');
        console.log('  LINKEDIN_PASSWORD=yourpassword');
        console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  searchLinkedInJobs,
  easyApplyToJob,
  connectWithRecruiter,
  autoLinkedInJobSearch
};

if (require.main === module) {
  main();
}
