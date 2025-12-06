#!/usr/bin/env node
/**
 * Open Major Tech Company Career Pages in UAE
 * Opens browser tabs for direct job applications
 */

const { chromium } = require('playwright');
const path = require('path');

const CAREER_PAGES = [
    // Top Priority - Major Tech
    { name: 'Microsoft', url: 'https://careers.microsoft.com/us/en/search-results?keywords=Software%20Engineer&location=Dubai,%20United%20Arab%20Emirates', priority: 1 },
    { name: 'Google', url: 'https://careers.google.com/jobs/results/?location=Dubai,%20United%20Arab%20Emirates', priority: 1 },
    { name: 'Amazon', url: 'https://www.amazon.jobs/en/search?base_query=software+engineer&loc_query=Dubai', priority: 1 },
    { name: 'Oracle', url: 'https://www.oracle.com/careers/', priority: 1 },

    // UAE Tech Leaders
    { name: 'Careem', url: 'https://www.careem.com/en-ae/careers/', priority: 2 },
    { name: 'Noon', url: 'https://careers.noon.com/jobs/', priority: 2 },
    { name: 'Talabat', url: 'https://careers.deliveryhero.com/global/en', priority: 2 },
    { name: 'Emirates Group', url: 'https://www.emiratesgroupcareers.com/search-and-apply/', priority: 2 },

    // Telecom
    { name: 'Etisalat', url: 'https://careers.etisalat.ae/', priority: 2 },
    { name: 'du', url: 'https://careers.du.ae/', priority: 2 },

    // Retail Tech (Your specialty)
    { name: 'Majid Al Futtaim', url: 'https://www.majidalfuttaim.com/en/careers', priority: 2 },
    { name: 'NCR', url: 'https://www.ncr.com/company/careers', priority: 1 },

    // Banks - Digital transformation
    { name: 'Emirates NBD', url: 'https://www.emiratesnbd.com/en/careers/', priority: 3 },
    { name: 'Mashreq', url: 'https://www.mashreq.com/en/uae/personal/ways-to-bank/careers/', priority: 3 },

    // Consulting
    { name: 'BCG', url: 'https://careers.bcg.com/locations/middle-east', priority: 2 },
    { name: 'Accenture', url: 'https://www.accenture.com/ae-en/careers/jobsearch?jk=&sb=1&vw=1&is_rj=0&ct=United%20Arab%20Emirates', priority: 2 },

    // Job Boards with filters
    { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer&location=Dubai', priority: 1 },
    { name: 'GulfTalent', url: 'https://www.gulftalent.com/jobs/information-technology', priority: 2 },
    { name: 'Bayt', url: 'https://www.bayt.com/en/uae/jobs/software-engineer-jobs/', priority: 2 },
    { name: 'Indeed UAE', url: 'https://ae.indeed.com/jobs?q=senior+software+engineer&l=Dubai', priority: 1 },
];

async function openCareerPages() {
    console.log('\n🚀 Opening Career Pages for Direct Applications...\n');

    // Sort by priority
    const sorted = [...CAREER_PAGES].sort((a, b) => a.priority - b.priority);

    const browser = await chromium.launchPersistentContext(
        path.join(__dirname, '..', 'user_data', 'playwright'),
        {
            headless: false,
            args: ['--start-maximized']
        }
    );

    // Open priority 1 first
    console.log('📌 PRIORITY 1 - Major Tech Companies:');
    for (const site of sorted.filter(s => s.priority === 1)) {
        console.log(`   🌐 ${site.name}`);
        const page = await browser.newPage();
        await page.goto(site.url);
        await page.waitForTimeout(500);
    }

    console.log('\n📌 PRIORITY 2 - UAE Tech Leaders:');
    for (const site of sorted.filter(s => s.priority === 2)) {
        console.log(`   🌐 ${site.name}`);
        const page = await browser.newPage();
        await page.goto(site.url);
        await page.waitForTimeout(500);
    }

    console.log('\n📌 PRIORITY 3 - Additional Opportunities:');
    for (const site of sorted.filter(s => s.priority === 3)) {
        console.log(`   🌐 ${site.name}`);
        const page = await browser.newPage();
        await page.goto(site.url);
        await page.waitForTimeout(500);
    }

    console.log('\n✅ All career pages opened!');
    console.log('📝 Apply to positions and track in target-companies.json');
    console.log('\n⏳ Browser will stay open. Close it manually when done.');

    await new Promise(() => {});
}

openCareerPages().catch(console.error);
