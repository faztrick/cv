const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Try to load API key from .env if not in process.env
if (!process.env.OPENAI_API_KEY) {
    try {
        const envPath = path.join(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/OPENAI_API_KEY=(.*)/);
            if (match) {
                process.env.OPENAI_API_KEY = match[1].trim();
            }
        }
    } catch (e) {
        console.error('Error reading .env:', e.message);
    }
}

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment or .env file');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function listModels() {
    console.log('🔄 Fetching available OpenAI models...');
    try {
        const list = await openai.models.list();

        // Filter for GPT models
        const gptModels = list.data
            .filter(model => model.id.includes('gpt'))
            .sort((a, b) => b.created - a.created); // Sort by newest first

        console.log('\n✨ Available GPT Models (Newest First):');
        console.log('────────────────────────────────────────');
        gptModels.forEach(model => {
            const date = new Date(model.created * 1000).toLocaleDateString();
            console.log(`• ${model.id.padEnd(30)} (Created: ${date})`);
        });

        console.log('\n────────────────────────────────────────');
        console.log(`Total GPT models found: ${gptModels.length}`);

    } catch (error) {
        console.error('❌ Error fetching models:', error.message);
    }
}

listModels();
