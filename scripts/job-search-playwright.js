#!/usr/bin/env node

class JobAutomator {
    async init() {
        throw new Error('Browser job automation has been disabled in this workspace.');
    }

    async close() {
        return;
    }
}

if (require.main === module) {
    console.error('This Playwright automation entrypoint has been disabled and no longer runs job-search automation.');
    process.exit(1);
}

module.exports = { JobAutomator };