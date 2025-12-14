#!/usr/bin/env node

/**
 * CV & Job Search Toolkit
 * Main entry point for the application
 *
 * @author Muhammed Fasil PV
 * @description Unified toolkit for job search, email generation, and application tracking
 */

const path = require('path');

// Display welcome banner
console.log("\n");
console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║          CV & JOB SEARCH TOOLKIT                               ║");
console.log("║          Muhammed Fasil PV - Software Engineer                 ║");
console.log("║          Dubai, UAE - Target: 12K+ AED                         ║");
console.log("╚════════════════════════════════════════════════════════════════╝");
console.log("\n");

// Display available commands
console.log("Available Commands:");
console.log("─".repeat(70));
console.log("");
console.log("  npm start                  - Show this help menu");
console.log("  npm run generate-emails    - Generate job application emails");
console.log("  npm run job-agent          - Display job search profile");
console.log("  npm run job-search -- -s \"query\" - Search jobs (requires Puppeteer)");
console.log("  npm run clean-cache        - Clean Puppeteer cache");
console.log("  npm run install-puppeteer  - Install Puppeteer for web scraping");
console.log("");
console.log("─".repeat(70));
console.log("\n");

// Display project structure
console.log("Project Structure:");
console.log("─".repeat(70));
console.log("");
console.log("  📁 scripts/");
console.log("     ├── generate-job-emails.js   - Email template generator");
console.log("     ├── email-templates.js        - Email templates library");
console.log("     ├── job-search-agent.js       - Profile & search config");
console.log("     └── delete-puppeteer-cache.js - Cache cleanup utility");
console.log("");
console.log("  📁 resumes/");
console.log("     ├── resume.md                  - Master resume");
console.log("     └── variants/                  - Resume variants");
console.log("");
console.log("  📁 cover-letters/");
console.log("     └── *.md                       - Cover letter templates");
console.log("");
console.log("  📁 automation/");
console.log("     └── repos/                     - Job application bots");
console.log("");
console.log("  📁 public/");
console.log("     ├── cv.html                    - Web resume");
console.log("     └── index.html                 - Landing page");
console.log("");
console.log("─".repeat(70));
console.log("\n");

// Display quick links
console.log("Quick Links:");
console.log("─".repeat(70));
console.log("");
console.log("  🌐 Website:  https://www.uaecodes.com");
console.log("  💼 LinkedIn: https://linkedin.com/in/faztrick");
console.log("  💻 GitHub:   https://github.com/faztrick");
console.log("  📧 Email:    faztrick@gmail.com");
console.log("  📱 Phone:    +971 555923545");
console.log("");
console.log("─".repeat(70));
console.log("\n");

// Tips
console.log("💡 Tips:");
console.log("  • Run 'npm run generate-emails' to create personalized job emails");
console.log("  • Run 'npm run job-search -- -s \"AI Engineer Dubai\"' to scrape jobs");
console.log("  • Install Puppeteer first: npm run install-puppeteer");
console.log("  • Update scripts/job-search-agent.js with target companies");
console.log("  • Track applications in job-tracker-uae.csv");
console.log("  • Customize email templates in scripts/email-templates.js");
console.log("\n");

module.exports = {
  scriptsPath: path.join(__dirname, 'scripts'),
  resumesPath: path.join(__dirname, 'resumes'),
  coverLettersPath: path.join(__dirname, 'cover-letters'),
  automationPath: path.join(__dirname, 'automation')
};
