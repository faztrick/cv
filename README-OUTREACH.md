# 📢 Company Outreach Manager

This tool helps you manage direct job applications to specific companies (POS, ERP, Hardware providers, etc.) in Dubai.

## 📂 Structure

* **Database**: `data/target-companies.json` - Stores company info and application status.
* **Emails**: `emails/outreach/` - Where generated emails are saved.
* **Script**: `scripts/outreach-manager.js` - The tool to manage everything.

## 🚀 How to Use

### 1. List Companies

View all companies and their current status (Pending, Generated, Sent).

```bash
npm run outreach list
```

### 2. Add a New Company

Add a company to the database.

```bash
# Usage: npm run outreach add "Name" "Type" "Email" "Job Title"
npm run outreach add "Tech One" "POS Hardware" "hr@techone.ae" "Senior Developer"
```

### 3. Generate Emails

Generate personalized emails for all companies with "Pending" status.

```bash
npm run outreach generate
```

This uses your CV and the company info to create a tailored email in `emails/outreach/`.

### 4. Send Emails

**Dry Run (Test):**
See what would happen without sending.

```bash
npm run outreach send
```

**Real Send:**
Actually send the emails using your Gmail configuration.

```bash
npm run outreach send -- --real
```

*(Note: Requires `GMAIL_APP_PASSWORD` environment variable or manual entry)*

## 📊 Database Fields

* `name`: Company Name
* `type`: Industry/Sector (e.g., ERP, POS)
* `email`: HR/Careers email
* `status`: Current state of application
* `jobTitle`: The role you are targeting
