const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Load local env vars when used from CLI or scripts.
// (Panel server and some scripts also load dotenv themselves, but this makes the module standalone.)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loadCvData(repoRoot) {
  // Prefer parsed CV data (structured) if present.
  const cvDataPath = path.join(repoRoot, 'data', 'cv-data.json');
  const parsed = readJsonIfExists(cvDataPath);
  if (parsed && typeof parsed === 'object') return parsed;
  return null;
}

function getOpenAIConfig(repoRoot) {
  // Priority:
  // 1) Environment variables (recommended)
  // 2) Panel AI config (data/ai-config.json) if user saved it there
  const envKey = process.env.OPENAI_API_KEY;
  const envBaseUrl = process.env.OPENAI_BASE_URL;
  const envModel = process.env.OPENAI_MODEL;

  let fileCfg = null;
  const aiCfgPath = path.join(repoRoot, 'data', 'ai-config.json');
  const fromFile = readJsonIfExists(aiCfgPath);
  if (fromFile && typeof fromFile === 'object') {
    fileCfg = fromFile;
  }

  const apiKeyRaw = envKey || (fileCfg && fileCfg.apiKey) || '';
  const baseURLRaw = envBaseUrl || (fileCfg && fileCfg.baseUrl) || 'https://api.openai.com/v1';
  const modelRaw = envModel || (fileCfg && fileCfg.model) || 'gpt-4o-mini';

  const apiKey = String(apiKeyRaw).trim();
  const baseURL = String(baseURLRaw).trim();
  const model = String(modelRaw).trim();
  const temperature = typeof (fileCfg && fileCfg.temperature) === 'number' ? fileCfg.temperature : 0.6;

  return { apiKey, baseURL, model, temperature };
}

function buildCoverLetterPrompt({ cvData, companyName, jobTitle, companyType, contactPerson, notes }) {
  const name = cvData?.personalInfo?.name || 'Muhammed Fasil PV';
  const location = cvData?.personalInfo?.location || 'Dubai, UAE';
  const email = cvData?.personalInfo?.email || 'faztrick@gmail.com';
  const phone = cvData?.personalInfo?.phone || '+971 555923545';
  const skills = Array.isArray(cvData?.skills) ? cvData.skills.slice(0, 12).join(', ') : '';

  // Use 2-3 strong bullets if available
  const projects = Array.isArray(cvData?.projects) ? cvData.projects.slice(0, 3) : [];
  const projectBullets = projects
    .map(p => {
      const title = p.name || p.title || 'Project';
      const desc = p.description || '';
      return `- ${title}${desc ? `: ${desc}` : ''}`;
    })
    .join('\n');

  const contactLine = contactPerson ? `Dear ${contactPerson},` : 'Dear Hiring Manager,';

  return `Write a professional cover letter for a job application.

Candidate:
- Name: ${name}
- Location: ${location}
- Email: ${email}
- Phone: ${phone}
- Top skills: ${skills || 'Flutter, Node.js, React, Python, APIs, CI/CD'}
- Notable projects (if useful):\n${projectBullets || '- IdolMEA ERP: enterprise ERP used across GCC branches\n- AI Self-Checkout kiosk showcased at Gitex Dubai 2024'}

Target role:
- Company: ${companyName}
- Role: ${jobTitle}
- Company type/context: ${companyType || 'Technology'}
- Extra notes/context: ${notes || '(none)'}

Requirements:
- 180–280 words
- UAE-friendly, direct and confident (not desperate)
- Mention 2–3 relevant strengths aligned to a modern software role (Flutter + full-stack + integrations)
- Avoid salary, visa details, and overly senior-only phrasing
- End with a short call-to-action for an interview
- Output plain text only
- Start with: "${contactLine}"`;
}

async function generateCoverLetterWithOpenAIAsync({ companyName, jobTitle, companyType, contactPerson, notes }) {
  const repoRoot = path.join(__dirname, '..');
  const cfg = getOpenAIConfig(repoRoot);

  if (!cfg.apiKey) {
    throw new Error('OPENAI_API_KEY is not set (and no saved AI config found).');
  }

  const cvData = loadCvData(repoRoot);
  const prompt = buildCoverLetterPrompt({
    cvData,
    companyName,
    jobTitle,
    companyType,
    contactPerson,
    notes
  });

  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL
  });

  const requestBase = {
    model: cfg.model,
    messages: [
      { role: 'system', content: 'You are an expert career writer. Write concise, high-quality cover letters.' },
      { role: 'user', content: prompt }
    ],
    temperature: cfg.temperature
  };

  // Some newer models (e.g., GPT-5.x) require `max_completion_tokens`.
  // Older chat-completions models accept `max_tokens`.
  let resp;
  try {
    resp = await client.chat.completions.create({
      ...requestBase,
      max_completion_tokens: 450
    });
  } catch (e) {
    const msg = String(e?.message || e || '');
    if (msg.toLowerCase().includes('max_completion_tokens')) {
      // If the API complains about max_completion_tokens, retry legacy param.
      resp = await client.chat.completions.create({
        ...requestBase,
        max_tokens: 450
      });
    } else if (msg.toLowerCase().includes('max_tokens')) {
      // If the API complains about max_tokens, retry new param.
      resp = await client.chat.completions.create({
        ...requestBase,
        max_completion_tokens: 450
      });
    } else {
      throw e;
    }
  }

  return (resp.choices?.[0]?.message?.content || '').trim();
}

module.exports = {
  getOpenAIConfig,
  generateCoverLetterWithOpenAIAsync
};
