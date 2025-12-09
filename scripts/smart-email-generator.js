#!/usr/bin/env node

/**
 * Smart Email Generator
 * Generates personalized job application emails with skill matching
 * Uses CV data to highlight relevant experience for each specific job
 */

const fs = require('fs');
const path = require('path');
const { parseResume, matchJobWithCV } = require('./cv-parser');

/**
 * Generate personalized email based on job description
 */
function generatePersonalizedEmail(jobData, options = {}) {
  const {
    senderName = 'Muhammed Fasil PV',
    tone = 'professional' // professional, enthusiastic, technical
  } = options;

  // Load CV data
  const resumePath = path.join(__dirname, '..', 'resumes', 'resume.md');
  const cvData = parseResume(resumePath);

  // Match job with CV
  const jobDescription = `${jobData.title} ${jobData.description || ''} ${jobData.requirements || ''}`;
  const matchResult = matchJobWithCV(jobDescription, cvData);

  // Select most relevant experience
  const relevantExperience = selectRelevantExperience(jobData, cvData, matchResult);

  // Select most relevant projects
  const relevantProjects = selectRelevantProjects(jobData, cvData, matchResult);

  // Build email
  const email = buildEmailTemplate({
    jobData,
    cvData,
    matchResult,
    relevantExperience,
    relevantProjects,
    tone
  });

  return email;
}

/**
 * Select relevant experience based on job requirements
 */
function selectRelevantExperience(jobData, cvData, matchResult) {
  const jobTitleLower = jobData.title.toLowerCase();
  const jobDescLower = (jobData.description || '').toLowerCase();

  // Score each experience
  const scoredExperience = cvData.experience.map(exp => {
    let score = 0;

    // Check if job title is relevant
    if (jobTitleLower.includes('ai') || jobTitleLower.includes('ml')) {
      if (exp.company.includes('Idol Technology') || exp.responsibilities.some(r => r.toLowerCase().includes('ai'))) {
        score += 10;
      }
    }

    if (jobTitleLower.includes('iot')) {
      if (exp.responsibilities.some(r => r.toLowerCase().includes('iot') || r.toLowerCase().includes('mqtt'))) {
        score += 10;
      }
    }

    if (jobTitleLower.includes('flutter') || jobTitleLower.includes('mobile')) {
      if (exp.responsibilities.some(r => r.toLowerCase().includes('flutter'))) {
        score += 10;
      }
    }

    if (jobTitleLower.includes('backend') || jobTitleLower.includes('node')) {
      if (exp.responsibilities.some(r => r.toLowerCase().includes('node') || r.toLowerCase().includes('api'))) {
        score += 10;
      }
    }

    // Check matched skills in responsibilities
    matchResult.matched.forEach(skill => {
      if (exp.responsibilities.some(r => r.toLowerCase().includes(skill.toLowerCase()))) {
        score += 1;
      }
    });

    return { ...exp, score };
  });

  // Return top 2 most relevant experiences
  return scoredExperience
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(exp => ({
      company: exp.company,
      title: exp.title,
      period: exp.period,
      highlights: exp.responsibilities.slice(0, 3)
    }));
}

/**
 * Select relevant projects based on job requirements
 */
function selectRelevantProjects(jobData, cvData, matchResult) {
  const jobTitleLower = jobData.title.toLowerCase();
  const jobDescLower = (jobData.description || '').toLowerCase();

  // Score each project
  const scoredProjects = cvData.projects.map(project => {
    let score = 0;
    const projectLower = (project.name + ' ' + project.description).toLowerCase();

    // Keyword matching
    if (jobTitleLower.includes('ai') && projectLower.includes('ai')) score += 10;
    if (jobTitleLower.includes('iot') && projectLower.includes('iot')) score += 10;
    if (jobTitleLower.includes('flutter') && projectLower.includes('flutter')) score += 10;
    if (jobTitleLower.includes('erp') && projectLower.includes('erp')) score += 10;

    // Match with job skills
    matchResult.matched.forEach(skill => {
      if (projectLower.includes(skill.toLowerCase())) {
        score += 2;
      }
    });

    return { ...project, score };
  });

  // Return top 3 projects
  return scoredProjects
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Build email template
 */
function buildEmailTemplate(data) {
  const { jobData, cvData, matchResult, relevantExperience, relevantProjects, tone } = data;

  const subject = buildSubject(jobData);
  const greeting = buildGreeting(jobData);
  const opening = buildOpening(jobData, cvData, tone);
  const experience = buildExperienceSection(relevantExperience, jobData);
  const skills = buildSkillsSection(matchResult, jobData);
  const projects = buildProjectsSection(relevantProjects, jobData);
  const closing = buildClosing(jobData, tone);
  const signature = buildSignature(cvData);

  const email = `Subject: ${subject}

${greeting}

${opening}

${experience}

${skills}

${projects}

${closing}

${signature}`;

  return email;
}

/**
 * Build email subject
 */
function buildSubject(jobData) {
  const position = jobData.title || 'Software Engineer Position';
  const company = jobData.company || '';

  return `Application – ${position}${company ? ` – ${company}` : ''} – Muhammed Fasil PV`;
}

/**
 * Build greeting
 */
function buildGreeting(jobData) {
  if (jobData.recruiterName) {
    return `Hi ${jobData.recruiterName},`;
  }
  return 'Dear Hiring Manager,';
}

/**
 * Build opening paragraph
 */
function buildOpening(jobData, cvData, tone) {
  const company = jobData.company || 'your company';
  const position = jobData.title || 'the position';

  if (tone === 'enthusiastic') {
    return `I'm thrilled to apply for the ${position} role at ${company}. With 13+ years of hands-on experience building production systems across AI, IoT, and full-stack development, I'm confident I can make an immediate impact on your team.`;
  } else if (tone === 'technical') {
    return `I'm applying for the ${position} role at ${company}. As a Software Architect with 13+ years of experience, I specialize in building scalable, production-ready systems using TypeScript/Node.js, Flutter, Python, and modern DevOps practices. I'm currently based in Dubai and immediately available.`;
  } else { // professional
    return `I'm a Dubai-based Software Architect and hands-on engineer with 13+ years building production systems (ERP/POS/QMS/IoT) using TypeScript/Node.js, Flutter, Python, and Docker. I'm immediately available in UAE (Company Visa) and interested in the ${position} opportunity at ${company}.`;
  }
}

/**
 * Build experience section
 */
function buildExperienceSection(relevantExperience, jobData) {
  if (!relevantExperience || relevantExperience.length === 0) {
    return '';
  }

  const expText = relevantExperience.map(exp => {
    const highlights = exp.highlights.slice(0, 2).map(h => {
      // Shorten if too long
      return h.length > 100 ? h.substring(0, 97) + '...' : h;
    });

    return `At ${exp.company}, I ${highlights.join(', and ')}`;
  }).join('. ');

  return `Relevant Experience:\n${expText}.`;
}

/**
 * Build skills section
 */
function buildSkillsSection(matchResult, jobData) {
  if (matchResult.matched.length === 0) {
    // Generic skills highlight
    return `Key Skills:\n• Full-stack development with TypeScript/Node.js, Flutter, Python\n• AI/ML integrations (YOLO, Whisper, OpenAI, LangChain)\n• IoT systems (ESP32, MQTT, edge computing)\n• DevOps: Docker/Compose, GitHub Actions, PM2, Nginx\n• Database: MySQL, MongoDB, Firebase (cloud and edge)`;
  }

  // Highlight matched skills
  const topSkills = matchResult.matched.slice(0, 8);

  // Group by category
  const categories = {
    languages: [],
    frameworks: [],
    ai: [],
    devops: [],
    other: []
  };

  topSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    if (['typescript', 'javascript', 'python', 'dart', 'php', 'c#'].some(l => skillLower.includes(l))) {
      categories.languages.push(skill);
    } else if (['flutter', 'node', 'react', 'express', 'wpf'].some(f => skillLower.includes(f))) {
      categories.frameworks.push(skill);
    } else if (['ai', 'ml', 'yolo', 'openai', 'tensorflow', 'whisper'].some(a => skillLower.includes(a))) {
      categories.ai.push(skill);
    } else if (['docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'nginx'].some(d => skillLower.includes(d))) {
      categories.devops.push(skill);
    } else {
      categories.other.push(skill);
    }
  });

  const skillBullets = [];
  if (categories.languages.length > 0 || categories.frameworks.length > 0) {
    skillBullets.push(`Development: ${[...categories.languages, ...categories.frameworks].slice(0, 5).join(', ')}`);
  }
  if (categories.ai.length > 0) {
    skillBullets.push(`AI/ML: ${categories.ai.join(', ')}`);
  }
  if (categories.devops.length > 0) {
    skillBullets.push(`DevOps: ${categories.devops.join(', ')}`);
  }
  if (categories.other.length > 0 && skillBullets.length < 3) {
    skillBullets.push(`Also: ${categories.other.slice(0, 3).join(', ')}`);
  }

  return `Highlights:\n${skillBullets.map(s => `• ${s}`).join('\n')}`;
}

/**
 * Build projects section
 */
function buildProjectsSection(relevantProjects, jobData) {
  if (!relevantProjects || relevantProjects.length === 0) {
    return '';
  }

  const projectText = relevantProjects.slice(0, 2).map(proj => {
    return `• ${proj.name}: ${proj.description}`;
  }).join('\n');

  return `Notable Projects:\n${projectText}`;
}

/**
 * Build closing
 */
function buildClosing(jobData, tone) {
  if (tone === 'enthusiastic') {
    return `I'd love to discuss how my experience in building scalable systems can contribute to ${jobData.company || 'your team'}. I'm immediately available and can start right away. I've attached my resume and would be happy to share code samples or discuss my projects in detail.

Thank you for considering my application!`;
  } else if (tone === 'technical') {
    return `I'm happy to provide code samples, discuss architecture decisions, or dive into technical details of my projects. My resume is attached for your review.

Looking forward to the opportunity to contribute.`;
  } else { // professional
    return `Attached are my resume and a brief overview. Happy to share code samples and discuss how I can contribute to your team.

Thank you for your consideration.`;
  }
}

/**
 * Build signature
 */
function buildSignature(cvData) {
  const personal = cvData.personal;

  return `${personal.name}
${personal.location} | ${personal.phone} | ${personal.email}
LinkedIn: ${personal.linkedin} | GitHub: ${personal.github} | Portfolio: ${personal.website}`;
}

/**
 * Generate email variants for A/B testing
 */
function generateEmailVariants(jobData) {
  const variants = {
    professional: generatePersonalizedEmail(jobData, { tone: 'professional' }),
    enthusiastic: generatePersonalizedEmail(jobData, { tone: 'enthusiastic' }),
    technical: generatePersonalizedEmail(jobData, { tone: 'technical' })
  };

  return variants;
}

/**
 * Save email to file
 */
function saveEmailToFile(email, jobData, outputDir = null) {
  const dir = outputDir || path.join(__dirname, '..', 'emails', 'generated');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = `${jobData.company || 'company'}-${jobData.title || 'position'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filepath = path.join(dir, `${filename}.txt`);

  fs.writeFileSync(filepath, email, 'utf8');
  console.log(`✅ Email saved to: ${filepath}`);

  return filepath;
}

/**
 * Batch generate emails for multiple jobs
 */
function batchGenerateEmails(jobs, options = {}) {
  const { outputDir = null, tone = 'professional' } = options;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         SMART EMAIL GENERATOR                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results = [];

  jobs.forEach((job, index) => {
    console.log(`\n[${index + 1}/${jobs.length}] Generating email for: ${job.title} at ${job.company}`);

    try {
      const email = generatePersonalizedEmail(job, { tone });
      const filepath = saveEmailToFile(email, job, outputDir);

      results.push({ job, filepath, success: true });

      // Show preview
      console.log('\nPreview:');
      console.log(email.substring(0, 300) + '...\n');

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      results.push({ job, success: false, error: error.message });
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total jobs: ${jobs.length}`);
  console.log(`Emails generated: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  return results;
}

// CLI
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'generate':
        // Example job data
        const job = {
          title: args[1] || 'Senior Software Engineer',
          company: args[2] || 'Tech Company',
          description: args[3] || 'Looking for experienced full-stack developer with AI/ML experience',
          requirements: 'Node.js, Python, Docker, AI/ML, Flutter'
        };

        console.log('\n📧 Generating personalized email...\n');
        const email = generatePersonalizedEmail(job, { tone: 'professional' });
        console.log(email);
        console.log('\n');

        // Save to file
        saveEmailToFile(email, job);
        break;

      case 'variants':
        const jobForVariants = {
          title: args[1] || 'AI Engineer',
          company: args[2] || 'AI Startup',
          description: 'AI/ML engineer with production experience'
        };

        console.log('\n📧 Generating email variants...\n');
        const variants = generateEmailVariants(jobForVariants);

        Object.entries(variants).forEach(([tone, email]) => {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`${tone.toUpperCase()} TONE`);
          console.log('='.repeat(80));
          console.log(email);
          console.log('\n');
        });
        break;

      case 'batch':
        // Load jobs from file or use sample
        const jobsFile = args[1] || path.join(__dirname, '..', 'data', 'jobs-to-apply.json');

        let jobs = [];
        if (fs.existsSync(jobsFile)) {
          jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
        } else {
          // Sample jobs
          jobs = [
            { title: 'Senior Software Engineer', company: 'Careem', description: 'Full-stack with AI/ML' },
            { title: 'Flutter Developer', company: 'Noon', description: 'Mobile app development' },
            { title: 'IoT Engineer', company: 'Smart Dubai', description: 'IoT systems and MQTT' }
          ];
        }

        batchGenerateEmails(jobs, { tone: 'professional' });
        break;

      default:
        console.log('\n📖 Smart Email Generator Usage:');
        console.log('');
        console.log('Commands:');
        console.log('  generate [title] [company] [description]');
        console.log('    - Generate a single personalized email');
        console.log('');
        console.log('  variants [title] [company]');
        console.log('    - Generate multiple tone variants (professional, enthusiastic, technical)');
        console.log('');
        console.log('  batch [jobs-file.json]');
        console.log('    - Generate emails for multiple jobs from JSON file');
        console.log('');
        console.log('Examples:');
        console.log('  node smart-email-generator.js generate "AI Engineer" "Careem"');
        console.log('  node smart-email-generator.js variants "Senior Developer" "Noon"');
        console.log('  node smart-email-generator.js batch jobs-to-apply.json');
        console.log('');
        console.log('Features:');
        console.log('  ✓ Automatic skill matching from your CV');
        console.log('  ✓ Relevant experience highlighting');
        console.log('  ✓ Project selection based on job requirements');
        console.log('  ✓ Multiple tone options');
        console.log('  ✓ Batch processing');
        console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = {
  generatePersonalizedEmail,
  generateEmailVariants,
  batchGenerateEmails,
  saveEmailToFile
};

if (require.main === module) {
  main();
}
