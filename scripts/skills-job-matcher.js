/**
 * Skills-Based Job Matcher
 * Extracts skills from CV and generates appropriate job search queries
 */

const fs = require('fs');
const path = require('path');

// Skill to job title mapping
const SKILL_JOB_MAP = {
    // Programming Languages -> Job Titles
    'Flutter': ['Flutter Developer', 'Mobile Developer', 'Cross-Platform Developer'],
    'Dart': ['Flutter Developer', 'Mobile Developer'],
    'React': ['React Developer', 'Frontend Developer', 'Full Stack Developer'],
    'React.js': ['React Developer', 'Frontend Developer', 'Full Stack Developer'],
    'Node.js': ['Backend Developer', 'Node.js Developer', 'Full Stack Developer'],
    'Python': ['Python Developer', 'Data Engineer', 'AI Engineer', 'Backend Developer'],
    'C#': ['C# Developer', '.NET Developer', 'Software Engineer'],
    'Kotlin': ['Android Developer', 'Kotlin Developer', 'Mobile Developer'],
    'TypeScript': ['TypeScript Developer', 'Frontend Developer', 'Full Stack Developer'],

    // AI/ML
    'AI/ML': ['AI Engineer', 'Machine Learning Engineer', 'Data Scientist'],
    'OpenAI': ['AI Engineer', 'GenAI Developer', 'LLM Engineer'],
    'LangChain': ['AI Engineer', 'GenAI Developer', 'LLM Engineer'],
    'YOLO': ['Computer Vision Engineer', 'AI Engineer', 'ML Engineer'],
    'TensorFlow': ['Machine Learning Engineer', 'AI Engineer', 'Data Scientist'],

    // IoT
    'IoT': ['IoT Engineer', 'Embedded Systems Engineer', 'IoT Developer'],
    'ESP32': ['Embedded Engineer', 'IoT Developer', 'Hardware Engineer'],
    'Raspberry Pi': ['IoT Developer', 'Embedded Systems Engineer'],
    'MQTT': ['IoT Engineer', 'Backend Developer'],

    // Cloud & DevOps
    'Docker': ['DevOps Engineer', 'Cloud Engineer', 'Backend Developer'],
    'Kubernetes': ['DevOps Engineer', 'Cloud Engineer', 'Platform Engineer'],
    'AWS': ['AWS Engineer', 'Cloud Architect', 'DevOps Engineer'],
    'Azure': ['Azure Engineer', 'Cloud Architect', 'DevOps Engineer'],
    'GCP': ['GCP Engineer', 'Cloud Architect', 'DevOps Engineer'],

    // Databases
    'MySQL': ['Database Administrator', 'Backend Developer', 'Data Engineer'],
    'MongoDB': ['Backend Developer', 'Full Stack Developer', 'Data Engineer'],
    'Firebase': ['Mobile Developer', 'Full Stack Developer'],

    // Infrastructure
    'MikroTik': ['Network Engineer', 'Infrastructure Engineer'],
    'WireGuard': ['Network Engineer', 'DevOps Engineer', 'Security Engineer'],

    // Enterprise
    'WPF': ['.NET Developer', 'Desktop Application Developer', 'Software Engineer'],
    'ERP': ['ERP Developer', 'Solutions Architect', 'Technical Consultant']
};

// Experience level based job title prefixes/suffixes
const EXPERIENCE_MODIFIERS = {
    senior: ['Senior', 'Lead', 'Principal', 'Staff'],
    mid: ['', 'Mid-Level'],
    junior: ['Junior', 'Associate', 'Entry-Level']
};

// Industry keywords for better matching
const INDUSTRY_KEYWORDS = {
    'retail': ['Retail', 'POS', 'E-commerce'],
    'fintech': ['FinTech', 'Banking', 'Payments'],
    'healthcare': ['HealthTech', 'Healthcare', 'Medical'],
    'enterprise': ['Enterprise', 'B2B', 'SaaS']
};

class SkillsJobMatcher {
    constructor(cvDataPath = null) {
        this.cvData = null;
        this.skills = [];
        this.experience = [];
        this.yearsOfExperience = 0;

        // Load CV data
        const dataPath = cvDataPath || path.join(__dirname, '..', 'data', 'cv-data.json');
        if (fs.existsSync(dataPath)) {
            this.cvData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            this.skills = this.cvData.skills || [];
            this.experience = this.cvData.experience || [];
            this.yearsOfExperience = Number(this.cvData.yearsOfExperience) || this.calculateYearsOfExperience();
        }
    }

    calculateYearsOfExperience() {
        if (!this.experience || this.experience.length === 0) return 10;

        // Extract the earliest start year
        let earliestYear = new Date().getFullYear();
        for (const exp of this.experience) {
            const match = exp.duration?.match(/\d{4}/);
            if (match) {
                const year = parseInt(match[0]);
                if (year < earliestYear) earliestYear = year;
            }
        }
        return new Date().getFullYear() - earliestYear;
    }

    getExperienceLevel() {
        if (this.yearsOfExperience >= 8) return 'senior';
        if (this.yearsOfExperience >= 3) return 'mid';
        return 'junior';
    }

    /**
     * Get skills grouped by category
     */
    getSkillsByCategory() {
        const categories = {
            'Programming Languages': [],
            'Frameworks': [],
            'AI & Machine Learning': [],
            'IoT & Hardware': [],
            'Cloud & DevOps': [],
            'Databases': [],
            'Infrastructure': [],
            'Other': []
        };

        const categoryMap = {
            'Flutter': 'Frameworks',
            'Dart': 'Programming Languages',
            'React': 'Frameworks',
            'React.js': 'Frameworks',
            'Node.js': 'Frameworks',
            'Python': 'Programming Languages',
            'C#': 'Programming Languages',
            'Kotlin': 'Programming Languages',
            'TypeScript': 'Programming Languages',
            'AI/ML': 'AI & Machine Learning',
            'OpenAI': 'AI & Machine Learning',
            'LangChain': 'AI & Machine Learning',
            'YOLO': 'AI & Machine Learning',
            'Whisper': 'AI & Machine Learning',
            'TensorFlow': 'AI & Machine Learning',
            'IoT': 'IoT & Hardware',
            'ESP32': 'IoT & Hardware',
            'Raspberry Pi': 'IoT & Hardware',
            'MQTT': 'IoT & Hardware',
            'Docker': 'Cloud & DevOps',
            'Kubernetes': 'Cloud & DevOps',
            'AWS': 'Cloud & DevOps',
            'Azure': 'Cloud & DevOps',
            'GCP': 'Cloud & DevOps',
            'MySQL': 'Databases',
            'SQL': 'Databases',
            'MongoDB': 'Databases',
            'Firebase': 'Databases',
            'Hive': 'Databases',
            'MikroTik': 'Infrastructure',
            'WireGuard': 'Infrastructure',
            'WPF': 'Frameworks'
        };

        for (const skill of this.skills) {
            const category = categoryMap[skill] || 'Other';
            if (!categories[category].includes(skill)) {
                categories[category].push(skill);
            }
        }

        // Remove empty categories
        for (const key in categories) {
            if (categories[key].length === 0) delete categories[key];
        }

        return categories;
    }

    /**
     * Generate job search queries based on skills
     */
    generateJobSearchQueries() {
        const queries = new Set();
        const level = this.getExperienceLevel();
        const modifiers = EXPERIENCE_MODIFIERS[level];

        // Based on skills
        for (const skill of this.skills) {
            if (SKILL_JOB_MAP[skill]) {
                for (const jobTitle of SKILL_JOB_MAP[skill]) {
                    // Add with and without experience modifier
                    for (const mod of modifiers) {
                        const query = mod ? `${mod} ${jobTitle}` : jobTitle;
                        queries.add(query);
                    }
                }
            }
        }

        // Add generic titles based on experience
        if (level === 'senior') {
            queries.add('Senior Software Engineer');
            queries.add('Software Architect');
            queries.add('Solutions Architect');
            queries.add('Technical Lead');
            queries.add('Principal Engineer');
            queries.add('Staff Engineer');
        } else if (level === 'mid') {
            queries.add('Software Engineer');
            queries.add('Full Stack Developer');
        }

        // Add combination queries based on skill combinations
        if (this.skills.includes('Flutter') && this.skills.includes('Node.js')) {
            queries.add('Full Stack Mobile Developer');
            queries.add('Flutter Node.js Developer');
        }
        if ((this.skills.includes('React') || this.skills.includes('React.js')) && this.skills.includes('TypeScript')) {
            queries.add('React TypeScript Developer');
            queries.add('Frontend Engineer React TypeScript');
        }
        if ((this.skills.includes('React') || this.skills.includes('React.js')) && this.skills.includes('Node.js')) {
            queries.add('Full Stack Developer React Node.js');
            queries.add('React Node.js Developer');
            queries.add('Full Stack JavaScript Developer');
        }
        if (this.skills.includes('Node.js') && this.skills.includes('TypeScript')) {
            queries.add('Node.js TypeScript Developer');
            queries.add('Backend Developer Node.js TypeScript');
        }
        if (this.skills.includes('C#') && (this.skills.includes('React') || this.skills.includes('React.js'))) {
            queries.add('.NET Full Stack Developer');
            queries.add('Full Stack Developer .NET React');
        }
        if (this.skills.includes('C#') && this.skills.includes('Azure')) {
            queries.add('.NET Azure Developer');
        }
        if (this.skills.includes('AI/ML') || this.skills.includes('OpenAI')) {
            queries.add('AI Solutions Architect');
            queries.add('GenAI Engineer');
        }
        if (this.skills.includes('IoT') || this.skills.includes('ESP32')) {
            queries.add('IoT Solutions Architect');
        }
        if (this.skills.includes('Docker') && this.skills.includes('AWS')) {
            queries.add('Cloud DevOps Engineer');
        }

        return Array.from(queries);
    }

    /**
     * Get recommended searches with platform and location
     */
    getRecommendedSearches(location = 'Dubai') {
        const queries = this.generateJobSearchQueries();
        const platforms = ['indeed', 'linkedin', 'bayt', 'gulftalent'];

        const recommendations = [];

        // Prioritize the most relevant queries
        const priorityQueries = [
            'Senior Software Engineer',
            'Software Architect',
            'Full Stack Developer',
            'Senior Flutter Developer',
            'Senior React Developer',
            'Full Stack Developer React Node.js',
            '.NET Full Stack Developer',
            'Senior .NET Developer',
            'Node.js TypeScript Developer',
            'AI Engineer',
            'Solutions Architect'
        ];

        // Add priority queries first
        for (const query of priorityQueries) {
            if (queries.includes(query)) {
                for (const platform of platforms) {
                    recommendations.push({
                        query,
                        platform,
                        location,
                        priority: 'high',
                        matchScore: 95
                    });
                }
            }
        }

        // Add remaining queries with medium priority
        for (const query of queries.slice(0, 15)) { // Limit to top 15
            if (!priorityQueries.includes(query)) {
                recommendations.push({
                    query,
                    platform: 'indeed', // Default to Indeed for non-priority
                    location,
                    priority: 'medium',
                    matchScore: 75
                });
            }
        }

        return recommendations;
    }

    /**
     * Match a job description against skills
     */
    matchJobDescription(jobDescription) {
        const descLower = jobDescription.toLowerCase();
        const matchedSkills = [];
        let score = 0;

        for (const skill of this.skills) {
            if (descLower.includes(skill.toLowerCase())) {
                matchedSkills.push(skill);
                score += 10;
            }
        }

        // Bonus for experience level match
        if (this.yearsOfExperience >= 10 && descLower.includes('senior')) {
            score += 20;
        }
        if (descLower.includes('architect') && this.yearsOfExperience >= 8) {
            score += 25;
        }

        // Check for industry keywords from projects
        const projects = this.cvData?.projects || [];
        for (const project of projects) {
            if (descLower.includes(project.name.toLowerCase())) {
                score += 15;
            }
        }

        return {
            score: Math.min(score, 100),
            matchedSkills,
            recommendation: score >= 70 ? 'Strong Match' : score >= 40 ? 'Good Match' : 'Partial Match'
        };
    }

    /**
     * Get a summary for the panel
     */
    getSummary() {
        return {
            name: this.cvData?.personalInfo?.name || 'Unknown',
            title: this.cvData?.personalInfo?.title || 'Software Engineer',
            skillCount: this.skills.length,
            yearsOfExperience: this.yearsOfExperience,
            experienceLevel: this.getExperienceLevel(),
            topSkills: this.skills.slice(0, 10),
            skillsByCategory: this.getSkillsByCategory(),
            recommendedQueries: this.generateJobSearchQueries().slice(0, 10),
            projects: this.cvData?.projects?.length || 0,
            availability: this.cvData?.availability || { status: 'Available' }
        };
    }
}

module.exports = { SkillsJobMatcher, SKILL_JOB_MAP };

// CLI usage
if (require.main === module) {
    const matcher = new SkillsJobMatcher();
    console.log('\n📊 Skills Job Matcher Summary\n');
    console.log(JSON.stringify(matcher.getSummary(), null, 2));
    console.log('\n🎯 Recommended Searches:\n');
    console.log(matcher.getRecommendedSearches().slice(0, 10));
}
