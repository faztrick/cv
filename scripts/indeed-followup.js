/**
 * Indeed Application Follow-up Automation
 * Uses OpenAI to generate personalized follow-up messages
 * and sends them through Indeed's messaging system
 */

const { chromium } = require('playwright');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Load CV data for personalization
const cvData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cv-data.json'), 'utf8'));

// OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Follow-up configuration
const CONFIG = {
    userDataDir: path.join(__dirname, '../user_data/playwright'),
    extensionPath: path.join(__dirname, '../chrome-extension'),
    appliedJobsUrl: 'https://myjobs.indeed.com/applied',
    messagesUrl: 'https://messages.indeed.com',
    minDaysSinceApply: 3, // Wait at least 3 days before follow-up
    maxFollowups: 10 // Max follow-ups per run
};

// Generate follow-up message using OpenAI
async function generateFollowUpMessage(jobTitle, companyName, applicationDate) {
    const daysSinceApply = Math.floor((new Date() - new Date(applicationDate)) / (1000 * 60 * 60 * 24));

    const prompt = `Generate a professional, concise follow-up email for a job application.

Applicant Details:
- Name: ${cvData.personalInfo.name}
- Title: ${cvData.personalInfo.title}
- Key Skills: ${cvData.skills.slice(0, 8).join(', ')}
- Recent Achievement: Showcased AI Self-Checkout Kiosk at Gitex Dubai 2024

Job Application Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Applied: ${daysSinceApply} days ago

Requirements:
1. Keep it under 150 words
2. Be professional but warm
3. Briefly mention 1-2 relevant skills
4. Express continued interest
5. Ask about the hiring timeline
6. Don't sound desperate or pushy

Generate ONLY the message body (no subject line, no signature - those will be added separately).`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a professional career coach helping craft follow-up messages for job applications. Be concise and professional.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI error:', error.message);
        // Fallback template
        return `I hope this message finds you well. I wanted to follow up on my application for the ${jobTitle} position that I submitted ${daysSinceApply} days ago.

I remain very interested in this opportunity and believe my experience in full-stack development and AI/IoT systems would be a strong fit for your team.

Could you please share any updates on the hiring timeline? I'm available for an interview at your earliest convenience.

Thank you for your time and consideration.`;
    }
}

// Extract applications from Indeed Applied page
async function getAppliedJobs(page) {
    console.log('📋 Fetching applied jobs...');

    await page.goto(CONFIG.appliedJobsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Take screenshot for debugging
    await page.screenshot({ path: path.join(__dirname, '../data/indeed-applied-debug.png') });
    console.log('📸 Screenshot saved to data/indeed-applied-debug.png');

    // Check if logged in
    const pageContent = await page.content();
    if (pageContent.includes('Sign in') && pageContent.includes('Create account')) {
        console.log('❌ Not logged in to Indeed. Manual sign-in is required in your browser session.');
        return [];
    }

    // Wait for any content to load
    await page.waitForTimeout(3000);

    const jobs = await page.evaluate(() => {
        const applications = [];

        // Try multiple selectors for Indeed's job cards
        const selectors = [
            // New Indeed UI
            '[class*="jobCard"]',
            '[class*="JobCard"]',
            '[data-testid*="job"]',
            // Applied jobs specific
            '[class*="applied"]',
            '.gnav-AppliedJobCard',
            '.gnav-JobCard',
            // Generic list items
            'article',
            '[role="listitem"]',
            'li[class*="job"]',
            // Table rows if in table view
            'tr[class*="job"]',
            'tbody tr'
        ];

        let jobCards = [];
        for (const selector of selectors) {
            const cards = document.querySelectorAll(selector);
            if (cards.length > 0) {
                jobCards = cards;
                console.log(`Found ${cards.length} elements with selector: ${selector}`);
                break;
            }
        }

        // If no cards found, try to get any job-related content
        if (jobCards.length === 0) {
            // Log page structure for debugging
            console.log('Page HTML preview:', document.body.innerHTML.substring(0, 2000));
        }

        jobCards.forEach((card, idx) => {
            try {
                // Try multiple selectors for job title
                const titleSelectors = ['h2', 'h3', 'a[class*="title"]', '[class*="Title"]', '[class*="jobTitle"]', 'a'];
                let titleEl = null;
                for (const sel of titleSelectors) {
                    titleEl = card.querySelector(sel);
                    if (titleEl && titleEl.textContent.trim().length > 2) break;
                }

                // Try multiple selectors for company
                const companySelectors = ['[class*="company"]', '[class*="Company"]', 'span[class*="name"]', '.companyName'];
                let companyEl = null;
                for (const sel of companySelectors) {
                    companyEl = card.querySelector(sel);
                    if (companyEl) break;
                }

                // Try multiple selectors for date
                const dateSelectors = ['time', '[class*="date"]', '[class*="Date"]', 'span[class*="time"]'];
                let dateEl = null;
                for (const sel of dateSelectors) {
                    dateEl = card.querySelector(sel);
                    if (dateEl) break;
                }

                const title = titleEl ? titleEl.textContent.trim() : '';
                const company = companyEl ? companyEl.textContent.trim() : '';

                if (title && title.length > 2) {
                    applications.push({
                        title: title,
                        company: company || 'Unknown Company',
                        appliedDate: dateEl ? dateEl.textContent.trim() : 'Recently',
                        status: 'Applied',
                        hasMessageOption: true,
                        cardIndex: idx
                    });
                }
            } catch (e) {
                console.error('Error parsing job card:', e);
            }
        });

        return applications;
    });

    console.log(`📊 Found ${jobs.length} applications`);

    if (jobs.length === 0) {
        console.log('💡 Page may have different structure. Check the screenshot.');
        console.log('💡 You can also manually browse to messages.indeed.com to send follow-ups');
    }

    const now = new Date();
    const str = dateStr.toLowerCase();

    if (str.includes('today') || str.includes('just now')) {
        return now;
    }
    if (str.includes('yesterday')) {
        return new Date(now - 24 * 60 * 60 * 1000);
    }

    const daysMatch = str.match(/(\d+)\s*day/);
    if (daysMatch) {
        return new Date(now - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000);
    }

    const weeksMatch = str.match(/(\d+)\s*week/);
    if (weeksMatch) {
        return new Date(now - parseInt(weeksMatch[1]) * 7 * 24 * 60 * 60 * 1000);
    }

    const monthsMatch = str.match(/(\d+)\s*month/);
    if (monthsMatch) {
        return new Date(now - parseInt(monthsMatch[1]) * 30 * 24 * 60 * 60 * 1000);
    }

    // Try parsing as actual date
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? now : parsed;
}

// Send follow-up message through Indeed
async function sendFollowUp(page, job, message) {
    console.log(`\n📤 Sending follow-up to ${job.company} for "${job.title}"...`);

    try {
        // Go to Indeed messages
        await page.goto(`${CONFIG.messagesUrl}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Search for conversation with this company
        const searchInput = await page.$('input[type="search"], input[placeholder*="search"], [data-testid="searchInput"]');
        if (searchInput) {
            await searchInput.fill(job.company);
            await page.waitForTimeout(1500);
        }

        // Look for existing conversation
        const conversationSelectors = [
            `[data-testid="conversation"]:has-text("${job.company}")`,
            `.conversation-item:has-text("${job.company}")`,
            `[class*="conversation"]:has-text("${job.company}")`,
            `li:has-text("${job.company}")`
        ];

        let conversationFound = false;
        for (const selector of conversationSelectors) {
            const conversation = await page.$(selector);
            if (conversation) {
                await conversation.click();
                conversationFound = true;
                await page.waitForTimeout(1500);
                break;
            }
        }

        if (!conversationFound) {
            console.log(`   ⚠️ No existing conversation found with ${job.company}`);
            console.log(`   💡 Try messaging directly from the application page`);
            return false;
        }

        // Find message input
        const messageInputSelectors = [
            'textarea[data-testid="messageInput"]',
            'textarea[placeholder*="message"]',
            '[contenteditable="true"]',
            'textarea',
            'input[type="text"][placeholder*="message"]'
        ];

        let messageInput = null;
        for (const selector of messageInputSelectors) {
            messageInput = await page.$(selector);
            if (messageInput) break;
        }

        if (!messageInput) {
            console.log(`   ❌ Could not find message input`);
            return false;
        }

        // Type the message
        const fullMessage = `${message}\n\nBest regards,\n${cvData.personalInfo.name}\n${cvData.personalInfo.phone}`;
        await messageInput.fill(fullMessage);
        await page.waitForTimeout(500);

        // Find and click send button
        const sendButtonSelectors = [
            'button[data-testid="sendButton"]',
            'button[aria-label*="send"]',
            'button:has-text("Send")',
            '[type="submit"]',
            'button[class*="send"]'
        ];

        let sendBtn = null;
        for (const selector of sendButtonSelectors) {
            sendBtn = await page.$(selector);
            if (sendBtn) {
                const isVisible = await sendBtn.isVisible();
                const isEnabled = await sendBtn.isEnabled();
                if (isVisible && isEnabled) break;
                sendBtn = null;
            }
        }

        if (sendBtn) {
            await sendBtn.click();
            console.log(`   ✅ Follow-up sent to ${job.company}!`);
            await page.waitForTimeout(2000);
            return true;
        } else {
            console.log(`   ⚠️ Send button not found - message typed but not sent`);
            console.log(`   💡 Please review and send manually`);
            return false;
        }

    } catch (error) {
        console.error(`   ❌ Error sending follow-up: ${error.message}`);
        return false;
    }
}

// Save follow-up log
function logFollowUp(job, message, sent) {
    const logFile = path.join(__dirname, '../data/followup-log.json');
    let log = [];

    if (fs.existsSync(logFile)) {
        log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }

    log.push({
        timestamp: new Date().toISOString(),
        company: job.company,
        jobTitle: job.title,
        appliedDate: job.appliedDate,
        message: message,
        sent: sent
    });

    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

// Main function
async function main() {
    console.log('🚀 Indeed Follow-up Automation Starting...\n');

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY environment variable not set');
        console.log('   Set it with: $env:OPENAI_API_KEY = "your-api-key"');
        process.exit(1);
    }

    let context;
    try {
        // Launch browser with persistent context
        context = await chromium.launchPersistentContext(CONFIG.userDataDir, {
            headless: false,
            args: [
                '--disable-blink-features=AutomationControlled',
                `--load-extension=${CONFIG.extensionPath}`
            ],
            viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();

        // Get applied jobs
        const jobs = await getAppliedJobs(page);

        if (jobs.length === 0) {
            console.log('❌ No applications found. Make sure you\'re logged in.');
            return;
        }

        // Filter jobs eligible for follow-up
        const eligibleJobs = jobs.filter(job => {
            const appliedDate = parseRelativeDate(job.appliedDate);
            const daysSince = Math.floor((new Date() - appliedDate) / (1000 * 60 * 60 * 24));
            return daysSince >= CONFIG.minDaysSinceApply;
        });

        console.log(`\n📬 ${eligibleJobs.length} applications eligible for follow-up (${CONFIG.minDaysSinceApply}+ days old)\n`);

        if (eligibleJobs.length === 0) {
            console.log('ℹ️ All applications are too recent for follow-up');
            console.log(`   Waiting period: ${CONFIG.minDaysSinceApply} days`);
            return;
        }

        // Process follow-ups
        let sentCount = 0;
        const toProcess = eligibleJobs.slice(0, CONFIG.maxFollowups);

        for (const job of toProcess) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📌 ${job.title} at ${job.company}`);
            console.log(`   Applied: ${job.appliedDate} | Status: ${job.status}`);

            // Generate personalized message
            console.log('   🤖 Generating follow-up message with AI...');
            const message = await generateFollowUpMessage(
                job.title,
                job.company,
                parseRelativeDate(job.appliedDate)
            );

            console.log('\n   📝 Generated Message:');
            console.log('   ─────────────────────');
            message.split('\n').forEach(line => console.log(`   ${line}`));
            console.log('   ─────────────────────\n');

            // Send the follow-up
            const sent = await sendFollowUp(page, job, message);

            // Log the follow-up
            logFollowUp(job, message, sent);

            if (sent) sentCount++;

            // Wait between follow-ups
            await page.waitForTimeout(3000);
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Follow-up Summary:`);
        console.log(`   📤 Sent: ${sentCount}/${toProcess.length}`);
        console.log(`   📋 Log saved to: data/followup-log.json`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Keep browser open for review
        console.log('👉 Browser will stay open for you to review');
        console.log('👉 Close the browser window when done');

        await new Promise(() => {}); // Keep running

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (context) await context.close();
        process.exit(1);
    }
}

// Run
main();
