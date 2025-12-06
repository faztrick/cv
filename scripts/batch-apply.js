/**
 * Batch Job Application Script
 * Runs job searches across all platforms with skill-based queries
 * Tracks all applications in the panel
 */

const { JobAutomator } = require('./job-search-playwright');
const { SkillsJobMatcher } = require('./skills-job-matcher');
const fs = require('fs');
const path = require('path');

const APPLICATIONS_FILE = path.join(__dirname, '..', 'data', 'applications-tracker.json');
const COMPANIES_FILE = path.join(__dirname, '..', 'data', 'target-companies.json');

// Platforms to search
const PLATFORMS = ['indeed', 'linkedin', 'bayt', 'gulftalent', 'naukrigulf'];

// Job queries based on skills
const JOB_QUERIES = [
    'Senior Software Engineer',
    'Software Architect',
    'Full Stack Developer',
    'Flutter Developer',
    'AI Engineer',
    'Solutions Architect',
    'Node.js Developer',
    'DevOps Engineer'
];

// Location
const LOCATION = 'Dubai';

class BatchJobApplicator {
    constructor() {
        this.automator = null;
        this.matcher = new SkillsJobMatcher();
        this.applications = this.loadApplications();
        this.results = {
            searched: 0,
            applied: 0,
            tracked: 0,
            errors: []
        };
    }

    loadApplications() {
        try {
            if (fs.existsSync(APPLICATIONS_FILE)) {
                return JSON.parse(fs.readFileSync(APPLICATIONS_FILE, 'utf8'));
            }
        } catch (e) {}
        return [];
    }

    saveApplications() {
        fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(this.applications, null, 2));
    }

    addToTracker(company, title, platform, status = 'Applied', email = '') {
        // Also add to companies file for panel display
        let companies = [];
        try {
            if (fs.existsSync(COMPANIES_FILE)) {
                companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
            }
        } catch (e) {}

        // Check for duplicates
        const exists = companies.find(c =>
            c.name.toLowerCase() === company.toLowerCase() &&
            c.jobTitle?.toLowerCase() === title.toLowerCase()
        );

        if (!exists) {
            const newId = companies.length > 0 ? Math.max(...companies.map(c => parseInt(c.id) || 0)) + 1 : 1;
            companies.push({
                id: String(newId),
                name: company,
                type: platform,
                email: email,
                jobTitle: title,
                status: status,
                appliedDate: new Date().toISOString().split('T')[0],
                source: 'automation'
            });
            fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
            this.results.tracked++;
            console.log(`   📝 Tracked: ${title} at ${company}`);
        }
    }

    async runSingleSearch(platform, query) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔍 Searching ${platform.toUpperCase()}: "${query}" in ${LOCATION}`);
        console.log('='.repeat(60));

        try {
            switch (platform.toLowerCase()) {
                case 'indeed':
                    await this.automator.runIndeed(query, LOCATION);
                    break;
                case 'linkedin':
                    await this.automator.runLinkedIn(query, LOCATION);
                    break;
                case 'bayt':
                    await this.automator.runBayt(query, LOCATION);
                    break;
                case 'gulftalent':
                    await this.automator.runGulfTalent(query, LOCATION);
                    break;
                case 'naukrigulf':
                    await this.automator.runNaukriGulf(query, LOCATION);
                    break;
                case 'dubizzle':
                    await this.automator.runDubizzle(query, LOCATION);
                    break;
            }
            this.results.searched++;
        } catch (e) {
            console.error(`❌ Error on ${platform}: ${e.message}`);
            this.results.errors.push({ platform, query, error: e.message });
        }
    }

    async runAll() {
        console.log('\n🚀 BATCH JOB APPLICATION STARTED');
        console.log('='.repeat(60));
        console.log(`📊 Skills Summary:`);
        const summary = this.matcher.getSummary();
        console.log(`   Name: ${summary.name}`);
        console.log(`   Experience: ${summary.yearsOfExperience}+ years (${summary.experienceLevel})`);
        console.log(`   Skills: ${summary.skillCount} skills`);
        console.log('='.repeat(60));

        // Initialize automator
        this.automator = new JobAutomator();
        await this.automator.init();

        // Run searches based on priority
        const priorityQueries = JOB_QUERIES.slice(0, 3); // Top 3 priority
        const priorityPlatforms = ['indeed', 'linkedin']; // Main platforms

        // Priority searches first
        for (const query of priorityQueries) {
            for (const platform of priorityPlatforms) {
                await this.runSingleSearch(platform, query);
                // Delay between searches to avoid detection
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        // Additional searches on other platforms
        for (const platform of ['bayt', 'gulftalent']) {
            await this.runSingleSearch(platform, 'Senior Software Engineer');
            await new Promise(r => setTimeout(r, 3000));
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 BATCH RESULTS');
        console.log('='.repeat(60));
        console.log(`   Searches completed: ${this.results.searched}`);
        console.log(`   Applications tracked: ${this.results.tracked}`);
        console.log(`   Errors: ${this.results.errors.length}`);

        if (this.results.errors.length > 0) {
            console.log('\n⚠️ Errors:');
            this.results.errors.forEach(e => {
                console.log(`   - ${e.platform}/${e.query}: ${e.error}`);
            });
        }

        console.log('\n✅ Batch automation complete!');
        console.log('   View results at: http://localhost:3000/panel');
    }

    async runQuick() {
        // Quick mode: Just Indeed with top query
        console.log('\n🚀 QUICK JOB SEARCH');

        this.automator = new JobAutomator();
        await this.automator.init();

        await this.runSingleSearch('indeed', 'Senior Software Engineer');

        console.log('\n✅ Quick search complete!');
    }
}

// CLI
if (require.main === module) {
    const mode = process.argv[2] || 'quick';
    const applicator = new BatchJobApplicator();

    (async () => {
        try {
            if (mode === 'all' || mode === 'batch') {
                await applicator.runAll();
            } else if (mode === 'quick') {
                await applicator.runQuick();
            } else {
                // Single platform mode
                const platform = mode;
                const query = process.argv[3] || 'Senior Software Engineer';

                applicator.automator = new JobAutomator();
                await applicator.automator.init();
                await applicator.runSingleSearch(platform, query);
            }
        } catch (e) {
            console.error('Fatal error:', e);
        }
    })();
}

module.exports = { BatchJobApplicator };
