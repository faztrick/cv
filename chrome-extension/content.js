// CV Auto-Apply Extension - Content Script
// Runs on job board pages to auto-fill forms and extract job info

console.log('CV Auto-Apply Extension loaded');

// Field selectors for different platforms
const FIELD_SELECTORS = {
  firstName: [
    'input[name*="firstName" i]', 'input[id*="firstName" i]', 'input[name*="first_name" i]',
    'input[placeholder*="first name" i]', 'input[name="fname"]', 'input[aria-label*="first name" i]'
  ],
  lastName: [
    'input[name*="lastName" i]', 'input[id*="lastName" i]', 'input[name*="last_name" i]',
    'input[placeholder*="last name" i]', 'input[name="lname"]', 'input[aria-label*="last name" i]'
  ],
  fullName: [
    'input[name*="fullName" i]', 'input[name*="full_name" i]', 'input[name="name"]',
    'input[id*="fullName" i]', 'input[placeholder*="full name" i]', 'input[aria-label*="name" i]'
  ],
  email: [
    'input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]',
    'input[placeholder*="email" i]', 'input[aria-label*="email" i]'
  ],
  phone: [
    'input[type="tel"]', 'input[name*="phone" i]', 'input[name*="mobile" i]',
    'input[id*="phone" i]', 'input[placeholder*="phone" i]', 'input[aria-label*="phone" i]'
  ],
  city: [
    'input[name*="city" i]', 'input[id*="city" i]', 'input[placeholder*="city" i]',
    'select[name*="city" i]'
  ],
  country: [
    'select[name*="country" i]', 'select[id*="country" i]', 'input[name*="country" i]'
  ],
  currentTitle: [
    'input[name*="jobTitle" i]', 'input[name*="job_title" i]', 'input[name*="currentTitle" i]',
    'input[id*="jobTitle" i]', 'input[placeholder*="job title" i]', 'input[placeholder*="current title" i]'
  ],
  linkedin: [
    'input[name*="linkedin" i]', 'input[id*="linkedin" i]', 'input[placeholder*="linkedin" i]'
  ],
  portfolio: [
    'input[name*="portfolio" i]', 'input[name*="website" i]', 'input[id*="portfolio" i]'
  ],
  yearsExperience: [
    'select[name*="experience" i]', 'input[name*="experience" i]', 'select[id*="experience" i]',
    'input[name*="years" i]'
  ],
  salary: [
    'input[name*="salary" i]', 'input[name*="expected" i]', 'select[name*="salary" i]'
  ],
  summary: [
    'textarea[name*="summary" i]', 'textarea[name*="cover" i]', 'textarea[id*="summary" i]',
    'textarea[placeholder*="tell us" i]', 'textarea[placeholder*="cover letter" i]',
    'textarea[name*="message" i]', 'div[contenteditable="true"]'
  ],
  resume: [
    'input[type="file"][name*="resume" i]', 'input[type="file"][name*="cv" i]',
    'input[type="file"][accept*="pdf"]', 'input[type="file"]'
  ]
};

// Platform-specific job info extractors
const JOB_EXTRACTORS = {
  indeed: {
    title: () => document.querySelector('h1.jobsearch-JobInfoHeader-title, .jobTitle')?.textContent?.trim(),
    company: () => document.querySelector('[data-company-name], .jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim(),
    location: () => document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle > div')?.textContent?.trim(),
    salary: () => document.querySelector('#salaryInfoAndJobType, .jobsearch-JobMetadataHeader-item')?.textContent?.trim(),
    applyButton: () => document.querySelector('#indeedApplyButton, button[id*="apply"], .jobsearch-IndeedApplyButton-contentWrapper')
  },
  linkedin: {
    title: () => document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title')?.textContent?.trim(),
    company: () => document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name')?.textContent?.trim(),
    location: () => document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim(),
    salary: () => document.querySelector('.job-details-jobs-unified-top-card__job-insight')?.textContent?.trim(),
    applyButton: () => document.querySelector('.jobs-apply-button, button[data-control-name="jobdetails_topcard_inapply"]')
  },
  bayt: {
    title: () => document.querySelector('h1[class*="job-title"], .job-title')?.textContent?.trim(),
    company: () => document.querySelector('[class*="company-name"], .company-name')?.textContent?.trim(),
    location: () => document.querySelector('[class*="location"], .job-location')?.textContent?.trim(),
    salary: () => document.querySelector('[class*="salary"]')?.textContent?.trim(),
    applyButton: () => document.querySelector('button[class*="apply"], a[class*="apply"]')
  },
  gulftalent: {
    title: () => document.querySelector('h1.job-title, .job-header h1')?.textContent?.trim(),
    company: () => document.querySelector('.company-name, .job-company')?.textContent?.trim(),
    location: () => document.querySelector('.job-location, .location')?.textContent?.trim(),
    salary: () => document.querySelector('.salary, .job-salary')?.textContent?.trim(),
    applyButton: () => document.querySelector('button.apply-btn, a.apply-btn, [class*="apply"]')
  },
  naukrigulf: {
    title: () => document.querySelector('h1.jd-header-title, .job-title')?.textContent?.trim(),
    company: () => document.querySelector('.jd-header-comp-name, .company-name')?.textContent?.trim(),
    location: () => document.querySelector('.location, .job-location')?.textContent?.trim(),
    salary: () => document.querySelector('.salary, .job-salary')?.textContent?.trim(),
    applyButton: () => document.querySelector('#apply-button, .apply-btn, button[class*="apply"]')
  }
};

// Detect current platform
function detectPlatform() {
  const url = window.location.href;
  if (url.includes('indeed.com')) return 'indeed';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('bayt.com')) return 'bayt';
  if (url.includes('gulftalent.com')) return 'gulftalent';
  if (url.includes('naukrigulf.com')) return 'naukrigulf';
  return 'generic';
}

// Get job info from current page
function getJobInfo() {
  const platform = detectPlatform();
  const extractor = JOB_EXTRACTORS[platform];

  if (!extractor) {
    return { platform, title: document.title, url: window.location.href };
  }

  return {
    platform,
    title: extractor.title?.() || '',
    company: extractor.company?.() || '',
    location: extractor.location?.() || '',
    salary: extractor.salary?.() || '',
    url: window.location.href
  };
}

// Find and fill a field
function fillField(selectors, value, options = {}) {
  if (!value) return false;

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Check visibility
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const tagName = element.tagName.toLowerCase();

        if (tagName === 'select') {
          // Handle select dropdowns
          const optionToSelect = Array.from(element.options).find(opt =>
            opt.value.toLowerCase().includes(value.toLowerCase()) ||
            opt.text.toLowerCase().includes(value.toLowerCase())
          );
          if (optionToSelect) {
            element.value = optionToSelect.value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        } else if (tagName === 'textarea' || element.type === 'text' || element.type === 'email' || element.type === 'tel') {
          // Clear and fill text fields
          element.focus();
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        } else if (element.contentEditable === 'true') {
          // Handle contenteditable divs
          element.innerHTML = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
    } catch (err) {
      console.error('Fill error:', err);
    }
  }
  return false;
}

// Highlight form fields
function highlightFields() {
  const allSelectors = Object.values(FIELD_SELECTORS).flat();
  let count = 0;

  allSelectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        el.style.outline = '3px solid #667eea';
        el.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        count++;
      });
    } catch (e) {}
  });

  // Remove highlights after 5 seconds
  setTimeout(() => {
    allSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          el.style.outline = '';
          el.style.backgroundColor = '';
        });
      } catch (e) {}
    });
  }, 5000);

  return count;
}

// Auto-fill form with CV data
function autoFillForm(cvData, options = {}) {
  if (!cvData || !cvData.personalInfo) {
    return { success: false, error: 'No CV data available' };
  }

  const info = cvData.personalInfo;
  let filledCount = 0;

  // Split name if needed
  const nameParts = (info.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Fill fields
  if (fillField(FIELD_SELECTORS.fullName, info.name)) filledCount++;
  if (fillField(FIELD_SELECTORS.firstName, firstName)) filledCount++;
  if (fillField(FIELD_SELECTORS.lastName, lastName)) filledCount++;
  if (fillField(FIELD_SELECTORS.email, info.email)) filledCount++;
  if (fillField(FIELD_SELECTORS.phone, info.phone)) filledCount++;
  if (fillField(FIELD_SELECTORS.city, info.location || 'Dubai')) filledCount++;
  if (fillField(FIELD_SELECTORS.currentTitle, info.title)) filledCount++;
  if (fillField(FIELD_SELECTORS.linkedin, info.linkedin)) filledCount++;
  if (fillField(FIELD_SELECTORS.portfolio, info.website || info.portfolio)) filledCount++;

  // Fill years of experience (estimate from CV)
  if (cvData.experience && cvData.experience.length > 0) {
    fillField(FIELD_SELECTORS.yearsExperience, '10');
  }

  // Fill summary/cover letter
  if (options.autoCover && cvData.summary) {
    fillField(FIELD_SELECTORS.summary, cvData.summary);
  }

  return { success: true, filledCount, message: `Filled ${filledCount} fields` };
}

// Click apply button
function clickApplyButton() {
  const platform = detectPlatform();
  const extractor = JOB_EXTRACTORS[platform];

  if (extractor?.applyButton) {
    const btn = extractor.applyButton();
    if (btn) {
      btn.click();
      return true;
    }
  }

  // Generic apply button search
  const applyButtons = document.querySelectorAll('button, a');
  for (const btn of applyButtons) {
    const text = btn.textContent.toLowerCase();
    if (text.includes('apply') || text.includes('submit')) {
      btn.click();
      return true;
    }
  }

  return false;
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received:', request.action);

  switch (request.action) {
    case 'getJobInfo':
      sendResponse({ job: getJobInfo() });
      break;

    case 'autoFill':
      const fillResult = autoFillForm(request.cvData, request.options);
      sendResponse({ success: fillResult.success, message: fillResult.message, error: fillResult.error });
      break;

    case 'autoFillSubmit':
      const fillRes = autoFillForm(request.cvData, request.options);
      if (fillRes.success) {
        setTimeout(() => clickApplyButton(), 1000);
      }
      sendResponse({ success: fillRes.success, message: fillRes.message, job: getJobInfo() });
      break;

    case 'highlight':
      const count = highlightFields();
      sendResponse({ success: true, message: `Highlighted ${count} fields` });
      break;

    case 'apply':
      const clicked = clickApplyButton();
      sendResponse({ success: clicked, message: clicked ? 'Apply button clicked' : 'Apply button not found', job: getJobInfo() });
      break;

    case 'saveJob':
      const job = getJobInfo();
      chrome.storage.local.get(['savedJobs'], (result) => {
        const saved = result.savedJobs || [];
        saved.push({ ...job, savedAt: new Date().toISOString() });
        chrome.storage.local.set({ savedJobs: saved });
      });
      sendResponse({ success: true, message: 'Job saved', job: getJobInfo() });
      break;

    case 'addToTracker':
      sendResponse({ success: true, message: 'Added to tracker', job: getJobInfo() });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return true; // Keep message channel open for async response
});

// Auto-detect and notify about Easy Apply opportunities
function checkForEasyApply() {
  const platform = detectPlatform();
  if (platform === 'linkedin') {
    const easyApply = document.querySelector('.jobs-apply-button--top-card');
    if (easyApply && easyApply.textContent.includes('Easy Apply')) {
      chrome.runtime.sendMessage({ type: 'easyApplyDetected', job: getJobInfo() });
    }
  } else if (platform === 'indeed') {
    const indeedApply = document.querySelector('#indeedApplyButton');
    if (indeedApply) {
      chrome.runtime.sendMessage({ type: 'indeedApplyDetected', job: getJobInfo() });
    }
  }
}

// Run check on page load
setTimeout(checkForEasyApply, 2000);

// Create floating action button
function createFloatingButton() {
  const fab = document.createElement('div');
  fab.id = 'cv-autoapply-fab';
  fab.innerHTML = `
    <div class="cv-fab-main">🚀</div>
    <div class="cv-fab-menu">
      <button class="cv-fab-btn" data-action="autoFill" title="Auto-Fill">✨</button>
      <button class="cv-fab-btn" data-action="highlight" title="Highlight">🔍</button>
      <button class="cv-fab-btn" data-action="apply" title="Apply">📤</button>
    </div>
  `;
  document.body.appendChild(fab);

  // Toggle menu
  fab.querySelector('.cv-fab-main').addEventListener('click', () => {
    fab.classList.toggle('open');
  });

  // Action buttons
  fab.querySelectorAll('.cv-fab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const result = await chrome.storage.local.get(['cvAutoApply_cvData', 'cvAutoApply_options']);

      if (action === 'autoFill') {
        autoFillForm(result.cvAutoApply_cvData, result.cvAutoApply_options);
      } else if (action === 'highlight') {
        highlightFields();
      } else if (action === 'apply') {
        clickApplyButton();
      }
    });
  });
}

// Create FAB on supported pages
if (detectPlatform() !== 'generic') {
  setTimeout(createFloatingButton, 1500);
}
