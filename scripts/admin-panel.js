const express = require('express');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = 3000;

const REPO_ROOT = path.resolve(__dirname, '..');
const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ADMIN_PROTECTED_PATHS = new Set([
    '/admin',
    '/admin-old',
    '/old-panel',
    '/panel',
    '/panel-modern',
    '/panel-skills',
    '/panel-classic',
    '/admin-panel.html',
    '/panel.html',
    '/panel-modern.html',
    '/panel-skills.html'
]);

app.use(cors());
app.use(express.json());

function getAdminPassword() {
    return typeof process.env.ADMIN_PASSWORD === 'string' ? process.env.ADMIN_PASSWORD : '';
}

function getAdminSecurityQuestion() {
    return typeof process.env.ADMIN_SECURITY_QUESTION === 'string' ? process.env.ADMIN_SECURITY_QUESTION.trim() : '';
}

function getAdminSecurityAnswer() {
    return typeof process.env.ADMIN_SECURITY_ANSWER === 'string' ? process.env.ADMIN_SECURITY_ANSWER.trim() : '';
}

function getAdminSessionSecret() {
    const configuredSecret = typeof process.env.ADMIN_SESSION_SECRET === 'string' ? process.env.ADMIN_SESSION_SECRET.trim() : '';
    if (configuredSecret) {
        return configuredSecret;
    }

    return crypto.createHash('sha256').update(`${REPO_ROOT}:local-admin-session`).digest('hex');
}

function safeEqual(left, right) {
    const leftBuffer = Buffer.from(left || '', 'utf8');
    const rightBuffer = Buffer.from(right || '', 'utf8');
    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(cookieHeader) {
    if (!cookieHeader) {
        return {};
    }

    return cookieHeader.split(';').reduce((accumulator, part) => {
        const [rawName, ...rawValue] = part.trim().split('=');
        if (!rawName) {
            return accumulator;
        }

        accumulator[rawName] = decodeURIComponent(rawValue.join('='));
        return accumulator;
    }, {});
}

function createAdminSessionToken(expiresAt) {
    const payload = `admin:${expiresAt}`;
    const signature = crypto
        .createHmac('sha256', getAdminSessionSecret())
        .update(payload)
        .digest('hex');

    return Buffer.from(`${payload}:${signature}`, 'utf8').toString('base64url');
}

function verifyAdminSessionToken(token) {
    if (!token) {
        return false;
    }

    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const [scope, rawExpiry, signature] = decoded.split(':');
        if (scope !== 'admin' || !rawExpiry || !signature) {
            return false;
        }

        const expiresAt = Number.parseInt(rawExpiry, 10);
        if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', getAdminSessionSecret())
            .update(`${scope}:${rawExpiry}`)
            .digest('hex');

        return safeEqual(signature, expectedSignature);
    } catch {
        return false;
    }
}

function setAdminSessionCookie(res) {
    const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
    const token = createAdminSessionToken(expiresAt);
    const isSecure = process.env.NODE_ENV === 'production';
    const securePart = isSecure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}${securePart}`);
}

function clearAdminSessionCookie(res) {
    res.setHeader('Set-Cookie', `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function isAdminAuthenticated(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    return verifyAdminSessionToken(cookies[ADMIN_SESSION_COOKIE]);
}

function isProtectedAdminRequest(requestPath) {
    if (requestPath.startsWith('/api/') && !requestPath.startsWith('/api/admin/auth/')) {
        return true;
    }

    return ADMIN_PROTECTED_PATHS.has(requestPath);
}

function sendAdminUnauthorized(req, res) {
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }

    const nextTarget = encodeURIComponent(req.originalUrl || req.path || '/panel');
    return res.redirect(`/admin-login.html?next=${nextTarget}`);
}

app.get('/api/admin/auth/status', (req, res) => {
    res.json({
        authenticated: isAdminAuthenticated(req),
        configured: Boolean(getAdminPassword()),
        securityQuestion: getAdminSecurityQuestion() || null
    });
});

app.post('/api/admin/auth/login', (req, res) => {
    const configuredPassword = getAdminPassword();
    if (!configuredPassword) {
        return res.status(503).json({ error: 'ADMIN_PASSWORD is not configured on the server' });
    }

    const submittedPassword = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!safeEqual(submittedPassword, configuredPassword)) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    const configuredSecurityQuestion = getAdminSecurityQuestion();
    const configuredSecurityAnswer = getAdminSecurityAnswer();
    if (configuredSecurityQuestion && configuredSecurityAnswer) {
        const submittedAnswer = typeof req.body?.securityAnswer === 'string' ? req.body.securityAnswer.trim() : '';
        if (!safeEqual(submittedAnswer.toLowerCase(), configuredSecurityAnswer.toLowerCase())) {
            return res.status(401).json({ error: 'Invalid security answer' });
        }
    }

    setAdminSessionCookie(res);
    res.json({ success: true });
});

app.post('/api/admin/auth/logout', (req, res) => {
    clearAdminSessionCookie(res);
    res.json({ success: true });
});

app.use((req, res, next) => {
    if (!isProtectedAdminRequest(req.path)) {
        return next();
    }

    if (!getAdminPassword()) {
        if (req.path.startsWith('/api/')) {
            return res.status(503).json({ error: 'ADMIN_PASSWORD is not configured on the server' });
        }

        return res.status(503).send('ADMIN_PASSWORD is not configured on the server. Set it in .env before using the admin panel.');
    }

    if (isAdminAuthenticated(req)) {
        return next();
    }

    return sendAdminUnauthorized(req, res);
});

// Admin panel route - now uses panel-modern.html with merged features
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/panel-modern.html'));
});

// Legacy admin panel (old)
app.get('/admin-old', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-panel.html'));
});

// Old panel routes preserved
app.get('/old-panel', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/panel.html'));
});

app.get('/panel-modern', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/panel-modern.html'));
});

app.get('/admin-login', (req, res) => {
    res.redirect('/admin-login.html');
});

// Static files (this serves index.html at / by default - your old panel)
app.use(express.static(path.join(__dirname, '../public')));

// Store active processes
const processes = {};
let logClients = [];

// Helper to broadcast logs
function broadcastLog(message, type = 'info') {
    const log = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
    };
    const data = `data: ${JSON.stringify(log)}\n\n`;
    logClients.forEach(client => client.write(data));
}

// SSE Endpoint for logs
app.get('/api/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    logClients.push(res);

    req.on('close', () => {
        logClients = logClients.filter(c => c !== res);
    });
});

// API: Start Job Search
app.post('/api/job-search', (req, res) => {
    broadcastLog('Browser job search automation is disabled in this workspace.', 'error');
    res.status(410).json({ error: 'Browser job search automation is disabled' });
});

// API: Start Session Setup
app.post('/api/session-setup', (req, res) => {
    broadcastLog('Session setup automation is disabled in this workspace.', 'error');
    res.status(410).json({ error: 'Session setup automation is disabled' });
});

// API: Start Bulk Follow-up Tool
app.post('/api/followup-tool', (req, res) => {
    if (processes['followup']) {
        return res.json({ success: true, message: 'Tool already running', port: 3456 });
    }

    broadcastLog('🤖 Launching Follow-up Tool...', 'system');

    const child = spawn('node', ['scripts/bulk-followup.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });

    processes['followup'] = child;

    child.stdout.on('data', (data) => {
        const msg = data.toString().trim();
        broadcastLog(msg);
        // Detect when server is ready
        if (msg.includes('http://localhost:3456')) {
            broadcastLog('✅ Follow-up Tool Ready at http://localhost:3456', 'success');
        }
    });

    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));

    res.json({ success: true, port: 3456 });
});

// API: Open Gmail Drafts
app.post('/api/open-emails', (req, res) => {
    broadcastLog('📧 Opening Gmail drafts...', 'system');

    const child = spawn('node', ['scripts/open-compose-emails.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });

    child.stdout.on('data', (data) => broadcastLog(data.toString().trim()));
    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));

    res.json({ success: true });
});

// API: Smart Email Generator
app.post('/api/smart-email', (req, res) => {
    broadcastLog('📧 Generating Smart Emails...', 'system');
    const child = spawn('node', ['scripts/smart-email-generator.js', 'generate'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });
    child.stdout.on('data', (data) => broadcastLog(data.toString().trim()));
    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));
    res.json({ success: true });
});

// API: CV Parser
app.post('/api/cv-parser', (req, res) => {
    broadcastLog('📄 Parsing CV...', 'system');
    const child = spawn('node', ['scripts/cv-parser.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });
    child.stdout.on('data', (data) => broadcastLog(data.toString().trim()));
    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));
    res.json({ success: true });
});

// API: Outreach Manager
app.post('/api/outreach', (req, res) => {
    broadcastLog('📢 Starting Outreach Manager...', 'system');
    const child = spawn('node', ['scripts/outreach-manager.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });
    child.stdout.on('data', (data) => broadcastLog(data.toString().trim()));
    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));
    res.json({ success: true });
});

// API: Universal Auto-Fill
app.post('/api/auto-fill', (req, res) => {
    broadcastLog('✍️ Starting Universal Auto-Fill...', 'system');
    const child = spawn('node', ['scripts/universal-auto-fill.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });
    child.stdout.on('data', (data) => broadcastLog(data.toString().trim()));
    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));
    res.json({ success: true });
});

// API: Clean Cache
app.post('/api/clean-cache', (req, res) => {
    broadcastLog('🧹 Cleaning Puppeteer Cache...', 'system');
    const child = spawn('node', ['scripts/delete-puppeteer-cache.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });
    child.stdout.on('data', (data) => broadcastLog(data.toString().trim()));
    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));
    res.json({ success: true });
});

// API: Clear Locks
app.post('/api/clear-locks', (req, res) => {
    const lockPath = path.join(__dirname, '../user_data/playwright');
    const locks = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];

    let cleared = 0;
    locks.forEach(file => {
        const p = path.join(lockPath, file);
        if (fs.existsSync(p)) {
            try {
                fs.unlinkSync(p);
                cleared++;
            } catch (e) {
                broadcastLog(`Failed to delete ${file}: ${e.message}`, 'error');
            }
        }
    });

    broadcastLog(`🧹 Cleared ${cleared} lock files`, 'success');

    // Also kill chrome processes
    exec('taskkill /F /IM chrome.exe /T', (err) => {
        if (!err) broadcastLog('💀 Killed Chrome processes', 'success');
    });

    res.json({ success: true, cleared });
});

// API: Stop Process
app.post('/api/stop/:id', (req, res) => {
    const { id } = req.params;
    const child = processes[id];

    if (child) {
        child.kill();
        delete processes[id];
        broadcastLog(`🛑 Stopped process: ${id}`, 'error');
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Process not found' });
    }
});

// API: Get Status
app.get('/api/status', (req, res) => {
    res.json({
        processes: Object.keys(processes),
        env: {
            openai: !!process.env.OPENAI_API_KEY
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Admin Panel running at http://localhost:${PORT}`);
    console.log(`   Open your browser to control all tools`);
});
