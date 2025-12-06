/**
 * Bulk Follow-up Automation with AI
 * - Uses GPT-4o (latest best model)
 * - Shows data in a visual panel
 * - Sends follow-ups one by one automatically
 * - Supports Indeed and LinkedIn
 */

const { chromium } = require('playwright');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Load CV data
const cvData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cv-data.json'), 'utf8'));

// OpenAI client with GPT-4o
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const CONFIG = {
    userDataDir: path.join(__dirname, '../user_data/playwright'),
    extensionPath: path.join(__dirname, '../chrome-extension'),
    panelPort: 3456,
    model: 'gpt-4o', // Latest and best model
    minDaysSinceApply: 2,
    delayBetweenMessages: 5000 // 5 seconds between messages
};

// Store for applications and status
let applications = [];
let followupStatus = {};
let browserContext = null;
let mainPage = null;

// Generate follow-up message using GPT-4o
async function generateFollowUpMessage(job) {
    const daysSince = job.daysSinceApply || 5;

    const prompt = `You are writing a follow-up message for a job application. Be professional, concise, and confident.

APPLICANT PROFILE:
- Name: ${cvData.personalInfo.name}
- Current Role: ${cvData.personalInfo.title}
- Top Skills: ${cvData.skills.slice(0, 10).join(', ')}
- Recent Achievement: AI Self-Checkout Kiosk showcased at Gitex Dubai 2024
- Experience: 10+ years in enterprise software, IoT, and AI

APPLICATION DETAILS:
- Position: ${job.title}
- Company: ${job.company}
- Applied: ${daysSince} days ago
- Platform: ${job.platform || 'Indeed'}

INSTRUCTIONS:
1. Write a 80-100 word follow-up message
2. Sound genuinely interested, not desperate
3. Highlight ONE specific skill relevant to this role
4. Mention ONE achievement briefly
5. Ask about timeline or next steps
6. Be warm but professional

OUTPUT: Just the message body, no greeting or signature.`;

    try {
        console.log(`   🤖 Generating with GPT-4o...`);
        const response = await openai.chat.completions.create({
            model: CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert career coach. Write compelling, natural-sounding follow-up messages that get responses. Avoid clichés and generic phrases.'
                },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.8
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('   ❌ OpenAI error:', error.message);
        return `I wanted to follow up on my application for the ${job.title} position. With my background in full-stack development and AI/IoT systems, I believe I can make a meaningful contribution to your team. I recently showcased an AI Self-Checkout system at Gitex Dubai 2024. Could you share any updates on the hiring timeline?`;
    }
}

// Format the complete message
function formatFullMessage(messageBody) {
    return `Hi,

${messageBody}

Best regards,
${cvData.personalInfo.name}
📞 ${cvData.personalInfo.phone}
🌐 ${cvData.personalInfo.portfolio}`;
}

// Scrape Indeed Applied Jobs
async function scrapeIndeedApplications(page) {
    console.log('\n📋 Scraping Indeed applications...');

    try {
        await page.goto('https://myjobs.indeed.com/applied', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(3000);

        // Check login
        const content = await page.content();
        if (content.includes('Sign in') && !content.includes('Applied')) {
            console.log('   ⚠️ Indeed: Not logged in');
            return [];
        }

        // Wait for job cards
        await page.waitForTimeout(2000);

        const jobs = await page.evaluate(() => {
            const results = [];

            // Try various selectors
            const containers = document.querySelectorAll('[class*="applied"], [class*="job"], article, [role="listitem"], .gnav-JobCard, li');

            containers.forEach((el, idx) => {
                const text = el.textContent || '';

                // Look for job title patterns
                const titleEl = el.querySelector('h2, h3, a[href*="job"], [class*="title"], [class*="Title"]');
                const companyEl = el.querySelector('[class*="company"], [class*="Company"], span:nth-child(2)');
                const dateEl = el.querySelector('time, [class*="date"], [class*="Date"]');

                if (titleEl && titleEl.textContent.trim().length > 3) {
                    results.push({
                        id: `indeed-${idx}`,
                        title: titleEl.textContent.trim().substring(0, 80),
                        company: companyEl ? companyEl.textContent.trim().substring(0, 50) : 'Unknown',
                        appliedDate: dateEl ? dateEl.textContent.trim() : 'Recently',
                        platform: 'Indeed',
                        status: 'pending'
                    });
                }
            });

            return results;
        });

        console.log(`   ✅ Found ${jobs.length} Indeed applications`);
        return jobs;
    } catch (error) {
        console.error('   ❌ Indeed scrape error:', error.message);
        return [];
    }
}

// Scrape LinkedIn Applied Jobs
async function scrapeLinkedInApplications(page) {
    console.log('\n📋 Scraping LinkedIn applications...');

    try {
        await page.goto('https://www.linkedin.com/my-items/saved-jobs/?cardType=APPLIED', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(3000);

        // Check login
        const content = await page.content();
        if (content.includes('Sign in') || content.includes('Join now')) {
            console.log('   ⚠️ LinkedIn: Not logged in');
            return [];
        }

        await page.waitForTimeout(2000);

        const jobs = await page.evaluate(() => {
            const results = [];

            const cards = document.querySelectorAll('.entity-result, .job-card-container, [class*="job-card"], .reusable-search__result-container, li[class*="result"]');

            cards.forEach((card, idx) => {
                const titleEl = card.querySelector('a[href*="jobs"], h3, .job-card-list__title, [class*="title"]');
                const companyEl = card.querySelector('.job-card-container__company-name, [class*="company"], .entity-result__primary-subtitle');
                const dateEl = card.querySelector('time, [class*="date"], [class*="time"]');

                if (titleEl) {
                    results.push({
                        id: `linkedin-${idx}`,
                        title: titleEl.textContent.trim().substring(0, 80),
                        company: companyEl ? companyEl.textContent.trim().substring(0, 50) : 'Unknown',
                        appliedDate: dateEl ? dateEl.textContent.trim() : 'Recently',
                        platform: 'LinkedIn',
                        status: 'pending'
                    });
                }
            });

            return results;
        });

        console.log(`   ✅ Found ${jobs.length} LinkedIn applications`);
        return jobs;
    } catch (error) {
        console.error('   ❌ LinkedIn scrape error:', error.message);
        return [];
    }
}

// Calculate days since application
function calculateDaysSince(dateStr) {
    const now = new Date();
    const str = (dateStr || '').toLowerCase();

    if (str.includes('today') || str.includes('just')) return 0;
    if (str.includes('yesterday')) return 1;

    const daysMatch = str.match(/(\d+)\s*d/);
    if (daysMatch) return parseInt(daysMatch[1]);

    const weeksMatch = str.match(/(\d+)\s*w/);
    if (weeksMatch) return parseInt(weeksMatch[1]) * 7;

    const monthsMatch = str.match(/(\d+)\s*m/);
    if (monthsMatch) return parseInt(monthsMatch[1]) * 30;

    return 5; // Default
}

// Send follow-up on Indeed
async function sendIndeedFollowUp(page, job, message) {
    try {
        await page.goto('https://messages.indeed.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Search for company conversation
        const searchInput = await page.$('input[type="search"], input[placeholder*="Search"], [data-testid*="search"]');
        if (searchInput) {
            await searchInput.fill(job.company);
            await page.waitForTimeout(2000);
        }

        // Click on conversation if found
        const conversationItem = await page.$(`text=${job.company}`);
        if (conversationItem) {
            await conversationItem.click();
            await page.waitForTimeout(1500);

            // Find message input
            const msgInput = await page.$('textarea, [contenteditable="true"], input[type="text"]');
            if (msgInput) {
                await msgInput.fill(message);
                await page.waitForTimeout(500);

                // Click send
                const sendBtn = await page.$('button[type="submit"], button:has-text("Send"), [aria-label*="Send"]');
                if (sendBtn) {
                    await sendBtn.click();
                    await page.waitForTimeout(2000);
                    return { success: true, method: 'direct' };
                }
            }
        }

        return { success: false, method: 'not_found', message: 'Conversation not found' };
    } catch (error) {
        return { success: false, method: 'error', message: error.message };
    }
}

// Send follow-up on LinkedIn
async function sendLinkedInFollowUp(page, job, message) {
    try {
        await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Search for conversation
        const searchInput = await page.$('input[placeholder*="Search"], .msg-search-form__search-field');
        if (searchInput) {
            await searchInput.fill(job.company);
            await page.waitForTimeout(2000);
        }

        // Try to find and click conversation
        const conversationItem = await page.$(`[class*="conversation"]:has-text("${job.company}"), .msg-conversation-card:has-text("${job.company}")`);
        if (conversationItem) {
            await conversationItem.click();
            await page.waitForTimeout(1500);

            // Find message input
            const msgInput = await page.$('.msg-form__contenteditable, [contenteditable="true"], textarea');
            if (msgInput) {
                await msgInput.fill(message);
                await page.waitForTimeout(500);

                // Click send
                const sendBtn = await page.$('.msg-form__send-button, button[type="submit"]:has-text("Send")');
                if (sendBtn) {
                    await sendBtn.click();
                    await page.waitForTimeout(2000);
                    return { success: true, method: 'direct' };
                }
            }
        }

        return { success: false, method: 'not_found', message: 'Conversation not found' };
    } catch (error) {
        return { success: false, method: 'error', message: error.message };
    }
}

// Create visual panel HTML
function createPanelHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>🤖 Bulk Follow-up Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px;
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            margin-bottom: 20px;
        }
        .header h1 { color: #00d4ff; font-size: 2em; }
        .header .subtitle { color: #888; margin-top: 5px; }
        .stats {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 20px 0;
        }
        .stat-card {
            background: rgba(255,255,255,0.08);
            padding: 15px 30px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-card .number { font-size: 2em; font-weight: bold; color: #00d4ff; }
        .stat-card .label { color: #888; font-size: 0.9em; }
        .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 20px 0;
        }
        button {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn-primary { background: #00d4ff; color: #1a1a2e; }
        .btn-primary:hover { background: #00b8e6; transform: scale(1.05); }
        .btn-secondary { background: rgba(255,255,255,0.1); color: #e0e0e0; }
        .btn-secondary:hover { background: rgba(255,255,255,0.2); }
        .btn-danger { background: #ff4757; color: white; }
        .btn-danger:hover { background: #ff3344; }
        .jobs-container {
            display: grid;
            gap: 15px;
            margin-top: 20px;
        }
        .job-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #00d4ff;
            transition: all 0.3s;
        }
        .job-card:hover { background: rgba(255,255,255,0.08); }
        .job-card.sending { border-left-color: #ffa502; animation: pulse 1s infinite; }
        .job-card.sent { border-left-color: #2ed573; }
        .job-card.failed { border-left-color: #ff4757; }
        .job-card.skipped { border-left-color: #888; opacity: 0.6; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .job-title { font-size: 1.2em; font-weight: bold; color: #fff; }
        .job-company { color: #00d4ff; margin-top: 5px; }
        .job-meta {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            color: #888;
            font-size: 0.9em;
        }
        .job-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .badge-indeed { background: #2557a7; color: white; }
        .badge-linkedin { background: #0077b5; color: white; }
        .job-message {
            margin-top: 15px;
            padding: 15px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            font-size: 0.9em;
            line-height: 1.5;
            white-space: pre-wrap;
        }
        .job-status {
            margin-top: 10px;
            padding: 8px;
            border-radius: 5px;
            font-size: 0.85em;
        }
        .status-pending { background: rgba(136,136,136,0.2); color: #888; }
        .status-sending { background: rgba(255,165,2,0.2); color: #ffa502; }
        .status-sent { background: rgba(46,213,115,0.2); color: #2ed573; }
        .status-failed { background: rgba(255,71,87,0.2); color: #ff4757; }
        .log-container {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            max-height: 200px;
            overflow-y: auto;
        }
        .log-entry { font-family: monospace; font-size: 0.85em; margin: 5px 0; }
        .log-entry.success { color: #2ed573; }
        .log-entry.error { color: #ff4757; }
        .log-entry.info { color: #00d4ff; }
        .loading {
            text-align: center;
            padding: 40px;
            color: #888;
        }
        .spinner {
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #00d4ff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI Bulk Follow-up</h1>
        <div class="subtitle">Using GPT-4o • One by One • Auto Send</div>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="number" id="total-count">-</div>
            <div class="label">Total Applications</div>
        </div>
        <div class="stat-card">
            <div class="number" id="pending-count">-</div>
            <div class="label">Pending</div>
        </div>
        <div class="stat-card">
            <div class="number" id="sent-count">0</div>
            <div class="label">Sent</div>
        </div>
        <div class="stat-card">
            <div class="number" id="failed-count">0</div>
            <div class="label">Failed</div>
        </div>
    </div>

    <div class="controls">
        <button class="btn-primary" id="start-btn" onclick="startFollowups()">🚀 Start Sending</button>
        <button class="btn-secondary" id="refresh-btn" onclick="refreshData()">🔄 Refresh</button>
        <button class="btn-danger" id="stop-btn" onclick="stopFollowups()" style="display:none">⏹️ Stop</button>
    </div>

    <div id="jobs-container" class="jobs-container">
        <div class="loading">
            <div class="spinner"></div>
            <div>Loading applications...</div>
        </div>
    </div>

    <div class="log-container" id="log-container">
        <div class="log-entry info">📋 Ready to load applications...</div>
    </div>

    <script>
        let isRunning = false;

        async function fetchData(endpoint) {
            const res = await fetch('/' + endpoint);
            return res.json();
        }

        async function refreshData() {
            document.getElementById('jobs-container').innerHTML = '<div class="loading"><div class="spinner"></div><div>Scraping applications...</div></div>';
            addLog('🔄 Refreshing application data...', 'info');

            const data = await fetchData('scrape');
            renderJobs(data.applications);
            updateStats(data.applications);
            addLog(\`✅ Found \${data.applications.length} applications\`, 'success');
        }

        function renderJobs(jobs) {
            const container = document.getElementById('jobs-container');
            if (!jobs || jobs.length === 0) {
                container.innerHTML = '<div class="loading">No applications found. Make sure you are logged in.</div>';
                return;
            }

            container.innerHTML = jobs.map((job, i) => \`
                <div class="job-card \${job.status}" id="job-\${job.id}">
                    <div class="job-header">
                        <div>
                            <div class="job-title">\${job.title}</div>
                            <div class="job-company">🏢 \${job.company}</div>
                            <div class="job-meta">
                                <span>📅 \${job.appliedDate}</span>
                                <span>⏱️ \${job.daysSinceApply || '?'} days ago</span>
                            </div>
                        </div>
                        <span class="job-badge badge-\${job.platform.toLowerCase()}">\${job.platform}</span>
                    </div>
                    <div class="job-message" id="msg-\${job.id}">\${job.generatedMessage || 'Message will be generated...'}</div>
                    <div class="job-status status-\${job.status}" id="status-\${job.id}">
                        \${getStatusText(job.status)}
                    </div>
                </div>
            \`).join('');
        }

        function getStatusText(status) {
            const texts = {
                pending: '⏳ Pending',
                generating: '🤖 Generating message...',
                sending: '📤 Sending...',
                sent: '✅ Sent successfully!',
                failed: '❌ Failed to send',
                skipped: '⏭️ Skipped (too recent)'
            };
            return texts[status] || status;
        }

        function updateStats(jobs) {
            document.getElementById('total-count').textContent = jobs.length;
            document.getElementById('pending-count').textContent = jobs.filter(j => j.status === 'pending').length;
            document.getElementById('sent-count').textContent = jobs.filter(j => j.status === 'sent').length;
            document.getElementById('failed-count').textContent = jobs.filter(j => j.status === 'failed').length;
        }

        function addLog(msg, type = 'info') {
            const container = document.getElementById('log-container');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${msg}\`;
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
        }

        async function startFollowups() {
            isRunning = true;
            document.getElementById('start-btn').style.display = 'none';
            document.getElementById('stop-btn').style.display = 'inline-block';

            addLog('🚀 Starting bulk follow-up process...', 'info');

            const response = await fetch('/start', { method: 'POST' });
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\\n').filter(l => l.trim());

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.slice(5));
                            handleUpdate(data);
                        } catch (e) {}
                    }
                }
            }

            isRunning = false;
            document.getElementById('start-btn').style.display = 'inline-block';
            document.getElementById('stop-btn').style.display = 'none';
            addLog('✅ Follow-up process completed', 'success');
        }

        function handleUpdate(data) {
            if (data.type === 'job_update') {
                const card = document.getElementById(\`job-\${data.job.id}\`);
                const msgEl = document.getElementById(\`msg-\${data.job.id}\`);
                const statusEl = document.getElementById(\`status-\${data.job.id}\`);

                if (card) card.className = \`job-card \${data.job.status}\`;
                if (msgEl && data.job.generatedMessage) msgEl.textContent = data.job.generatedMessage;
                if (statusEl) statusEl.textContent = getStatusText(data.job.status);
            }

            if (data.type === 'log') {
                addLog(data.message, data.level);
            }

            if (data.type === 'stats') {
                updateStats(data.applications);
            }
        }

        async function stopFollowups() {
            await fetch('/stop', { method: 'POST' });
            isRunning = false;
            document.getElementById('start-btn').style.display = 'inline-block';
            document.getElementById('stop-btn').style.display = 'none';
            addLog('⏹️ Stopped by user', 'error');
        }

        // Initial load
        refreshData();
    </script>
</body>
</html>`;
}

// Start HTTP server for panel
function startPanelServer() {
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${CONFIG.panelPort}`);

        // Serve panel HTML
        if (url.pathname === '/' || url.pathname === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(createPanelHTML());
            return;
        }

        // Scrape applications
        if (url.pathname === '/scrape') {
            res.writeHead(200, { 'Content-Type': 'application/json' });

            const indeedJobs = await scrapeIndeedApplications(mainPage);
            const linkedinJobs = await scrapeLinkedInApplications(mainPage);

            applications = [...indeedJobs, ...linkedinJobs].map(job => ({
                ...job,
                daysSinceApply: calculateDaysSince(job.appliedDate),
                status: calculateDaysSince(job.appliedDate) >= CONFIG.minDaysSinceApply ? 'pending' : 'skipped'
            }));

            res.end(JSON.stringify({ applications }));
            return;
        }

        // Start follow-up process
        if (url.pathname === '/start' && req.method === 'POST') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const sendEvent = (data) => {
                res.write(`data:${JSON.stringify(data)}\n\n`);
            };

            // Process each job one by one
            const pendingJobs = applications.filter(j => j.status === 'pending');

            sendEvent({ type: 'log', message: `Processing ${pendingJobs.length} applications...`, level: 'info' });

            for (const job of pendingJobs) {
                try {
                    // Update status to generating
                    job.status = 'generating';
                    sendEvent({ type: 'job_update', job });
                    sendEvent({ type: 'log', message: `🤖 Generating message for ${job.company}...`, level: 'info' });

                    // Generate message with GPT-4o
                    const messageBody = await generateFollowUpMessage(job);
                    const fullMessage = formatFullMessage(messageBody);
                    job.generatedMessage = fullMessage;

                    sendEvent({ type: 'job_update', job });
                    sendEvent({ type: 'log', message: `📝 Message generated for ${job.company}`, level: 'success' });

                    // Update status to sending
                    job.status = 'sending';
                    sendEvent({ type: 'job_update', job });

                    // Send the message
                    let result;
                    if (job.platform === 'Indeed') {
                        result = await sendIndeedFollowUp(mainPage, job, fullMessage);
                    } else {
                        result = await sendLinkedInFollowUp(mainPage, job, fullMessage);
                    }

                    if (result.success) {
                        job.status = 'sent';
                        sendEvent({ type: 'log', message: `✅ Sent to ${job.company}!`, level: 'success' });
                    } else {
                        job.status = 'failed';
                        job.error = result.message;
                        sendEvent({ type: 'log', message: `❌ Failed: ${job.company} - ${result.message}`, level: 'error' });
                    }

                    sendEvent({ type: 'job_update', job });
                    sendEvent({ type: 'stats', applications });

                    // Log to file
                    logFollowUp(job);

                    // Delay between messages
                    await new Promise(r => setTimeout(r, CONFIG.delayBetweenMessages));

                } catch (error) {
                    job.status = 'failed';
                    job.error = error.message;
                    sendEvent({ type: 'job_update', job });
                    sendEvent({ type: 'log', message: `❌ Error: ${error.message}`, level: 'error' });
                }
            }

            sendEvent({ type: 'log', message: '🎉 All follow-ups processed!', level: 'success' });
            res.end();
            return;
        }

        // Stop
        if (url.pathname === '/stop') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ stopped: true }));
            return;
        }

        res.writeHead(404);
        res.end('Not found');
    });

    server.listen(CONFIG.panelPort, () => {
        console.log(`\n🖥️  Panel running at: http://localhost:${CONFIG.panelPort}\n`);
    });

    return server;
}

// Log follow-up to file
function logFollowUp(job) {
    const logFile = path.join(__dirname, '../data/followup-log.json');
    let log = [];

    if (fs.existsSync(logFile)) {
        try {
            log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        } catch (e) {}
    }

    log.push({
        timestamp: new Date().toISOString(),
        id: job.id,
        company: job.company,
        title: job.title,
        platform: job.platform,
        status: job.status,
        message: job.generatedMessage,
        error: job.error
    });

    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

// Main function
async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🤖 AI Bulk Follow-up Tool');
    console.log('  Model: GPT-4o (Latest) | Mode: One by One | Auto Send');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not set');
        console.log('   Set it with: $env:OPENAI_API_KEY = "your-key"');
        process.exit(1);
    }

    console.log('🌐 Launching browser...');

    // Launch browser
    browserContext = await chromium.launchPersistentContext(CONFIG.userDataDir, {
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            `--load-extension=${CONFIG.extensionPath}`
        ],
        viewport: { width: 1400, height: 900 }
    });

    mainPage = await browserContext.newPage();

    // Start panel server
    const server = startPanelServer();

    // Open panel in browser
    const panelPage = await browserContext.newPage();
    await panelPage.goto(`http://localhost:${CONFIG.panelPort}`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Panel opened in browser');
    console.log('  📋 Click "Start Sending" to begin follow-ups');
    console.log('  👉 Close the browser window when done');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Keep running
    await new Promise(() => {});
}

main().catch(console.error);
