/**
 * Stealth Utilities for Browser Automation
 * Anti-detection, fingerprint spoofing, and CAPTCHA handling
 * Based on undetected-chromedriver patterns and Playwright best practices
 */

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:126.0) Gecko/20100101 Firefox/126.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0'
];

const WEBGL_VENDORS = [
    'Intel Inc.',
    'NVIDIA Corporation',
    'AMD',
    'Google Inc. (Intel)',
    'Google Inc. (NVIDIA)'
];

const WEBGL_RENDERERS = [
    'Intel(R) UHD Graphics 630',
    'NVIDIA GeForce GTX 1080',
    'AMD Radeon RX 580',
    'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0, D3D11)'
];

/**
 * Get a random user agent
 */
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Get random viewport dimensions
 */
function getRandomViewport() {
    const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
        { width: 1440, height: 900 },
        { width: 1280, height: 720 },
        { width: 1600, height: 900 }
    ];
    return viewports[Math.floor(Math.random() * viewports.length)];
}

/**
 * Stealth JavaScript injection - patches navigator.webdriver and other detection vectors
 * This should be executed via page.evaluateOnNewDocument() BEFORE loading any pages
 */
const STEALTH_SCRIPT = `
(function() {
    'use strict';

    // 1. Override navigator.webdriver to return undefined (like real browsers)
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
    });

    // 2. Add Chrome runtime object (missing in automation)
    if (!window.chrome) {
        window.chrome = {
            runtime: {
                id: undefined,
                connect: function() {},
                sendMessage: function() {},
                onMessage: { addListener: function() {} }
            },
            app: {
                isInstalled: false,
                InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
                RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
            },
            csi: function() {},
            loadTimes: function() {}
        };
    }

    // 3. Override Permissions API
    const originalQuery = window.navigator.permissions?.query;
    if (originalQuery) {
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    }

    // 4. Override plugins (automation browsers have empty plugins)
    Object.defineProperty(navigator, 'plugins', {
        get: () => {
            const fakePlugins = {
                0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
                length: 3,
                item: function(i) { return this[i]; },
                namedItem: function(name) { return this[name]; },
                refresh: function() {}
            };
            return fakePlugins;
        },
        configurable: true
    });

    // 5. Override languages (normalize to common values)
    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true
    });

    // 6. Override hardware concurrency (randomize slightly)
    const cores = [4, 6, 8, 12][Math.floor(Math.random() * 4)];
    Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => cores,
        configurable: true
    });

    // 7. Override device memory
    const memory = [4, 8, 16][Math.floor(Math.random() * 3)];
    Object.defineProperty(navigator, 'deviceMemory', {
        get: () => memory,
        configurable: true
    });

    // 8. Mask automation-specific console messages
    const originalWarn = console.warn;
    console.warn = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('WebDriver')) return;
        return originalWarn.apply(console, args);
    };

    // 9. Override canvas fingerprinting (add slight noise)
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png') {
            const context = this.getContext('2d');
            if (context) {
                const imageData = context.getImageData(0, 0, this.width, this.height);
                // Add tiny noise to a few pixels
                for (let i = 0; i < 5; i++) {
                    const idx = Math.floor(Math.random() * imageData.data.length);
                    imageData.data[idx] = (imageData.data[idx] + 1) % 256;
                }
                context.putImageData(imageData, 0, 0);
            }
        }
        return originalToDataURL.apply(this, arguments);
    };

    // 10. WebGL fingerprint protection
    const getParameterOriginal = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) {
            return 'Intel Inc.';
        }
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) {
            return 'Intel(R) UHD Graphics 630';
        }
        return getParameterOriginal.apply(this, arguments);
    };

    // 11. Remove automation-specific window properties
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

    // 12. Override connection type (use realistic values)
    if (navigator.connection) {
        Object.defineProperty(navigator.connection, 'rtt', { get: () => 50, configurable: true });
        Object.defineProperty(navigator.connection, 'downlink', { get: () => 10, configurable: true });
        Object.defineProperty(navigator.connection, 'effectiveType', { get: () => '4g', configurable: true });
    }

})();
`;

/**
 * Apply stealth settings to a Playwright page
 * @param {import('playwright').Page} page - The Playwright page object
 */
async function applyStealthToPage(page) {
    // Inject stealth script before any page loads
    await page.addInitScript(STEALTH_SCRIPT);

    console.log('🛡️ Stealth mode applied to page');
}

/**
 * Apply stealth settings to a Playwright browser context
 * @param {import('playwright').BrowserContext} context - The Playwright context
 */
async function applyStealthToContext(context) {
    await context.addInitScript(STEALTH_SCRIPT);
    console.log('🛡️ Stealth mode applied to browser context');
}

/**
 * Human-like mouse movement using Bezier curves
 * @param {import('playwright').Page} page
 * @param {number} toX - Target X coordinate
 * @param {number} toY - Target Y coordinate
 */
async function humanMouseMove(page, toX, toY) {
    // Get current mouse position (default to center of viewport)
    const viewport = page.viewportSize() || { width: 1280, height: 800 };
    const fromX = Math.floor(viewport.width / 2 + (Math.random() - 0.5) * 100);
    const fromY = Math.floor(viewport.height / 2 + (Math.random() - 0.5) * 100);

    // Generate curved path points
    const steps = Math.floor(Math.random() * 15) + 10; // 10-25 steps
    const points = [];

    // Control points for quadratic bezier curve
    const cpX = fromX + (toX - fromX) * 0.5 + (Math.random() - 0.5) * 100;
    const cpY = fromY + (toY - fromY) * 0.5 + (Math.random() - 0.5) * 100;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Quadratic bezier formula
        const x = Math.pow(1 - t, 2) * fromX + 2 * (1 - t) * t * cpX + Math.pow(t, 2) * toX;
        const y = Math.pow(1 - t, 2) * fromY + 2 * (1 - t) * t * cpY + Math.pow(t, 2) * toY;
        points.push({ x: Math.round(x), y: Math.round(y) });
    }

    // Move along the curve with variable speed
    for (const point of points) {
        await page.mouse.move(point.x, point.y);
        await new Promise(r => setTimeout(r, Math.random() * 15 + 5)); // 5-20ms between moves
    }
}

/**
 * Human-like typing with variable delays
 * @param {import('playwright').Page} page
 * @param {string} selector - Element selector
 * @param {string} text - Text to type
 */
async function humanType(page, selector, text) {
    const element = page.locator(selector);
    await element.click();

    for (const char of text) {
        await element.pressSequentially(char, { delay: 0 });
        // Variable delay between keystrokes (50-150ms, occasionally longer)
        const delay = Math.random() < 0.1
            ? Math.random() * 300 + 200  // 10% chance of longer pause (200-500ms)
            : Math.random() * 100 + 50;  // Normal typing (50-150ms)
        await new Promise(r => setTimeout(r, delay));
    }
}

/**
 * Natural scrolling behavior
 * @param {import('playwright').Page} page
 * @param {number} distance - Distance to scroll (positive = down)
 */
async function humanScroll(page, distance) {
    const steps = Math.floor(Math.random() * 5) + 5; // 5-10 scroll steps
    const stepSize = distance / steps;

    for (let i = 0; i < steps; i++) {
        // Variable scroll amount (80-120% of step size)
        const scrollAmount = stepSize * (0.8 + Math.random() * 0.4);
        await page.evaluate((y) => window.scrollBy(0, y), scrollAmount);

        // Variable delay between scrolls (100-400ms)
        await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
    }
}

/**
 * Random delay that mimics human pause
 * @param {number} minMs - Minimum milliseconds
 * @param {number} maxMs - Maximum milliseconds
 */
async function humanDelay(minMs = 1000, maxMs = 3000) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(r => setTimeout(r, delay));
}

/**
 * CAPTCHA Detection - checks for common CAPTCHA elements on page
 * @param {import('playwright').Page} page
 * @returns {Promise<{detected: boolean, type: string|null}>}
 */
async function detectCaptcha(page) {
    const captchaSelectors = {
        'reCAPTCHA': [
            '.g-recaptcha',
            '#recaptcha',
            'iframe[src*="recaptcha"]',
            'iframe[title*="reCAPTCHA"]',
            '[data-sitekey]'
        ],
        'hCaptcha': [
            '.h-captcha',
            'iframe[src*="hcaptcha"]',
            '[data-hcaptcha-sitekey]'
        ],
        'Cloudflare': [
            '#cf-turnstile',
            'iframe[src*="challenges.cloudflare.com"]',
            '.cf-turnstile'
        ],
        'Generic': [
            '#captcha',
            '.captcha',
            'input[name*="captcha"]',
            'img[alt*="captcha" i]'
        ]
    };

    for (const [type, selectors] of Object.entries(captchaSelectors)) {
        for (const selector of selectors) {
            try {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    console.log(`⚠️ CAPTCHA Detected: ${type}`);
                    return { detected: true, type };
                }
            } catch (e) {
                // Ignore errors from invalid selectors in iframes
            }
        }
    }

    // Also check for captcha-related text
    const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
    const captchaKeywords = ['verify you are human', 'i\'m not a robot', 'security check', 'prove you\'re human'];

    for (const keyword of captchaKeywords) {
        if (pageText.toLowerCase().includes(keyword)) {
            console.log(`⚠️ CAPTCHA-like challenge detected via text: "${keyword}"`);
            return { detected: true, type: 'TextChallenge' };
        }
    }

    return { detected: false, type: null };
}

/**
 * Handle detected CAPTCHA - pauses automation and notifies user
 * @param {import('playwright').Page} page
 * @param {string} captchaType
 * @returns {Promise<boolean>} - True if user solved it, false if timed out
 */
async function handleCaptcha(page, captchaType) {
    console.log(`\n🚨 ========================================`);
    console.log(`🚨 CAPTCHA DETECTED: ${captchaType}`);
    console.log(`🚨 Please solve the CAPTCHA manually in the browser!`);
    console.log(`🚨 Automation will resume after CAPTCHA is solved.`);
    console.log(`🚨 Timeout: 120 seconds`);
    console.log(`🚨 ========================================\n`);

    // Wait for CAPTCHA to disappear (user solved it) or timeout
    const maxWait = 120000; // 2 minutes
    const checkInterval = 2000;
    let elapsed = 0;

    while (elapsed < maxWait) {
        await new Promise(r => setTimeout(r, checkInterval));
        elapsed += checkInterval;

        const { detected } = await detectCaptcha(page);
        if (!detected) {
            console.log(`✅ CAPTCHA solved! Resuming automation...`);
            await humanDelay(1500, 3000); // Wait a bit before continuing
            return true;
        }

        // Progress indicator
        const remaining = Math.ceil((maxWait - elapsed) / 1000);
        if (elapsed % 10000 === 0) { // Every 10 seconds
            console.log(`⏳ Waiting for CAPTCHA... ${remaining}s remaining`);
        }
    }

    console.log(`❌ CAPTCHA timeout! User did not solve in time.`);
    return false;
}

/**
 * Safe navigation with CAPTCHA detection
 * @param {import('playwright').Page} page
 * @param {string} url
 * @param {object} options
 */
async function safeGoto(page, url, options = {}) {
    await page.goto(url, { waitUntil: 'domcontentloaded', ...options });

    // Check for CAPTCHA after navigation
    const { detected, type } = await detectCaptcha(page);
    if (detected) {
        const solved = await handleCaptcha(page, type);
        if (!solved) {
            throw new Error(`CAPTCHA not solved: ${type}`);
        }
    }
}

/**
 * Get launch options with anti-detection flags
 */
function getStealthLaunchOptions(userDataDir = null) {
    const viewport = getRandomViewport();

    const options = {
        headless: false, // Headed mode is harder to detect
        slowMo: 50 + Math.random() * 50, // 50-100ms
        viewport: viewport,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--window-size=1920,1080',
            `--user-agent=${getRandomUserAgent()}`
        ],
        ignoreDefaultArgs: ['--enable-automation']
    };

    if (userDataDir) {
        // For persistent context, return different structure
        return {
            ...options,
            userDataDir: userDataDir
        };
    }

    return options;
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
