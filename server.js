const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const COMPANIES_FILE = path.join(DATA_DIR, 'target-companies.json');
const EMAILS_DIR = path.join(__dirname, 'emails', 'outreach');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// --- API ENDPOINTS ---

// Get Companies
app.get('/api/companies', (req, res) => {
    if (!fs.existsSync(COMPANIES_FILE)) return res.json([]);
    const data = fs.readFileSync(COMPANIES_FILE, 'utf8');
    res.json(JSON.parse(data));
});

// Add Company
app.post('/api/companies', (req, res) => {
    const newCompany = req.body;
    let companies = [];
    if (fs.existsSync(COMPANIES_FILE)) {
        companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    }

    // Generate ID
    const newId = companies.length > 0 ? Math.max(...companies.map(c => parseInt(c.id))) + 1 : 1;
    newCompany.id = String(newId);
    newCompany.status = 'Pending';

    companies.push(newCompany);
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
    res.json(newCompany);
});

// Run Command
app.post('/api/run', (req, res) => {
    const { command } = req.body;
    console.log(`Executing: ${command}`);

    // Security check: only allow specific npm commands
    const allowedCommands = [
        'npm run outreach generate',
        'npm run outreach send', // Dry run
        'npm run outreach send -- --real',
        'npm run playwright-indeed',
        'npm run playwright-linkedin',
        'npm run playwright-dubizzle',
        'npm run playwright-bayt',
        'npm run playwright-gulftalent',
        'npm run playwright-naukrigulf',
        'npm run parse-cv',
        'python scripts/render_pdf.py',
        'npm run clean-cache'
    ];

    // Basic validation to allow arguments for playwright
    const isAllowed = allowedCommands.some(cmd => command.startsWith(cmd.split(' --')[0]));

    if (!isAllowed && !command.startsWith('npm run playwright')) {
        return res.status(403).json({ error: 'Command not allowed' });
    }

    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.json({ success: false, output: stderr || error.message });
        }
        res.json({ success: true, output: stdout });
    });
});

// Get Generated Emails
app.get('/api/emails', (req, res) => {
    if (!fs.existsSync(EMAILS_DIR)) return res.json([]);
    const files = fs.readdirSync(EMAILS_DIR).filter(f => f.endsWith('.txt'));
    const emails = files.map(file => {
        const content = fs.readFileSync(path.join(EMAILS_DIR, file), 'utf8');
        return { filename: file, content };
    });
    res.json(emails);
});

// Serve Dashboard
app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel-modern.html'));
});

app.get('/panel-classic', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

// --- WHATSAPP INTEGRATION ---
const WA_CONFIG_FILE = path.join(DATA_DIR, 'whatsapp-config.json');
let waClient;
let waStatus = 'DISCONNECTED';
let waQRCode = null;

// Get WhatsApp Config
app.get('/api/whatsapp/config', (req, res) => {
    if (!fs.existsSync(WA_CONFIG_FILE)) {
        return res.json({
            autoReply: false,
            notifyDisconnect: true,
            autoReplyMessage: "I'm currently unavailable, I will get back to you soon."
        });
    }
    res.json(JSON.parse(fs.readFileSync(WA_CONFIG_FILE, 'utf8')));
});

// Save WhatsApp Config
app.post('/api/whatsapp/config', (req, res) => {
    const config = req.body;
    fs.writeFileSync(WA_CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'WhatsApp configuration saved' });
});

function initWhatsApp() {
    try {
        console.log('Initializing WhatsApp Client...');
        waClient = new Client({
            authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        waClient.on('qr', (qr) => {
            console.log('WhatsApp QR Received');
            QRCode.toDataURL(qr, (err, url) => {
                if (err) console.error('QR Gen Error', err);
                waQRCode = url;
                waStatus = 'QR_READY';
            });
        });

        waClient.on('ready', () => {
            console.log('WhatsApp Client is ready!');
            waStatus = 'CONNECTED';
            waQRCode = null;
        });

        waClient.on('authenticated', () => {
            console.log('WhatsApp Authenticated');
            waStatus = 'AUTHENTICATED';
        });

        waClient.on('auth_failure', msg => {
            console.error('WhatsApp Auth Failure', msg);
            waStatus = 'AUTH_FAILURE';
        });

        waClient.on('disconnected', (reason) => {
            console.log('WhatsApp Disconnected:', reason);
            waStatus = 'DISCONNECTED';
            waQRCode = null;
            // Optional: Auto-reconnect logic could go here
        });

        waClient.initialize();
    } catch (error) {
        console.error('Failed to init WhatsApp:', error);
        waStatus = 'ERROR';
    }
}

// Start WhatsApp
initWhatsApp();

app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: waStatus, qr: waQRCode });
});

app.post('/api/whatsapp/logout', async (req, res) => {
    try {
        if (waClient) {
            await waClient.logout();
            waStatus = 'DISCONNECTED';
            waQRCode = null;
            // Re-init to allow new login
            setTimeout(initWhatsApp, 1000);
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'No client' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Send Message
app.post('/api/whatsapp/send', async (req, res) => {
    const { number, message } = req.body;

    if (waStatus !== 'CONNECTED' && waStatus !== 'AUTHENTICATED') {
        return res.status(400).json({ success: false, error: 'WhatsApp client not connected' });
    }

    if (!number || !message) {
        return res.status(400).json({ success: false, error: 'Missing number or message' });
    }

    try {
        // Format number: remove non-digits, append @c.us if not present
        let formattedNumber = number.replace(/\D/g, '');
        if (!formattedNumber.endsWith('@c.us')) {
            formattedNumber += '@c.us';
        }

        const response = await waClient.sendMessage(formattedNumber, message);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- CV DATA MANAGEMENT ---
const CV_DATA_FILE = path.join(DATA_DIR, 'cv-data.json');

// Get CV Data
app.get('/api/cv', (req, res) => {
    if (!fs.existsSync(CV_DATA_FILE)) return res.json({});
    const data = fs.readFileSync(CV_DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
});

// Save CV Data
app.post('/api/cv', (req, res) => {
    const data = req.body;
    fs.writeFileSync(CV_DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'CV data saved' });
});

// --- AI AGENT INTEGRATION ---
const AI_CONFIG_FILE = path.join(DATA_DIR, 'ai-config.json');
const { spawn } = require('child_process');

let agentProcess = null;
let agentLogs = [];

// Get AI Config
app.get('/api/ai/config', (req, res) => {
    if (!fs.existsSync(AI_CONFIG_FILE)) {
        return res.json({
            provider: 'openai',
            apiKey: '',
            baseUrl: 'http://localhost:11434/v1',
            model: 'gpt-4o',
            temperature: 0.7,
            maxTokens: 2000,
            autoApply: false
        });
    }
    res.json(JSON.parse(fs.readFileSync(AI_CONFIG_FILE, 'utf8')));
});

// Save AI Config
app.post('/api/ai/config', (req, res) => {
    const config = req.body;
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'Configuration saved' });
});

// Start AI Agent
app.post('/api/ai/agent/start', (req, res) => {
    if (agentProcess) {
        return res.json({ success: false, message: 'Agent is already running' });
    }

    agentLogs = []; // Clear logs
    agentLogs.push(`[${new Date().toLocaleTimeString()}] Starting AI Agent...`);

    // Spawn the job search agent
    // Using 'node scripts/job-search-agent.js --search "Software Engineer Dubai"'
    // We could also pass arguments from the request if needed
    const args = ['scripts/job-search-agent.js', '--search', 'Software Engineer Dubai'];

    agentProcess = spawn('node', args, { cwd: __dirname });

    agentProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                agentLogs.push(`[${new Date().toLocaleTimeString()}] ${line.trim()}`);
            }
        });
    });

    agentProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                agentLogs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${line.trim()}`);
            }
        });
    });

    agentProcess.on('close', (code) => {
        agentLogs.push(`[${new Date().toLocaleTimeString()}] Agent stopped with code ${code}`);
        agentProcess = null;
    });

    res.json({ success: true, message: 'AI Agent started' });
});

// Stop AI Agent
app.post('/api/ai/agent/stop', (req, res) => {
    if (agentProcess) {
        agentProcess.kill();
        agentProcess = null;
        agentLogs.push(`[${new Date().toLocaleTimeString()}] Agent stopped by user`);
        res.json({ success: true, message: 'AI Agent stopped' });
    } else {
        res.json({ success: false, message: 'Agent is not running' });
    }
});

// Get Agent Logs
app.get('/api/ai/agent/logs', (req, res) => {
    res.json({
        running: !!agentProcess,
        logs: agentLogs
    });
});

app.listen(PORT, () => {
    console.log(`🚀 CV Panel Server running at http://localhost:${PORT}/panel`);
});
