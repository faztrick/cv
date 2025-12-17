const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function safeReadText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function loadResumeText(repoRoot) {
  // Prefer the software-focused version if present.
  const preferred = path.join(repoRoot, 'resumes', 'resume-fasil-software-focused.md');
  const fallback = path.join(repoRoot, 'resumes', 'resume.md');

  if (fs.existsSync(preferred)) return safeReadText(preferred);
  if (fs.existsSync(fallback)) return safeReadText(fallback);
  return '';
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Builds a body text file for outreach emails.
 *
 * - baseEmailPath: existing generated email content
 * - includeCoverLetterAI: generates a cover letter using OpenAI and embeds it
 * - includeCV: embeds a plain-text/markdown resume
 *
 * Returns path to the generated body file.
 */
function buildInlineBodyForOutreach({ company, subject, baseEmailPath, includeCV, includeCoverLetterAI }) {
  const repoRoot = path.join(__dirname, '..');
  const outDir = path.join(repoRoot, 'emails', 'outreach-inline');
  ensureDir(outDir);

  const base = safeReadText(baseEmailPath);
  if (!base.trim()) {
    throw new Error('Base email content is empty.');
  }

  let coverLetter = '';
  if (includeCoverLetterAI) {
    const cliPath = path.join(repoRoot, 'scripts', 'outreach-openai-cover-letter-cli.js');
    const r = spawnSync('node', [
      cliPath,
      '--company', String(company.name || ''),
      '--role', String(company.jobTitle || ''),
      '--type', String(company.type || ''),
      '--contact', String(company.contactPerson || ''),
      '--notes', String(company.notes || '')
    ], { cwd: repoRoot, encoding: 'utf8' });

    if (r.stdout) coverLetter = String(r.stdout).trim();
    if (r.status !== 0) {
      const msg = (r.stderr || '').trim() || `exit code ${r.status}`;
      throw new Error(msg);
    }
  }

  const resumeText = includeCV ? loadResumeText(repoRoot) : '';

  const parts = [];

  // Keep the base email message first.
  // `send_email.py` strips Subject/To/From headers if present; we leave them as-is.
  parts.push(base.trim());

  if (coverLetter && coverLetter.trim()) {
    parts.push('\n\n---\n');
    parts.push('COVER LETTER\n');
    parts.push(coverLetter.trim());
  }

  if (resumeText && resumeText.trim()) {
    // Avoid massive sends: keep a reasonable maximum size for the inline CV.
    const maxChars = 12000; // ~ a few pages in plain text
    const clipped = resumeText.length > maxChars ? (resumeText.slice(0, maxChars) + '\n\n[...CV truncated for email size...]') : resumeText;

    parts.push('\n\n---\n');
    parts.push('CV (TEXT VERSION)\n');
    parts.push(clipped.trim());
  }

  const safeCompany = String(company.name || 'company').replace(/[^a-z0-9\-_.]+/gi, '_').slice(0, 60);
  const safeId = String(company.id || Date.now());
  const outPath = path.join(outDir, `inline_${safeId}_${safeCompany}.txt`);
  fs.writeFileSync(outPath, parts.join('\n'), 'utf8');
  return outPath;
}

module.exports = {
  buildInlineBodyForOutreach
};
