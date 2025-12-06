#!/usr/bin/env node
/**
 * Open Gmail Compose Windows for All Outreach Emails
 * Opens browser with pre-filled Gmail compose for each company
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const TARGET_COMPANIES = path.join(__dirname, '..', 'data', 'target-companies.json');

async function openComposeEmails() {
    const companies = JSON.parse(fs.readFileSync(TARGET_COMPANIES, 'utf8'));

    // Filter companies with emails and Generated status
    const toEmail = companies.filter(c => c.email && c.status === 'Generated');

    console.log(`\n📧 Opening ${toEmail.length} email compose windows...\n`);

    // Launch browser with persistent context (to use existing Gmail login)
    const browser = await chromium.launchPersistentContext(
        path.join(__dirname, '..', 'user_data', 'playwright'),
        {
            headless: false,
            args: ['--start-maximized']
        }
    );

    const page = await browser.newPage();

    // First, go to Gmail to ensure we're logged in
    console.log('📬 Opening Gmail...');
    await page.goto('https://mail.google.com');
    await page.waitForTimeout(3000);

    for (const company of toEmail) {
        try {
            const emailFile = company.generatedEmailPath;
            if (!fs.existsSync(emailFile)) {
                console.log(`⚠️  ${company.name}: Email file not found`);
                continue;
            }

            const emailContent = fs.readFileSync(emailFile, 'utf8');

            // Extract subject and body
            const subjectMatch = emailContent.match(/^Subject:\s*(.+)$/m);
            const subject = subjectMatch ? subjectMatch[1] : `Application - ${company.jobTitle} - ${company.name}`;

            // Get body (everything after Subject line)
            const bodyStart = emailContent.indexOf('\n\n');
            const body = bodyStart > -1 ? emailContent.slice(bodyStart + 2) : emailContent;

            // Create Gmail compose URL
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(company.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            console.log(`📧 ${company.name} → ${company.email}`);

            // Open in new tab
            const newPage = await browser.newPage();
            await newPage.goto(gmailUrl);
            await page.waitForTimeout(1000);

        } catch (error) {
            console.log(`❌ ${company.name}: ${error.message}`);
        }
    }

    console.log(`\n✅ Opened ${toEmail.length} compose windows!`);
    console.log('📎 Remember to attach your resume to each email before sending!');
    console.log('\n⏳ Browser will stay open. Close it manually when done.');

    // Keep browser open
    await new Promise(() => {});
}

openComposeEmails().catch(console.error);
