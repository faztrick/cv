#!/usr/bin/env node

/**
 * Outreach Manager
 * Manages the database of target companies and automates the email workflow.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { generatePersonalizedEmail, saveEmailToFile } = require('./smart-email-generator');
const { buildInlineBodyForOutreach } = require('./outreach-inline-body');

// Load local env vars when running via CLI (panel server also loads env).
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = path.join(__dirname, '..', 'data', 'target-companies.json');
const EMAILS_DIR = path.join(__dirname, '..', 'emails', 'outreach');

// Ensure directories exist
if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (!fs.existsSync(EMAILS_DIR)) fs.mkdirSync(EMAILS_DIR, { recursive: true });

/**
 * Load Database
 */
function loadDB() {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

/**
 * Save Database
 */
function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * List Companies
 */
function listCompanies(filterStatus = null) {
    const db = loadDB();
    console.log('\n🏢 Target Companies Database');
    console.log('='.repeat(80));
    console.log(String('ID').padEnd(4) + String('Name').padEnd(25) + String('Type').padEnd(20) + String('Status').padEnd(15) + 'Email');
    console.log('-'.repeat(80));

    db.forEach(c => {
        if (filterStatus && c.status.toLowerCase() !== filterStatus.toLowerCase()) return;
        console.log(
            String(c.id).padEnd(4) +
            String(c.name.substring(0, 24)).padEnd(25) +
            String(c.type.substring(0, 19)).padEnd(20) +
            String(c.status).padEnd(15) +
            c.email
        );
    });
    console.log('='.repeat(80));
    console.log(`Total: ${db.length} companies\n`);
}

/**
 * Add Company
 */
function addCompany(name, type, email, jobTitle = 'Software Engineer', status = 'Pending') {
    const db = loadDB();

    // Check for duplicates
    const exists = db.find(c => c.name.toLowerCase() === name.toLowerCase() && c.jobTitle.toLowerCase() === jobTitle.toLowerCase());
    if (exists) {
        console.log(`⚠️  ${name} already exists in database.`);
        return exists;
    }

    const newId = db.length > 0 ? Math.max(...db.map(c => parseInt(c.id))) + 1 : 1;

    const company = {
        id: String(newId),
        name,
        type,
        email: email || '',
        contactPerson: 'Hiring Manager',
        status: status,
        notes: '',
        jobTitle,
        website: '',
        addedDate: new Date().toISOString().split('T')[0]
    };

    db.push(company);
    saveDB(db);
    console.log(`✅ Added ${name} to database.`);
    return company;
}

/**
 * Generate Emails for Pending Companies
 */
function generateEmails() {
    const db = loadDB();
    const pending = db.filter(c => c.status === 'Pending');

    if (pending.length === 0) {
        console.log('No pending companies found.');
        return;
    }

    console.log(`\n📧 Generating emails for ${pending.length} companies...\n`);

    pending.forEach(c => {
        console.log(`Processing ${c.name}...`);

        // Create job data object for the generator
        const jobData = {
            title: c.jobTitle,
            company: c.name,
            description: `${c.type} company looking for ${c.jobTitle}. Focus on ERP, POS, and hardware integration.`,
            recruiterName: c.contactPerson
        };

        try {
            const emailContent = generatePersonalizedEmail(jobData, { tone: 'professional' });
            const filePath = saveEmailToFile(emailContent, jobData, EMAILS_DIR);

            c.status = 'Generated';
            c.generatedEmailPath = filePath;
            console.log(`   -> Email generated: ${path.basename(filePath)}`);
        } catch (err) {
            console.error(`   -> Failed: ${err.message}`);
        }
    });

    saveDB(db);
    console.log('\n✅ Generation complete.');
}

/**
 * Send Emails (Mock or Real)
 */
function sendEmails(realSend = false) {
    const db = loadDB();
    const ready = db.filter(c => c.status === 'Generated');

    if (ready.length === 0) {
        console.log('No companies with "Generated" status found.');
        return;
    }

    console.log(`\n🚀 Sending emails to ${ready.length} companies...\n`);

    const repoRoot = path.join(__dirname, '..');
    const venvPython = path.join(repoRoot, '.venv', 'Scripts', 'python.exe');
    const pythonExe = fs.existsSync(venvPython) ? venvPython : 'python';

    const defaultResume = path.join(repoRoot, 'resumes', 'resume-fasil-software-2025.pdf');
    const resumeAttachment = fs.existsSync(defaultResume) ? defaultResume : null;

    const senderEmail = process.env.GMAIL_SENDER_EMAIL || undefined;

    if (realSend && !process.env.GMAIL_APP_PASSWORD) {
        console.error('❌ GMAIL_APP_PASSWORD is not set.');
        console.error('This command runs non-interactively (panel/server). Set it in .env before sending real emails.');
        console.error('Example: GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx');
        process.exit(1);
    }

    const inline = process.argv.includes('--inline') || process.argv.includes('--no-attachment');
    const includeInlineCV = process.argv.includes('--cv-inline');
    const includeAICoverLetter = process.argv.includes('--cover-letter-openai');

    ready.forEach(c => {
        if (!c.generatedEmailPath || !fs.existsSync(c.generatedEmailPath)) {
            console.log(`⚠️  Skipping ${c.name}: Email file not found.`);
            return;
        }

        if (realSend && !c.email) {
            console.log(`⚠️  Skipping ${c.name}: Missing recipient email.`);
            return;
        }

        console.log(`Sending to ${c.name} (${c.email})...`);

        // Extract subject from file (first line)
        const content = fs.readFileSync(c.generatedEmailPath, 'utf8');
        const subjectMatch = content.match(/^Subject: (.+)$/m);
        const subject = subjectMatch ? subjectMatch[1] : `Application for ${c.jobTitle}`;

        if (!realSend) {
            console.log(`   [DRY RUN] Email ready for ${c.email || '(no email set)'}. Use --real to send.`);
            return;
        }

        // Build body:
        // - default: existing generated email file
        // - inline mode: generates an augmented body file including AI cover letter and/or CV text
        let bodyPath = c.generatedEmailPath;
        if (inline || includeInlineCV || includeAICoverLetter) {
            try {
                bodyPath = buildInlineBodyForOutreach({
                    company: c,
                    subject,
                    baseEmailPath: c.generatedEmailPath,
                    includeCV: includeInlineCV,
                    includeCoverLetterAI: includeAICoverLetter
                });
            } catch (e) {
                console.error(`   ❌ Failed to build inline body for ${c.name}: ${e.message}`);
                c.lastError = `inline body build failed: ${e.message}`;
                return;
            }
        }

        const args = [
            'scripts/send_email.py',
            '--to', String(c.email),
            '--subject', String(subject),
            '--body', String(bodyPath)
        ];

        // Attachments are optional, but in inline mode we intentionally avoid attaching files.
        if (!inline && resumeAttachment) args.push('--attachment', resumeAttachment);
        if (senderEmail) args.push('--sender', senderEmail);

        const r = spawnSync(pythonExe, args, { cwd: repoRoot, encoding: 'utf8' });
        if (r.stdout) process.stdout.write(r.stdout);
        if (r.stderr) process.stderr.write(r.stderr);

        if (r.status === 0) {
            c.status = 'Sent';
            console.log(`   ✅ Sent to ${c.email}`);
        } else {
            console.error(`   ❌ Failed to send to ${c.email} (exit code ${r.status ?? 'unknown'})`);
            c.lastError = `send_email.py failed (exit code ${r.status ?? 'unknown'})`;
        }
    });

    if (realSend) {
        saveDB(db);
        console.log('\n✅ Sending process complete.');
    }
}

// CLI Handler
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'list':
            listCompanies(args[1]);
            break;
        case 'add':
            if (args.length < 4) {
                console.log('Usage: node outreach-manager.js add "Name" "Type" "Email" ["Job Title"]');
            } else {
                addCompany(args[1], args[2], args[3], args[4]);
            }
            break;
        case 'generate':
            generateEmails();
            break;
        case 'send':
            sendEmails(args.includes('--real'));
            break;
        default:
            console.log('\n📢 Outreach Manager');
            console.log('-------------------');
            console.log('Commands:');
            console.log('  list [status]       - List companies (optional filter by status)');
            console.log('  add "Name" ...      - Add a new company');
            console.log('  generate            - Generate emails for Pending companies');
            console.log('  send [--real]       - Send emails for Generated companies');
            console.log('');
    }
}

module.exports = {
    addCompany,
    listCompanies,
    generateEmails,
    sendEmails,
    loadDB,
    saveDB
};
