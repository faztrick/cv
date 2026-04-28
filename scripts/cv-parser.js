#!/usr/bin/env node

/**
 * CV Parser - Extract structured data from resume.md
 * Parses Muhammed Fasil PV's resume to extract skills, experience, projects, and keywords
 * for automated job matching and application form filling
 */

const fs = require('fs');
const path = require('path');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getArgValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const val = args[idx + 1];
  if (!val || val.startsWith('-')) return null;
  return val;
}

function hasFlag(args, ...names) {
  return names.some(n => args.includes(n));
}

function resolveRepoPath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  // Resolve relative to repo root (one level above scripts/)
  return path.resolve(__dirname, '..', p);
}

function normalizeSkillsForPanel(skills) {
  const set = new Set((skills || []).filter(Boolean));
  // Preserve common synonyms used elsewhere in the repo
  if (set.has('React') && !set.has('React.js')) set.add('React.js');
  return Array.from(set);
}

const KNOWN_SKILLS = [
  // Core
  'Flutter', 'Dart', 'React', 'React.js', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'C#', 'Kotlin', 'WPF',
  // AI
  'OpenAI', 'LangChain', 'Qwen3', 'YOLO', 'Whisper', 'TensorFlow', 'PyTorch',
  // IoT / Real-time
  'IoT', 'ESP32', 'ESP-S3', 'Raspberry Pi', 'Arduino', 'MQTT',
  // DevOps / Cloud
  'Docker', 'Kubernetes', 'PM2', 'Nginx', 'AWS', 'Azure', 'GCP', 'Cloudflare',
  // Data
  'MySQL', 'MongoDB', 'Firebase', 'Hive', 'ObjectBox',
  // Networking
  'MikroTik', 'WireGuard'
];

function extractCanonicalSkills(cvData) {
  const parts = [];
  if (cvData?.summary) parts.push(cvData.summary);
  if (Array.isArray(cvData?.keywords)) parts.push(cvData.keywords.join(' '));
  if (Array.isArray(cvData?.skills?.all)) parts.push(cvData.skills.all.join(' '));
  if (Array.isArray(cvData?.skills?.languages)) parts.push(cvData.skills.languages.join(' '));
  if (Array.isArray(cvData?.skills?.frameworks)) parts.push(cvData.skills.frameworks.join(' '));

  const haystack = parts.join(' ').toLowerCase();
  const out = [];
  for (const skill of KNOWN_SKILLS) {
    if (haystack.includes(skill.toLowerCase())) out.push(skill);
  }

  // Add a couple of helpful derived tokens
  if (out.includes('React') && !out.includes('React.js')) out.push('React.js');
  return Array.from(new Set(out));
}

function splitCompanyAndLocation(companyRaw) {
  if (!companyRaw) return { company: '', location: '' };
  const m = companyRaw.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (m) {
    return { company: m[1].trim(), location: m[2].trim() };
  }
  return { company: companyRaw.trim(), location: '' };
}

function syncToPanelCvData(cvData, options = {}) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const panelPath = path.join(dataDir, 'cv-data.json');
  const existing = fs.existsSync(panelPath)
    ? JSON.parse(fs.readFileSync(panelPath, 'utf8'))
    : {};

  const phoneDigits = (cvData?.personal?.phone || '').replace(/\D/g, '');
  const whatsapp = phoneDigits ? `https://wa.me/${phoneDigits}` : (existing?.personalInfo?.whatsapp || '');

  const mappedExperience = (cvData?.experience || []).map(exp => {
    const { company, location } = splitCompanyAndLocation(exp.company);
    return {
      role: exp.title || '',
      company: company,
      location: location,
      duration: exp.period || '',
      description: (exp.responsibilities || []).join(' ')
    };
  });

  const updated = {
    ...existing,
    yearsOfExperience: existing?.yearsOfExperience || 13,
    personalInfo: {
      ...(existing.personalInfo || {}),
      name: cvData?.personal?.name || existing?.personalInfo?.name || '',
      title: cvData?.personal?.title || existing?.personalInfo?.title || '',
      email: cvData?.personal?.email || existing?.personalInfo?.email || '',
      phone: cvData?.personal?.phone || existing?.personalInfo?.phone || '',
      location: cvData?.personal?.location || existing?.personalInfo?.location || '',
      linkedin: cvData?.personal?.linkedin || existing?.personalInfo?.linkedin || '',
      github: cvData?.personal?.github || existing?.personalInfo?.github || '',
      portfolio: cvData?.personal?.website || existing?.personalInfo?.portfolio || '',
      website: cvData?.personal?.website || existing?.personalInfo?.website || undefined,
      whatsapp
    },
    summary: cvData?.summary || existing?.summary || '',
    skills: extractCanonicalSkills(cvData).length
      ? extractCanonicalSkills(cvData)
      : normalizeSkillsForPanel(existing?.skills || []),
    experience: mappedExperience.length ? mappedExperience : (existing?.experience || []),
    highlights: Array.isArray(existing?.highlights)
      ? existing.highlights.map(h => typeof h === 'string' ? h.replace(/\b10\+\s*years\b/gi, '13+ years') : h)
      : (existing?.highlights || []),
    availability: existing?.availability || {
      status: 'Available Immediately',
      visa: 'Valid UAE Work Visa',
      location: cvData?.personal?.location || 'Dubai, UAE'
    }
  };

  // Avoid clobbering curated projects unless explicitly requested
  if (options.syncProjects === true) {
    updated.projects = (cvData?.projects || []).map(p => ({
      name: p.name,
      description: p.description
    }));
  }

  fs.writeFileSync(panelPath, JSON.stringify(updated, null, 2), 'utf8');
  return panelPath;
}

/**
 * Extract a markdown section body by its H2 heading text.
 *
 * Supports headings like:
 *   "## Professional Summary"
 *   "## 🧩 Professional Summary"
 */
function extractSection(content, headingText) {
  const headingRegex = new RegExp(
    `^##\\s*(?:[^A-Za-z0-9\\n]+\\s*)?${escapeRegExp(headingText)}\\s*$`,
    'im'
  );

  const match = headingRegex.exec(content);
  if (!match) return null;

  const afterHeadingIndex = match.index + match[0].length;
  const rest = content.slice(afterHeadingIndex);
  const nextHeadingIndex = rest.search(/^##\s+/m);

  const sectionBody = nextHeadingIndex === -1 ? rest : rest.slice(0, nextHeadingIndex);
  return sectionBody.trim();
}

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

  // Extract contact info (supports emoji or label-based formats)
  const locationMatch = content.match(/^(?:📍\s*|Location:\s*)([^|\n]+)/mi);
  if (locationMatch) personal.location = locationMatch[1].trim();

  const phoneMatch = content.match(/^(?:📞\s*|Phone:\s*)([+\d\s\-().]+)/mi);
  if (phoneMatch) personal.phone = phoneMatch[1].trim();

  // Fallback: ATS-style single-line contact block
  // Example: "Dubai, UAE | +971 555... | email@domain"
  if (!personal.location || !personal.phone) {
    const contactLineMatch = content.match(
      /^\s*([^|\n]+?)\s*\|\s*([+\d\s\-().]{7,})\s*\|\s*(?:\[)?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})(?:\])?/im
    );
    if (contactLineMatch) {
      if (!personal.location) personal.location = contactLineMatch[1].trim();
      if (!personal.phone) personal.phone = contactLineMatch[2].trim();
      if (!personal.email) personal.email = contactLineMatch[3].trim();
    }
  }

  // Email: prefer markdown mailto, fall back to first email in the doc
  const emailMatch = content.match(/mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
    || content.match(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i);
  if (emailMatch) personal.email = emailMatch[1].trim();

  // Website/portfolio: prefer explicit https link
  const websiteMatch = content.match(/(?:🌐|Website:|Portfolio:)\s*\[?(https?:\/\/[^\s\]]+)/i)
    || content.match(/\bhttps?:\/\/[^\s\]]+/i);
  if (websiteMatch) personal.website = websiteMatch[1].trim();

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
  const section = extractSection(content, 'Professional Summary');
  if (!section) return '';
  return section.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
}

function splitSkillItems(raw) {
  if (!raw) return [];

  // Keep common compound tokens intact
  const protectedRaw = raw.replace(/\bCI\/CD\b/g, 'CI-CD');

  // First pass split on commas / pipes / semicolons
  const primary = protectedRaw
    .split(/[,|;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Second pass split tokens like "AWS/Azure/GCP" but avoid over-splitting
  const out = [];
  for (const token of primary) {
    const t = token.trim();
    if (!t) continue;

    // Split on slashes only when it looks like a list token, not a phrase
    if (t.includes('/') && t !== 'CI-CD') {
      const slashParts = t.split('/').map(p => p.trim()).filter(Boolean);
      if (slashParts.length > 1 && slashParts.every(p => p.length <= 30)) {
        out.push(...slashParts);
        continue;
      }
    }

    out.push(t);
  }

  return out
    .map(s => s.replace(/\bCI-CD\b/g, 'CI/CD'))
    .map(s => s.replace(/^[-•\s]+/, '').trim())
    .filter(Boolean);
}

function categorizeCompetencyLabel(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('ai') || l.includes('ml')) return 'ai';
  if (l.includes('iot') || l.includes('edge') || l.includes('real-time') || l.includes('realtime')) return 'iot';
  if (l.includes('network')) return 'networking';
  if (l.includes('cloud') || l.includes('devops') || l.includes('infra')) return 'cloud';
  if (l.includes('data') || l.includes('database')) return 'database';
  if (l.includes('automation')) return 'automation';
  if (l.includes('backend') || l.includes('frontend') || l.includes('mobile') || l.includes('framework') || l.includes('.net') || l.includes('desktop')) return 'frameworks';
  return null;
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
  const competencies = extractSection(content, 'Core Competencies');
  if (competencies) {
    // Parse bullet lines like: "- **Backend:** Node.js/Express, REST APIs, ..."
    const bulletRegex = /\*\*([^*]+)\*\*\s*:\s*([^\n]+)/g;
    let m;
    while ((m = bulletRegex.exec(competencies)) !== null) {
      const label = (m[1] || '').trim();
      const itemsText = (m[2] || '').trim();
      const items = splitSkillItems(itemsText);
      const category = categorizeCompetencyLabel(label);

      if (category && Array.isArray(skills[category])) skills[category].push(...items);
      skills.all.push(...items);
    }
  }

  // Extract from Technical Skills table
  const tableContent = extractSection(content, 'Technical Skills');
  if (tableContent) {
    // Capture any table row values (not just Languages/Frameworks)
    const lines = tableContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|')) continue;
      if (/^\|\s*-+\s*\|/.test(trimmed)) continue; // separator row

      const cols = trimmed.split('|').map(c => c.trim()).filter(Boolean);
      // Expected: [Category, Value]
      if (cols.length < 2) continue;

      const key = cols[0].replace(/\*\*/g, '').trim().toLowerCase();
      const value = cols.slice(1).join(' | ').replace(/\*\*/g, '').trim();

      // Skip header row like: "| Category | Tools / Technologies |"
      if (key === 'category' && /tools\s*\//i.test(value)) {
        continue;
      }

      const items = splitSkillItems(value);

      if (key === 'languages') {
        skills.languages.push(...items);
      } else if (key === 'frameworks' || key === 'frontend' || key === 'frontend/mobile' || key === 'frontend/mobile' || key === 'desktop' || key === 'backend') {
        skills.frameworks.push(...items);
      }

      skills.all.push(...items);
    }
  }

  // Extract from Keywords (ATS) section (common in variants)
  const atsKeywords = extractSection(content, 'Keywords (ATS)') || extractSection(content, 'Keywords');
  if (atsKeywords) {
    const items = splitSkillItems(atsKeywords.replace(/\n/g, ' '));
    skills.all.push(...items);
  }

  // Remove duplicates
  skills.all = [...new Set(skills.all.map(s => s.trim()).filter(Boolean))];

  return skills;
}

/**
 * Extract work experience
 */
function extractExperience(content) {
  const experience = [];
  const expSection = extractSection(content, 'Professional Experience');

  if (expSection) {
    const jobs = expSection.split(/###\s+\*\*/).filter(Boolean);

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
  const projectsSection = extractSection(content, 'Major Projects');

  if (projectsSection) {
    const projectList = projectsSection.match(/- \*\*(.+?):\*\* (.+)/g);
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
  const eduSection = extractSection(content, 'Education');

  if (eduSection) {
    const degrees = eduSection.match(/###\s+(.+)/g);
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
    currentSalary: '10000 AED',
    noticePeriod: 'Immediately Available',

    // Work authorization
    workAuthorization: 'Currently in UAE on Visit Visa',
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
  const args = process.argv.slice(2);
  const resumeArg = getArgValue(args, '--resume') || getArgValue(args, '-r');
  const outArg = getArgValue(args, '--out');
  const syncData = hasFlag(args, '--sync-data', '--sync');
  const syncProjects = hasFlag(args, '--sync-projects');

  const resumePath = resolveRepoPath(resumeArg) || path.join(__dirname, '..', 'resumes', 'resume.md');

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
  const outputPath = resolveRepoPath(outArg) || path.join(__dirname, '..', 'cv-parsed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(cvData, null, 2), 'utf8');
  console.log('💾 Full parsed data saved to:', outputPath);

  if (syncData) {
    const panelPath = syncToPanelCvData(cvData, { syncProjects });
    console.log('🔄 Synced panel CV data to:', panelPath);
  }
}
