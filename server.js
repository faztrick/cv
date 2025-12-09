const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { SkillsJobMatcher } = require('./scripts/skills-job-matcher');

const app = express();
const PORT = 3000;

// Initialize skills matcher
const skillsMatcher = new SkillsJobMatcher();

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

app.get('/panel-skills', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel-skills.html'));
});

app.get('/panel-modern', (req, res) => {
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

        waClient.initialize().catch(err => {
            console.error('WhatsApp initialization failed:', err.message);
            waStatus = 'CHROMIUM_MISSING';
            console.log('⚠️  WhatsApp features disabled - Chromium not found');
            console.log('   To enable WhatsApp integration, run: npx puppeteer browsers install chrome');
        });
    } catch (error) {
        console.error('Failed to init WhatsApp:', error.message);
        waStatus = 'ERROR';
        console.log('⚠️  WhatsApp features disabled');
    }
}

// Start WhatsApp (non-blocking)
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

    console.log('WhatsApp Send Request:', { number, waStatus });

    if (!waClient || waStatus === 'CHROMIUM_MISSING' || waStatus === 'ERROR') {
        return res.status(503).json({ 
            success: false, 
            error: 'WhatsApp client unavailable. Please install Chromium: npx puppeteer browsers install chrome' 
        });
    }

    if (waStatus !== 'CONNECTED' && waStatus !== 'AUTHENTICATED') {
        return res.status(400).json({ success: false, error: `WhatsApp client not connected. Status: ${waStatus}` });
    }

    if (!number || !message) {
        return res.status(400).json({ success: false, error: 'Missing number or message' });
    }

    try {
        // Format number: remove non-digits and any leading zeros after country code
        let formattedNumber = number.replace(/\D/g, '');

        // Ensure proper format for whatsapp-web.js
        // Remove leading + if present in original (already handled by replace)
        // Add @c.us suffix for individual chats
        if (!formattedNumber.endsWith('@c.us')) {
            formattedNumber = formattedNumber + '@c.us';
        }

        console.log('Sending to:', formattedNumber);

        // Check if the number is registered on WhatsApp
        const isRegistered = await waClient.isRegisteredUser(formattedNumber);
        if (!isRegistered) {
            return res.status(400).json({ success: false, error: `Number ${number} is not registered on WhatsApp` });
        }

        const response = await waClient.sendMessage(formattedNumber, message);
        console.log('Message sent successfully:', response.id);
        res.json({ success: true, messageId: response.id._serialized });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send PDF Message
app.post('/api/whatsapp/send-pdf', async (req, res) => {
    const { number, message, pdfPath } = req.body;

    console.log('WhatsApp Send PDF Request:', { number, pdfPath, waStatus });

    if (!waClient || waStatus === 'CHROMIUM_MISSING' || waStatus === 'ERROR') {
        return res.status(503).json({ 
            success: false, 
            error: 'WhatsApp client unavailable. Please install Chromium: npx puppeteer browsers install chrome' 
        });
    }

    if (waStatus !== 'CONNECTED' && waStatus !== 'AUTHENTICATED') {
        return res.status(400).json({ success: false, error: `WhatsApp client not connected. Status: ${waStatus}` });
    }

    if (!number || !pdfPath) {
        return res.status(400).json({ success: false, error: 'Missing number or pdfPath' });
    }

    try {
        // Format number
        let formattedNumber = number.replace(/\D/g, '');
        if (!formattedNumber.endsWith('@c.us')) {
            formattedNumber = formattedNumber + '@c.us';
        }

        console.log('Sending PDF to:', formattedNumber);

        if (!fs.existsSync(pdfPath)) {
             return res.status(400).json({ success: false, error: `PDF file not found at ${pdfPath}` });
        }

        const media = MessageMedia.fromFilePath(pdfPath);

        const response = await waClient.sendMessage(formattedNumber, media, { caption: message });
        console.log('PDF sent successfully:', response.id);
        res.json({ success: true, messageId: response.id._serialized });
    } catch (error) {
        console.error('Error sending PDF:', error);
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

// --- APPLICATION TRACKING & FOLLOW-UP ---

// Update company status
app.put('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (!fs.existsSync(COMPANIES_FILE)) {
        return res.status(404).json({ error: 'Companies file not found' });
    }

    let companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    const index = companies.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }

    companies[index] = { ...companies[index], ...updates };
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
    res.json(companies[index]);
});

// Mark as applied
app.post('/api/companies/:id/apply', (req, res) => {
    const { id } = req.params;

    let companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    const index = companies.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7); // Follow up in 7 days

    companies[index].status = 'Applied';
    companies[index].appliedDate = today;
    companies[index].followUpDate = followUpDate.toISOString().split('T')[0];

    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
    res.json(companies[index]);
});

// Mark follow-up sent
app.post('/api/companies/:id/followup', (req, res) => {
    const { id } = req.params;

    let companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    const index = companies.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 7);

    companies[index].status = 'Followed Up';
    companies[index].followUpCount = (companies[index].followUpCount || 0) + 1;
    companies[index].lastFollowUp = today;
    companies[index].followUpDate = nextFollowUp.toISOString().split('T')[0];

    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
    res.json(companies[index]);
});

// Update response status
app.post('/api/companies/:id/response', (req, res) => {
    const { id } = req.params;
    const { response, notes } = req.body;

    let companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    const index = companies.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }

    companies[index].status = response; // 'Interview', 'Rejected', 'Offer', etc.
    companies[index].response = response;
    if (notes) companies[index].notes = notes;

    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
    res.json(companies[index]);
});

// Get follow-up reminders (companies needing follow-up)
app.get('/api/companies/followups', (req, res) => {
    if (!fs.existsSync(COMPANIES_FILE)) return res.json([]);

    const companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    const today = new Date().toISOString().split('T')[0];

    const needsFollowUp = companies.filter(c => {
        if (!c.followUpDate) return false;
        if (c.status === 'Rejected' || c.status === 'Offer' || c.status === 'Interview') return false;
        return c.followUpDate <= today;
    });

    res.json(needsFollowUp);
});

// --- OUTLOOK EMAIL INTEGRATION ---

// Generate Outlook Web compose URL
app.get('/api/outlook/compose/:id', (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // 'apply' or 'followup'

    if (!fs.existsSync(COMPANIES_FILE)) {
        return res.status(404).json({ error: 'Companies file not found' });
    }

    const companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    const company = companies.find(c => c.id === id);

    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }

    let subject, body;

    if (type === 'followup') {
        subject = `Following Up - ${company.jobTitle} Application - Muhammed Fasil PV`;
        body = `Dear ${company.contactPerson || 'Hiring Manager'},

I hope this message finds you well. I wanted to follow up on my application for the ${company.jobTitle} position at ${company.name} that I submitted ${company.appliedDate ? 'on ' + company.appliedDate : 'recently'}.

I remain very interested in this opportunity and would welcome the chance to discuss how my 10+ years of experience in Flutter, React, Node.js, and AI/IoT systems could benefit your team.

Key highlights from my background:
• Architected IdolMEA ERP serving 50+ retail branches across GCC
• Developed AI Self-Checkout Kiosk (showcased at Gitex Dubai 2024)
• Expert in offline-first architectures, MQTT, and enterprise integrations

I'm currently based in Dubai with a valid work visa and available to start immediately.

Please let me know if you need any additional information or would like to schedule a call.

Best regards,
Muhammed Fasil PV
📞 +971 555923545
📧 faztrick@gmail.com
🌐 https://uaecodes.com`;
    } else {
        // Application email
        if (company.generatedEmailPath && fs.existsSync(company.generatedEmailPath)) {
            body = fs.readFileSync(company.generatedEmailPath, 'utf8');
            body = body.replace(/^Subject:.*\r?\n/m, '').trim();
        } else {
            body = `Dear ${company.contactPerson || 'Hiring Manager'},

I am writing to express my interest in the ${company.jobTitle} position at ${company.name}.

With 10+ years of experience as a Full Stack Developer specializing in Flutter, React, Node.js, and AI/IoT systems, I have successfully delivered enterprise solutions including:

• IdolMEA ERP - Retail platform serving 50+ branches across GCC
• AI Self-Checkout Kiosk - YOLO-based detection (Gitex Dubai 2024)
• IdolQueue (i-QMS) - Offline-first queue management system

I am based in Dubai, UAE with a valid work visa and available immediately.

Please find my CV attached. I would welcome the opportunity to discuss how I can contribute to ${company.name}.

Best regards,
Muhammed Fasil PV
📞 +971 555923545
📧 faztrick@gmail.com
🌐 https://uaecodes.com`;
        }
        subject = `Application - ${company.jobTitle} - ${company.name} - Muhammed Fasil PV`;
    }

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${company.email}&subject=${encodedSubject}&body=${encodedBody}`;

    res.json({
        url: outlookUrl,
        to: company.email,
        subject: subject,
        body: body,
        company: company.name
    });
});

// Bulk send via Outlook Web (returns all URLs)
app.get('/api/outlook/bulk', (req, res) => {
    const { status, type } = req.query;

    if (!fs.existsSync(COMPANIES_FILE)) return res.json([]);

    const companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    let filtered = companies;

    if (status) {
        filtered = companies.filter(c => c.status === status);
    }

    const results = filtered.map(company => {
        let subject, body;

        if (type === 'followup') {
            subject = `Following Up - ${company.jobTitle} Application - Muhammed Fasil PV`;
            body = `Dear ${company.contactPerson || 'Hiring Manager'},\n\nFollowing up on my ${company.jobTitle} application...`;
        } else {
            subject = `Application - ${company.jobTitle} - ${company.name} - Muhammed Fasil PV`;
            if (company.generatedEmailPath && fs.existsSync(company.generatedEmailPath)) {
                body = fs.readFileSync(company.generatedEmailPath, 'utf8');
            } else {
                body = 'Application email content...';
            }
        }

        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);

        return {
            id: company.id,
            name: company.name,
            email: company.email,
            status: company.status,
            url: `https://outlook.live.com/mail/0/deeplink/compose?to=${company.email}&subject=${encodedSubject}&body=${encodedBody}`
        };
    });

    res.json(results);
});

// --- CONTACT SCRAPER ---

// Scrape URL for emails and phone numbers
app.post('/api/scrape/url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    try {
        // Use fetch to get the page content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Extract text content (simple HTML stripping)
        const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        res.json({
            success: true,
            url: url,
            content: textContent,
            rawLength: html.length,
            textLength: textContent.length
        });

    } catch (error) {
        console.error('Scrape error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Scraped contacts storage
const SCRAPED_CONTACTS_FILE = path.join(DATA_DIR, 'scraped-contacts.json');

// Get scraped contacts
app.get('/api/scrape/contacts', (req, res) => {
    if (!fs.existsSync(SCRAPED_CONTACTS_FILE)) return res.json([]);
    const data = fs.readFileSync(SCRAPED_CONTACTS_FILE, 'utf8');
    res.json(JSON.parse(data));
});

// Save scraped contacts
app.post('/api/scrape/contacts', (req, res) => {
    const contacts = req.body;
    fs.writeFileSync(SCRAPED_CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    res.json({ success: true, count: contacts.length });
});

// --- INDEED AUTO-APPLY INTEGRATION ---

const INDEED_CONFIG_FILE = path.join(DATA_DIR, 'indeed-config.json');
const INDEED_JOBS_FILE = path.join(DATA_DIR, 'indeed-jobs.json');
const INDEED_APPLICATIONS_FILE = path.join(__dirname, 'indeed-applications.json');

let indeedProcess = null;
let indeedLogs = [];

// Get Indeed Config
app.get('/api/indeed/config', (req, res) => {
    if (!fs.existsSync(INDEED_CONFIG_FILE)) {
        return res.json({
            email: '',
            password: '',
            autoResume: true,
            skipApplied: true,
            headless: false
        });
    }
    res.json(JSON.parse(fs.readFileSync(INDEED_CONFIG_FILE, 'utf8')));
});

// Save Indeed Config
app.post('/api/indeed/config', (req, res) => {
    const config = req.body;
    fs.writeFileSync(INDEED_CONFIG_FILE, JSON.stringify(config, null, 2));

    // Also update .env file for the script
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add Indeed credentials
    if (config.email) {
        if (envContent.includes('INDEED_EMAIL=')) {
            envContent = envContent.replace(/INDEED_EMAIL=.*/g, `INDEED_EMAIL=${config.email}`);
        } else {
            envContent += `\nINDEED_EMAIL=${config.email}`;
        }
    }
    if (config.password) {
        if (envContent.includes('INDEED_PASSWORD=')) {
            envContent = envContent.replace(/INDEED_PASSWORD=.*/g, `INDEED_PASSWORD=${config.password}`);
        } else {
            envContent += `\nINDEED_PASSWORD=${config.password}`;
        }
    }
    fs.writeFileSync(envPath, envContent.trim());

    res.json({ success: true, message: 'Indeed configuration saved' });
});

// Search Indeed Jobs
app.post('/api/indeed/search', (req, res) => {
    const { query, location, minMatch } = req.body;

    indeedLogs = [];
    indeedLogs.push(`[${new Date().toLocaleTimeString()}] Starting Indeed search: "${query}" in ${location}`);

    const args = ['scripts/indeed-auto-apply.js', 'search', query || 'Software Engineer'];

    const searchProcess = spawn('node', args, { cwd: __dirname });
    let output = '';

    searchProcess.stdout.on('data', (data) => {
        output += data.toString();
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                indeedLogs.push(`[${new Date().toLocaleTimeString()}] ${line.trim()}`);
            }
        });
    });

    searchProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                indeedLogs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${line.trim()}`);
            }
        });
    });

    searchProcess.on('close', (code) => {
        indeedLogs.push(`[${new Date().toLocaleTimeString()}] Search completed with code ${code}`);

        // Try to load results
        const resultsFile = path.join(__dirname, 'indeed-matches.json');
        if (fs.existsSync(resultsFile)) {
            const jobs = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
            fs.writeFileSync(INDEED_JOBS_FILE, JSON.stringify(jobs, null, 2));
        }
    });

    res.json({ success: true, message: 'Search started' });
});

// Get Indeed Jobs
app.get('/api/indeed/jobs', (req, res) => {
    // Try multiple possible result files
    const files = [
        INDEED_JOBS_FILE,
        path.join(__dirname, 'indeed-matches.json')
    ];

    for (const file of files) {
        if (fs.existsSync(file)) {
            const jobs = JSON.parse(fs.readFileSync(file, 'utf8'));
            return res.json(jobs);
        }
    }

    res.json([]);
});

// Start Auto-Apply
app.post('/api/indeed/apply', (req, res) => {
    const { realMode, maxApps } = req.body;

    if (indeedProcess) {
        return res.json({ success: false, message: 'Auto-apply already running' });
    }

    indeedLogs = [];
    indeedLogs.push(`[${new Date().toLocaleTimeString()}] Starting auto-apply (${realMode ? 'REAL' : 'DRY RUN'} mode)...`);

    const args = ['scripts/indeed-auto-apply.js', 'apply'];
    if (realMode) {
        args.push('--real');
    }
    if (maxApps) {
        args.push('--max', String(maxApps));
    }

    indeedProcess = spawn('node', args, { cwd: __dirname });

    indeedProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                indeedLogs.push(`[${new Date().toLocaleTimeString()}] ${line.trim()}`);
            }
        });
    });

    indeedProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                indeedLogs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${line.trim()}`);
            }
        });
    });

    indeedProcess.on('close', (code) => {
        indeedLogs.push(`[${new Date().toLocaleTimeString()}] Auto-apply finished with code ${code}`);
        indeedProcess = null;
    });

    res.json({ success: true, message: 'Auto-apply started' });
});

// Stop Auto-Apply
app.post('/api/indeed/stop', (req, res) => {
    if (indeedProcess) {
        indeedProcess.kill();
        indeedProcess = null;
        indeedLogs.push(`[${new Date().toLocaleTimeString()}] Auto-apply stopped by user`);
        res.json({ success: true, message: 'Stopped' });
    } else {
        res.json({ success: false, message: 'Not running' });
    }
});

// Get Indeed Logs
app.get('/api/indeed/logs', (req, res) => {
    res.json({
        running: !!indeedProcess,
        logs: indeedLogs
    });
});

// Get Indeed Stats
app.get('/api/indeed/stats', (req, res) => {
    if (!fs.existsSync(INDEED_APPLICATIONS_FILE)) {
        return res.json({ total: 0, byStatus: {}, byCompany: {}, recent: [] });
    }

    const applications = JSON.parse(fs.readFileSync(INDEED_APPLICATIONS_FILE, 'utf8'));

    const stats = {
        total: applications.length,
        byStatus: {},
        byCompany: {},
        recent: applications.slice(-10).reverse()
    };

    applications.forEach(app => {
        stats.byStatus[app.status || 'applied'] = (stats.byStatus[app.status || 'applied'] || 0) + 1;
        stats.byCompany[app.company] = (stats.byCompany[app.company] || 0) + 1;
    });

    res.json(stats);
});

// Update Indeed Profile Resume
app.post('/api/indeed/update-profile', (req, res) => {
    indeedLogs = [];
    indeedLogs.push(`[${new Date().toLocaleTimeString()}] Updating Indeed profile resume...`);

    const updateProcess = spawn('node', ['scripts/indeed-auto-apply.js', 'update-profile'], { cwd: __dirname });

    updateProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                indeedLogs.push(`[${new Date().toLocaleTimeString()}] ${line.trim()}`);
            }
        });
    });

    updateProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                indeedLogs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${line.trim()}`);
            }
        });
    });

    updateProcess.on('close', (code) => {
        indeedLogs.push(`[${new Date().toLocaleTimeString()}] Profile update completed with code ${code}`);
    });

    res.json({ success: true, message: 'Profile update started' });
});

// Apply to specific job
app.post('/api/indeed/apply-job', (req, res) => {
    const { job, dryRun } = req.body;

    indeedLogs.push(`[${new Date().toLocaleTimeString()}] Applying to: ${job.title} at ${job.company}`);

    // Save job to temp file for the script to pick up
    const tempJobFile = path.join(DATA_DIR, 'temp-apply-job.json');
    fs.writeFileSync(tempJobFile, JSON.stringify(job, null, 2));

    res.json({ success: true, message: 'Application initiated' });
});

// --- SKILLS & JOB MATCHING API ---

// Get skills summary
app.get('/api/skills/summary', (req, res) => {
    try {
        const summary = skillsMatcher.getSummary();
        res.json(summary);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get skills by category
app.get('/api/skills/categories', (req, res) => {
    try {
        const categories = skillsMatcher.getSkillsByCategory();
        res.json(categories);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get recommended job searches
app.get('/api/skills/recommended-searches', (req, res) => {
    try {
        const location = req.query.location || 'Dubai';
        const recommendations = skillsMatcher.getRecommendedSearches(location);
        res.json(recommendations);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Match job description against skills
app.post('/api/skills/match-job', (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Job description is required' });
        }
        const match = skillsMatcher.matchJobDescription(description);
        res.json(match);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Reload skills matcher (after CV update)
app.post('/api/skills/reload', (req, res) => {
    try {
        const newMatcher = new SkillsJobMatcher();
        Object.assign(skillsMatcher, newMatcher);
        res.json({ success: true, message: 'Skills reloaded', summary: skillsMatcher.getSummary() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- PLAYWRIGHT JOB AUTOMATION API ---

let playwrightProcess = null;
let playwrightLogs = [];

// Run job search automation
app.post('/api/automation/search', (req, res) => {
    const { platform, keyword, location } = req.body;

    if (playwrightProcess) {
        return res.status(400).json({ success: false, message: 'Automation already running' });
    }

    playwrightLogs = [];
    playwrightLogs.push(`[${new Date().toLocaleTimeString()}] Starting ${platform} search: "${keyword}" in ${location}`);

    const args = ['scripts/job-search-playwright.js', platform || 'indeed', keyword || 'Software Engineer', location || 'Dubai'];

    playwrightProcess = spawn('node', args, { cwd: __dirname });

    playwrightProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                playwrightLogs.push(`[${new Date().toLocaleTimeString()}] ${line.trim()}`);
            }
        });
    });

    playwrightProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                playwrightLogs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${line.trim()}`);
            }
        });
    });

    playwrightProcess.on('close', (code) => {
        playwrightLogs.push(`[${new Date().toLocaleTimeString()}] Automation finished with code ${code}`);
        playwrightProcess = null;
    });

    res.json({ success: true, message: `${platform} search started` });
});

// Stop automation
app.post('/api/automation/stop', (req, res) => {
    if (playwrightProcess) {
        playwrightProcess.kill();
        playwrightProcess = null;
        playwrightLogs.push(`[${new Date().toLocaleTimeString()}] Automation stopped by user`);
        res.json({ success: true, message: 'Stopped' });
    } else {
        res.json({ success: false, message: 'Not running' });
    }
});

// Get automation logs
app.get('/api/automation/logs', (req, res) => {
    res.json({
        running: !!playwrightProcess,
        logs: playwrightLogs
    });
});

// Batch run multiple searches
app.post('/api/automation/batch', async (req, res) => {
    const { searches } = req.body; // Array of { platform, keyword, location }

    if (!searches || !Array.isArray(searches)) {
        return res.status(400).json({ error: 'searches array is required' });
    }

    // Queue up searches (they'll run one at a time)
    const BATCH_FILE = path.join(DATA_DIR, 'batch-searches.json');
    fs.writeFileSync(BATCH_FILE, JSON.stringify(searches, null, 2));

    res.json({
        success: true,
        message: `Queued ${searches.length} searches`,
        searches
    });
});

// --- ADMIN TOOLS API ---

// Running processes tracker
let runningProcesses = {};

// Session setup
app.post('/api/session-setup', (req, res) => {
    console.log('Starting session setup...');
    res.json({ success: true, message: 'Session setup started' });
});

// Follow-up tool
app.post('/api/followup-tool', (req, res) => {
    const port = 3001;
    res.json({ success: true, port, message: 'Follow-up tool ready' });
});

// Open emails
app.post('/api/open-emails', (req, res) => {
    exec('start https://outlook.live.com/mail/0/inbox', (error) => {
        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, message: 'Gmail/Outlook opened' });
    });
});

// Clear browser locks
app.post('/api/clear-locks', (req, res) => {
    const lockPaths = [
        path.join(__dirname, '.wwebjs_auth', 'session', 'SingletonLock'),
        path.join(__dirname, 'user_data', 'SingletonLock'),
        path.join(__dirname, '.puppeteer_cache', 'SingletonLock')
    ];

    let cleared = 0;
    lockPaths.forEach(lockPath => {
        try {
            if (fs.existsSync(lockPath)) {
                fs.unlinkSync(lockPath);
                cleared++;
            }
        } catch (e) {
            console.log('Could not remove lock:', lockPath);
        }
    });

    res.json({ success: true, cleared, message: `Cleared ${cleared} lock files` });
});

// CV Parser
app.post('/api/cv-parser', (req, res) => {
    exec('npm run parse-cv', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, output: stderr || error.message });
        }
        res.json({ success: true, output: stdout });
    });
});

// Smart email generator
app.post('/api/smart-email', (req, res) => {
    exec('npm run outreach generate', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, output: stderr || error.message });
        }
        res.json({ success: true, output: stdout });
    });
});

// Outreach manager
app.post('/api/outreach', (req, res) => {
    exec('npm run outreach', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, output: stderr || error.message });
        }
        res.json({ success: true, output: stdout });
    });
});

// Auto-fill
app.post('/api/auto-fill', (req, res) => {
    res.json({ success: true, message: 'Auto-fill initiated. Use the browser automation tab.' });
});

// Clean cache
app.post('/api/clean-cache', (req, res) => {
    const cachePaths = [
        path.join(__dirname, '.puppeteer_cache'),
        path.join(__dirname, 'node_modules', '.cache')
    ];

    let cleaned = 0;
    cachePaths.forEach(cachePath => {
        try {
            if (fs.existsSync(cachePath)) {
                fs.rmSync(cachePath, { recursive: true, force: true });
                cleaned++;
            }
        } catch (e) {
            console.log('Could not clean cache:', cachePath);
        }
    });

    res.json({ success: true, cleaned, message: `Cleaned ${cleaned} cache directories` });
});

// Stop specific process
app.post('/api/stop/:id', (req, res) => {
    const { id } = req.params;

    // Kill specific process types
    if (id === 'job-search' && playwrightProcess) {
        playwrightProcess.kill();
        playwrightProcess = null;
        delete runningProcesses['job-search'];
        return res.json({ success: true, message: 'Job search stopped' });
    }

    if (id === 'indeed' && indeedProcess) {
        indeedProcess.kill();
        indeedProcess = null;
        delete runningProcesses['indeed'];
        return res.json({ success: true, message: 'Indeed process stopped' });
    }

    if (id === 'agent' && agentProcess) {
        agentProcess.kill();
        agentProcess = null;
        delete runningProcesses['agent'];
        return res.json({ success: true, message: 'Agent stopped' });
    }

    if (runningProcesses[id]) {
        try {
            runningProcesses[id].kill();
            delete runningProcesses[id];
            return res.json({ success: true, message: `Process ${id} stopped` });
        } catch (e) {
            return res.json({ success: false, message: e.message });
        }
    }

    res.json({ success: true, message: `No process found with id: ${id}` });
});

// System status
app.get('/api/status', (req, res) => {
    const processes = [];

    if (agentProcess) processes.push('AI Agent');
    if (indeedProcess) processes.push('Indeed Auto-Apply');
    if (playwrightProcess) processes.push('Job Search Automation');
    if (waStatus === 'CONNECTED' || waStatus === 'AUTHENTICATED') processes.push('WhatsApp');

    Object.keys(runningProcesses).forEach(id => {
        if (!processes.includes(id)) processes.push(id);
    });

    res.json({
        processes,
        env: {
            openai: !!process.env.OPENAI_API_KEY,
            indeed: !!process.env.INDEED_EMAIL
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Job search (admin tools)
app.post('/api/job-search', (req, res) => {
    const { platform, keyword, location } = req.body;

    if (playwrightProcess) {
        return res.status(400).json({ success: false, error: 'Search already running' });
    }

    const args = ['scripts/job-search-playwright.js', platform || 'indeed', keyword || 'Software Engineer', location || 'Dubai'];

    playwrightProcess = spawn('node', args, { cwd: __dirname });
    runningProcesses['job-search'] = playwrightProcess;

    playwrightProcess.on('close', (code) => {
        playwrightProcess = null;
        delete runningProcesses['job-search'];
    });

    res.json({ success: true, pid: playwrightProcess.pid, message: 'Job search started' });
});

// SSE endpoint for real-time logs
const sseClients = [];

app.get('/api/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ timestamp: new Date().toLocaleTimeString(), message: 'Connected to log stream', type: 'success' })}\n\n`);

    // Add client to list
    sseClients.push(res);

    // Remove client on disconnect
    req.on('close', () => {
        const index = sseClients.indexOf(res);
        if (index !== -1) {
            sseClients.splice(index, 1);
        }
    });
});

// Helper function to broadcast logs to all SSE clients
function broadcastLog(message, type = 'info') {
    const logData = JSON.stringify({
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
    });

    sseClients.forEach(client => {
        client.write(`data: ${logData}\n\n`);
    });
}

// Override console.log to also broadcast to SSE clients
const originalConsoleLog = console.log;
console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    broadcastLog(message, 'info');
};

const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    broadcastLog(message, 'error');
};

app.listen(PORT, () => {
    console.log(`🚀 CV Panel Server running at http://localhost:${PORT}/panel`);
});
