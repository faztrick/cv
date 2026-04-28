#!/usr/bin/env node

/**
 * Universal Job Application Auto-Fill
 * Smart form-filling agent that works across multiple job platforms
 * Supports: Bayt, Naukrigulf, GulfTalent, and generic application forms
 */

const fs = require('fs');
const path = require('path');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.log("Note: Puppeteer not installed");
}

const { parseResume, generateApplicationFormData } = require('./cv-parser');

/**
 * Universal field selectors for common form fields
 */
const FIELD_SELECTORS = {
  // Name fields
  firstName: [
    'input[name*="firstName" i]',
    'input[id*="firstName" i]',
    'input[placeholder*="first name" i]',
    'input[name="fname"]',
    'input[id="fname"]'
  ],
  lastName: [
    'input[name*="lastName" i]',
    'input[id*="lastName" i]',
    'input[placeholder*="last name" i]',
    'input[name="lname"]',
    'input[id="lname"]'
  ],
  fullName: [
    'input[name*="fullName" i]',
    'input[name*="name" i]',
    'input[id*="fullName" i]',
    'input[placeholder*="full name" i]'
  ],

  // Contact
  email: [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[id*="email" i]'
  ],
  phone: [
    'input[type="tel"]',
    'input[name*="phone" i]',
    'input[name*="mobile" i]',
    'input[id*="phone" i]',
    'input[placeholder*="phone" i]'
  ],

  // Location
  city: [
    'input[name*="city" i]',
    'input[id*="city" i]',
    'select[name*="city" i]'
  ],
  country: [
    'select[name*="country" i]',
    'select[id*="country" i]'
  ],

  // Professional
  currentTitle: [
    'input[name*="jobTitle" i]',
    'input[name*="currentTitle" i]',
    'input[id*="jobTitle" i]',
    'input[placeholder*="job title" i]'
  ],
  yearsOfExperience: [
    'select[name*="experience" i]',
    'input[name*="experience" i]',
    'select[id*="experience" i]'
  ],

  // Links
  linkedin: [
    'input[name*="linkedin" i]',
    'input[id*="linkedin" i]',
    'input[placeholder*="linkedin" i]'
  ],
  portfolio: [
    'input[name*="portfolio" i]',
    'input[name*="website" i]',
    'input[id*="portfolio" i]'
  ],

  // Salary
  expectedSalary: [
    'input[name*="salary" i]',
    'input[name*="expected" i]',
    'select[name*="salary" i]'
  ],

  // Notice period
  noticePeriod: [
    'select[name*="notice" i]',
    'input[name*="notice" i]',
    'select[name*="available" i]'
  ],

  // Summary/Cover letter
  summary: [
    'textarea[name*="summary" i]',
    'textarea[name*="cover" i]',
    'textarea[id*="summary" i]',
    'textarea[placeholder*="tell us" i]'
  ]
};

/**
 * Platform-specific configurations
 */
const PLATFORM_CONFIGS = {
  bayt: {
    name: 'Bayt.com',
    domain: 'bayt.com',
    resumeSelector: 'input[type="file"][name*="cv" i], input[type="file"][name*="resume" i]',
    submitSelector: 'button[type="submit"], input[type="submit"], button:has-text("Apply")',
    customFields: {
      nationality: 'select[name*="nationality" i]',
      visa: 'select[name*="visa" i]'
    }
  },
  naukrigulf: {
    name: 'Naukrigulf',
    domain: 'naukrigulf.com',
    resumeSelector: 'input[type="file"]',
    submitSelector: 'button:has-text("Apply"), input[value="Apply"]',
    customFields: {}
  },
  gulftalent: {
    name: 'GulfTalent',
    domain: 'gulftalent.com',
    resumeSelector: 'input[type="file"][name*="cv" i]',
    submitSelector: 'button:has-text("Submit"), button:has-text("Apply")',
    customFields: {}
  },
  generic: {
    name: 'Generic',
    domain: null,
    resumeSelector: 'input[type="file"]',
    submitSelector: 'button[type="submit"], input[type="submit"]',
    customFields: {}
  }
};

/**
 * Detect platform from URL
 */
function detectPlatform(url) {
  for (const [key, config] of Object.entries(PLATFORM_CONFIGS)) {
    if (config.domain && url.includes(config.domain)) {
      return key;
    }
  }
  return 'generic';
}

/**
 * Find and fill a field using multiple selectors
 */
async function findAndFillField(page, selectors, value, options = {}) {
  const { delay = 50, clear = true } = options;

  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (!element) continue;

      // Check if it's visible
      const isVisible = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      }, element);

      if (!isVisible) continue;

      // Check element type
      const tagName = await page.evaluate(el => el.tagName.toLowerCase(), element);
      const inputType = await page.evaluate(el => el.type, element);

      if (tagName === 'select') {
        // Handle select dropdowns
        await page.select(selector, value).catch(() => {
          // If exact match fails, try partial match
          page.evaluate((sel, val) => {
            const select = document.querySelector(sel);
            const options = Array.from(select.options);
            const match = options.find(opt =>
              opt.value.toLowerCase().includes(val.toLowerCase()) ||
              opt.text.toLowerCase().includes(val.toLowerCase())
            );
            if (match) select.value = match.value;
          }, selector, value);
        });
      } else if (tagName === 'textarea' || inputType === 'text' || inputType === 'email' || inputType === 'tel') {
        // Handle text inputs
        if (clear) {
          await element.click({ clickCount: 3 });
          await page.keyboard.press('Backspace');
        }
        await element.type(value.toString(), { delay });
      }

      console.log(`   ✓ Filled: ${selector.substring(0, 40)}...`);
      return true;

    } catch (err) {
      continue;
    }
  }

  return false;
}

/**
 * Auto-fill application form
 */
async function autoFillApplicationForm(page, formData, platform = 'generic') {
  console.log(`📝 Auto-filling ${PLATFORM_CONFIGS[platform].name} application form...`);

  const fieldMapping = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    city: formData.city,
    currentTitle: formData.currentTitle,
    linkedin: formData.linkedin,
    portfolio: formData.portfolio,
    summary: formData.summary,
    expectedSalary: '12000'
  };

  let filledCount = 0;

  for (const [field, value] of Object.entries(fieldMapping)) {
    if (!value) continue;

    const selectors = FIELD_SELECTORS[field];
    if (!selectors) continue;

    const success = await findAndFillField(page, selectors, value);
    if (success) filledCount++;
  }

  // Handle years of experience (special case - select dropdown)
  try {
    const expSelectors = FIELD_SELECTORS.yearsOfExperience;
    for (const selector of expSelectors) {
      const element = await page.$(selector);
      if (element) {
        await page.select(selector, '10').catch(() => {
          // Try selecting by visible text
          page.evaluate((sel) => {
            const select = document.querySelector(sel);
            const options = Array.from(select.options);
            const match = options.find(opt => opt.text.includes('10') || opt.text.includes('13'));
            if (match) select.value = match.value;
          }, selector);
        });
        console.log('   ✓ Selected years of experience');
        filledCount++;
        break;
      }
    }
  } catch (err) {
    // Skip if not found
  }

  // Platform-specific fields
  const platformConfig = PLATFORM_CONFIGS[platform];
  if (platformConfig.customFields) {
    for (const [field, selector] of Object.entries(platformConfig.customFields)) {
      try {
        const element = await page.$(selector);
        if (element) {
          if (field === 'nationality') {
            await page.select(selector, 'Indian').catch(() => {});
          } else if (field === 'visa') {
            await page.select(selector, 'Company').catch(() => {});
          }
          filledCount++;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  console.log(`✅ Auto-fill completed (${filledCount} fields filled)`);
  return filledCount;
}

/**
 * Upload resume
 */
async function uploadResume(page, resumePath, platform = 'generic') {
  console.log('📎 Uploading resume...');

  if (!fs.existsSync(resumePath)) {
    console.log(`⚠️  Resume not found: ${resumePath}`);
    return false;
  }

  const platformConfig = PLATFORM_CONFIGS[platform];
  const selector = platformConfig.resumeSelector;

  try {
    const fileInput = await page.$(selector);
    if (fileInput) {
      await fileInput.uploadFile(resumePath);
      console.log('✅ Resume uploaded');
      return true;
    }
  } catch (err) {
    console.log('⚠️  Could not upload resume');
  }

  return false;
}

/**
 * Apply to job with auto-fill
 */
async function applyWithAutoFill(jobUrl, options = {}) {
  if (!puppeteer) {
    throw new Error('Puppeteer is required');
  }

  const {
    resumePath = path.join(__dirname, '..', 'resumes', 'resume-fasil-2025.pdf'),
    dryRun = true
  } = options;

  console.log(`\n🚀 ${dryRun ? '[DRY RUN]' : 'Applying to'}: ${jobUrl}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: []
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Navigate to job
    await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Detect platform
    const platform = detectPlatform(jobUrl);
    console.log(`📱 Detected platform: ${PLATFORM_CONFIGS[platform].name}`);

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Load CV data
    const cvData = parseResume(path.join(__dirname, '..', 'resumes', 'resume.md'));
    const formData = generateApplicationFormData(cvData);

    // Auto-fill form
    const fieldsFilledCount = await autoFillApplicationForm(page, formData, platform);

    // Upload resume
    await uploadResume(page, resumePath, platform);

    if (!dryRun) {
      // Submit form
      const platformConfig = PLATFORM_CONFIGS[platform];
      const submitBtn = await page.$(platformConfig.submitSelector);

      if (submitBtn) {
        await submitBtn.click();
        console.log('✅ Application submitted!');
        await page.waitForTimeout(3000);
      } else {
        console.log('⚠️  Submit button not found - manual submission required');
      }
    } else {
      console.log('🔍 DRY RUN: Form filled but not submitted');
      console.log('📊 Review the form and submit manually if satisfied');
      await page.waitForTimeout(10000); // Wait for manual review
    }

    await browser.close();
    return { success: true, fieldsFilledCount };

  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
    return { success: false, error: error.message };
  }
}

/**
 * Batch apply to multiple jobs
 */
async function batchApply(jobUrls, options = {}) {
  const { dryRun = true, delayBetweenApplications = 10000 } = options;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         UNIVERSAL AUTO-FILL AGENT                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results = [];

  for (let i = 0; i < jobUrls.length; i++) {
    const jobUrl = jobUrls[i];
    console.log(`\n[${i + 1}/${jobUrls.length}] Processing: ${jobUrl}`);

    try {
      const result = await applyWithAutoFill(jobUrl, { ...options, dryRun });
      results.push({ jobUrl, ...result });

      if (i < jobUrls.length - 1) {
        console.log(`\n⏳ Waiting ${delayBetweenApplications / 1000}s before next application...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenApplications));
      }

    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      results.push({ jobUrl, success: false, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('BATCH APPLICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total jobs: ${jobUrls.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  return results;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'apply':
        const jobUrl = args[1];
        if (!jobUrl) {
          console.error('❌ Please provide a job URL');
          console.log('Usage: node universal-auto-fill.js apply <job-url>');
          process.exit(1);
        }
        await applyWithAutoFill(jobUrl, { dryRun: true });
        break;

      case 'batch':
        const urlsFile = args[1] || path.join(__dirname, '..', 'job-urls.txt');
        if (!fs.existsSync(urlsFile)) {
          console.error('❌ URLs file not found:', urlsFile);
          console.log('Create a file with one job URL per line');
          process.exit(1);
        }
        const urls = fs.readFileSync(urlsFile, 'utf8')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line.startsWith('http'));

        await batchApply(urls, { dryRun: true });
        break;

      case 'test-cv':
        const cvData = parseResume(path.join(__dirname, '..', 'resumes', 'resume.md'));
        const formData = generateApplicationFormData(cvData);
        console.log('\n📄 CV Data for Auto-Fill:');
        console.log(JSON.stringify(formData, null, 2));
        break;

      default:
        console.log('\n📖 Universal Auto-Fill Agent Usage:');
        console.log('');
        console.log('Commands:');
        console.log('  apply <job-url>     - Auto-fill a single job application');
        console.log('  batch [urls-file]   - Auto-fill multiple jobs from a file');
        console.log('  test-cv             - Test CV data extraction');
        console.log('');
        console.log('Examples:');
        console.log('  node universal-auto-fill.js apply "https://www.bayt.com/job/..."');
        console.log('  node universal-auto-fill.js batch job-urls.txt');
        console.log('');
        console.log('Supported Platforms:');
        console.log('  - Bayt.com');
        console.log('  - Naukrigulf');
        console.log('  - GulfTalent');
        console.log('  - Indeed (manual application flow only)');
        console.log('  - LinkedIn (manual application flow only)');
        console.log('  - Generic job application forms');
        console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  autoFillApplicationForm,
  applyWithAutoFill,
  batchApply,
  uploadResume,
  detectPlatform
};

if (require.main === module) {
  main();
}
