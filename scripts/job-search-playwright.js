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
    resumePath: path.join(__dirname, '..', 'resumes', 'resume.md'),
    pdfPath: path.join(__dirname, '..', 'resumes', 'resume-fasil-2025.pdf')
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
        console.log('🚀 Initializing Job Automator (Playwright) - v2.1...');

        // Parse CV data first
        if (fs.existsSync(CONFIG.resumePath)) {
            this.cvData = cvParser.parseResume(CONFIG.resumePath);
            this.formData = cvParser.generateApplicationFormData(this.cvData);
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
            } catch (e) {
                console.error('❌ Connection failed. Make sure Chrome is running with --remote-debugging-port=9222');
                console.error(e.message);
                process.exit(1);
            }
        } else {
            this.browser = await chromium.launchPersistentContext(CONFIG.userDataDir, {
                headless: CONFIG.headless,
                slowMo: CONFIG.slowMo,
                viewport: CONFIG.viewport,
                args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
            });
            this.page = this.browser.pages()[0] || await this.browser.newPage();
        }

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
                try {
                    const card = jobCards.nth(i);
                    // Re-query the element to avoid stale element errors
                    if (await card.count() === 0) continue;

                    await card.scrollIntoViewIfNeeded();
                    const title = await card.locator('h2.jobTitle').innerText().catch(() => 'Unknown Title');
                    const company = await card.locator('[data-testid="company-name"]').innerText().catch(() => 'Unknown Company');

                    console.log(`\n👉 Checking: ${title} at ${company}`);

                    // Click job to see details
                    await card.click({ timeout: 5000 });
                    await this.randomDelay(1000, 2000);

                    // Check for "Apply now" (Indeed Apply) vs "Apply on company site"
                    const applyButton = this.page.locator('#indeedApplyButton');
                    const companySiteButton = this.page.locator('#applyButtonLinkContainer');

                    if (await applyButton.count() > 0) {
                        console.log('   ✨ Indeed Apply available! (Easy Apply)');
                        await this.applyIndeedEasy();
                    } else if (await companySiteButton.count() > 0) {
                        console.log('   🔗 External application link');
                    } else {
                        console.log('   ❓ Application method unclear');
                    }
                } catch (err) {
                    console.log(`   ⚠️ Error processing job ${i + 1}: ${err.message}`);
                    continue;
                }
            }

        } catch (error) {
            console.error('❌ Error in Indeed automation:', error);
        }
    }

    async applyIndeedEasy() {
        try {
            await this.page.click('#indeedApplyButton');
            console.log('   📝 Opened application modal...');

            // Check for iframe
            let contentFrame = this.page;
            try {
                const iframeElement = await this.page.waitForSelector('iframe[title*="application"], iframe[title*="Apply"]', { timeout: 5000 });
                if (iframeElement) {
                    console.log('   Testing for iframe content...');
                    const frames = this.page.frames();
                    const appFrame = frames.find(f => f.url().includes('indeed.com/apply') || f.name().includes('application'));
                    if (appFrame) {
                        contentFrame = appFrame;
                        console.log('   ✅ Switched to application iframe');
                    }
                }
            } catch (e) {
                console.log('   ℹ️ No iframe detected, assuming direct page content');
            }

            await this.randomDelay(2000, 4000);

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
                    break;
                } else if (await reviewBtn.isVisible()) {
                    await reviewBtn.click();
                    console.log('   👀 Reviewing application...');
                } else if (await continueBtn.isVisible()) {
                    await continueBtn.click();
                    console.log('   ➡️ Clicking Continue...');
                } else if (await nextBtn.isVisible()) {
                    await nextBtn.click();
                    console.log('   ➡️ Clicking Next...');
                } else {
                    // Check if we are stuck
                    const errorMsg = await contentFrame.locator('.ia-Form-error').first();
                    if (await errorMsg.isVisible()) {
                        console.log('   ⚠️ Form error detected (manual intervention needed)');
                        break;
                    }

                    console.log('   ⏳ Waiting for buttons...');
                    await this.randomDelay(1000, 2000);

                    if (attempts > 12) {
                         console.log('   ⚠️ Timed out waiting for buttons');
                         break;
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
        try {
            // console.log('   ✍️ Checking form fields...');

            // 1. Text Inputs & Textareas
            const inputs = await frame.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea').all();
            for (const input of inputs) {
                if (await input.isVisible()) {
                    const val = await input.inputValue();
                    if (!val) {
                        // Try to infer what to fill based on label/id
                        const id = await input.getAttribute('id') || '';
                        const name = await input.getAttribute('name') || '';
                        const label = await frame.locator(`label[for="${id}"]`).innerText().catch(() => '') || '';
                        const context = (id + ' ' + name + ' ' + label).toLowerCase();

                        if (context.includes('first name')) await input.fill(this.formData.firstName);
                        else if (context.includes('last name')) await input.fill(this.formData.lastName);
                        else if (context.includes('phone') || context.includes('mobile')) await input.fill(this.formData.phone);
                        else if (context.includes('email')) await input.fill(this.formData.email);
                        else if (context.includes('city')) await input.fill(this.formData.city);
                        else if (context.includes('experience') || context.includes('years')) await input.fill(this.formData.yearsOfExperience);
                        else if (context.includes('salary') || context.includes('pay')) await input.fill('15000');
                        else if (context.includes('notice')) await input.fill('0');
                        else if (context.includes('linkedin')) await input.fill(this.formData.linkedin);
                        else if (context.includes('website') || context.includes('portfolio')) await input.fill(this.formData.website);
                        else if (context.includes('summary') || context.includes('cover')) await input.fill(this.formData.summary);
                    }
                }
            }

            // 2. Radio Buttons (Complex because they are often grouped)
            // Strategy: Find fieldsets or groups, then look for "Yes" or "No"
            const fieldsets = await frame.locator('fieldset').all();
            for (const fieldset of fieldsets) {
                const legend = await fieldset.locator('legend').innerText().catch(() => '');
                const text = legend.toLowerCase();

                // Default to YES for positive things, NO for sponsorship
                let targetText = 'Yes';
                if (text.includes('sponsor') || text.includes('visa')) targetText = 'No';

                // Find the radio button with the target text
                const radio = fieldset.locator(`label:has-text("${targetText}") input[type="radio"]`);
                if (await radio.count() > 0) {
                    if (!(await radio.isChecked())) {
                        await radio.check();
                        // console.log(`   🔘 Selected ${targetText} for "${legend.substring(0, 30)}..."`);
                    }
                }
            }

            // 3. Select Dropdowns
            const selects = await frame.locator('select').all();
            for (const select of selects) {
                if (await select.isVisible()) {
                    const val = await select.inputValue();
                    if (!val) {
                        // Try to select the first real option or a specific one
                        // For now, just select the second option (index 1) if index 0 is "Select..."
                        await select.selectOption({ index: 1 });
                    }
                }
            }

        } catch (e) {
            // console.log('   ⚠️ Error filling form:', e.message);
        }
    }

    // --- LINKEDIN AUTOMATION ---

    async runLinkedIn(keyword = 'Software Engineer', location = 'Dubai') {
        console.log(`\n🔍 Starting LinkedIn Search: "${keyword}" in "${location}"`);

        try {
            await this.page.goto('https://www.linkedin.com/jobs/', { waitUntil: 'domcontentloaded' });

            // Check login
            if (await this.page.locator('.nav__button-secondary').count() > 0) {
                console.log('⚠️ Not logged in. Please log in manually.');
            }

            // Search
            const searchBox = this.page.locator('.jobs-search-box__text-input').first();

            if (await searchBox.isVisible()) {
                await searchBox.fill(keyword);
                await this.page.keyboard.press('Enter');
            } else {
                console.log('⚠️ Search box not found, trying direct URL');
                await this.page.goto(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
            }

            await this.page.waitForSelector('.jobs-search-results-list', { timeout: 10000 }).catch(() => console.log('List not found immediately'));
            console.log('✅ Search results loaded');

            // Filter for "Easy Apply"
            try {
                const easyApplyFilter = this.page.locator('button[aria-label="Easy Apply filter."]');
                if (await easyApplyFilter.isVisible()) {
                    await easyApplyFilter.click();
                    await this.randomDelay();
                    console.log('✅ Filtered by Easy Apply');
                }
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

                // Get title safely
                let title = "Unknown Job";
                try {
                    title = await job.locator('.job-card-list__title').innerText();
                } catch (e) {}

                console.log(`\n👉 Checking: ${title}`);

                await job.click();
                await this.randomDelay(1000, 2000);

                const easyApplyBtn = this.page.locator('.jobs-apply-button--top-card button');
                if (await easyApplyBtn.isVisible() && await easyApplyBtn.innerText() === 'Easy Apply') {
                    console.log('   ✨ Easy Apply button found!');
                    await easyApplyBtn.click();
                    await this.handleLinkedInModal();
                } else {
                    console.log('   ❌ No Easy Apply button (or already applied)');
                }
            }

        } catch (error) {
            console.error('❌ Error in LinkedIn automation:', error);
        }
    }

    async handleLinkedInModal() {
        try {
            console.log('   📝 Handling LinkedIn Modal...');
                const fileInput = this.page.locator('input[type="file"]');

                if (await fileInput.isVisible()) {
                    console.log('   📂 Uploading resume...');
                    await fileInput.setInputFiles(CONFIG.pdfPath);
                    await this.randomDelay(1000, 2000);
                }
            await this.randomDelay(1000, 2000);

            let attempts = 0;
            while (attempts < 5) {
                const nextBtn = this.page.locator('button[aria-label="Continue to next step"]');
                const reviewBtn = this.page.locator('button[aria-label="Review your application"]');
                const submitBtn = this.page.locator('button[aria-label="Submit application"]');

                if (await submitBtn.isVisible()) {
                    console.log('   🚀 Ready to submit! (Stopping here for safety)');
                    // await submitBtn.click();
                    break;
                } else if (await reviewBtn.isVisible()) {
                    await reviewBtn.click();
                    console.log('   👀 Reviewing...');
                } else if (await nextBtn.isVisible()) {
                    await nextBtn.click();
                    console.log('   ➡️ Next step...');
                } else {
                    // Check for form fields to fill?
                    // For now, just break if no buttons found
                    break;
                }
                await this.randomDelay(1000, 2000);
                attempts++;
            }

            // Close modal if stuck
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
