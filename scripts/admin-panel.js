const express = require('express');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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
    const { platform, keyword, location } = req.body;

    if (processes['job-search']) {
        return res.status(400).json({ error: 'Job search already running' });
    }

    broadcastLog(`🚀 Starting ${platform} search for "${keyword}" in "${location}"...`, 'system');

    const child = spawn('node', ['scripts/job-search-playwright.js', platform, keyword, location], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });

    processes['job-search'] = child;

    child.stdout.on('data', (data) => {
        broadcastLog(data.toString().trim());
    });

    child.stderr.on('data', (data) => {
        broadcastLog(data.toString().trim(), 'error');
    });

    child.on('close', (code) => {
        delete processes['job-search'];
        broadcastLog(`🏁 Job search finished with code ${code}`, code === 0 ? 'success' : 'error');
    });

    res.json({ success: true, pid: child.pid });
});

// API: Start Session Setup
app.post('/api/session-setup', (req, res) => {
    if (processes['session']) {
        return res.status(400).json({ error: 'Session setup already running' });
    }

    broadcastLog('🔐 Starting session setup...', 'system');

    const child = spawn('node', ['scripts/setup-session.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });

    processes['session'] = child;

    child.stdout.on('data', (data) => broadcastLog(data.toString().trim()));
    child.stderr.on('data', (data) => broadcastLog(data.toString().trim(), 'error'));

    child.on('close', (code) => {
        delete processes['session'];
        broadcastLog(`🏁 Session setup closed (Code: ${code})`, 'success');
    });

    res.json({ success: true });
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
