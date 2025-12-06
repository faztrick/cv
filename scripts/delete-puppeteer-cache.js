/**
 * Delete Puppeteer/Playwright browser cache
 * Uses dynamic path resolution for cross-platform compatibility
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Cache directories to clean
const cacheDirs = [
    // Puppeteer cache (Windows, Mac, Linux)
    path.join(os.homedir(), '.cache', 'puppeteer'),
    // Playwright cache (Windows)
    path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'),
    // Playwright cache (Mac/Linux)
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    // Local project user_data
    path.join(__dirname, '..', 'user_data'),
    // Chrome profile cache in project
    path.join(__dirname, '..', '.cache', 'chrome-profile')
];

let deletedCount = 0;
let skippedCount = 0;

console.log('🧹 Browser Cache Cleanup Utility\n');

for (const dirPath of cacheDirs) {
    if (fs.existsSync(dirPath)) {
        try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`✅ Deleted: ${dirPath}`);
            deletedCount++;
        } catch (err) {
            console.log(`❌ Failed to delete ${dirPath}: ${err.message}`);
        }
    } else {
        console.log(`⏭️  Skipped (not found): ${dirPath}`);
        skippedCount++;
    }
}

console.log(`\n📊 Summary: ${deletedCount} deleted, ${skippedCount} not found`);
console.log('✨ Cache cleanup complete!');
