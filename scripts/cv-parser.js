#!/usr/bin/env node

/**
 * CV Parser - Extract structured data from resume.md
 * Parses Muhammed Fasil PV's resume to extract skills, experience, projects, and keywords
 * for automated job matching and application form filling
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse resume.md and extract structured data
 */
function parseResume(resumePath) {
  const content = fs.readFileSync(resumePath, 'utf8');

  const cvData = {
    personal: extractPersonalInfo(content),
    summary: extractSummary(content),
    skills: extractSkills(content),
    experience: extractExperience(content),
    projects: extractProjects(content),
    keywords: extractKeywords(content),
    education: extractEducation(content)
  };

  return cvData;
}

/**
 * Extract personal information
 */
function extractPersonalInfo(content) {
  const personal = {
    name: '',
    title: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    github: '',
    linkedin: ''
  };

  // Extract name (first heading)
  const nameMatch = content.match(/^#\s+(.+)$/m);
  if (nameMatch) personal.name = nameMatch[1].trim();

  // Extract title (first bold line after name)
  const titleMatch = content.match(/\*\*(.+?)\*\*/);
  if (titleMatch) personal.title = titleMatch[1].trim();

  // Extract contact info
  const locationMatch = content.match(/📍\s*([^|]+)/);
  if (locationMatch) personal.location = locationMatch[1].trim();

  const phoneMatch = content.match(/📞\s*([+\d\s]+)/);
  if (phoneMatch) personal.phone = phoneMatch[1].trim();

  const emailMatch = content.match(/✉️.*?\[([^\]]+@[^\]]+)\]/);
  if (emailMatch) personal.email = emailMatch[1].trim();

  const websiteMatch = content.match(/🌐.*?\[https?:\/\/([^\]]+)\]/);
  if (websiteMatch) personal.website = `https://${websiteMatch[1].trim()}`;

  const githubMatch = content.match(/GitHub.*?\(https?:\/\/github\.com\/([^\)]+)\)/);
  if (githubMatch) personal.github = `https://github.com/${githubMatch[1].trim()}`;

  const linkedinMatch = content.match(/LinkedIn.*?\(https?:\/\/linkedin\.com\/in\/([^\)]+)\)/);
  if (linkedinMatch) personal.linkedin = `https://linkedin.com/in/${linkedinMatch[1].trim()}`;

  return personal;
}

/**
 * Extract professional summary
 */
function extractSummary(content) {
  const summaryMatch = content.match(/## 🧩 Professional Summary\s+([\s\S]+?)(?=\n##)/);
  if (summaryMatch) {
    return summaryMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
  }
  return '';
}

/**
 * Extract skills from the resume
 */
function extractSkills(content) {
  const skills = {
    all: [],
    languages: [],
    frameworks: [],
    ai: [],
    iot: [],
    networking: [],
    database: [],
    cloud: [],
    automation: []
  };

  // Extract from Core Competencies section
  const competenciesMatch = content.match(/## 💡 Core Competencies([\s\S]+?)(?=\n##)/);
  if (competenciesMatch) {
    const competencies = competenciesMatch[1];

    // Extract by category
    const categories = {
      'Software Architecture': 'frameworks',
      'AI & Automation': 'ai',
      'IoT & Edge': 'iot',
      'Networking': 'networking',
      'DevOps & Cloud': 'cloud',
      'Database': 'database',
      'Automation Platforms': 'automation'
    };

    for (const [key, category] of Object.entries(categories)) {
      const regex = new RegExp(`\\*\\*${key}[^:]*:\\*\\*([^\\n]+)`, 'i');
      const match = competencies.match(regex);
      if (match) {
        const items = match[1].split(',').map(s => s.trim());
        skills[category].push(...items);
        skills.all.push(...items);
      }
    }
  }

  // Extract from Technical Skills table
  const tableMatch = content.match(/## ⚙️ Technical Skills([\s\S]+?)(?=\n##|$)/);
  if (tableMatch) {
    const tableContent = tableMatch[1];

    const languagesMatch = tableContent.match(/\*\*Languages\*\*\s*\|\s*(.+)/);
    if (languagesMatch) {
      skills.languages = languagesMatch[1].split(',').map(s => s.trim());
      skills.all.push(...skills.languages);
    }

    const frameworksMatch = tableContent.match(/\*\*Frameworks\*\*\s*\|\s*(.+)/);
    if (frameworksMatch) {
      const fw = frameworksMatch[1].split(',').map(s => s.trim());
      skills.frameworks.push(...fw);
      skills.all.push(...fw);
    }
  }

  // Remove duplicates
  skills.all = [...new Set(skills.all)];

  return skills;
}

/**
 * Extract work experience
 */
function extractExperience(content) {
  const experience = [];
  const expSection = content.match(/## 🏢 Professional Experience([\s\S]+?)(?=\n##)/);

  if (expSection) {
    const jobs = expSection[1].split(/###\s+\*\*/).filter(Boolean);

    jobs.forEach(job => {
      const titleMatch = job.match(/^(.+?)—\s*(.+?)\*\*/);
      const dateMatch = job.match(/📆\s*\*(.+?)\*/);
      const responsibilitiesMatch = job.match(/\n-\s+(.+?)(?=\n-|\n###|$)/gs);

      if (titleMatch) {
        const exp = {
          title: titleMatch[1].trim(),
          company: titleMatch[2].trim(),
          period: dateMatch ? dateMatch[1].trim() : '',
          responsibilities: responsibilitiesMatch
            ? responsibilitiesMatch.map(r => r.replace(/\n-\s+/, '').trim())
            : []
        };
        experience.push(exp);
      }
    });
  }

  return experience;
}

/**
 * Extract projects
 */
function extractProjects(content) {
  const projects = [];
  const projectsMatch = content.match(/## 🚀 Major Projects([\s\S]+?)(?=\n##)/);

  if (projectsMatch) {
    const projectList = projectsMatch[1].match(/- \*\*(.+?):\*\* (.+)/g);
    if (projectList) {
      projectList.forEach(p => {
        const match = p.match(/- \*\*(.+?):\*\* (.+)/);
        if (match) {
          projects.push({
            name: match[1].trim(),
            description: match[2].trim()
          });
        }
      });
    }
  }

  return projects;
}

/**
 * Extract education
 */
function extractEducation(content) {
  const education = [];
  const eduMatch = content.match(/## 🎓 Education([\s\S]+?)(?=\n##|$)/);

  if (eduMatch) {
    const degrees = eduMatch[1].match(/###\s+(.+)/g);
    if (degrees) {
      degrees.forEach(d => {
        education.push(d.replace(/###\s+/, '').trim());
      });
    }
  }

  return education;
}

/**
 * Extract searchable keywords for job matching
 */
function extractKeywords(content) {
  const keywords = new Set();

  // Common tech keywords to look for
  const techPatterns = [
    /Flutter/gi, /Node\.js/gi, /TypeScript/gi, /JavaScript/gi, /Python/gi,
    /React/gi, /Angular/gi, /Vue/gi, /Docker/gi, /Kubernetes/gi,
    /AWS/gi, /Azure/gi, /GCP/gi, /MySQL/gi, /MongoDB/gi,
    /AI/gi, /ML/gi, /Machine Learning/gi, /Deep Learning/gi,
    /IoT/gi, /Microservices/gi, /API/gi, /REST/gi, /GraphQL/gi,
    /MQTT/gi, /WebSocket/gi, /Redis/gi, /Nginx/gi, /CI\/CD/gi,
    /DevOps/gi, /Agile/gi, /Scrum/gi, /Git/gi, /GitHub/gi,
    /TensorFlow/gi, /PyTorch/gi, /OpenAI/gi, /LangChain/gi,
    /ESP32/gi, /Raspberry Pi/gi, /Arduino/gi, /YOLO/gi,
    /WireGuard/gi, /VPN/gi, /MikroTik/gi, /ERP/gi, /POS/gi
  ];

  techPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(m => keywords.add(m));
    }
  });

  return Array.from(keywords);
}

/**
 * Generate job search keywords from CV
 */
function generateJobSearchKeywords(cvData) {
  const keywords = [];

  // Add title variations
  keywords.push(
    'Software Engineer',
    'Senior Software Engineer',
    'Lead Software Engineer',
    'Software Architect',
    'Full Stack Engineer',
    'Backend Engineer',
    'AI Engineer',
    'IoT Engineer',
    'Solutions Architect'
  );

  // Add skill-based searches
  if (cvData.skills.ai.length > 0) {
    keywords.push('AI Developer', 'ML Engineer', 'Machine Learning Engineer');
  }

  if (cvData.skills.iot.length > 0) {
    keywords.push('IoT Developer', 'Embedded Systems Engineer');
  }

  // Add framework-specific searches
  if (cvData.skills.frameworks.includes('Flutter')) {
    keywords.push('Flutter Developer', 'Flutter Engineer');
  }

  if (cvData.skills.frameworks.includes('Node.js')) {
    keywords.push('Node.js Developer', 'Backend Node.js Engineer');
  }

  return keywords;
}

/**
 * Match CV data with job description
 */
function matchJobWithCV(jobDescription, cvData) {
  const score = {
    total: 0,
    matched: [],
    missing: [],
    skillMatch: 0,
    experienceMatch: 0
  };

  const jobDescLower = jobDescription.toLowerCase();

  // Check skill matches
  cvData.skills.all.forEach(skill => {
    if (jobDescLower.includes(skill.toLowerCase())) {
      score.matched.push(skill);
      score.skillMatch += 1;
    }
  });

  // Calculate match percentage
  score.total = Math.min(100, (score.skillMatch / Math.max(cvData.skills.all.length * 0.3, 1)) * 100);

  return score;
}

/**
 * Generate form data for job applications
 */
function generateApplicationFormData(cvData) {
  return {
    // Personal Information
    firstName: cvData.personal.name.split(' ')[0] || '',
    lastName: cvData.personal.name.split(' ').slice(1).join(' ') || '',
    fullName: cvData.personal.name,
    email: cvData.personal.email,
    phone: cvData.personal.phone,
    location: cvData.personal.location,
    city: 'Dubai',
    country: 'United Arab Emirates',

    // Professional
    currentTitle: cvData.personal.title,
    yearsOfExperience: '13',

    // Social/Portfolio
    linkedin: cvData.personal.linkedin,
    github: cvData.personal.github,
    portfolio: cvData.personal.website,
    website: cvData.personal.website,

    // Skills (formatted for forms)
    skills: cvData.skills.all.join(', '),
    topSkills: cvData.skills.all.slice(0, 10).join(', '),

    // Summary
    summary: cvData.summary,

    // Salary expectations
    expectedSalary: '12000-18000 AED',
    currentSalary: '',
    noticePeriod: 'Immediately Available',

    // Work authorization
    workAuthorization: 'Authorized to work in UAE (Company Visa)',
    sponsorship: 'No',

    // Education
    education: cvData.education.join('; ')
  };
}

// Export functions
module.exports = {
  parseResume,
  extractPersonalInfo,
  extractSummary,
  extractSkills,
  extractExperience,
  extractProjects,
  extractKeywords,
  generateJobSearchKeywords,
  matchJobWithCV,
  generateApplicationFormData
};

// CLI usage
if (require.main === module) {
  const resumePath = path.join(__dirname, '..', 'resumes', 'resume.md');

  if (!fs.existsSync(resumePath)) {
    console.error('❌ Resume not found at:', resumePath);
    process.exit(1);
  }

  console.log('📄 Parsing CV from:', resumePath);
  console.log('');

  const cvData = parseResume(resumePath);

  console.log('=== CV PARSER RESULTS ===\n');

  console.log('👤 Personal Info:');
  console.log(`   Name: ${cvData.personal.name}`);
  console.log(`   Title: ${cvData.personal.title}`);
  console.log(`   Location: ${cvData.personal.location}`);
  console.log(`   Email: ${cvData.personal.email}`);
  console.log(`   Phone: ${cvData.personal.phone}`);
  console.log('');

  console.log('💼 Experience:');
  cvData.experience.forEach((exp, i) => {
    console.log(`   ${i + 1}. ${exp.title} at ${exp.company} (${exp.period})`);
  });
  console.log('');

  console.log('🛠️  Skills:');
  console.log(`   Total: ${cvData.skills.all.length}`);
  console.log(`   Languages: ${cvData.skills.languages.join(', ')}`);
  console.log(`   Top Skills: ${cvData.skills.all.slice(0, 10).join(', ')}`);
  console.log('');

  console.log('🚀 Projects:');
  cvData.projects.forEach((proj, i) => {
    console.log(`   ${i + 1}. ${proj.name}: ${proj.description.substring(0, 60)}...`);
  });
  console.log('');

  console.log('🔍 Extracted Keywords:');
  console.log(`   ${cvData.keywords.join(', ')}`);
  console.log('');

  console.log('🎯 Recommended Job Search Keywords:');
  const searchKeywords = generateJobSearchKeywords(cvData);
  searchKeywords.forEach(kw => console.log(`   - ${kw}`));
  console.log('');

  console.log('📝 Application Form Data Preview:');
  const formData = generateApplicationFormData(cvData);
  Object.entries(formData).slice(0, 10).forEach(([key, value]) => {
    const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
    console.log(`   ${key}: ${displayValue}`);
  });
  console.log('');

  // Save parsed data
  const outputPath = path.join(__dirname, '..', 'cv-parsed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(cvData, null, 2), 'utf8');
  console.log('💾 Full parsed data saved to:', outputPath);
}
