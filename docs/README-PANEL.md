# 🎛️ CV & Job Search Control Panel

A unified web-based dashboard to manage your job search automation, company outreach, and email generation.

## 🚀 Getting Started

1. **Start the Panel Server**:

    ```bash
    npm run panel
    ```

2. **Open in Browser**:
    Go to [http://localhost:3000/panel](http://localhost:3000/panel)

## ✨ Features

### 📊 Dashboard

* View real-time statistics on your outreach efforts.
* Track total companies, pending applications, and sent emails.

### 🏢 Outreach Manager

* **Add Companies**: Easily add new target companies to your database.
* **Generate Emails**: One-click generation of personalized emails for all pending companies.
* **Send Emails**: Trigger the sending process (Dry Run or Real) directly from the UI.
* **Status Tracking**: Visual status badges (Pending, Generated, Sent).

### 🤖 Job Search Automation

* **Indeed & LinkedIn**: Run your Playwright automation scripts from the browser.
* **Custom Search**: Input keywords and location (e.g., "Software Engineer", "Dubai").
* **Live Console**: See the output of your scripts in real-time within the panel.

### 📧 Email Viewer

* **Browse**: View a list of all generated email files.
* **Preview**: Read the content of your personalized emails before sending.

## 🛠️ Tech Stack

* **Backend**: Node.js, Express
* **Frontend**: HTML5, Tailwind CSS, JavaScript
* **Automation**: Playwright, Python (for email sending)
