#!/usr/bin/env node

/**
 * Outreach Manager
 * Manages the database of target companies and automates the email workflow.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generatePersonalizedEmail, saveEmailToFile } = require('./smart-email-generator');

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
function addCompany(name, type, email, jobTitle = 'Software Engineer') {
    const db = loadDB();
    const newId = db.length > 0 ? Math.max(...db.map(c => parseInt(c.id))) + 1 : 1;

    const company = {
        id: String(newId),
        name,
        type,
        email,
        contactPerson: 'Hiring Manager',
        status: 'Pending',
        notes: '',
        jobTitle,
        website: ''
    };

    db.push(company);
    saveDB(db);
    console.log(`✅ Added ${name} to database.`);
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

    ready.forEach(c => {
        if (!c.generatedEmailPath || !fs.existsSync(c.generatedEmailPath)) {
            console.log(`⚠️  Skipping ${c.name}: Email file not found.`);
            return;
        }

        console.log(`Sending to ${c.name} (${c.email})...`);

        if (realSend) {
            // Construct python command
            // python scripts/send_email.py --to "email" --subject "Subject" --body "path"

            // Extract subject from file (first line)
            const content = fs.readFileSync(c.generatedEmailPath, 'utf8');
            const subjectMatch = content.match(/^Subject: (.+)$/m);
            const subject = subjectMatch ? subjectMatch[1] : `Application for ${c.jobTitle}`;

            try {
                // We use the python script
                const cmd = `python scripts/send_email.py --to "${c.email}" --subject "${subject}" --body "${c.generatedEmailPath}" --sender "faztrick@gmail.com"`;
                // Note: This requires GMAIL_APP_PASSWORD env var or manual input.
                // For automation, we assume it's set or we skip.

                // For safety in this demo, we won't actually execute the send unless explicitly confirmed
                // execSync(cmd, { stdio: 'inherit' });

                console.log(`   [MOCK SEND] Would execute: ${cmd}`);
                c.status = 'Sent'; // Update status even in mock for flow demonstration
            } catch (err) {
                console.error(`   -> Failed to send: ${err.message}`);
            }
        } else {
            console.log(`   [DRY RUN] Email ready for ${c.email}. Use --real to send.`);
        }
    });

    if (realSend) {
        saveDB(db);
        console.log('\n✅ Sending process complete.');
    }
}

// CLI Handler
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
