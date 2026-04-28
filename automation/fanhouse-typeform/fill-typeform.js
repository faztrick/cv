/*
  FanHouse Typeform auto-fill (runs on Windows, uses Playwright).

  What it does:
  - Opens the Typeform
  - Fills: Personal Info, GitHub, LinkedIn, Location
  - Uploads resume PDF
  - Handles all subsequent questions using "Best Method" robust selectors
  - Submits the form automatically

  Usage (from repo root):
    node automation/fanhouse-typeform/fill-typeform.js
*/

const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables
const { chromium } = require('playwright');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TYPEFORM_URL = 'https://highticketventures.typeform.com/to/wQUM9YF5?typeform-source=www.linkedin.com';

// --- Configuration & Data Loading ---

function safeFilename(input) {
  return String(input)
    .replace(/[^a-z0-9-_]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function snap(page, label) {
  const outDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${nowStamp()}_${safeFilename(label)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  // console.log(`[screenshot] ${file}`);
}

function loadCvData() {
  const cvPath = path.resolve(__dirname, '..', '..', 'data', 'cv-data.json');
  const raw = fs.readFileSync(cvPath, 'utf8');
  const json = JSON.parse(raw);
  const p = json.personalInfo || {};

  const fullName = (p.name || '').trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Muhammed';
  const lastName = parts.slice(1).join(' ') || 'Fasil PV';

  return {
    _raw: json,
    firstName,
    lastName,
    phone: p.phone || '',
    email: p.email || '',
    github: p.github || '',
    linkedin: p.linkedin || '',
    website: p.website || p.portfolio || '',
    portfolio: p.portfolio || p.website || '',
    location: p.location || 'Dubai, UAE',
  };
}

function loadAnswerOverrides() {
  const p = path.resolve(__dirname, 'answers.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn(`[warn] Failed to parse ${p}: ${e.message}`);
    return {};
  }
}

function normalizeText(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildDefaults(answers) {
  const cv = answers._raw || {};
  const years = cv.yearsOfExperience ?? 13;
  const availability = (cv.availability && cv.availability.status) || 'Available Immediately';

  const whyFanHouse = [
    `I’m looking for a founding-engineer environment where shipping a correct vertical slice matters more than ticket throughput.`,
    `I’ve built production ERP/POS/QMS platforms with real-time workflows, secure networking, and payment-like ledger patterns.`,
    `FanHouse’s focus on clean foundations (auth/roles, content gating, media handling, realtime, ledger) matches how I like to build.`
  ].join(' ');

  const stackFit = [
    `Frontend: Strong React + TypeScript; comfortable shipping Next.js (App Router) quickly with Tailwind/shadcn-style components.`,
    `Backend: Node.js/TypeScript services, REST APIs, auth/roles, media/file workflows.`,
    `Data: Strong relational modelling; can deliver Postgres cleanly; experienced with append-only ledger/event patterns.`,
    `Realtime: Built real-time systems (MQTT etc.) and can implement Ably presence/events confidently.`,
    `Infra: Docker, CI/CD, pragmatic deployment decisions.`
  ].join('\n');

  const rolePreference = `Backend-leaning Senior Engineer (full-stack capable).`;

  return {
    rolePreference,
    whyFanHouse,
    stackFit,
    yearsOfExperience: String(years),
    availability,
    timezone: 'UTC+4 (Dubai)',
    compensationNote: 'Open to market rate; happy to proceed with the paid test terms as described.',
  };
}

function resolveResumePath() {
  const candidate = path.resolve(__dirname, '..', '..', 'resumes', 'resume-fasil-software-2025.pdf');
  if (fs.existsSync(candidate)) return candidate;

  const fallbacks = [
    path.resolve(__dirname, '..', '..', 'resumes', 'resume-fasil-2025.pdf'),
    path.resolve(__dirname, '..', '..', 'resumes', 'resume-fasil-full-2025.pdf'),
  ];
  for (const p of fallbacks) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Resume PDF not found. Tried: ${[candidate, ...fallbacks].join(', ')}`);
}

// --- AI Helper ---

async function getAIAnswer(question, contextData) {
  try {
    console.log(`[ai] Generating answer for: "${question.slice(0, 50)}..."`);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant filling out a job application for a Senior Full Stack Engineer role.
          Use the following candidate context to answer the question professionally, concisely, and in the first person.

          Candidate Context:
          Name: ${contextData.firstName} ${contextData.lastName}
          Experience: ${contextData.yearsOfExperience} years
          Stack: React, Node.js, TypeScript, Postgres, AWS, Docker
          Location: ${contextData.location}

          Keep answers under 280 characters unless the question implies a longer response.
          Do not include "Answer:" prefix.`
        },
        {
          role: "user",
          content: `Question: ${question}`
        }
      ],
      max_tokens: 150,
    });

    const answer = completion.choices[0].message.content.trim();
    console.log(`[ai] Answer: "${answer}"`);
    return answer;
  } catch (error) {
    console.error(`[ai] Error generating answer: ${error.message}`);
    return "I am very interested in this role and have the relevant experience."; // Fallback
  }
}

// --- Automation Logic ---

async function getActiveBlock(page) {
  // Typeform uses data-qa-focused="true" for the active question container
  const focused = page.locator('[data-qa-focused="true"]').first();
  if (await focused.count()) return focused;
  return null;
}

async function clickOk(page, block) {
  try {
    // 1. Try OK button inside the block
    const okBtn = block.locator('button[data-qa*="ok-button"], button[data-qa="ok-button-visible"]').first();
    if (await okBtn.isVisible()) {
      // Force click to bypass potential overlays (like dropdowns)
      await okBtn.click({ force: true });
      return true;
    }

    // 2. Try generic OK button on page (sometimes floating)
    const globalOk = page.locator('button[data-qa*="ok-button"]').first();
    if (await globalOk.isVisible()) {
      await globalOk.click({ force: true });
      return true;
    }
  } catch (e) {
    console.log(`[typeform] Click OK failed: ${e.message}. Will try Enter.`);
  }

  return false;
}

async function pressEnter(page) {
  await page.keyboard.press('Enter');
}

async function handleTextQuestion(page, block, text) {
  // Try specific types first
  let input = block.locator('input[type="text"], textarea, input[type="email"], input[type="tel"], input[type="url"], input[type="number"]').first();
  if (await input.isVisible()) {
    await input.fill(text);
    return true;
  }

  // Try generic input (Typeform sometimes uses inputs without standard types or with dynamic types)
  // Exclude file inputs and radio/checkboxes
  input = block.locator('input:not([type="file"]):not([type="radio"]):not([type="checkbox"]), textarea').first();
  if (await input.isVisible()) {
      await input.fill(text);
      return true;
  }

  return false;
}

async function handleChoices(page, block, preferredOptions) {
  // Typeform choices usually have data-qa="choice-X-label" or similar
  // Or we can use role="radio" / role="checkbox" / role="button"

  // Normalize preferences
  const prefs = preferredOptions.map(normalizeText);

  // 1. Try standard radio/checkbox inputs
  const inputs = block.locator('input[type="radio"], input[type="checkbox"]');
  const count = await inputs.count();

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      // Get label text. Usually in a sibling or parent.
      // In Typeform, the label is often in a div with data-qa="choice-label"
      // We'll try to find the text associated with this input.
      // A robust way is to click the parent container that looks like an option.
      const container = input.locator('xpath=..');
      const text = normalizeText(await container.innerText());

      if (prefs.some(p => text.includes(p) || p.includes(text))) {
        await container.click();
        return true;
      }
    }
  }

  // 2. Try "button" choices (often used for single select)
  const buttons = block.locator('[role="button"], button').filter({ hasText: /\w+/ }); // Filter out icon-only buttons
  const btnCount = await buttons.count();

  for (let i = 0; i < btnCount; i++) {
    const btn = buttons.nth(i);
    const text = normalizeText(await btn.innerText());

    // Skip navigation buttons
    if (text === 'ok' || text === 'submit' || text === 'start' || text === 'back') continue;

    if (prefs.some(p => text.includes(p) || p.includes(text))) {
      await btn.click();
      return true;
    }
  }

  // 3. Fallback: Select the first available option if it's a required choice question
  // (Only if we are desperate, but let's avoid random clicking for now)
  return false;
}

async function handleDropdown(page, block, value) {
  // Typeform often uses a custom dropdown.
  // Look for a dropdown trigger.
  const trigger = block.locator('.choices, [class*="dropdown"]').first();
  if (await trigger.isVisible()) {
    await trigger.click();
    await page.keyboard.type(value);
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    return true;
  }
  return false;
}

async function handleUpload(page, block, filePath) {
  const input = block.locator('input[type="file"]').first();
  if (await input.count()) {
    await input.setInputFiles(filePath);
    // Wait for upload to complete? Typeform usually shows a progress bar.
    // We can wait for the "OK" button to become enabled or visible.
    await page.waitForTimeout(2000);
    return true;
  }
  return false;
}

async function handleMultiInputBlock(page, block, answers) {
  const inputs = block.locator('input, textarea');
  const count = await inputs.count();

  if (count === 0) return false;

  let filledAny = false;

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);

    // Skip hidden or file inputs here
    if (!(await input.isVisible()) || (await input.getAttribute('type')) === 'file') continue;

    // Determine what this input is for
    // 1. Check aria-label
    // 2. Check placeholder
    // 3. Check preceding label text
    const ariaLabel = normalizeText(await input.getAttribute('aria-label'));
    const placeholder = normalizeText(await input.getAttribute('placeholder'));

    // Get nearby text (label)
    // This is tricky in Typeform. Often the label is a sibling or parent's sibling.
    // We'll rely on aria-label and placeholder first, which are usually good in Typeform.

    const context = `${ariaLabel} ${placeholder}`;
    let valueToFill = null;

    if (context.includes('first name')) valueToFill = answers.firstName;
    else if (context.includes('last name')) valueToFill = answers.lastName;
    else if (context.includes('phone')) valueToFill = answers.phone;
    else if (context.includes('email')) valueToFill = answers.email;
    else if (context.includes('linkedin')) valueToFill = answers.linkedin;
    else if (context.includes('github')) valueToFill = answers.github;
    else if (context.includes('portfolio') || context.includes('website')) valueToFill = answers.portfolio;
    else if (context.includes('city') || context.includes('location')) valueToFill = answers.location;

    if (valueToFill) {
      await input.fill(valueToFill);
      filledAny = true;
    }
  }

  return filledAny;
}

async function run(headless = false) {
  const answers = loadCvData();
  const overrides = loadAnswerOverrides() || {};
  const defaults = { ...buildDefaults(answers), ...overrides };
  const resumePath = resolveResumePath();

  console.log('[typeform] Launching browser...');
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`[typeform] Navigating to ${TYPEFORM_URL}`);
  await page.goto(TYPEFORM_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click Start if present
  const startBtn = page.locator('button[data-qa="start-button"]');
  if (await startBtn.isVisible()) {
    console.log('[typeform] Clicking Start');
    await startBtn.click();
    await page.waitForTimeout(1000);
  }

  let steps = 0;
  const maxSteps = 50;

  while (steps < maxSteps) {
    steps++;
    await page.waitForTimeout(1000); // Stability wait

    // Check for Submit
    const submitBtn = page.locator('button[data-qa="submit-button"]');
    if (await submitBtn.isVisible()) {
      console.log('[typeform] Submit button found. Submitting...');
      await snap(page, 'pre_submit');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await snap(page, 'submitted');
      console.log('[typeform] Form submitted successfully.');
      break;
    }

    // Get Active Block
    const block = await getActiveBlock(page);
    if (!block) {
      console.log('[typeform] No active block found. Waiting...');
      await page.waitForTimeout(1000);
      continue;
    }

    // Check for Start/Continue Button inside the block or globally
    const startBtn = page.locator('button[data-qa="start-button"], button[data-qa="continue-button"]').first();
    if (await startBtn.isVisible()) {
        console.log('[typeform] Found Start/Continue button. Clicking...');
        await startBtn.click();
        await page.waitForTimeout(1000);
        continue;
    }

    // Identify Question
    const questionText = await block.innerText();
    const q = normalizeText(questionText);
    console.log(`[typeform] Step ${steps}: "${q.slice(0, 50)}..."`);
    // console.log(`[debug] q full: ${q}`);

    let handled = false;

    // --- Logic Mapping ---

    // 0. Video / Loom (High Priority)
    if (q.includes('video') || q.includes('loom')) {
        console.log('[typeform] Video question detected. Attempting to skip or fill placeholder...');

        // 1. Try text input (URL)
        const input = block.locator('input[type="text"], input[type="url"], textarea').first();
        if (await input.isVisible()) {
            console.log('[typeform] Found text input for video URL. Filling...');
            await input.fill('https://www.loom.com/share/placeholder-video-id');
            handled = true;
        }

        // 2. Try Skip button
        const skipBtn = block.locator('button').filter({ hasText: /skip/i }).first();
        if (await skipBtn.isVisible()) {
            console.log('[typeform] Found Skip button. Clicking...');
            await skipBtn.click();
            handled = true;
        }

        // 3. Try Continue/OK button directly
        if (!handled) {
             console.log('[typeform] No input/skip found. Trying to click OK/Next...');
             // handled will be false, so it will fall through to clickOk at the end
        }
    }

    // 1. Personal Info Group (First Name, Last Name, Email, Phone)
    // If we see multiple inputs, use the multi-handler
    const inputCount = await block.locator('input:not([type="file"]), textarea').count();

    if (inputCount > 1) {
       console.log('[typeform] Detected multi-input block. Attempting to fill all fields...');
       handled = await handleMultiInputBlock(page, block, answers);
    }
    // Single input specific handling
    else if (q.includes('first name')) {
      handled = await handleTextQuestion(page, block, answers.firstName);
    } else if (q.includes('last name')) {
      handled = await handleTextQuestion(page, block, answers.lastName);
    } else if (q.includes('phone')) {
      handled = await handleTextQuestion(page, block, answers.phone);
    } else if (q.includes('email')) {
      handled = await handleTextQuestion(page, block, answers.email);
    }

    // 2. Links (GitHub, LinkedIn, Portfolio)
    else if (q.includes('github')) {
      handled = await handleTextQuestion(page, block, answers.github);
    } else if (q.includes('linkedin')) {
      handled = await handleTextQuestion(page, block, answers.linkedin);
    } else if (q.includes('portfolio') || q.includes('website')) {
      handled = await handleTextQuestion(page, block, answers.portfolio || 'https://uaecodes.com');
    }

    // 3. Resume
    else if (q.includes('upload') && q.includes('resume')) {
      console.log('[typeform] Uploading resume...');
      handled = await handleUpload(page, block, resumePath);
    }

    // 4. Location
    else if (q.includes('currently based') || (q.includes('city') && q.includes('country'))) {
      console.log('[typeform] Handling location...');

      // Check for any input
      const input = block.locator('input, textarea').first();
      if (await input.isVisible()) {
        console.log('[typeform] Found input for location. Filling...');
        await input.fill('Dubai');
        await page.waitForTimeout(2000);

        const option = page.locator('div[role="option"], .choices__item, div[class*="option"]').filter({ hasText: /Dubai|United Arab Emirates/i }).first();

        if (await option.isVisible()) {
            console.log('[typeform] Found location option, clicking...');
            await option.click();
        } else {
            console.log('[typeform] No option found, trying ArrowDown+Enter...');
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
        }
        handled = true;
      } else {
        console.log('[typeform] No input found. Trying dropdown logic...');
        handled = await handleDropdown(page, block, 'Dubai');
      }
    }

    // 5. Role Preference
    else if (q.includes('frontend') && q.includes('backend')) {
      handled = await handleChoices(page, block, ['backend', 'full stack']);
      if (!handled) handled = await handleTextQuestion(page, block, defaults.rolePreference);
    }

    // 6. Years of Experience
    else if (q.includes('years') && q.includes('experience')) {
      handled = await handleTextQuestion(page, block, defaults.yearsOfExperience);
    }

// 7. Availability / Resignation
    else if (q.includes('how soon could you resign') || q.includes('potential barriers') || q.includes('availability') || (q.includes('when') && q.includes('start'))) {

        // 1. Try Choices (Common answers)
        const options = ['immediate', 'now', 'asap', 'available', '2 weeks', 'notice', 'month'];
        handled = await handleChoices(page, block, options);

        // 2. Try Dropdown
        if (!handled) {
             console.log('[typeform] Choices failed. Trying dropdown...');
             handled = await handleDropdown(page, block, 'Immediately');
        }

        // 3. Try Text Input
        if (!handled) {
             console.log('[typeform] Dropdown failed. Trying text input...');
             handled = await handleTextQuestion(page, block, defaults.availability);
        }

        // 4. Fallback: Click by text content (for non-semantic divs)
        if (!handled) {
            console.log('[typeform] Standard methods failed. Trying to click by text content...');
            const keywords = ['Immediately', '2 weeks', '1 month', 'Unemployed', 'Freelance', 'Notice'];
            for (const k of keywords) {
                const el = block.locator(`text=${k}`).first();
                if (await el.isVisible()) {
                    console.log(`[typeform] Found text "${k}", clicking...`);
                    await el.click({ force: true });
                    handled = true;
                    break;
                }
            }
        }

        // 5. Last Resort: Click the first "Box" or "Flex" div that looks like an option
        if (!handled) {
             console.log('[typeform] Text click failed. Trying generic container click...');
             // Look for divs that are likely options (siblings in the content area)
             // This is a heuristic: find divs with class containing "Box" or "Flex" that have text
             const candidates = block.locator('div[class*="Box"], div[class*="Flex"]').filter({ hasText: /\w+/ });
             const count = await candidates.count();
             for (let i = 0; i < count; i++) {
                 const el = candidates.nth(i);
                 // Skip the question title itself (usually the first one or large text)
                 const txt = await el.innerText();
                 // Heuristic: options are usually short and don't contain the question text
                 if (txt.length < 50 && !txt.includes('?') && !q.includes(normalizeText(txt))) {
                     console.log(`[typeform] Clicking candidate div: "${txt}"`);
                     await el.click({ force: true });
                     handled = true;
                     break;
                 }
             }
        }
    }

    // 8. Motivation / Why
    else if (q.includes('why') || q.includes('motivat') || q.includes('vision') || q.includes('excites')) {
      const aiAnswer = await getAIAnswer(q, { ...answers, ...defaults });
      handled = await handleTextQuestion(page, block, aiAnswer);
    }

    // 9. Stack Fit / Risks / Challenges
    else if (q.includes('stack') || q.includes('technolog') || q.includes('risk') || q.includes('challenge')) {
      const aiAnswer = await getAIAnswer(q, { ...answers, ...defaults });
      handled = await handleTextQuestion(page, block, aiAnswer);
    }

    // 10. Compensation
    else if (q.includes('compensation') || q.includes('salary') || (q.includes('rate') && (q.includes('hourly') || q.includes('pay')))) {
      handled = await handleTextQuestion(page, block, defaults.compensationNote);
    }

    // 11. Rating / Experience Scales
    else if (q.includes('rate your experience') || q.includes('how would you rate')) {
        console.log('[typeform] Handling Rating/Scale question...');
        // Try to click a high number (8, 9, 10) or "Expert"
        const ratings = ['10', '9', '8', 'Expert', 'Advanced', 'Strong', '5']; // 5 is max for some scales

        for (const r of ratings) {
            // Try specific data-qa attributes first
            const el = block.locator(`[data-qa*="${r}"], [aria-label="${r}"], div[class*="rating"] >> text="${r}"`).first();
            if (await el.isVisible()) {
                console.log(`[typeform] Clicking rating "${r}"...`);
                await el.click({ force: true });
                handled = true;
                break;
            }

            // Try exact text match for numbers (risky, so check context)
            const textEl = block.locator(`text="${r}"`).first();
            if (await textEl.isVisible()) {
                 // Check if it looks like a rating button (small size)
                 const box = await textEl.boundingBox();
                 if (box && box.width < 100 && box.height < 100) {
                     console.log(`[typeform] Clicking text rating "${r}"...`);
                     await textEl.click({ force: true });
                     handled = true;
                     break;
                 }
            }
        }

        if (!handled) {
            console.log('[typeform] Rating fallback: Clicking last option...');
            // Click the last radio or button-like element
            const options = block.locator('[role="radio"], [role="button"], div[class*="ScaleItem"]').filter({ hasText: /\d+/ });
            if (await options.count() > 0) {
                await options.last().click({ force: true });
                handled = true;
            }
        }
    }

    // 12. Timezone
    else if (q.includes('timezone')) {
      handled = await handleTextQuestion(page, block, defaults.timezone);
    }

    // 13. Video / Loom (Skip or Placeholder)
    else if (q.includes('video') || q.includes('loom')) {
        console.log('[typeform] Video question detected. Attempting to skip or fill placeholder...');

        const input = block.locator('input[type="text"], input[type="url"], textarea').first();
        if (await input.isVisible()) {
            await input.fill('https://www.loom.com/share/placeholder-video-id'); // Placeholder
            handled = true;
        } else {
            console.log('[typeform] No input for video. Trying to click OK/Next...');
        }
    }

    // 14. Generic / Fallback
    else {
      // If it's a text question we haven't matched, fill with a generic polite answer
      const isText = await block.locator('input[type="text"], textarea').count() > 0;
      if (isText) {
        console.log('[typeform] Unknown text question. Generating AI answer...');
        const aiAnswer = await getAIAnswer(q, { ...answers, ...defaults });
        handled = await handleTextQuestion(page, block, aiAnswer);
      } else {
        // Maybe it's a choice question we didn't match?
        // Try to select the first option if it's not "Other"
        const buttons = block.locator('[role="button"], button').filter({ hasText: /\w+/ });
        if (await buttons.count() > 0) {
           // Be careful not to click OK/Submit here
           const firstBtn = buttons.first();
           const txt = normalizeText(await firstBtn.innerText());
           if (txt !== 'ok' && txt !== 'submit') {
             console.log('[typeform] Unknown choice question. Selecting first option.');
             await firstBtn.click();
             handled = true;
           }
        }
      }
    }

    // Advance
    if (handled) {
      await page.waitForTimeout(500); // Short pause for UI update
    }

    // Try to click OK or Press Enter
    const okClicked = await clickOk(page, block);
    if (!okClicked) {
      await pressEnter(page);
    }
  }

  await browser.close();
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
