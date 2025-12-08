const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const cvParser = require('./cv-parser');
const stealth = require('./stealth-utils');
const { AIFormAgent } = require('./ai-form-agent');
const outreachManager = require('./outreach-manager');

// Configuration
const CONFIG = {
    headless: process.argv.includes('--headless') || !process.env.DISPLAY || process.env.CI === 'true', // Auto-detect headless mode
    slowMo: 100, // Increased for more human-like behavior
    viewport: stealth.getRandomViewport(), // Randomized viewport
    timeout: 45000, // Increased timeout
    userDataDir: path.join(__dirname, '..', 'user_data', 'playwright'), // Persist sessions
    resumePath: path.join(__dirname, '..', 'resumes', 'resume.md'),
    pdfPath: path.join(__dirname, '..', 'resumes', 'resume-fasil-2025.pdf'),
    retryAttempts: 3,
    retryDelay: 2000,
    userAgent: stealth.getRandomUserAgent() // Random user agent
};

const EXTENSION_PATH = path.join(__dirname, '..', 'chrome-extension');

// Utility: Retry wrapper for flaky operations
async function withRetry(fn, attempts = CONFIG.retryAttempts, delayMs = CONFIG.retryDelay) {
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            console.log(`   ⚠️ Attempt ${i + 1}/${attempts} failed: ${e.message}`);
            if (i < attempts - 1) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }
    }
    throw lastError;
}

class JobAutomator {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.cvData = null;
        this.formData = null;
        this.aiAgent = null; // AI-powered form filling agent
    }

    async init() {
        console.log('🚀 Initializing Job Automator (Playwright) - v2.4 with AI Agent...');
        console.log(`   Mode: ${CONFIG.headless ? 'Headless' : 'Visible'}`);
        console.log(`   User-Agent: ${CONFIG.userAgent.substring(0, 50)}...`);

        // Parse CV data first
        if (fs.existsSync(CONFIG.resumePath)) {
            this.cvData = cvParser.parseResume(CONFIG.resumePath);
            this.formData = cvParser.generateApplicationFormData(this.cvData);

            // Initialize AI agent with CV data
            this.aiAgent = new AIFormAgent({
                personal: {
                    firstName: this.formData.firstName,
                    lastName: this.formData.lastName,
                    name: this.formData.fullName,
                    email: this.formData.email,
                    phone: this.formData.phone,
                    title: this.cvData.title || 'Software Architect',
                    linkedin: this.formData.linkedin,
                    website: this.formData.website,
                    portfolio: this.formData.portfolio,
                    location: this.formData.city || 'Dubai'
                },
                yearsOfExperience: this.formData.yearsOfExperience || '15',
                summary: this.formData.summary,
                skills: this.cvData.skills || []
            });
            console.log(`📄 Loaded CV for: ${this.formData.fullName}`);
        } else {
            console.error('❌ Resume not found!');
            process.exit(1);
        }

        if (process.argv.includes('--connect')) {
            console.log('🔗 Connecting to existing Chrome (port 9222)...');
            try {
                const browser = await chromium.connectOverCDP('http://localhost:9222');
                const context = browser.contexts()[0];
                if (!context) throw new Error('No open browser context found. Open a tab in Chrome.');
                this.page = context.pages()[0] || await context.newPage();
                this.browser = browser;

                // Apply stealth to connected browser page
                await stealth.applyStealthToPage(this.page);
            } catch (e) {
                console.error('❌ Connection failed. Make sure Chrome is running with --remote-debugging-port=9222');
                console.error(e.message);
                process.exit(1);
            }
        } else {
            // Check if user data dir is in use (lock file exists)
            const lockFile = path.join(CONFIG.userDataDir, 'SingletonLock');
            let isLocked = false;
            try {
                // Check if lock file exists and process is actually running (simple check)
                if (fs.existsSync(lockFile)) {
                    isLocked = true;
                }
            } catch (e) {}

            if (isLocked) {
                console.log('⚠️ Browser profile is locked. Trying to connect to existing instance (port 9222)...');
                try {
                    const browser = await chromium.connectOverCDP('http://localhost:9222');
                    const context = browser.contexts()[0];
                    if (!context) throw new Error('No open browser context found.');
                    this.page = context.pages()[0] || await context.newPage();
                    this.browser = browser;
                    console.log('✅ Connected to existing browser session!');
                    await stealth.applyStealthToPage(this.page);
                    return; // Exit init, we are connected
                } catch (connErr) {
                    console.log('❌ Could not connect to existing instance:', connErr.message);
                    console.log('   Proceeding with fresh session (login state might be lost)...');
                }
            }

            // Always try persistent context first, fall back to regular launch on failure
            try {
                // Create user data dir if needed
                if (!fs.existsSync(CONFIG.userDataDir)) {
                    fs.mkdirSync(CONFIG.userDataDir, { recursive: true });
                }

                this.browser = await chromium.launchPersistentContext(CONFIG.userDataDir, {
                    headless: CONFIG.headless,
                    slowMo: CONFIG.slowMo,
                    viewport: CONFIG.viewport,
                    channel: 'chromium', // Use Playwright's bundled Chromium, not system Chrome
                    args: [
                        `--disable-extensions-except=${EXTENSION_PATH}`,
                        `--load-extension=${EXTENSION_PATH}`,
                        '--disable-blink-features=AutomationControlled',
                        '--disable-features=IsolateOrigins,site-per-process',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        `--user-agent=${CONFIG.userAgent}`
                    ],
                    ignoreDefaultArgs: ['--enable-automation']
                });

                this.page = this.browser.pages()[0] || await this.browser.newPage();
                console.log('✅ Persistent browser context launched');
            } catch (persistErr) {
                console.log('⚠️ Persistent context failed, using fresh session:', persistErr.message);
                // Fallback: Use non-persistent context
                const browser = await chromium.launch({
                    headless: CONFIG.headless,
                    slowMo: CONFIG.slowMo,
                    args: [
                        '--disable-blink-features=AutomationControlled',
                        '--disable-features=IsolateOrigins,site-per-process',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        `--user-agent=${CONFIG.userAgent}`
                    ],
                    ignoreDefaultArgs: ['--enable-automation']
                });
                this.browser = await browser.newContext({ viewport: CONFIG.viewport });
                this.page = await this.browser.newPage();
                console.log('✅ Fresh browser session launched');
            }

            // Apply stealth scripts to context
            try {
                await stealth.applyStealthToContext(this.browser);
            } catch (stealthErr) {
                console.log('⚠️ Stealth context injection skipped:', stealthErr.message);
            }

            // Also apply to the specific page
            try {
                await stealth.applyStealthToPage(this.page);
            } catch (stealthErr) {
                console.log('⚠️ Stealth page injection skipped:', stealthErr.message);
            }
        }

        // Set additional headers to avoid detection
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });

        console.log('🛡️ Stealth mode initialized');
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async randomDelay(min = 1500, max = 4000) {
        await stealth.humanDelay(min, max);
    }

    // Human-like scroll
    async humanScroll(distance = 300) {
        await stealth.humanScroll(this.page, distance);
    }

    // Check for CAPTCHA on current page
    async checkForCaptcha() {
        const { detected, type } = await stealth.detectCaptcha(this.page);
        if (detected) {
            const solved = await stealth.handleCaptcha(this.page, type);
            return solved;
        }
        return true; // No CAPTCHA, continue
    }

    // Safe navigation with CAPTCHA detection
    async safeNavigate(url, options = {}) {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout, ...options });
        await this.checkForCaptcha();
    }

    // --- LOGIN FUNCTIONS ---

    async loginIndeed() {
        const email = process.env.INDEED_EMAIL;
        const password = process.env.INDEED_PASSWORD;

        if (!email || !password) {
            console.log('⚠️ INDEED_EMAIL/INDEED_PASSWORD not set in environment. Skipping auto-login.');
            console.log('   Set these in your .env file or manually log in.');
            return false;
        }

        console.log('🔐 Logging into Indeed...');
        try {
            await this.safeNavigate('https://secure.indeed.com/account/login');
            await this.randomDelay(1000, 2000);

            // Enter email
            await this.page.fill('input[type="email"], input[name*="email"], #ifl-InputFormField-3', email);
            await this.randomDelay(300, 600);

            // Click continue
            const continueBtn = this.page.locator('button[type="submit"], button:has-text("Continue")');
            if (await continueBtn.count() > 0) {
                await continueBtn.first().click();
                await this.randomDelay(1500, 2500);
            }

            // Check for CAPTCHA
            await this.checkForCaptcha();

            // Enter password
            const passwordField = this.page.locator('input[type="password"]');
            await passwordField.waitFor({ state: 'visible', timeout: 20000 });
            await passwordField.fill(password);
            await this.randomDelay(300, 600);

            // Click sign in
            const signInBtn = this.page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');
            if (await signInBtn.count() > 0) {
                await signInBtn.first().click();
            }

            // Wait for navigation
            await this.page.waitForURL(/indeed\.com/, { timeout: 30000 }).catch(() => {});
            await this.randomDelay(2000, 3000);

            console.log('✅ Indeed login completed (may require verification)');
            return true;
        } catch (e) {
            console.log('⚠️ Indeed login issue:', e.message);
            return false;
        }
    }

    async loginLinkedIn() {
        const email = process.env.LINKEDIN_EMAIL;
        const password = process.env.LINKEDIN_PASSWORD;

        if (!email || !password) {
            console.log('⚠️ LINKEDIN_EMAIL/LINKEDIN_PASSWORD not set in environment. Skipping auto-login.');
            console.log('   Set these in your .env file or manually log in.');
            return false;
        }

        console.log('🔐 Logging into LinkedIn...');
        try {
            await this.safeNavigate('https://www.linkedin.com/login');
            await this.randomDelay(1000, 2000);

            // Enter credentials with human-like typing
            await this.page.fill('#username', email);
            await this.randomDelay(200, 500);
            await this.page.fill('#password', password);
            await this.randomDelay(300, 600);

            // Click sign in
            await this.page.click('button[type="submit"]');
            await this.randomDelay(3000, 5000);

            // Check for CAPTCHA/security check
            await this.checkForCaptcha();

            // Verify login by checking for feed
            const isLoggedIn = await this.page.locator('.feed-identity-module, .global-nav__me').count() > 0;
            if (isLoggedIn) {
                console.log('✅ LinkedIn login successful!');
                return true;
            } else {
                console.log('⚠️ LinkedIn login may require verification');
                return false;
            }
        } catch (e) {
            console.log('⚠️ LinkedIn login issue:', e.message);
            return false;
        }
    }

    // --- FORM FILLING UTILITIES ---

    // Get answer for common application questions (Delegates to AI Agent)
    async getAnswerForQuestion(questionText) {
        if (!this.aiAgent) return null;
        return await this.aiAgent.answerQuestion(questionText);
    }

    // Fill LinkedIn Easy Apply modal form (Delegates to AI Agent or Extension)
    async fillLinkedInForm(formModal) {
        // Try using the extension via FAB first
        try {
            const fabBtn = this.page.locator('button[data-action="autoFill"]');
            if (await fabBtn.count() > 0) {
                if (await fabBtn.isVisible()) {
                    console.log('   🧩 Clicking Extension Auto-Fill button...');
                    await fabBtn.click();
                    await this.randomDelay(1000, 2000);
                    return; // Assume extension did the job
                } else {
                    // FAB might be closed
                    const fabMain = this.page.locator('#cv-autoapply-fab .cv-fab-main');
                    if (await fabMain.isVisible()) {
                        await fabMain.click();
                        await this.randomDelay(500);
                        if (await fabBtn.isVisible()) {
                            console.log('   🧩 Clicking Extension Auto-Fill button...');
                            await fabBtn.click();
                            await this.randomDelay(1000, 2000);
                            return;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('   ⚠️ Extension interaction failed:', e.message);
        }

        if (!this.aiAgent) {
            console.log('⚠️ AI Agent not initialized');
            return;
        }

        console.log('   🤖 AI Agent taking over form filling...');
        await this.aiAgent.fillForm(formModal, CONFIG.pdfPath);
    }

    // --- GMAIL AUTOMATION ---

    async sendGmailWeb(to, subject, body, attachmentPath = null) {
        console.log(`📧 Sending email via Gmail Web to: ${to}`);
        try {
            // Open new tab for Gmail
            const page = await this.browser.newPage();
            await page.goto('https://mail.google.com', { waitUntil: 'domcontentloaded' });

            // Check if logged in
            if (await page.locator('a[href*="accounts.google.com/ServiceLogin"]').count() > 0) {
                console.log('⚠️ Not logged in to Gmail. Please run "node scripts/setup-session.js" first.');
                await page.close();
                return false;
            }

            // Click Compose
            console.log('   ✍️ Clicking Compose...');
            await page.click('div[role="button"]:has-text("Compose")');

            // Wait for compose window
            const toField = page.locator('input[aria-label="To recipients"]'); // Selector might vary
            await toField.waitFor({ state: 'visible', timeout: 10000 });

            // Fill To
            await toField.fill(to);
            await page.keyboard.press('Enter');
            await this.randomDelay(500, 1000);

            // Fill Subject
            const subjectField = page.locator('input[name="subjectbox"]');
            await subjectField.fill(subject);
            await this.randomDelay(500, 1000);

            // Fill Body
            const bodyField = page.locator('div[aria-label="Message Body"]');
            await bodyField.fill(body);
            await this.randomDelay(500, 1000);

            // Attachment
            if (attachmentPath && fs.existsSync(attachmentPath)) {
                console.log('   📎 Attaching file...');
                const attachInput = page.locator('input[type="file"][name="Filedata"]');
                await attachInput.setInputFiles(attachmentPath);

                // Wait for upload (progress bar to disappear)
                await page.waitForSelector('div[role="progressbar"]', { state: 'hidden', timeout: 30000 });
                await this.randomDelay(1000, 2000);
            }

            // Send
            console.log('   🚀 Sending...');
            // Ctrl+Enter is safer than finding the button sometimes
            await bodyField.press('Control+Enter');

            // Wait for "Message sent" toast
            await page.waitForSelector('span:has-text("Message sent")', { timeout: 10000 });
            console.log('   ✅ Email sent successfully via Gmail Web!');

            await page.close();
            return true;

        } catch (e) {
            console.log('   ❌ Gmail Web send failed:', e.message);
            // Try to close page if open
            try { if (page) await page.close(); } catch (_) {}
            return false;
        }
    }

    // --- NOTIFICATIONS ---

    async sendWhatsAppNotification(message) {
        try {
            // Send to self (using the number from CV or a default)
            const number = process.env.WHATSAPP_NOTIFY_NUMBER || this.formData.phone;
            if (!number) return;

            // Use dynamic import for fetch if needed in older node, but node 18+ has global fetch
            await fetch('http://localhost:3000/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, message })
            });
            console.log('   📱 WhatsApp notification sent');
        } catch (e) {
            console.log('   ⚠️ WhatsApp notification failed:', e.message);
        }
    }

    async sendEmailNotification(subject, body) {
        try {
            const toEmail = process.env.NOTIFY_EMAIL || this.formData.email;
            if (!toEmail) return;

            // Try Gmail Web first if we have a browser session
            if (this.browser) {
                const sent = await this.sendGmailWeb(toEmail, subject, body);
                if (sent) return;
            }

            // Fallback to Python SMTP
            const { spawn } = require('child_process');
            const scriptPath = path.join(__dirname, 'send_email.py');
            const tempBodyPath = path.join(__dirname, '..', '.cache', 'temp-email-body.txt');

            // Ensure cache directory exists
            const cacheDir = path.dirname(tempBodyPath);
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            fs.writeFileSync(tempBodyPath, body);

            const pythonProcess = spawn('python', [
                scriptPath,
                '--to', toEmail,
                '--subject', subject,
                '--body', tempBodyPath
            ]);

            pythonProcess.on('error', (err) => {
                console.log('   ⚠️ Email notification failed:', err.message);
            });

            // Cleanup temp file after a delay
            setTimeout(() => {
                try { fs.unlinkSync(tempBodyPath); } catch (e) {}
            }, 5000);

        } catch (e) {
            console.log('   ⚠️ Email notification error:', e.message);
        }
    }

    // Safe click with retry
    async safeClick(selector, options = {}) {
        return withRetry(async () => {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout: options.timeout || 10000 });
            await element.click();
        });
    }

    // Safe fill with retry
    async safeFill(selector, value, options = {}) {
        return withRetry(async () => {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout: options.timeout || 10000 });
            await element.fill(value);
        });
    }

    // --- TRACKING & OUTREACH ---

    extractEmail(text) {
        if (!text) return '';
        // Simple regex for email extraction
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
        const matches = text.match(emailRegex);
        // Filter out common false positives or generic emails if needed
        if (matches) {
            const valid = matches.find(e => !e.includes('indeed.com') && !e.includes('linkedin.com'));
            return valid || '';
        }
        return '';
    }

    async trackApplication(company, title, platform, status = 'Applied', email = '') {
        try {
            console.log(`   📝 Tracking application: ${title} at ${company}`);
            outreachManager.addCompany(company, platform, email, title, status);

            // If we have an email, maybe generate an outreach email automatically?
            if (email) {
                console.log('   📧 Email found! Generating outreach draft...');
                outreachManager.generateEmails(); // This processes all 'Pending' ones, but we might want to be more specific
            }
        } catch (e) {
            console.log('   ⚠️ Failed to track application:', e.message);
        }
    }

    // --- INDEED AUTOMATION ---

    async runIndeed(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting Indeed Search: "${keyword}" in "${location}"`);

        try {
            // Navigate and wait for full page load
            await this.page.goto('https://ae.indeed.com/', { waitUntil: 'networkidle', timeout: 60000 });
            await this.randomDelay(2000, 3000);

            // Simulate human-like page interaction before searching
            await this.humanScroll(100);
            await this.randomDelay(1000, 1500);

            // Check if logged in - multiple possible selectors
            const isLoggedIn = await this.page.locator([
                '[data-gnav-element-name="AccountMenu"]',
                '[aria-label="Profile"]',
                '.gnav-AccountMenu',
                '#ifl-GlobalMainNav-link-user',
                'button[aria-label="Open profile menu"]',
                '.gnav-header-1b6v969'
            ].join(',')).count() > 0;

            if (!isLoggedIn) {
                console.log('⚠️ Not logged in. Search works without login, but apply may require it.');
            } else {
                console.log('✅ Logged in to Indeed');
            }

            // Wait for search inputs to be ready
            await this.page.waitForSelector('#text-input-what, input[name="q"]', { state: 'visible', timeout: 15000 });

            // Fill search form - with retry for dynamic loading
            await withRetry(async () => {
                await this.page.fill('#text-input-what, input[name="q"]', keyword);
            });
            await this.randomDelay(500, 1000);

            await withRetry(async () => {
                await this.page.fill('#text-input-where, input[name="l"]', location);
            });
            await this.randomDelay(300, 600);

            await this.page.keyboard.press('Enter');

            await this.page.waitForURL(/jobs/, { timeout: CONFIG.timeout });
            await this.randomDelay(1500, 2500);
            console.log('✅ Search results loaded');

            // Get job cards - multiple selector patterns for compatibility
            const jobCardSelector = '.job_seen_beacon, .resultContent, [data-testid="job-card"], .jobCard_mainContent, .cardOutline';
            const jobCards = this.page.locator(jobCardSelector);
            const count = await jobCards.count();
            console.log(`📊 Found ${count} jobs on first page`);

            for (let i = 0; i < Math.min(count, 10); i++) { // Limit to 10 for safety
                try {
                    const card = jobCards.nth(i);
                    // Re-query the element to avoid stale element errors
                    if (await card.count() === 0) continue;

                    await card.scrollIntoViewIfNeeded();
                    await this.randomDelay(800, 1500);

                    // Try multiple title selectors - updated for 2025 Indeed structure
                    let title = 'Unknown Title';
                    const titleSelectors = [
                        'h2.jobTitle span[title]',
                        'h2.jobTitle a span',
                        'h2.jobTitle span',
                        'h2.jobTitle a',
                        'h2.jobTitle',
                        '[data-testid="job-title"]',
                        '.jcs-JobTitle',
                        'a.jcs-JobTitle',
                        '.jobTitle'
                    ];
                    for (const sel of titleSelectors) {
                        try {
                            const el = card.locator(sel).first();
                            if (await el.count() > 0) {
                                const attr = await el.getAttribute('title');
                                title = attr || await el.innerText();
                                if (title && title !== 'Unknown Title') break;
                            }
                        } catch (e) {}
                    }

                    // Company selectors
                    let company = 'Unknown Company';
                    const companySelectors = [
                        '[data-testid="company-name"]',
                        '.companyName',
                        'span[data-testid="company-name"]',
                        '.company_location span:first-child',
                        '.companyInfo span'
                    ];
                    for (const sel of companySelectors) {
                        try {
                            const el = card.locator(sel).first();
                            if (await el.count() > 0) {
                                company = await el.innerText();
                                if (company && company !== 'Unknown Company') break;
                            }
                        } catch (e) {}
                    }

                    console.log(`\n👉 [${i + 1}/${count}] ${title.trim()} at ${company.trim()}`);

                    // Click job to see details
                    await card.click({ timeout: 5000 });

                    // Wait for job details panel to load
                    await this.page.waitForSelector('#jobDescriptionText, .jobsearch-JobComponent-description, [data-testid="job-description"]', {
                        state: 'visible',
                        timeout: 10000
                    }).catch(() => console.log('   ⏳ Job details loading slowly...'));

                    await this.randomDelay(2000, 3000);

                    // Extract email from description
                    let email = '';
                    try {
                        const desc = await this.page.locator('#jobDescriptionText').innerText({ timeout: 2000 }).catch(() => '');
                        email = this.extractEmail(desc);
                        if (email) console.log(`   📧 Found email: ${email}`);
                    } catch (e) {}

                    // Check for CAPTCHA after clicking
                    await this.checkForCaptcha();

                    // Wait a bit for apply buttons to render
                    await this.randomDelay(1000, 1500);

                    // Check for "Apply now" (Indeed Apply) vs "Apply on company site" - updated selectors for 2025
                    const applySelectors = [
                        '#indeedApplyButton',
                        'button[id*="indeedApply"]',
                        '[data-testid="indeedApply-button"]',
                        'button:has-text("Apply now")',
                        '.jobsearch-IndeedApplyButton',
                        'button.ia-IndeedApplyButton',
                        'button[aria-label*="Apply"]',
                        '.jobsearch-ApplyButton button',
                        '[data-testid="apply-button"]'
                    ];

                    let applyButton = null;
                    for (const sel of applySelectors) {
                        try {
                            const btn = this.page.locator(sel).first();
                            if (await btn.count() > 0 && await btn.isVisible()) {
                                applyButton = btn;
                                break;
                            }
                        } catch (e) {}
                    }

                    const companySiteButton = this.page.locator('a:has-text("Apply on company site"), a[href*="apply"]:visible, a.jobsearch-IndeedApplyButton-newWindow');

                    if (applyButton) {
                        const buttonText = await applyButton.innerText().catch(() => '');
                        console.log(`   ✨ Found Apply button: "${buttonText.trim()}"`);
                        await this.applyIndeedEasy(title, company, email, applyButton);
                    } else if (await companySiteButton.count() > 0) {
                        console.log('   🔗 External application link');
                        // Track as pending/interested
                        await this.trackApplication(company, title, 'Indeed', 'Pending', email);
                    } else {
                        console.log('   ❓ No apply button found - may need to apply on company site');
                        // Track anyway
                        await this.trackApplication(company, title, 'Indeed', 'Pending', email);
                    }
                } catch (err) {
                    console.log(`   ⚠️ Error processing job ${i + 1}: ${err.message}`);
                    continue;
                }
            }

        } catch (error) {
            console.error('❌ Error in Indeed automation:', error.message);
        }
    }

    async applyIndeedEasy(title, company, email = '', applyButton = null) {
        try {
            // Reset form fill tracking for new application
            this._indeedFormFilled = false;

            // Click the apply button (use passed button or fallback to selector)
            if (applyButton) {
                await applyButton.click();
            } else {
                await this.page.click('#indeedApplyButton, button:has-text("Apply now")');
            }
            console.log('   📝 Opened application modal...');

            // Wait for modal or new page to load
            await this.randomDelay(2000, 3000);

            // Check for iframe
            let contentFrame = this.page;
            try {
                const iframeElement = await this.page.waitForSelector('iframe[title*="application"], iframe[title*="Apply"], iframe[src*="apply"]', { timeout: 5000 });
                if (iframeElement) {
                    console.log('   Testing for iframe content...');
                    const frames = this.page.frames();
                    const appFrame = frames.find(f => f.url().includes('indeed.com/apply') || f.url().includes('/apply') || f.name().includes('application'));
                    if (appFrame) {
                        contentFrame = appFrame;
                        console.log('   ✅ Switched to application iframe');
                    }
                }
            } catch (e) {
                console.log('   ℹ️ No iframe detected, assuming direct page content');
            }

            await this.randomDelay(1500, 2500);

            // Basic flow: Click "Continue" until "Submit" or "Review"
            let attempts = 0;
            while (attempts < 15) {
                // Check for "Applied" message
                if (await contentFrame.locator('h1:has-text("You have applied"), h2:has-text("Application submitted")').count() > 0) {
                    console.log('   ✅ Application already submitted or finished!');
                    break;
                }

                // Try to fill form fields before clicking next
                await this.fillIndeedForm(contentFrame);

                const continueBtn = contentFrame.locator('button:has-text("Continue")');
                const nextBtn = contentFrame.locator('button:has-text("Next")');
                const reviewBtn = contentFrame.locator('button:has-text("Review your application")');
                const submitBtn = contentFrame.locator('button:has-text("Submit your application")');
                const fileInput = contentFrame.locator('input[type="file"]');

                if (await fileInput.isVisible()) {
                    console.log('   📂 Uploading resume...');
                    await fileInput.setInputFiles(CONFIG.pdfPath);
                    await this.randomDelay(1000, 2000);
                }

                if (await submitBtn.isVisible()) {
                    console.log('   🚀 Ready to submit! (Clicking submit...)');
                    await submitBtn.click();
                    await this.randomDelay(2000, 3000);
                    console.log('   ✅ Submitted!');
                    await this.sendWhatsAppNotification(`Applied to Indeed job: ${title} at ${company}`);
                    await this.trackApplication(company, title, 'Indeed', 'Applied', email);
                    break;
                } else if (await reviewBtn.isVisible()) {
                    this._indeedFormFilled = false; // Reset for next step
                    await reviewBtn.click();
                    console.log('   👀 Reviewing application...');
                } else if (await continueBtn.isVisible()) {
                    this._indeedFormFilled = false; // Reset for next step
                    await continueBtn.click();
                    console.log('   ➡️ Clicking Continue...');
                } else if (await nextBtn.isVisible()) {
                    this._indeedFormFilled = false; // Reset for next step
                    await nextBtn.click();
                    console.log('   ➡️ Clicking Next...');
                } else {
                    // Check if we are stuck
                    const errorMsg = contentFrame.locator('.ia-Form-error, [data-testid="error"], .error-message').first();
                    if (await errorMsg.isVisible().catch(() => false)) {
                        console.log('   ⚠️ Form error detected (manual intervention needed)');
                        break;
                    }

                    // Wait a bit and check for buttons again
                    await this.randomDelay(1500, 2500);

                    // Check for any clickable action button
                    const anyButton = contentFrame.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit")').first();
                    if (await anyButton.isVisible().catch(() => false)) {
                        console.log('   ➡️ Found action button, clicking...');
                        this._indeedFormFilled = false; // Reset for next step
                        await anyButton.click();
                    } else if (attempts > 8) {
                         console.log('   ⚠️ Timed out waiting for buttons');
                         break;
                    } else {
                        console.log('   ⏳ Waiting for page to load...');
                    }
                }
                await this.randomDelay(1500, 3000);
                attempts++;
            }

            // Close modal if it's still open (cleanup)
            const closeBtn = this.page.locator('button[aria-label="Close"]');
            if (await closeBtn.isVisible()) {
                await closeBtn.click();
            }

        } catch (e) {
            console.log('   ❌ Error during Indeed Apply:', e.message);
        }
    }

    async fillIndeedForm(frame) {
        // Only fill form once per modal - track if already filled
        if (this._indeedFormFilled) {
            return;
        }

        // Try using the extension via FAB first
        try {
            const fabBtn = frame.locator('button[data-action="autoFill"]');
            if (await fabBtn.count() > 0) {
                await fabBtn.click({ force: true });
                console.log('   🧩 Clicking Extension Auto-Fill button (Indeed)...');
                await this.randomDelay(1000, 2000);
                this._indeedFormFilled = true;
                return;
            }
        } catch (e) {}

        if (!this.aiAgent) {
            console.log('⚠️ AI Agent not initialized');
            return;
        }

        // AI Agent fills form ONCE
        const filled = await this.aiAgent.fillForm(frame, CONFIG.pdfPath);
        if (filled) {
            this._indeedFormFilled = true;
        }
    }

    // --- LINKEDIN AUTOMATION ---

    async runLinkedIn(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting LinkedIn Search: "${keyword}" in "${location}"`);

        try {
            // Go directly to job search URL with Easy Apply filter
            const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_AL=true`;
            console.log('   Loading LinkedIn...');
            await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.randomDelay(3000, 4000);

            // Check login status
            console.log('   Checking login status...');
            const isLoggedIn = await this.page.locator('.global-nav__me, .feed-identity-module, [data-control-name="identity_welcome_message"], .global-nav__primary-link--active').count() > 0;
            if (!isLoggedIn) {
                console.log('⚠️ Not logged in to LinkedIn. Run "node scripts/setup-session.js" first.');
                // Check if we're on sign-in page
                if (this.page.url().includes('login') || this.page.url().includes('signin')) {
                    console.log('   Redirected to login page. Please log in manually in the browser.');
                    await this.randomDelay(20000, 25000); // Wait for manual login
                }
            } else {
                console.log('✅ Logged in to LinkedIn');
            }

            // Wait for job results to load
            console.log('   Waiting for job results...');
            await this.page.waitForSelector('.jobs-search-results-list, .scaffold-layout__list, [data-job-id], .jobs-search-results__list', { timeout: 15000 }).catch(() => {
                console.log('   ⚠️ Job results list not found with primary selectors');
            });
            await this.randomDelay(2000, 3000);
            console.log('✅ Search results loaded');

            // Get job cards - updated selectors for 2025 LinkedIn
            const jobCardSelectors = '.job-card-container, .jobs-search-results__list-item, [data-job-id], .scaffold-layout__list-item, .jobs-search-two-pane__job-card-container--viewport-tracking-0';
            const jobs = this.page.locator(jobCardSelectors);
            const count = await jobs.count();
            console.log(`📊 Found ${count} jobs`);

            if (count === 0) {
                console.log('   No jobs found. LinkedIn may have changed its layout or you may need to log in.');
                return;
            }

            for (let i = 0; i < Math.min(count, 10); i++) {
                try {
                    const job = jobs.nth(i);
                    await job.scrollIntoViewIfNeeded();
                    await this.randomDelay(1000, 1500);

                    // Get title and company - multiple selector attempts
                    let title = "Unknown Job";
                    let company = "Unknown Company";

                    const titleSelectors = ['.job-card-list__title', '.job-card-container__link', 'a[data-control-id*="job"]', '.artdeco-entity-lockup__title'];
                    for (const sel of titleSelectors) {
                        try {
                            const el = job.locator(sel).first();
                            if (await el.count() > 0) {
                                title = await el.innerText();
                                if (title && title !== 'Unknown Job') break;
                            }
                        } catch (e) {}
                    }

                    const companySelectors = ['.job-card-container__primary-description', '.artdeco-entity-lockup__subtitle', '.job-card-container__company-name'];
                    for (const sel of companySelectors) {
                        try {
                            const el = job.locator(sel).first();
                            if (await el.count() > 0) {
                                company = await el.innerText();
                                if (company && company !== 'Unknown Company') break;
                            }
                        } catch (e) {}
                    }

                    console.log(`\n👉 [${i + 1}/${count}] ${title.trim()} at ${company.trim()}`);

                    // Click job to see details
                    await job.click();
                    await this.randomDelay(2000, 3000);

                    // Wait for job details to load
                    await this.page.waitForSelector('.jobs-description, .jobs-unified-top-card, .job-details-jobs-unified-top-card__primary-description', { timeout: 8000 }).catch(() => {});

                    // Extract email from description
                    let email = '';
                    try {
                        const desc = await this.page.locator('.jobs-description__content, .jobs-description, .job-details-module').innerText({ timeout: 3000 }).catch(() => '');
                        email = this.extractEmail(desc);
                        if (email) console.log(`   📧 Found email: ${email}`);
                    } catch (e) {}

                    // Look for Easy Apply button - updated selectors
                    const easyApplySelectors = [
                        'button.jobs-apply-button',
                        'button[aria-label*="Easy Apply"]',
                        'button:has-text("Easy Apply")',
                        '.jobs-apply-button--top-card button'
                    ];

                    let easyApplyBtn = null;
                    for (const sel of easyApplySelectors) {
                        try {
                            const btn = this.page.locator(sel).first();
                            if (await btn.isVisible()) {
                                const text = await btn.innerText().catch(() => '');
                                if (text.toLowerCase().includes('easy apply') || text.toLowerCase().includes('apply')) {
                                    easyApplyBtn = btn;
                                    break;
                                }
                            }
                        } catch (e) {}
                    }

                    if (easyApplyBtn) {
                        console.log('   ✨ Easy Apply button found!');
                        await easyApplyBtn.click();
                        await this.handleLinkedInModal(title, company, email);
                    } else {
                        console.log('   ❌ No Easy Apply (external application or already applied)');
                        await this.trackApplication(company, title, 'LinkedIn', 'Pending', email);
                    }
                } catch (err) {
                    console.log(`   ⚠️ Error processing job ${i + 1}: ${err.message}`);
                    continue;
                }
            }

        } catch (error) {
            console.error('❌ Error in LinkedIn automation:', error.message);
        }
    }

async handleLinkedInModal(title, company, email = '') {
        try {
            console.log('   📝 Handling LinkedIn Modal...');
            const modal = this.page.locator('.jobs-easy-apply-modal');

            let attempts = 0;
            while (attempts < 15) {
                // Try to fill form fields first
                await this.fillLinkedInForm(modal);

                const nextBtn = this.page.locator('button[aria-label="Continue to next step"]');
                const reviewBtn = this.page.locator('button[aria-label="Review your application"]');
                const submitBtn = this.page.locator('button[aria-label="Submit application"]');

                if (await submitBtn.isVisible()) {
                    console.log('   🚀 Ready to submit!');
                    await submitBtn.click();
                    await this.randomDelay(2000, 3000);
                    console.log('   ✅ Submitted!');

                    // Send notification
                    await this.sendWhatsAppNotification(`Applied to LinkedIn job: ${title} at ${company}`);
                    await this.trackApplication(company, title, 'LinkedIn', 'Applied', email);
                    break;
                } else if (await reviewBtn.isVisible()) {
                    await reviewBtn.click();
                    console.log('   👀 Reviewing...');
                } else if (await nextBtn.isVisible()) {
                    await nextBtn.click();
                    console.log('   ➡️ Next step...');
                } else {
                    // Check for errors
                    const error = modal.locator('.artdeco-inline-feedback--error');
                    if (await error.count() > 0) {
                        console.log('   ⚠️ Form error detected');
                        break;
                    }

                    // If no buttons and no errors, maybe we are done or stuck
                    if (attempts > 5 && await modal.locator('h2').innerText().then(t => t.includes('submitted'))) {
                         console.log('   ✅ Application submitted!');
                         await this.sendWhatsAppNotification(`Applied to LinkedIn job: ${title} at ${company}`);
                         await this.trackApplication(company, title, 'LinkedIn', 'Applied', email);
                         break;
                    }
                }
                await this.randomDelay(1500, 3000);
                attempts++;
            }

            // Close modal if it's still open (e.g. success screen or stuck)
            const closeBtn = this.page.locator('button[aria-label="Dismiss"]');
            if (await closeBtn.isVisible()) {
                await closeBtn.click();
                const discardBtn = this.page.locator('button[data-control-name="discard_application_confirm_btn"]');
                if (await discardBtn.isVisible()) await discardBtn.click();
            }

        } catch (e) {
            console.log('   ❌ Error in LinkedIn modal:', e.message);
        }
    }

    // --- DUBIZZLE AUTOMATION ---
    async runDubizzle(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting Dubizzle Search: "${keyword}" in "${location}"`);
        try {
            const url = `https://dubai.dubizzle.com/jobs/?keywords=${encodeURIComponent(keyword)}`;
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log('✅ Search results loaded');

            // Basic listing
            const listings = this.page.locator('#listings-top .listing-item');
            const count = await listings.count();
            console.log(`📊 Found ${count} jobs on first page`);

            for (let i = 0; i < Math.min(count, 5); i++) {
                const listing = listings.nth(i);
                const title = await listing.locator('.title').innerText();
                console.log(`\n👉 Found: ${title}`);

                // Get link
                const link = await listing.locator('a.title').getAttribute('href');
                if (link) {
                    console.log(`   🔗 ${link}`);
                    // We could visit it, but Dubizzle often requires manual email sending or external apply
                }
            }

            console.log('ℹ️  Dubizzle automation is limited. Please browse results manually.');
        } catch (error) {
            console.error('❌ Error in Dubizzle automation:', error);
        }
    }

    // --- BAYT AUTOMATION ---
    async runBayt(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting Bayt Search: "${keyword}" in "${location}"`);
        try {
            const url = `https://www.bayt.com/en/uae/jobs/${encodeURIComponent(keyword.replace(/ /g, '-'))}-jobs-in-${encodeURIComponent(location.toLowerCase())}/`;
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log('✅ Search results loaded');
            console.log('ℹ️  Bayt automation is limited to search. Please browse results manually.');
        } catch (error) {
            console.error('❌ Error in Bayt automation:', error);
        }
    }

    // --- GULFTALENT AUTOMATION ---
    async runGulfTalent(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting GulfTalent Search: "${keyword}" in "${location}"`);
        try {
            const url = `https://www.gulftalent.com/uae/jobs?pos_ref=${encodeURIComponent(keyword)}`;
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log('✅ Search results loaded');
            console.log('ℹ️  GulfTalent automation is limited to search. Please browse results manually.');
        } catch (error) {
            console.error('❌ Error in GulfTalent automation:', error);
        }
    }

    // --- NAUKRIGULF AUTOMATION ---
    async runNaukriGulf(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting NaukriGulf Search: "${keyword}" in "${location}"`);
        try {
            const url = `https://www.naukrigulf.com/${encodeURIComponent(keyword.replace(/ /g, '-'))}-jobs-in-${encodeURIComponent(location.toLowerCase())}`;
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log('✅ Search results loaded');
            console.log('ℹ️  NaukriGulf automation is limited to search. Please browse results manually.');
        } catch (error) {
            console.error('❌ Error in NaukriGulf automation:', error);
        }
    }
}

// Main execution
if (require.main === module) {
    (async () => {
        const automator = new JobAutomator();
        const platform = process.argv[2] || 'indeed'; // Default to indeed
        const keyword = process.argv[3] || 'Senior Full Stack Developer';
        const location = process.argv[4] || 'Dubai';

        try {
            await automator.init();

            switch (platform.toLowerCase()) {
                case 'indeed': await automator.runIndeed(keyword, location); break;
                case 'linkedin': await automator.runLinkedIn(keyword, location); break;
                case 'dubizzle': await automator.runDubizzle(keyword, location); break;
                case 'bayt': await automator.runBayt(keyword, location); break;
                case 'gulftalent': await automator.runGulfTalent(keyword, location); break;
                case 'naukrigulf': await automator.runNaukriGulf(keyword, location); break;
                default: console.log('Unknown platform. Use indeed, linkedin, dubizzle, bayt, gulftalent, or naukrigulf');
            }

        } catch (error) {
            console.error('Fatal Error:', error);
        } finally {
            console.log('\n🏁 Automation finished. Browser will remain open for inspection if not headless.');
            // await automator.close(); // Keep open for user to see
        }
    })();
}

module.exports = { JobAutomator, CONFIG };
