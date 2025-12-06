/**
 * AI-Powered Form Filling Agent
 * Uses OpenAI API to intelligently analyze and fill job application forms
 * No loops or retries - single intelligent pass
 */

const fs = require('fs');
const path = require('path');

// Load env vars
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (_) {}

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * AI Form Agent - Analyzes page and fills forms intelligently
 */
class AIFormAgent {
    constructor(cvData = null) {
        this.cvData = cvData;
        this.apiKey = OPENAI_API_KEY;

        if (!this.apiKey) {
            console.log('⚠️ OPENAI_API_KEY not set. AI agent will use fallback logic.');
        }
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(messages, options = {}) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: options.model || OPENAI_MODEL,
                messages: messages,
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 2000,
                response_format: options.json ? { type: 'json_object' } : undefined
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Extract form fields from page using AI vision or DOM analysis
     */
    async analyzeForm(page) {
        console.log('🤖 AI Agent: Analyzing form structure...');

        // Get all form elements
        const formData = await page.evaluate(() => {
            const fields = [];

            // Text inputs
            document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea').forEach(el => {
                if (el.offsetParent !== null) { // visible
                    const label = document.querySelector(`label[for="${el.id}"]`)?.innerText ||
                                  el.getAttribute('aria-label') ||
                                  el.getAttribute('placeholder') ||
                                  el.getAttribute('name') || '';
                    fields.push({
                        type: 'text',
                        selector: el.id ? `#${el.id}` : `[name="${el.name}"]`,
                        label: label.trim(),
                        value: el.value,
                        required: el.required
                    });
                }
            });

            // Radio buttons (grouped by name)
            const radioGroups = {};
            document.querySelectorAll('input[type="radio"]').forEach(el => {
                if (el.offsetParent !== null) {
                    const name = el.name;
                    if (!radioGroups[name]) {
                        const fieldset = el.closest('fieldset');
                        const legend = fieldset?.querySelector('legend')?.innerText || '';
                        radioGroups[name] = {
                            type: 'radio',
                            name: name,
                            label: legend.trim(),
                            options: [],
                            selected: null
                        };
                    }
                    const optionLabel = document.querySelector(`label[for="${el.id}"]`)?.innerText || el.value;
                    radioGroups[name].options.push(optionLabel.trim());
                    if (el.checked) radioGroups[name].selected = optionLabel.trim();
                }
            });
            Object.values(radioGroups).forEach(g => fields.push(g));

            // Dropdowns
            document.querySelectorAll('select').forEach(el => {
                if (el.offsetParent !== null) {
                    const label = document.querySelector(`label[for="${el.id}"]`)?.innerText ||
                                  el.getAttribute('aria-label') || '';
                    const options = Array.from(el.options).map(o => o.text.trim());
                    fields.push({
                        type: 'select',
                        selector: el.id ? `#${el.id}` : `[name="${el.name}"]`,
                        label: label.trim(),
                        options: options,
                        value: el.value
                    });
                }
            });

            // File inputs
            document.querySelectorAll('input[type="file"]').forEach(el => {
                if (el.offsetParent !== null) {
                    fields.push({
                        type: 'file',
                        selector: el.id ? `#${el.id}` : 'input[type="file"]',
                        label: 'Resume/CV Upload',
                        accept: el.accept
                    });
                }
            });

            // Checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(el => {
                if (el.offsetParent !== null) {
                    const label = document.querySelector(`label[for="${el.id}"]`)?.innerText || '';
                    fields.push({
                        type: 'checkbox',
                        selector: el.id ? `#${el.id}` : `[name="${el.name}"]`,
                        label: label.trim(),
                        checked: el.checked
                    });
                }
            });

            return fields;
        });

        console.log(`   Found ${formData.length} form fields`);
        return formData;
    }

    /**
     * Use AI to determine best answers for form fields
     */
    async getFormAnswers(formFields) {
        if (!this.apiKey || !this.cvData) {
            console.log('   Using rule-based form filling...');
            return this.getRuleBasedAnswers(formFields);
        }

        console.log('🤖 AI Agent: Determining best answers...');

        const systemPrompt = `You are a job application form-filling assistant. Based on the candidate's CV data and the form fields provided, determine the best answer for each field.

CANDIDATE CV DATA:
${JSON.stringify(this.cvData, null, 2)}

RULES:
- For "years of experience" questions, use the candidate's total experience
- For work authorization, answer "Yes" (candidate is authorized)
- For visa sponsorship, answer "No" (doesn't require sponsorship)
- For salary expectations, use a reasonable range based on experience (15000-25000 AED)
- For notice period, use "2 weeks" or "Immediately available"
- For location/relocation questions, answer "Yes" (willing to relocate)
- For education, use the highest degree from CV
- Match phone/email/name exactly from CV data
- For checkboxes about terms/conditions, check "true"

Return a JSON object with field answers:
{
  "answers": [
    {"selector": "#field-id", "value": "answer", "action": "fill|select|click|upload"},
    ...
  ]
}`;

        const userPrompt = `Analyze these form fields and provide the best answers:

${JSON.stringify(formFields, null, 2)}`;

        try {
            const response = await this.callOpenAI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], { json: true });

            const result = JSON.parse(response);
            console.log(`   AI determined ${result.answers?.length || 0} answers`);
            return result.answers || [];
        } catch (e) {
            console.log('   AI error, falling back to rules:', e.message);
            return this.getRuleBasedAnswers(formFields);
        }
    }

    /**
     * Rule-based fallback for form answers
     */
    getRuleBasedAnswers(formFields) {
        const answers = [];
        const cv = this.cvData || {};
        const personal = cv.personal || {};

        for (const field of formFields) {
            const label = (field.label || '').toLowerCase();
            let answer = null;
            let action = 'fill';

            if (field.type === 'text') {
                // Name fields
                if (label.includes('first name')) answer = personal.firstName || personal.name?.split(' ')[0];
                else if (label.includes('last name')) answer = personal.lastName || personal.name?.split(' ').slice(1).join(' ');
                else if (label.includes('full name') || label.includes('name')) answer = personal.name;

                // Contact
                else if (label.includes('email')) answer = personal.email;
                else if (label.includes('phone') || label.includes('mobile')) answer = personal.phone;

                // Professional
                else if (label.includes('linkedin')) answer = personal.linkedin;
                else if (label.includes('website') || label.includes('portfolio')) answer = personal.portfolio || personal.website;
                else if (label.includes('city') || label.includes('location')) answer = personal.location || 'Dubai';

                // Experience
                else if (label.includes('years') && label.includes('experience')) answer = cv.yearsOfExperience || '15';
                else if (label.includes('notice period')) answer = '2 weeks';
                else if (label.includes('salary') || label.includes('compensation')) answer = '15000';
                else if (label.includes('current') && label.includes('title')) answer = personal.title;

                // Summary
                else if (label.includes('cover') || label.includes('summary') || label.includes('about')) {
                    answer = cv.summary || `Experienced ${personal.title || 'Software Engineer'} with ${cv.yearsOfExperience || '15'}+ years of expertise.`;
                }

                if (answer) {
                    answers.push({ selector: field.selector, value: answer, action: 'fill' });
                }
            }
            else if (field.type === 'radio') {
                // Determine best radio option
                if (label.includes('authorization') || label.includes('legally authorized') || label.includes('right to work')) {
                    answer = 'Yes';
                } else if (label.includes('sponsorship')) {
                    answer = 'No';
                } else if (label.includes('relocate') || label.includes('willing')) {
                    answer = 'Yes';
                } else if (label.includes('previously') || label.includes('former')) {
                    answer = 'No';
                } else {
                    // Default to first positive option
                    answer = field.options.find(o => o.toLowerCase().includes('yes')) || field.options[0];
                }
                answers.push({ selector: `input[name="${field.name}"]`, value: answer, action: 'radio' });
            }
            else if (field.type === 'select') {
                // Select first non-placeholder option
                const validOptions = field.options.filter(o => !o.toLowerCase().includes('select') && o.trim() !== '');
                if (validOptions.length > 0) {
                    answers.push({ selector: field.selector, value: validOptions[0], action: 'select' });
                }
            }
            else if (field.type === 'checkbox') {
                // Check agreement/terms checkboxes
                if (label.includes('agree') || label.includes('terms') || label.includes('confirm') || label.includes('acknowledge')) {
                    answers.push({ selector: field.selector, value: true, action: 'check' });
                }
            }
            else if (field.type === 'file') {
                answers.push({ selector: field.selector, value: 'resume', action: 'upload' });
            }
        }

        return answers;
    }

    /**
     * Apply answers to the form
     */
    async applyAnswers(page, answers, resumePath = null) {
        console.log(`🤖 AI Agent: Applying ${answers.length} form answers...`);
        let filled = 0;

        for (const answer of answers) {
            try {
                const { selector, value, action } = answer;

                switch (action) {
                    case 'fill':
                        await page.fill(selector, String(value));
                        filled++;
                        break;

                    case 'select':
                        await page.selectOption(selector, { label: value });
                        filled++;
                        break;

                    case 'radio':
                        // Find radio with matching label
                        const radioLabel = page.locator(`label:has-text("${value}")`).first();
                        if (await radioLabel.count() > 0) {
                            await radioLabel.click();
                            filled++;
                        }
                        break;

                    case 'check':
                        await page.check(selector);
                        filled++;
                        break;

                    case 'upload':
                        if (resumePath && fs.existsSync(resumePath)) {
                            await page.setInputFiles(selector, resumePath);
                            filled++;
                        }
                        break;
                }
            } catch (e) {
                // Skip fields that can't be filled
                console.log(`      ⚠️ Could not fill: ${answer.selector}`);
            }
        }

        console.log(`   ✅ Filled ${filled}/${answers.length} fields`);
        return filled;
    }

    /**
     * Main function: Analyze and fill form in one pass
     */
    async fillForm(page, resumePath = null) {
        console.log('\n🤖 ═══════════════════════════════════════');
        console.log('🤖 AI FORM AGENT - Single Pass Form Fill');
        console.log('🤖 ═══════════════════════════════════════\n');

        // Step 1: Analyze form
        const formFields = await this.analyzeForm(page);

        if (formFields.length === 0) {
            console.log('   No form fields found');
            return false;
        }

        // Step 2: Get answers (AI or rule-based)
        const answers = await this.getFormAnswers(formFields);

        // Step 3: Apply answers
        const filledCount = await this.applyAnswers(page, answers, resumePath);

        console.log('\n🤖 Form filling complete!\n');
        return filledCount > 0;
    }

    /**
     * Analyze a question and get the best answer
     */
    async answerQuestion(question) {
        if (!this.apiKey) {
            return this.getRuleBasedAnswer(question);
        }

        const systemPrompt = `You are helping fill out a job application. Based on the candidate's profile, provide the best answer for the question. Keep answers concise and professional.

CANDIDATE PROFILE:
${JSON.stringify(this.cvData, null, 2)}

Return just the answer text, nothing else.`;

        try {
            const response = await this.callOpenAI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Question: ${question}` }
            ], { maxTokens: 200 });

            return response.trim();
        } catch (e) {
            return this.getRuleBasedAnswer(question);
        }
    }

    /**
     * Rule-based answer for a single question
     */
    getRuleBasedAnswer(question) {
        const q = question.toLowerCase();
        const cv = this.cvData || {};
        const personal = cv.personal || {};

        if (q.includes('years') && q.includes('experience')) return cv.yearsOfExperience || '15';
        if (q.includes('authorized') || q.includes('work authorization')) return 'Yes';
        if (q.includes('sponsorship')) return 'No';
        if (q.includes('relocate') || q.includes('willing to work')) return 'Yes';
        if (q.includes('notice period')) return '2 weeks';
        if (q.includes('salary')) return '15000';
        if (q.includes('start date') || q.includes('when can you start')) return 'Immediately';
        if (q.includes('why') && q.includes('interested')) {
            return `I'm excited about this opportunity because it aligns with my ${cv.yearsOfExperience || '15'}+ years of experience in software development.`;
        }

        return null;
    }
}

module.exports = { AIFormAgent };
