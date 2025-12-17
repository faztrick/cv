#!/usr/bin/env node

/**
 * Job Pack Generator (offline / safe)
 *
 * Creates a ready-to-apply “pack” for a specific job:
 * - Cover letter (from existing templates)
 * - Pack summary with match highlights (skills + keywords)
 * - Optional: a tailored application email (reuses smart-email-generator)
 *
 * This does NOT auto-apply anywhere and does not require credentials.
 */

const fs = require('fs');
const path = require('path');

const { SkillsJobMatcher } = require('./skills-job-matcher');

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
	if (!t) return null;

	if (['flutter', 'dart', 'mobile'].includes(t)) return 'flutter';
	if (['react', 'frontend', 'fullstack-react'].includes(t)) return 'react';
	if (['dotnet', '.net', 'csharp', 'c#', 'wpf'].includes(t)) return 'dotnet';
	if (['node', 'nodejs', 'backend', 'typescript', 'ts'].includes(t)) return 'node';

	return t;
}

function inferTrack({ role, jd }) {
	const text = `${role || ''}\n${jd || ''}`.toLowerCase();

	if (/(\bflutter\b|\bdart\b|\bmobile\b|\bandroid\b|\bios\b)/.test(text)) return 'flutter';
	if (/(\b\.net\b|\bdotnet\b|\bc#\b|\bwpf\b|\bmvvm\b)/.test(text)) return 'dotnet';

	// If explicitly backend/node, pick node
	if (/(\bnode\b|\bnode\.js\b|\bnodejs\b|\bexpress\b|\bbackend\b)/.test(text) && !/(\breact\b|\bfrontend\b)/.test(text)) {
		return 'node';
	}

	// Default web full-stack
	if (/(\breact\b|\btypescript\b|\bfrontend\b|\bfull\s*stack\b)/.test(text)) return 'react';

	return 'react';
}

function getTemplateForTrack(track) {
	const templates = {
		flutter: repoPath('cover-letters', 'cover-letter-flutter-fullstack.md'),
		react: repoPath('cover-letters', 'cover-letter-react-fullstack.md'),
		dotnet: repoPath('cover-letters', 'cover-letter-dotnet-fullstack.md'),
		node: repoPath('cover-letters', 'cover-letter-nodejs-backend.md')
	};

	return templates[track] || null;
}

function applyReplacements(template, replacements) {
	let out = template;
	for (const [key, val] of Object.entries(replacements)) {
		const token = `{{${key}}}`;
		out = out.split(token).join(val);
	}
	return out;
}

function normalizeForCompare(s) {
	return String(s || '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/\./g, '')
		.trim();
}

const KNOWN_TECH_TERMS = [
	'React', 'React.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'NestJS',
	'Python', 'FastAPI', 'Django',
	'C#', '.NET', 'WPF', 'MVVM',
	'Flutter', 'Dart', 'Kotlin', 'Android',
	'Docker', 'Kubernetes', 'Nginx', 'PM2',
	'AWS', 'Azure', 'GCP',
	'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
	'REST', 'GraphQL', 'WebSocket',
	'MQTT', 'ESP32', 'Raspberry Pi',
	'OpenAI', 'LangChain', 'LLM', 'GenAI', 'YOLO', 'TensorFlow', 'Whisper',
	'CI/CD', 'GitHub Actions', 'Terraform'
];

function extractTechTerms(text) {
	const hay = String(text || '');
	const found = new Set();

	for (const term of KNOWN_TECH_TERMS) {
		const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const re = new RegExp(`\\b${escaped}\\b`, 'i');

		// Special cases: "Node.js" or ".NET" where word boundaries are tricky
		const alt = term === 'Node.js'
			? /node\.?js/i
			: term === '.NET'
				? /\b\.net\b|\bdotnet\b/i
				: null;

		if (re.test(hay) || (alt && alt.test(hay))) {
			found.add(term);
		}
	}

	return Array.from(found);
}

function loadPanelCvData() {
	const p = repoPath('data', 'cv-data.json');
	if (!fs.existsSync(p)) return null;
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function suggestBullets(cvData, jobTechTerms = []) {
	const bullets = [];
	const terms = jobTechTerms.map(normalizeForCompare);

	const projects = Array.isArray(cvData?.projects) ? cvData.projects : [];
	const experience = Array.isArray(cvData?.experience) ? cvData.experience : [];

	const scoreText = (t) => {
		const hay = normalizeForCompare(t);
		let score = 0;
		for (const term of terms) {
			if (term && hay.includes(term)) score += 1;
		}
		return score;
	};

	const scoredProjects = projects
		.map(p => ({
			...p,
			_score: scoreText(`${p.name} ${p.description} ${(p.technologies || []).join(' ')}`)
		}))
		.sort((a, b) => b._score - a._score)
		.slice(0, 3);

	const scoredExperience = experience
		.map(e => ({
			...e,
			_score: scoreText(`${e.role} ${e.company} ${e.description}`)
		}))
		.sort((a, b) => b._score - a._score)
		.slice(0, 2);

	// Experience-driven bullets
	for (const exp of scoredExperience) {
		bullets.push(`Delivered enterprise features at ${exp.company} (${exp.role}) spanning ERP/POS/QMS workflows, emphasizing reliability and operational readiness.`);
	}

	// Project-driven bullets
	for (const p of scoredProjects) {
		const tech = Array.isArray(p.technologies) && p.technologies.length
			? ` using ${p.technologies.slice(0, 5).join(', ')}`
			: '';
		bullets.push(`Built ${p.name} — ${p.description}${tech}.`);
	}

	// Add a couple of universally strong bullets if we still have too few
	while (bullets.length < 5) {
		bullets.push('Built production APIs and dashboards with strong attention to performance, security, and maintainability (Dockerized deployments + CI/CD).');
	}

	return bullets.slice(0, 6);
}

function printUsage() {
	console.log('\n🧰 Job Pack Generator');
	console.log('');
	console.log('Usage:');
	console.log('  npm run job-pack -- --company "Careem" --role "Senior Software Engineer" --jobUrl "https://..." --jdFile ".\\jd.txt"');
	console.log('');
	console.log('Options:');
	console.log('  --company   Company name');
	console.log('  --role      Role title');
	console.log('  --jobUrl    Job link');
	console.log('  --track     flutter | react | dotnet | node (optional; auto-inferred if omitted)');
	console.log('  --team      Team/product (optional)');
	console.log('  --hiring    Hiring manager name/team (optional)');
	console.log('  --address   Company address (optional; used for the generic template)');
	console.log('  --jdFile    Path to a job description text file (recommended)');
	console.log('  --jd        Job description text (quote it)');
	console.log('  --noEmail   Skip generating the application email');
	console.log('  --outDir    Output directory root for pack summary (optional)');
	console.log('');
}

function main() {
	const args = parseArgs(process.argv);
	if (args.help || args.h) {
		printUsage();
		process.exit(0);
	}

	const company = String(args.company || args.c || '').trim() || 'COMPANY_NAME';
	const role = String(args.role || args.r || '').trim() || 'ROLE_TITLE';
	const jobUrl = String(args.jobUrl || args.jobURL || args.url || '').trim() || 'JOB_URL';
	const team = String(args.team || '').trim() || 'TEAM_OR_PRODUCT';
	const hiring = String(args.hiring || '').trim() || 'Hiring Manager';
	const address = String(args.address || '').trim() || '';

	let jdText = '';
	if (args.jdFile) {
		const jdPath = path.isAbsolute(args.jdFile) ? args.jdFile : path.resolve(process.cwd(), args.jdFile);
		if (!fs.existsSync(jdPath)) {
			console.error(`❌ JD file not found: ${jdPath}`);
			process.exit(1);
		}
		jdText = fs.readFileSync(jdPath, 'utf8');
	} else if (args.jd) {
		jdText = String(args.jd);
	}

	const explicitTrack = resolveTrack(args.track || args.t);
	const track = explicitTrack || inferTrack({ role, jd: jdText });

	// Pick the best template available
	const trackTemplate = getTemplateForTrack(track);
	const genericTemplate = repoPath('cover-letters', 'cover-letter-template.md');
	const templatePath = (trackTemplate && fs.existsSync(trackTemplate))
		? trackTemplate
		: (fs.existsSync(genericTemplate) ? genericTemplate : null);

	if (!templatePath) {
		console.error('❌ No cover letter template found.');
		process.exit(1);
	}

	const date = formatDateISO();
	const slug = `${slugify(company)}-${slugify(role)}-${track}-${date}`.replace(/^-|-$/g, '');

	const coverOutDir = repoPath('cover-letters', 'generated');
	const outRoot = args.outDir ? path.resolve(args.outDir) : repoPath('docs', 'application-packs', 'generated');

	// Render cover letter
	const template = loadText(templatePath);
	const renderedCover = applyReplacements(template, {
		DATE: date,
		COMPANY_NAME: company,
		COMPANY_ADDRESS: address || 'Dubai, UAE',
		ROLE_TITLE: role,
		JOB_URL: jobUrl,
		TEAM_OR_PRODUCT: team,
		HIRING_MANAGER_NAME: hiring,
		HIRING_MANAGER_NAME_OR_TEAM: hiring
	});

	const coverLetterPath = path.join(coverOutDir, `${slug}.md`);
	writeText(coverLetterPath, renderedCover);

	// Match + suggestions (if JD provided)
	const matcher = new SkillsJobMatcher();
	const match = jdText ? matcher.matchJobDescription(jdText) : null;
	const jobTechTerms = jdText ? extractTechTerms(jdText) : [];

	const cvData = loadPanelCvData();
	const suggestions = cvData ? suggestBullets(cvData, jobTechTerms) : [];

	const packSummaryPath = path.join(outRoot, `${slug}.md`);
	const lines = [];

	lines.push(`# Job Pack — ${company} — ${role}`);
	lines.push('');
	lines.push(`**Track:** ${track}`);
	lines.push(`**Generated:** ${date}`);
	lines.push('');

	lines.push('## Files to submit');
	lines.push('');
	lines.push(`- **Cover letter:** ${path.relative(repoPath(), coverLetterPath)}`);
	lines.push(`- **Resume variant:** ${path.relative(repoPath(), repoPath('resumes', 'variants', `resume-${track === 'node' ? 'nodejs-backend' : track === 'dotnet' ? 'dotnet-fullstack' : track === 'flutter' ? 'flutter-fullstack' : 'react-fullstack'}.md`))}`);
	lines.push('');

	lines.push('## Job link');
	lines.push('');
	lines.push(jobUrl);
	lines.push('');

	if (jdText) {
		lines.push('## Match snapshot (from your CV data)');
		lines.push('');
		if (match) {
			lines.push(`- **Match score:** ${match.score}/100 (${match.recommendation})`);
			lines.push(`- **Matched skills:** ${match.matchedSkills.length ? match.matchedSkills.join(', ') : '(none detected)'}`);
		}

		if (jobTechTerms.length) {
			lines.push(`- **Tech terms found in JD:** ${jobTechTerms.join(', ')}`);
		}
		lines.push('');
	} else {
		lines.push('## Add job description for better tailoring');
		lines.push('');
		lines.push('Re-run with `--jdFile` (recommended) to generate match highlights + suggested resume bullets.');
		lines.push('');
	}

	if (suggestions.length) {
		lines.push('## Suggested resume bullets (copy/modify)');
		lines.push('');
		for (const b of suggestions) lines.push(`- ${b}`);
		lines.push('');
	}

	lines.push('## Quick copy/paste answers');
	lines.push('');
	lines.push(`Use: ${path.relative(repoPath(), repoPath('docs', 'APPLICATION-ANSWERS-TEMPLATES.md'))}`);
	lines.push('');

	writeText(packSummaryPath, lines.join('\n'));

	// Optional: generate email (reuses existing module)
	let emailPath = null;
	if (!args.noEmail) {
		try {
			// eslint-disable-next-line global-require
			const { generatePersonalizedEmail, saveEmailToFile } = require('./smart-email-generator');
			const email = generatePersonalizedEmail({
				title: role,
				company,
				description: jdText ? jdText.slice(0, 2000) : '',
				requirements: ''
			}, { tone: 'professional' });

			emailPath = saveEmailToFile(email, { title: role, company });
		} catch (e) {
			// Keep pack generation successful even if email generation fails
			emailPath = null;
		}
	}

	console.log('✅ Job pack generated');
	console.log(`   Cover letter: ${path.relative(repoPath(), coverLetterPath)}`);
	console.log(`   Pack summary: ${path.relative(repoPath(), packSummaryPath)}`);
	if (emailPath) {
		console.log(`   Email draft:  ${path.relative(repoPath(), emailPath)}`);
	} else if (args.noEmail) {
		console.log('   Email draft:  (skipped)');
	} else {
		console.log('   Email draft:  (not generated — check resumes/resume.md exists)');
	}

	console.log('');
	console.log('Next: paste a job link + JD text and I can tune the bullets to match the posting (ATS keywords + strongest projects).');
}

if (require.main === module) {
	try {
		main();
	} catch (err) {
		console.error('❌ Failed to generate job pack');
		console.error(err && err.stack ? err.stack : String(err));
		process.exit(1);
	}
}
