const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const cvParser = require('./cv-parser');

// Configuration
const CONFIG = {
    headless: false, // Run visible for debugging/monitoring
    slowMo: 50, // Slow down operations slightly to be more human-like
    viewport: { width: 1280, height: 800 },
    timeout: 30000,
    userDataDir: path.join(__dirname, '..', 'user_data'), // Persist sessions
    resumePath: path.join(__dirname, '..', 'resumes', 'resume.md')
};

class JobAutomator {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.cvData = null;
        this.formData = null;
    }

    async init() {
        console.log('🚀 Initializing Job Automator (Playwright)...');

        // Parse CV data first
        if (fs.existsSync(CONFIG.resumePath)) {
            this.cvData = cvParser.parseResume(CONFIG.resumePath);
            this.formData = cvParser.generateApplicationFormData(this.cvData);
            console.log(`📄 Loaded CV for: ${this.formData.fullName}`);
        } else {
            console.error('❌ Resume not found!');
            process.exit(1);
        }

        this.browser = await chromium.launchPersistentContext(CONFIG.userDataDir, {
            headless: CONFIG.headless,
            slowMo: CONFIG.slowMo,
            viewport: CONFIG.viewport,
            args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
        });

        this.page = this.browser.pages()[0] || await this.browser.newPage();

        // Randomize user agent to avoid detection
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9'
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async randomDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await this.page.waitForTimeout(delay);
    }

    // --- INDEED AUTOMATION ---

    async runIndeed(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting Indeed Search: "${keyword}" in "${location}"`);

        try {
            await this.page.goto('https://ae.indeed.com/', { waitUntil: 'domcontentloaded' });

            // Check if logged in
            const isLoggedIn = await this.page.locator('.gnav-header-1b6w516').count() > 0 ||
                               await this.page.locator('[aria-label="Profile"]').count() > 0;

            if (!isLoggedIn) {
                console.log('⚠️ Not logged in. Please log in manually in the browser window if needed.');
                // We continue anyway as search works without login
            }

            // Fill search form
            await this.page.fill('#text-input-what', keyword);
            await this.page.fill('#text-input-where', location);
            await this.page.press('#text-input-where', 'Enter');

            await this.page.waitForURL(/jobs/);
            console.log('✅ Search results loaded');

            // Get job cards
            const jobCards = this.page.locator('.job_seen_beacon');
            const count = await jobCards.count();
            console.log(`📊 Found ${count} jobs on first page`);

            for (let i = 0; i < count; i++) {
                const card = jobCards.nth(i);
                const title = await card.locator('h2.jobTitle').innerText();
                const company = await card.locator('[data-testid="company-name"]').innerText();

                console.log(`\n👉 Checking: ${title} at ${company}`);

                // Click job to see details
                await card.click();
                await this.randomDelay(1000, 2000);

                // Check for "Apply now" (Indeed Apply) vs "Apply on company site"
                const applyButton = this.page.locator('#indeedApplyButton');
                const companySiteButton = this.page.locator('#applyButtonLinkContainer');

                if (await applyButton.count() > 0) {
                    console.log('   ✨ Indeed Apply available! (Easy Apply)');
                    // await this.applyIndeedEasy(); // Uncomment to enable auto-apply
                } else if (await companySiteButton.count() > 0) {
                    console.log('   🔗 External application link');
                } else {
                    console.log('   ❓ Application method unclear');
                }
            }

        } catch (error) {
            console.error('❌ Error in Indeed automation:', error);
        }
    }

    async applyIndeedEasy() {
        // Implementation for clicking through Indeed Apply modal
        // This is complex as it varies by job, but here's a skeleton
        await this.page.click('#indeedApplyButton');
        await this.page.waitForSelector('.ia-Content');

        console.log('   📝 Filling application...');

        // Example: Handle "Continue" buttons until "Submit"
        // while (await this.page.locator('button:has-text("Continue")').count() > 0) {
        //     await this.page.click('button:has-text("Continue")');
        //     await this.randomDelay();
        // }
    }

    // --- LINKEDIN AUTOMATION ---

    async runLinkedIn(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting LinkedIn Search: "${keyword}" in "${location}"`);

        try {
            await this.page.goto('https://www.linkedin.com/jobs/', { waitUntil: 'domcontentloaded' });

            // Check login
            if (await this.page.locator('.nav__button-secondary').count() > 0) {
                console.log('⚠️ Not logged in. Please log in manually.');
                await this.page.pause(); // Pause to let user login
            }

            // Search
            const searchBox = this.page.locator('.jobs-search-box__text-input').first();
            const locationBox = this.page.locator('.jobs-search-box__text-input').nth(1); // Usually the second input

            if (await searchBox.isVisible()) {
                await searchBox.fill(keyword);
                // Location handling might be tricky if pre-filled
                // await locationBox.fill(location);
                await this.page.keyboard.press('Enter');
            } else {
                // Mobile view or different layout
                console.log('⚠️ Search box not found, trying direct URL');
                await this.page.goto(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
            }

            await this.page.waitForSelector('.jobs-search-results-list');
            console.log('✅ Search results loaded');

            // Filter for "Easy Apply"
            try {
                await this.page.click('button[aria-label="Easy Apply filter."]');
                await this.randomDelay();
                console.log('✅ Filtered by Easy Apply');
            } catch (e) {
                console.log('⚠️ Could not filter by Easy Apply');
            }

            // Iterate jobs
            const jobs = this.page.locator('.job-card-container');
            const count = await jobs.count();
            console.log(`📊 Found ${count} jobs`);

            for (let i = 0; i < Math.min(count, 5); i++) { // Limit to 5 for demo
                const job = jobs.nth(i);
                await job.scrollIntoViewIfNeeded();
                const title = await job.locator('.job-card-list__title').innerText();
                console.log(`\n👉 Checking: ${title}`);

                await job.click();
                await this.randomDelay(1000, 2000);

                const easyApplyBtn = this.page.locator('.jobs-apply-button--top-card button');
                if (await easyApplyBtn.isVisible() && await easyApplyBtn.innerText() === 'Easy Apply') {
                    console.log('   ✨ Easy Apply button found!');
                    // await easyApplyBtn.click();
                    // await this.handleLinkedInModal();
                }
            }

        } catch (error) {
            console.error('❌ Error in LinkedIn automation:', error);
        }
    }
}

// Main execution
(async () => {
    const automator = new JobAutomator();
    const platform = process.argv[2] || 'indeed'; // Default to indeed
    const keyword = process.argv[3] || 'Software Engineer';
    const location = process.argv[4] || 'Dubai';

    try {
        await automator.init();

        if (platform.toLowerCase() === 'indeed') {
            await automator.runIndeed(keyword, location);
        } else if (platform.toLowerCase() === 'linkedin') {
            await automator.runLinkedIn(keyword, location);
        } else {
            console.log('Unknown platform. Use "indeed" or "linkedin"');
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        console.log('\n🏁 Automation finished. Browser will remain open for inspection if not headless.');
        // await automator.close(); // Keep open for user to see
    }
})();
