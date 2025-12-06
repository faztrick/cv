const { JobAutomator } = require('./job-search-playwright');

(async () => {
    console.log('🧪 Starting End-to-End Smoke Test...');
    console.log('   Target: Verify Browser Session, Login Status, and Search Functionality');

    const bot = new JobAutomator();

    try {
        // 1. Initialize (Connects to session or launches persistent context)
        await bot.init();

        // 2. Check Gmail Login
        console.log('\n📧 [1/3] Checking Gmail Session...');
        const gmailPage = await bot.browser.newPage();
        try {
            await gmailPage.goto('https://mail.google.com', { waitUntil: 'domcontentloaded' });
            // If we see the "Sign in" link, we are NOT logged in
            const signInLink = gmailPage.locator('a[href*="accounts.google.com/ServiceLogin"], a[href*="signin"]');
            if (await signInLink.count() > 0) {
                console.log('   ❌ Gmail: Not logged in');
            } else {
                // Check for inbox element
                try {
                    await gmailPage.waitForSelector('div[role="main"]', { timeout: 5000 });
                    console.log('   ✅ Gmail: Logged in & Inbox accessible');
                } catch (e) {
                    console.log('   ⚠️ Gmail: Logged in but Inbox not detected immediately');
                }
            }
        } catch (e) {
            console.log('   ⚠️ Gmail check failed:', e.message);
        } finally {
            await gmailPage.close();
        }

        // 3. Check Indeed Login
        console.log('\n💼 [2/3] Checking Indeed Session...');
        try {
            await bot.page.goto('https://ae.indeed.com/', { waitUntil: 'domcontentloaded' });
            const indeedLoggedIn = await bot.page.locator([
                '[data-gnav-element-name="AccountMenu"]',
                '[aria-label="Profile"]',
                '.gnav-AccountMenu',
                '#ifl-GlobalMainNav-link-user',
                'button[aria-label="Open profile menu"]'
            ].join(',')).count() > 0;
            console.log(`   Indeed Logged In: ${indeedLoggedIn ? '✅' : '❌'}`);
        } catch (e) {
            console.log('   ⚠️ Indeed check failed:', e.message);
        }

        // 4. Test Search Functionality (Indeed)
        console.log('\n🔍 [3/3] Testing Search (Smoke Test)...');
        try {
            const keyword = 'Test Engineer';
            const location = 'Dubai';

            await bot.page.fill('#text-input-what, input[name="q"]', keyword);
            await bot.page.fill('#text-input-where, input[name="l"]', location);
            await bot.page.keyboard.press('Enter');

            await bot.page.waitForURL(/jobs/, { timeout: 10000 });
            console.log('   ✅ Search submitted successfully');

            const jobCards = bot.page.locator('.job_seen_beacon, .resultContent, [data-testid="job-card"]');
            await jobCards.first().waitFor({ state: 'visible', timeout: 10000 });
            const count = await jobCards.count();

            if (count > 0) {
                console.log(`   ✅ Found ${count} jobs (Selectors are working)`);
                const firstTitle = await jobCards.first().locator('h2').innerText();
                console.log(`   👉 First result: ${firstTitle}`);
            } else {
                console.log('   ⚠️ Search ran but found 0 jobs (Selectors might be broken)');
            }

        } catch (e) {
            console.log('   ❌ Search test failed:', e.message);
        }

        console.log('\n🏁 Smoke Test Complete');

    } catch (e) {
        console.error('❌ Smoke Test Fatal Error:', e);
    } finally {
        console.log('   Closing browser...');
        await bot.close();
    }
})();
