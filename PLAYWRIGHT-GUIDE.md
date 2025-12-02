# 🎭 Playwright Job Search Automation

This guide explains how to use the new Playwright-based automation for Indeed and LinkedIn.

## 🚀 Setup

1. **Install Dependencies**:

    ```bash
    npm install
    ```

    (This installs `playwright` which was recently added to `package.json`)

2. **Browsers**:
    Playwright needs browser binaries. If you haven't installed them:

    ```bash
    npx playwright install chromium
    ```

## 🏃‍♂️ Running the Automation

### Indeed Search

To search for jobs on Indeed:

```bash
npm run playwright-indeed -- "Software Engineer" "Dubai"
```

Or directly:

```bash
node scripts/job-search-playwright.js indeed "Software Engineer" "Dubai"
```

### LinkedIn Search

To search for jobs on LinkedIn:

```bash
npm run playwright-linkedin -- "Software Engineer" "Dubai"
```

## ⚙️ Configuration

The script `scripts/job-search-playwright.js` has a configuration section at the top:

```javascript
const CONFIG = {
    headless: false, // Set to true to run in background
    slowMo: 50,      // Delay between actions
    userDataDir: ... // Stores login session
};
```

## 🔐 Login Persistence

The script uses a `user_data` directory to store your browser profile.

1. Run the script once.
2. Log in to Indeed/LinkedIn manually in the opened browser window.
3. Close the script/browser.
4. Next time you run it, you will stay logged in!

## 🤖 Features

* **Anti-Detection**: Uses randomized user agents and human-like delays.
* **CV Integration**: Loads your `resume.md` data using `cv-parser.js`.
* **Smart Apply**: Detects "Easy Apply" (LinkedIn) and "Indeed Apply" buttons.

## ⚠️ Note

Automated scraping/applying may violate Terms of Service. Use responsibly and at your own risk.
