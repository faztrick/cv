#!/usr/bin/env node

/**
 * Job Email Generator CLI
 * Interactive tool to generate personalized job application emails
 */

const { generateEmail } = require('./email-templates');
const { profile } = require('./job-search-agent');

// Sample job opportunities for Dubai (12k+ AED)
const sampleJobs = [
  {
    company: "Careem",
    position: "Senior Software Engineer - AI/ML",
    salary: "15000-20000 AED",
    url: "https://careers.careem.com",
    type: "Full-time"
  },
  {
    company: "Noon",
    position: "Lead Software Engineer",
    salary: "18000-25000 AED",
    url: "https://careers.noon.com",
    type: "Full-time"
  },
  {
    company: "Tabby",
    position: "Senior Full Stack Engineer",
    salary: "16000-22000 AED",
    url: "https://tabby.ai/careers",
    type: "Full-time"
  },
  {
    company: "Network International",
    position: "Software Architect",
    salary: "20000-28000 AED",
    url: "https://www.network.ae/careers",
    type: "Full-time"
  },
  {
    company: "Bayzat",
    position: "Senior Software Engineer - IoT",
    salary: "14000-18000 AED",
    url: "https://www.bayzat.com/careers",
    type: "Full-time"
  }
];

// Generate emails for sample jobs
function generateAllEmails() {
  console.log("=== GENERATING JOB APPLICATION EMAILS ===\n");
  console.log(`Profile: ${profile.name}`);
  console.log(`Location: ${profile.location}`);
  console.log(`Minimum Salary: ${profile.salary.minimum} ${profile.salary.currency}\n`);
  console.log("=".repeat(50) + "\n");

  sampleJobs.forEach((job, index) => {
    console.log(`\n[${ index + 1}/${sampleJobs.length}] ${job.company} - ${job.position}`);
    console.log(`Salary: ${job.salary}`);
    console.log("-".repeat(70));

    const email = generateEmail('general', {
      company: job.company,
      position: job.position,
      jobUrl: job.url
    });

    console.log(email);
    console.log("\n" + "=".repeat(70) + "\n");
  });
}

// Generate specific email type
function generateSpecificEmail(type, params) {
  console.log(`\n=== ${type.toUpperCase()} EMAIL ===\n`);
  const email = generateEmail(type, params);
  console.log(email);
  console.log("\n" + "=".repeat(70) + "\n");
}

// Main execution
console.log("\n");
console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║     JOB EMAIL GENERATOR - DUBAI POSITIONS (12K+ AED)          ║");
console.log("║     Muhammed Fasil PV - Software Engineer                     ║");
console.log("╚════════════════════════════════════════════════════════════════╝");
console.log("\n");

// Generate sample emails
console.log("Generating emails for top Dubai tech companies...\n");
generateAllEmails();

console.log("\n\n=== ADDITIONAL EMAIL TEMPLATES ===\n");

// Recruiter outreach example
generateSpecificEmail('recruiter', {
  recruiterName: "Sarah Ahmed",
  position: "Senior AI Engineer"
});

// Executive outreach example
generateSpecificEmail('executive', {
  executiveName: "Mohammed Al-Rashid",
  title: "CTO",
  company: "Emirates Digital Solutions"
});

// Follow-up example
generateSpecificEmail('followup', {
  company: "Careem",
  position: "Senior Software Engineer - AI",
  days: 7
});

console.log("\n");
console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║                    USAGE INSTRUCTIONS                          ║");
console.log("╠════════════════════════════════════════════════════════════════╣");
console.log("║ 1. Review generated emails above                               ║");
console.log("║ 2. Customize company-specific details                          ║");
console.log("║ 3. Copy and paste into your email client                       ║");
console.log("║ 4. Attach your resume (resumes/resume.md or PDF version)       ║");
console.log("║ 5. Send and track in job application spreadsheet               ║");
console.log("╚════════════════════════════════════════════════════════════════╝");
console.log("\n");

console.log("Next Steps:");
console.log("• Update job-search-agent.js with more target companies");
console.log("• Track applications in a spreadsheet");
console.log("• Set follow-up reminders for 5-7 days after application");
console.log("• Customize each email with company-specific research");
console.log("\n");

module.exports = { generateAllEmails, generateSpecificEmail, sampleJobs };
