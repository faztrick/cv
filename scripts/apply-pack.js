#!/usr/bin/env node

/**
 * Application Pack Generator
 * - Selects the best resume variant for a track
 * - Generates a company/role-specific cover letter from an existing template
 * - Writes a short pack summary markdown (what to submit + quick answers)
 *
 * This is intentionally lightweight and safe: it doesn't auto-apply anywhere.
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = { _: [] };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a) continue;

    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith('-')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
      continue;
    }

    if (a.startsWith('-')) {
      const key = a.slice(1);
      const next = args[i + 1];
      if (!next || next.startsWith('-')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
      continue;
    }

    out._.push(a);
  }

  return out;
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function repoPath(...parts) {
  return path.join(__dirname, '..', ...parts);
}

function loadText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function formatDateISO(d = new Date()) {
  return d.toISOString().split('T')[0];
}

function resolveTrack(trackRaw) {
  const t = String(trackRaw || '').trim().toLowerCase();
  if (!t) return 'react';

  if (['flutter', 'dart', 'mobile'].includes(t)) return 'flutter';
  if (['react', 'frontend', 'fullstack-react'].includes(t)) return 'react';
  if (['dotnet', '.net', 'csharp', 'c#', 'wpf'].includes(t)) return 'dotnet';
  if (['node', 'nodejs', 'backend', 'typescript', 'ts'].includes(t)) return 'node';

  return t;
}

function getTrackAssets(track) {
  const templates = {
    flutter: repoPath('cover-letters', 'cover-letter-flutter-fullstack.md'),
    react: repoPath('cover-letters', 'cover-letter-react-fullstack.md'),
    dotnet: repoPath('cover-letters', 'cover-letter-dotnet-fullstack.md'),
    node: repoPath('cover-letters', 'cover-letter-nodejs-backend.md')
  };

  const resumes = {
    flutter: repoPath('resumes', 'variants', 'resume-flutter-fullstack.md'),
    react: repoPath('resumes', 'variants', 'resume-react-fullstack.md'),
    dotnet: repoPath('resumes', 'variants', 'resume-dotnet-fullstack.md'),
    node: repoPath('resumes', 'variants', 'resume-nodejs-backend.md')
  };

  const techStack = {
    flutter: 'Flutter (MVVM), Dart, Node.js/Express, REST APIs, JWT/OAuth2, MQTT, Docker, CI/CD',
    react: 'React, TypeScript, Node.js/Express, REST APIs, JWT/OAuth2, Docker, CI/CD',
    dotnet: 'C#, .NET, WPF (MVVM), SQL/MySQL, integrations, diagnostics',
    node: 'Node.js, TypeScript, REST APIs, JWT/OAuth2, MySQL, MQTT/event-driven, Docker, CI/CD'
  };

  return {
    templatePath: templates[track],
    resumePath: resumes[track],
    techStack: techStack[track] || ''
  };
}

function applyReplacements(template, replacements) {
  let out = template;
  for (const [key, val] of Object.entries(replacements)) {
    const token = `{{${key}}}`;
    out = out.split(token).join(val);
  }
  return out;
}

function printUsage() {
  console.log('\n📦 Application Pack Generator');
  console.log('');
  console.log('Usage:');
  console.log('  npm run apply-pack -- --track react --company "Careem" --role "Senior Software Engineer" --jobUrl "https://..."');
  console.log('');
  console.log('Options:');
  console.log('  --track   flutter | react | dotnet | node (default: react)');
  console.log('  --company Company name');
  console.log('  --role    Role title');
  console.log('  --jobUrl  Job link');
  console.log('  --team    Team/product (optional)');
  console.log('  --hiring  Hiring manager name/team (optional)');
  console.log('  --outDir  Output directory root (optional)');
  console.log('');
  console.log('Notes:');
  console.log('  - This generates files only (cover letter + pack summary).');
  console.log('  - It does not submit applications or require credentials.');
  console.log('');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  const track = resolveTrack(args.track || args.t);
  const company = String(args.company || args.c || '').trim() || 'COMPANY_NAME';
  const role = String(args.role || args.r || '').trim() || 'ROLE_TITLE';
  const jobUrl = String(args.jobUrl || args.jobURL || args.url || '').trim() || 'JOB_URL';
  const team = String(args.team || '').trim() || 'TEAM_OR_PRODUCT';
  const hiring = String(args.hiring || '').trim() || 'Hiring Manager';

  const assets = getTrackAssets(track);
  if (!assets.templatePath || !fs.existsSync(assets.templatePath)) {
    console.error(`❌ No cover letter template found for track: ${track}`);
    console.error('   Expected one of: flutter, react, dotnet, node');
    process.exit(1);
  }

  if (!assets.resumePath || !fs.existsSync(assets.resumePath)) {
    console.error(`❌ No resume variant found for track: ${track}`);
    console.error(`   Missing: ${assets.resumePath || '(unknown path)'}`);
    process.exit(1);
  }

  const outRoot = args.outDir ? path.resolve(args.outDir) : repoPath('docs', 'application-packs', 'generated');
  const coverOutDir = repoPath('cover-letters', 'generated');

  const date = formatDateISO();
  const slug = `${slugify(company)}-${slugify(role)}-${track}-${date}`.replace(/^-|-$/g, '');

  const template = loadText(assets.templatePath);
  const rendered = applyReplacements(template, {
    COMPANY_NAME: company,
    ROLE_TITLE: role,
    JOB_URL: jobUrl,
    TEAM_OR_PRODUCT: team,
    HIRING_MANAGER_NAME_OR_TEAM: hiring
  });

  const coverLetterPath = path.join(coverOutDir, `${slug}.md`);
  writeText(coverLetterPath, rendered);

  const packSummaryPath = path.join(outRoot, `${slug}.md`);
  const packSummary = `# Application Pack — ${company} — ${role}\n\n` +
    `**Track:** ${track}\n\n` +
    `## Files to submit\n\n` +
    `- **Resume (variant):** ${path.relative(repoPath(), assets.resumePath)}\n` +
    `- **Cover letter:** ${path.relative(repoPath(), coverLetterPath)}\n\n` +
    `## Job link\n\n` +
    `${jobUrl}\n\n` +
    `## Suggested tech stack line\n\n` +
    `${assets.techStack || '(add tech stack)'}\n\n` +
    `## Quick copy/paste answers\n\n` +
    `Use: ${path.relative(repoPath(), repoPath('docs', 'APPLICATION-ANSWERS-TEMPLATES.md'))}\n\n` +
    `### Short summary\n\n` +
    `Dubai-based engineer with **13+ years** delivering enterprise platforms (ERP/POS/QMS) and automation systems. Strong full-stack execution across **${assets.techStack || '{{TECH_STACK}}'}**, with a pragmatic focus on reliability, maintainability, and shipping.\n\n` +
    `### Why this role\n\n` +
    `I’m interested in **${role}** because it combines hands-on delivery with real product ownership. I enjoy building end-to-end features that are production-ready—clean interfaces, stable services, and measurable improvements for users.\n\n` +
    `### Why ${company}\n\n` +
    `${company} stands out because of (1) the product/mission and (2) the engineering challenges at scale. I’d like to contribute by helping deliver a reliable, maintainable platform that supports real operational workflows.\n\n` +
    `---\n\n` +
    `Generated on ${date}.\n`;

  writeText(packSummaryPath, packSummary);

  console.log('✅ Application pack generated');
  console.log(`   Resume:       ${path.relative(repoPath(), assets.resumePath)}`);
  console.log(`   Cover letter: ${path.relative(repoPath(), coverLetterPath)}`);
  console.log(`   Pack summary: ${path.relative(repoPath(), packSummaryPath)}`);
  console.log('');
  console.log('Next: paste the job description and I can tailor bullets + skills to match the posting exactly.');
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('❌ Failed to generate application pack');
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
}
