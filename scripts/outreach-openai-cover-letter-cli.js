#!/usr/bin/env node

const { generateCoverLetterWithOpenAIAsync } = require('./outreach-openai-cover-letter');

function getArg(name, args) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

(async () => {
  const args = process.argv.slice(2);

  const companyName = getArg('--company', args) || 'Company';
  const jobTitle = getArg('--role', args) || 'Software Engineer';
  const companyType = getArg('--type', args) || '';
  const contactPerson = getArg('--contact', args) || '';
  const notes = getArg('--notes', args) || '';

  try {
    const text = await generateCoverLetterWithOpenAIAsync({
      companyName,
      jobTitle,
      companyType,
      contactPerson,
      notes
    });

    process.stdout.write(String(text || '').trim());
  } catch (e) {
    process.stderr.write(`OpenAI cover letter generation failed: ${e.message || e}\n`);
    process.exit(1);
  }
})();
