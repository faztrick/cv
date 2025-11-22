const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let subject = '';
let body = '';
let isBody = false;

for (const line of lines) {
  if (line.trim().startsWith('Subject:')) {
    subject = line.replace('Subject:', '').trim();
    isBody = true;
    continue; // Skip the subject line itself in the body
  }

  if (isBody) {
    body += line + '\n';
  }
}

// If no "Subject:" line found, assume first line is subject or just put everything in body
if (!subject) {
    subject = "Job Application";
    body = content;
}

// Clean up body
body = body.trim();

const encodedSubject = encodeURIComponent(subject);
const encodedBody = encodeURIComponent(body);
const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodedSubject}&body=${encodedBody}`;

console.log(`Drafting email for: ${subject}`);
console.log(`Opening Gmail...`);

// Open URL in default browser (Windows)
exec(`start "" "${gmailUrl}"`, (error) => {
  if (error) {
    console.error('Failed to open browser:', error);
  }
});
