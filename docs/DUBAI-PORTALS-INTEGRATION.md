# Dubai Job Portals Integration

This update adds support for the following Dubai-based job portals to the automation suite:

1. **Dubizzle**
2. **Bayt**
3. **GulfTalent**
4. **NaukriGulf**

## Changes Made

### 1. Automation Script (`scripts/job-search-playwright.js`)

- Added dedicated search functions for each portal.
- Updated the main switch statement to handle new platform arguments.
- Each function navigates to the portal, enters the keyword and location, and performs the search.

### 2. Package Configuration (`package.json`)

- Added new npm scripts:
  - `npm run playwright-dubizzle`
  - `npm run playwright-bayt`
  - `npm run playwright-gulftalent`
  - `npm run playwright-naukrigulf`

### 3. Control Panel Backend (`server.js`)

- Whitelisted the new npm scripts to allow execution from the web interface.

### 4. Control Panel UI (`public/panel.html`)

- Added new cards for each portal in the "Job Search" tab.
- Each card allows specifying a custom Keyword and Location.

## How to Use

1. **Restart the Server**: If the server is running, stop it (Ctrl+C) and start it again:

    ```bash
    node server.js
    ```

2. **Open the Panel**: Go to [http://localhost:3000/panel](http://localhost:3000/panel).
3. **Navigate to Job Search**: Click the "Job Search" tab in the sidebar.
4. **Run a Search**:
    - Enter your desired **Keyword** (e.g., "Project Manager").
    - Enter your desired **Location** (e.g., "Abu Dhabi").
    - Click the **Start Search** button for the desired platform.
5. **View Results**: The browser will open, perform the search, and you can see the progress in the "Console Output" box on the panel.

## Notes

- These automations currently perform the **Search** action. They do not auto-apply, as these portals often require complex login/upload flows that vary significantly.
- The browser will launch in visible mode (headless: false) so you can see the results and manually apply if needed.
