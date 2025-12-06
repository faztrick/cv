/**
 * LinkedIn Profile Updater
 * Updates LinkedIn profile sections using CV data
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const stealth = require('./stealth-utils');

const USER_DATA_DIR = path.join(__dirname, '..', 'user_data', 'playwright');
const EXTENSION_PATH = path.join(__dirname, '..', 'chrome-extension');
const CV_DATA_PATH = path.join(__dirname, '..', 'data', 'cv-data.json');

class LinkedInProfileUpdater {
    constructor() {
        this.context = null;
        this.page = null;
        this.cvData = null;
    }

    async init() {
        console.log('🚀 LinkedIn Profile Updater');
        console.log('='.repeat(50));

        // Load CV data
        if (fs.existsSync(CV_DATA_PATH)) {
            this.cvData = JSON.parse(fs.readFileSync(CV_DATA_PATH, 'utf8'));
            console.log(`📄 Loaded CV data for: ${this.cvData.personalInfo.name}`);
        } else {
            throw new Error('CV data not found!');
        }

        // Launch browser with persistent session
        console.log('🌐 Launching browser with saved session...');
        this.context = await chromium.launchPersistentContext(USER_DATA_DIR, {
            headless: false,
            viewport: { width: 1280, height: 900 },
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox'
            ],
            userAgent: stealth.getRandomUserAgent()
        });

        this.page = await this.context.newPage();
        await stealth.applyStealthToPage(this.page);
    }

    async delay(min = 1000, max = 2000) {
        const ms = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(r => setTimeout(r, ms));
    }

    async checkLogin() {
        console.log('🔐 Checking LinkedIn login...');
        await this.page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
        await this.delay(2000, 3000);

        const isLoggedIn = await this.page.locator('.feed-identity-module, .global-nav__me').count() > 0;
        if (!isLoggedIn) {
            console.log('❌ Not logged in to LinkedIn!');
            console.log('   Please run: node scripts/setup-session.js');
            console.log('   And log in to LinkedIn manually first.');
            return false;
        }
        console.log('✅ Logged in to LinkedIn');
        return true;
    }

    async goToProfile() {
        console.log('👤 Navigating to profile...');
        await this.page.goto('https://www.linkedin.com/in/me/', { waitUntil: 'domcontentloaded' });
        await this.delay(2000, 3000);
    }

    async updateHeadline() {
        console.log('\n📝 Updating Headline...');
        const headline = this.cvData.personalInfo.title;
        console.log(`   New headline: ${headline}`);

        try {
            // Click on the intro edit button (pencil icon near the top)
            const editIntroBtn = this.page.locator('button[aria-label="Edit intro"]').first();
            if (await editIntroBtn.count() > 0) {
                await editIntroBtn.click();
                await this.delay(1500, 2500);

                // Find headline input
                const headlineInput = this.page.locator('input[id*="headline"], input[name*="headline"]').first();
                if (await headlineInput.count() > 0) {
                    await headlineInput.clear();
                    await headlineInput.fill(headline);
                    console.log('   ✅ Headline updated');

                    // Save
                    const saveBtn = this.page.locator('button:has-text("Save")').first();
                    if (await saveBtn.count() > 0) {
                        await saveBtn.click();
                        await this.delay(2000, 3000);
                    }
                }
            } else {
                console.log('   ⚠️ Edit intro button not found');
            }
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }
    }

    async updateAbout() {
        console.log('\n📝 Updating About Section...');
        const about = this.generateAboutSection();
        console.log(`   About length: ${about.length} chars`);

        try {
            await this.goToProfile();
            await this.delay(1000, 2000);

            // Scroll to About section
            await this.page.evaluate(() => {
                const aboutSection = document.querySelector('#about');
                if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
            });
            await this.delay(1000, 1500);

            // Click edit on About section
            const editAboutBtn = this.page.locator('section:has(#about) button[aria-label*="Edit"]').first();
            if (await editAboutBtn.count() > 0) {
                await editAboutBtn.click();
                await this.delay(1500, 2500);

                // Find the textarea
                const aboutTextarea = this.page.locator('textarea[id*="summary"], textarea[name*="summary"], .artdeco-text-input--textarea textarea').first();
                if (await aboutTextarea.count() > 0) {
                    await aboutTextarea.clear();
                    await aboutTextarea.fill(about);
                    console.log('   ✅ About section updated');

                    // Save
                    const saveBtn = this.page.locator('button:has-text("Save")').first();
                    if (await saveBtn.count() > 0) {
                        await saveBtn.click();
                        await this.delay(2000, 3000);
                    }
                }
            } else {
                console.log('   ⚠️ Edit About button not found - may need to add section first');
            }
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }
    }

    generateAboutSection() {
        const cv = this.cvData;
        const skills = cv.skills.slice(0, 15).join(' • ');

        return `${cv.summary}

🔧 Core Technologies:
${skills}

🚀 Key Achievements:
${cv.highlights.map(h => `• ${h}`).join('\n')}

📍 ${cv.availability.location} | ${cv.availability.visa}
🌐 ${cv.personalInfo.portfolio}

#SoftwareEngineer #Flutter #NodeJS #AI #IoT #FullStack #Dubai #UAE`;
    }

    async updateSkills() {
        console.log('\n📝 Checking Skills Section...');
        const skills = this.cvData.skills;
        console.log(`   Skills to add: ${skills.length}`);

        try {
            await this.page.goto('https://www.linkedin.com/in/me/details/skills/', { waitUntil: 'domcontentloaded' });
            await this.delay(2000, 3000);

            // Get current skills
            const currentSkills = await this.page.locator('.skill-categories-card__skill-name').allTextContents();
            console.log(`   Current skills: ${currentSkills.length}`);

            // Find missing skills
            const missingSkills = skills.filter(s =>
                !currentSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
            );

            if (missingSkills.length > 0) {
                console.log(`   Missing skills: ${missingSkills.join(', ')}`);
                console.log('   ℹ️ Please add these skills manually from the Skills page');
            } else {
                console.log('   ✅ All skills already present');
            }
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }
    }

    async printProfileSuggestions() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 LINKEDIN PROFILE UPDATE SUGGESTIONS');
        console.log('='.repeat(50));

        console.log('\n📌 HEADLINE (paste this):');
        console.log('─'.repeat(40));
        console.log(this.cvData.personalInfo.title);

        console.log('\n📌 ABOUT SECTION (paste this):');
        console.log('─'.repeat(40));
        console.log(this.generateAboutSection());

        console.log('\n📌 FEATURED PROJECTS TO ADD:');
        console.log('─'.repeat(40));
        this.cvData.projects.slice(0, 5).forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}: ${p.description}`);
        });

        console.log('\n📌 SKILLS TO ENSURE:');
        console.log('─'.repeat(40));
        console.log(this.cvData.skills.join(', '));

        console.log('\n📌 EXPERIENCE HIGHLIGHTS:');
        console.log('─'.repeat(40));
        this.cvData.experience.forEach(exp => {
            console.log(`• ${exp.role} at ${exp.company} (${exp.duration})`);
        });

        console.log('\n' + '='.repeat(50));
    }

    async openProfileForManualEdit() {
        console.log('\n🌐 Opening LinkedIn profile for manual editing...');
        await this.goToProfile();
        console.log('   Profile page is now open');
        console.log('   Use the suggestions above to update your profile');
        console.log('\n   Press Ctrl+C when done to close');
    }

    async close() {
        if (this.context) {
            await this.context.close();
        }
    }
}

// Main execution
(async () => {
    const updater = new LinkedInProfileUpdater();

    try {
        await updater.init();

        const loggedIn = await updater.checkLogin();
        if (!loggedIn) {
            await updater.close();
            process.exit(1);
        }

        // Print suggestions first
        await updater.printProfileSuggestions();

        // Open profile for manual editing
        await updater.openProfileForManualEdit();

        // Keep browser open for manual edits
        console.log('\n⏳ Browser will stay open. Close it manually when done.');
        await new Promise(() => {}); // Keep running

    } catch (e) {
        console.error('❌ Error:', e.message);
        await updater.close();
        process.exit(1);
    }
})();

module.exports = { LinkedInProfileUpdater };
