const { chromium } = require('playwright');
const path = require('path');
const stealth = require('./stealth-utils');

const USER_DATA_DIR = path.join(__dirname, '..', 'user_data', 'playwright');
const EXTENSION_PATH = path.join(__dirname, '..', 'chrome-extension');

(async () => {
    console.log('🚀 Starting Browser Session Setup...');
    console.log(`📂 User Data Dir: ${USER_DATA_DIR}`);
    console.log(`🧩 Loading Extension from: ${EXTENSION_PATH}`);
    console.log('------------------------------------------------');
    console.log('👉 Please log in to your accounts manually.');
    console.log('👉 The session will be saved automatically.');
    console.log('👉 Close the browser window when you are done.');
    console.log('------------------------------------------------');

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        viewport: null, // Let user resize
        args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--remote-debugging-port=9222', // Allow other scripts to connect
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
        ],
        userAgent: stealth.getRandomUserAgent()
    });

    const page = await context.newPage();
    await stealth.applyStealthToContext(context);

    // Open key services
    console.log('🌐 Opening Gmail...');
    await page.goto('https://mail.google.com', { timeout: 60000 });

    const p2 = await context.newPage();
    console.log('🌐 Opening LinkedIn...');
    await p2.goto('https://www.linkedin.com', { timeout: 60000 });

    const p3 = await context.newPage();
    console.log('🌐 Opening Indeed...');
    await p3.goto('https://ae.indeed.com', { timeout: 60000 });

    const p4 = await context.newPage();
    console.log('🌐 Opening Bayt...');
    await p4.goto('https://www.bayt.com', { timeout: 60000 });

    const p5 = await context.newPage();
    console.log('🌐 Opening GulfTalent...');
    await p5.goto('https://www.gulftalent.com', { timeout: 60000 });

    // Keep script running until user closes browser
    context.on('close', () => {
        console.log('✅ Browser closed. Session saved.');
        process.exit(0);
    });

    // Prevent script from exiting immediately
    await new Promise(() => {});
})();
