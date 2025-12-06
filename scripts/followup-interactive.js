/**
 * Interactive Follow-up Message Generator
 * Opens Indeed messages and generates AI-powered follow-up messages
 * You paste the company/job info, it generates the message
 */

const { chromium } = require('playwright');
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load CV data
const cvData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cv-data.json'), 'utf8'));

// OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const CONFIG = {
    userDataDir: path.join(__dirname, '../user_data/playwright'),
    extensionPath: path.join(__dirname, '../chrome-extension'),
};

// Generate follow-up message
async function generateFollowUp(jobTitle, companyName, daysSinceApply = 5) {
    const prompt = `Generate a professional, concise follow-up message for a job application.

Applicant Details:
- Name: ${cvData.personalInfo.name}
- Title: ${cvData.personalInfo.title}
- Key Skills: ${cvData.skills.slice(0, 8).join(', ')}
- Recent Achievement: Showcased AI Self-Checkout Kiosk at Gitex Dubai 2024

Job Application:
- Position: ${jobTitle}
- Company: ${companyName}
- Applied approximately ${daysSinceApply} days ago

Requirements:
1. Keep it under 120 words
2. Professional but personable
3. Mention 1-2 relevant skills briefly
4. Express continued interest
5. Ask about next steps
6. Don't be pushy

Generate ONLY the message body (no subject, no greeting like "Dear Hiring Manager", no signature).`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a career coach helping write concise, professional follow-up messages. Be direct and confident.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 250,
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI error:', error.message);
        return `I wanted to follow up on my application for the ${jobTitle} position. I remain very interested in this opportunity and believe my experience in full-stack development and AI systems would be valuable to your team. Could you share any updates on the hiring process?`;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🤖 AI Follow-up Message Generator');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not set');
        process.exit(1);
    }

    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    // Launch browser
    console.log('🌐 Opening browser with Indeed Messages...\n');

    const context = await chromium.launchPersistentContext(CONFIG.userDataDir, {
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            `--load-extension=${CONFIG.extensionPath}`
        ],
        viewport: { width: 1400, height: 900 }
    });

    const page = await context.newPage();

    // Open Indeed messages
    await page.goto('https://messages.indeed.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Also open LinkedIn messages in new tab
    const linkedinPage = await context.newPage();
    await linkedinPage.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('✅ Browser opened with Indeed & LinkedIn messages\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  How to use:');
    console.log('  1. Click on a conversation in Indeed or LinkedIn');
    console.log('  2. Come back here and enter job details');
    console.log('  3. Copy the generated message and paste it');
    console.log('  4. Type "quit" to exit');
    console.log('═══════════════════════════════════════════════════════════════\n');

    while (true) {
        console.log('\n─────────────────────────────────────────────────');
        const company = await ask('🏢 Company name (or "quit"): ');

        if (company.toLowerCase() === 'quit' || company.toLowerCase() === 'exit') {
            console.log('\n👋 Goodbye! Browser will stay open.\n');
            rl.close();
            break;
        }

        const jobTitle = await ask('💼 Job title: ');
        const days = await ask('📅 Days since applied (default 5): ');

        console.log('\n🤖 Generating follow-up message...\n');

        const message = await generateFollowUp(
            jobTitle || 'Software Developer',
            company,
            parseInt(days) || 5
        );

        // Add greeting and signature
        const fullMessage = `Hi,

${message}

Best regards,
${cvData.personalInfo.name}
${cvData.personalInfo.phone}
${cvData.personalInfo.portfolio}`;

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📝 FOLLOW-UP MESSAGE:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(fullMessage);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n📋 Message ready! Copy and paste it into the chat.\n');

        // Copy to clipboard (Windows)
        try {
            const { exec } = require('child_process');
            exec(`echo ${JSON.stringify(fullMessage)} | clip`, (err) => {
                if (!err) console.log('✅ Message copied to clipboard!\n');
            });
        } catch (e) {}

        // Log the follow-up
        const logFile = path.join(__dirname, '../data/followup-log.json');
        let log = [];
        if (fs.existsSync(logFile)) {
            log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        log.push({
            timestamp: new Date().toISOString(),
            company: company,
            jobTitle: jobTitle,
            message: fullMessage,
            platform: 'manual'
        });
        fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
    }

    // Keep browser open
    await new Promise(() => {});
}

main().catch(console.error);
