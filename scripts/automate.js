#!/usr/bin/env node

/**
 * Job Search Automation Orchestrator (safe mode)
 *
 * Goals:
 * - Ingest existing scraped results (CSV)
 * - Score and shortlist using your CV skills (SkillsJobMatcher)
 * - Append new items to job-tracker-uae.csv (no duplicates)
 * - Generate job packs (cover letter + pack summary) for top N
 *
 * Non-goals:
 * - This does NOT auto-submit applications.
 * - This does NOT log in or scrape new pages.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { SkillsJobMatcher } = require('./skills-job-matcher');

function repoPath(...parts) {
  return path.join(__dirname, '..', ...parts);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatDateISO(d = new Date()) {
  return d.toISOString().split('T')[0];
}

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

// Minimal CSV parser: handles commas inside quotes and escaped quotes ""
function parseCsv(content) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (ch === '\n') {
      row.push(cell);
      cell = '';
      // ignore empty trailing line
      if (row.some(v => String(v).trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    if (ch === '\r') {
      continue;
    }

    cell += ch;
  }

  // Last cell
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some(v => String(v).trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function toCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function loadJobsFromSearchCsv(csvPath) {
  if (!fs.existsSync(csvPath)) return [];

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) return [];

  const header = rows[0].map(h => String(h || '').trim());
  const idx = (name) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

  const titleI = idx('Title');
  const companyI = idx('Company');
  const locationI = idx('Location');
  const platformI = idx('Platform');
  const urlI = idx('URL');
  const dateI = idx('Date Scraped');

  const jobs = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const job = {
      title: titleI >= 0 ? (row[titleI] || '').trim() : '',
      company: companyI >= 0 ? (row[companyI] || '').trim() : '',
      location: locationI >= 0 ? (row[locationI] || '').trim() : '',
      platform: platformI >= 0 ? (row[platformI] || '').trim() : '',
      url: urlI >= 0 ? (row[urlI] || '').trim() : '',
      scrapedDate: dateI >= 0 ? (row[dateI] || '').trim() : ''
    };

    if (!job.title && !job.url) continue;
    jobs.push(job);
  }

  return jobs;
}

function loadTrackerUrls(trackerCsvPath) {
  if (!fs.existsSync(trackerCsvPath)) return new Set();
  const rows = parseCsv(fs.readFileSync(trackerCsvPath, 'utf8'));
  if (rows.length < 2) return new Set();

  const header = rows[0].map(h => String(h || '').trim());
  const urlI = header.findIndex(h => h.toLowerCase() === 'url');
  if (urlI === -1) return new Set();

  const urls = new Set();
  for (let i = 1; i < rows.length; i++) {
    const url = String(rows[i][urlI] || '').trim();
    if (url) urls.add(url);
  }
  return urls;
}

function appendTrackerRows(trackerCsvPath, rowsToAppend) {
  if (!rowsToAppend.length) return { appended: 0 };

  const header = ['date', 'source', 'company', 'role', 'location', 'url', 'posted', 'match_notes', 'status'];

  if (!fs.existsSync(trackerCsvPath)) {
    ensureDir(path.dirname(trackerCsvPath));
    fs.writeFileSync(trackerCsvPath, `${header.join(',')}\n`, 'utf8');
  }

  const lines = rowsToAppend.map(r => header.map(h => toCsvCell(r[h] ?? '')).join(',')).join('\n');
  fs.appendFileSync(trackerCsvPath, lines + '\n', 'utf8');
  return { appended: rowsToAppend.length };
}

// Keep this strict: we want *software* roles, not generic “engineer”.
const INCLUDE_RE = /(software|developer|architect|full\s*stack|backend|frontend|mobile|flutter|react|node|typescript|javascript|python|ai|ml|iot|devops|cloud|solutions|platform|sre|site reliability|data\s+engineer|automation)/i;
const EXCLUDE_RE = /(electrical|mep|mechanical|civil|generator|technician|trainee\s+engineer|helpdesk|instrumentation|structures|security\s*guard|driver|nurse)/i;

function computeRoleRelevanceScore(title) {
  const t = String(title || '').toLowerCase();
  if (!t) return 0;

  // Weighted signals; keep simple and transparent.
  const signals = [
    { re: /software/, w: 4 },
    { re: /architect|solutions\s+architect|solution\s+architect/, w: 4 },
    { re: /full\s*stack|backend|frontend/, w: 3 },
    { re: /react|typescript|node(\.js)?|javascript/, w: 3 },
    { re: /flutter|dart|mobile/, w: 3 },
    { re: /\.net|dotnet|c#|wpf|mvvm/, w: 3 },
    { re: /ai|ml|machine\s+learning|genai|llm|computer\s+vision/, w: 3 },
    { re: /iot|mqtt|embedded|esp32/, w: 2 },
    { re: /devops|sre|site\s+reliability|platform/, w: 2 },
    { re: /automation/, w: 1 }
  ];

  let score = 0;
  for (const s of signals) {
    if (s.re.test(t)) score += s.w;
  }
  return score;
}

function shortlistAndScore(jobs, matcher, options = {}) {
  const {
    minScore = 20,
    max = 15,
    minRoleRelevance = 4
  } = options;

  const scored = jobs
    .filter(j => j && (j.title || j.url))
    .filter(j => INCLUDE_RE.test(j.title || '') && !EXCLUDE_RE.test(j.title || ''))
    .map(j => {
      const match = matcher.matchJobDescription(`${j.title || ''} ${j.company || ''}`);
      const roleRelevance = computeRoleRelevanceScore(j.title);
      return {
        ...j,
        matchScore: match.score,
        matchRecommendation: match.recommendation,
        matchedSkills: match.matchedSkills || [],
        roleRelevance
      };
    })
    .filter(j => j.matchScore >= minScore && j.roleRelevance >= minRoleRelevance)
    .sort((a, b) => (b.matchScore - a.matchScore) || (b.roleRelevance - a.roleRelevance) || String(a.company).localeCompare(String(b.company)));

  return scored.slice(0, max);
}

function writeShortlistMarkdown(outPath, shortlisted) {
  ensureDir(path.dirname(outPath));

  const lines = [];
  lines.push(`# Job Shortlist — ${formatDateISO()}`);
  lines.push('');
  lines.push(`Total shortlisted: **${shortlisted.length}**`);
  lines.push('');
  lines.push('| # | Score | Company | Role | Platform | Location | Link |');
  lines.push('|---:|---:|---|---|---|---|---|');

  shortlisted.forEach((j, i) => {
    const link = j.url ? `[open](${j.url})` : '';
    lines.push(`| ${i + 1} | ${j.matchScore} | ${j.company || ''} | ${j.title || ''} | ${j.platform || ''} | ${j.location || ''} | ${link} |`);
  });

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Scores are computed from your CV skills vs the job title/company text (best-effort when full JD is not available).');
  lines.push('- For best results, open the job and copy the full job description into `jd.txt`, then run `npm run job-pack ... --jdFile .\\jd.txt`.');
  lines.push('');

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
}

function generatePacks(shortlisted, maxPacks = 5) {
  const take = shortlisted.slice(0, maxPacks);
  let ok = 0;

  for (const j of take) {
    try {
      execFileSync(
        process.execPath,
        [
          repoPath('scripts', 'job-pack.js'),
          '--company', j.company || 'Company',
          '--role', j.title || 'Role',
          '--jobUrl', j.url || 'JOB_URL',
          '--noEmail'
        ],
        { cwd: repoPath(), stdio: 'pipe' }
      );
      ok++;
    } catch (e) {
      // ignore individual failures
    }
  }

  return { generated: ok, attempted: take.length };
}

function printUsage() {
  console.log('\n🤖 Automation (Safe Mode)');
  console.log('');
  console.log('Usage:');
  console.log('  npm run automate -- --csv "data\\job-search-results.csv" --minScore 30 --minRoleRelevance 4 --max 15 --packs 5');
  console.log('');
  console.log('Options:');
  console.log('  --csv       Path to job search results CSV (default: data/job-search-results.csv)');
  console.log('  --minScore  Minimum match score (default: 20)');
  console.log('  --minRoleRelevance  Minimum role relevance (default: 4)');
  console.log('  --max       Max shortlisted jobs (default: 15)');
  console.log('  --packs     Generate packs for top N (default: 5)');
  console.log('  --noTrack   Do not append to job-tracker-uae.csv');
  console.log('  --noPacks   Do not generate packs');
  console.log('');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  const csvPath = args.csv
    ? (path.isAbsolute(args.csv) ? args.csv : path.resolve(repoPath(), args.csv))
    : repoPath('data', 'job-search-results.csv');

  const minScore = args.minScore ? Number(args.minScore) : 20;
  const max = args.max ? Number(args.max) : 15;
  const minRoleRelevance = args.minRoleRelevance ? Number(args.minRoleRelevance) : 4;
  const packs = args.packs ? Number(args.packs) : 5;

  const trackerPath = repoPath('data', 'job-tracker-uae.csv');

  const matcher = new SkillsJobMatcher();
  const jobs = loadJobsFromSearchCsv(csvPath);

  if (!jobs.length) {
    console.log('⚠️ No jobs found in CSV:', csvPath);
    console.log('   Tip: run a scrape first (e.g., job-agent search) or point --csv to an existing file.');
    process.exit(0);
  }

  const shortlisted = shortlistAndScore(jobs, matcher, { minScore, max, minRoleRelevance });

  // Write shortlist outputs
  const date = formatDateISO();
  const mdOut = repoPath('docs', 'shortlists', 'generated', `${date}-shortlist.md`);
  const jsonOut = repoPath('data', 'shortlist-latest.json');

  writeShortlistMarkdown(mdOut, shortlisted);
  fs.writeFileSync(jsonOut, JSON.stringify(shortlisted, null, 2), 'utf8');

  // Append to tracker (dedupe by URL)
  let trackerAppended = 0;
  if (!args.noTrack) {
    const existingUrls = loadTrackerUrls(trackerPath);

    const rowsToAppend = shortlisted
      .filter(j => j.url && !existingUrls.has(j.url))
      .map(j => ({
        date,
        source: j.platform || 'Unknown',
        company: j.company || '',
        role: j.title || '',
        location: j.location || '',
        url: j.url || '',
        posted: j.scrapedDate || '',
        match_notes: `score=${j.matchScore}; skills=${(j.matchedSkills || []).slice(0, 8).join(' | ')}`,
        status: 'to-apply'
      }));

    const r = appendTrackerRows(trackerPath, rowsToAppend);
    trackerAppended = r.appended;
  }

  // Generate packs
  let packResult = { generated: 0, attempted: 0 };
  if (!args.noPacks) {
    packResult = generatePacks(shortlisted, Number.isFinite(packs) ? packs : 5);
  }

  console.log('✅ Automation complete (safe mode)');
  console.log(`   Shortlist:      ${path.relative(repoPath(), mdOut)}`);
  console.log(`   Shortlist JSON: ${path.relative(repoPath(), jsonOut)}`);
  if (!args.noTrack) {
    console.log(`   Tracker appended: ${trackerAppended} row(s)`);
  } else {
    console.log('   Tracker appended: (skipped)');
  }
  if (!args.noPacks) {
    console.log(`   Packs generated:  ${packResult.generated}/${packResult.attempted}`);
  } else {
    console.log('   Packs generated:  (skipped)');
  }

  console.log('');
  console.log('Next best step: open the top 1–3 jobs, copy the full JD into jd.txt, then run job-pack with --jdFile for ATS-perfect tailoring.');
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('❌ Automation failed');
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
}
