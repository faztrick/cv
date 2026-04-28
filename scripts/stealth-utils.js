const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomViewport() {
    const viewports = [
        { width: 1920, height: 1080 },
        { width: 1536, height: 864 },
        { width: 1440, height: 900 },
        { width: 1366, height: 768 }
    ];
    return viewports[Math.floor(Math.random() * viewports.length)];
}

const STEALTH_SCRIPT = '';

async function applyStealthToPage() {
    return;
}

async function applyStealthToContext() {
    return;
}

async function humanMouseMove(page, toX, toY) {
    await page.mouse.move(toX, toY);
}

async function humanType(page, selector, text) {
    await page.locator(selector).fill(text);
}

async function humanScroll(page, distance) {
    await page.evaluate((scrollDistance) => window.scrollBy(0, scrollDistance), distance);
}

async function humanDelay(minMs = 1000, maxMs = 3000) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
}

async function detectCaptcha(page) {
    const selectors = [
        '.g-recaptcha',
        '#recaptcha',
        'iframe[src*="recaptcha"]',
        '.h-captcha',
        '#cf-turnstile',
        '.cf-turnstile',
        'input[name*="captcha"]'
    ];

    for (const selector of selectors) {
        try {
            if (await page.locator(selector).count()) {
                return { detected: true, type: selector };
            }
        } catch (_) {
        }
    }

    return { detected: false, type: null };
}

async function handleCaptcha() {
    console.log('CAPTCHA detected. Solve it manually before continuing.');
    return false;
}

async function safeGoto(page, url, options = {}) {
    await page.goto(url, { waitUntil: 'domcontentloaded', ...options });
}

function getStealthLaunchOptions(userDataDir = null) {
    const options = {
        headless: false,
        slowMo: 50,
        viewport: getRandomViewport(),
        args: ['--window-size=1920,1080']
    };

    if (!userDataDir) {
        return options;
    }

    return {
        ...options,
        userDataDir
    };
}

module.exports = {
    STEALTH_SCRIPT,
    USER_AGENTS,
    getRandomUserAgent,
    getRandomViewport,
    applyStealthToPage,
    applyStealthToContext,
    humanMouseMove,
    humanType,
    humanScroll,
    humanDelay,
    detectCaptcha,
    handleCaptcha,
    safeGoto,
    getStealthLaunchOptions
};