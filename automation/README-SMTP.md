# Email Automation Tools

This directory contains scripts to automate sending job applications via email, including attachments.

## Prerequisites

1. **Python 3.x** installed.
2. **Gmail App Password**:
    * Go to [Google Account Security](https://myaccount.google.com/security).
    * Enable 2-Step Verification if not already enabled.
    * Go to "App passwords" (search for it if you can't find it).
    * Create a new app password (name it "Job Automation").
    * Copy the 16-character code.

## Scripts

### `apply-emirates-smtp.ps1`

Automates the application for the Emirates Group GenAI role.

**Usage:**

```powershell
.\automation\apply-emirates-smtp.ps1
```

It will ask for:

1. **Recipient Email**: The email address of the recruiter or hiring manager.
2. **Gmail App Password**: Your secure app password (hidden input).

### `scripts/send_email.py`

The core Python script that handles SMTP communication.

**Usage:**

```bash
python scripts/send_email.py --to "recruiter@example.com" --subject "My Application" --body "emails/cover-letter.txt" --attachment "resumes/resume.pdf"
```

## Troubleshooting

* **Authentication Failed**: Ensure you are using an **App Password**, not your regular Gmail password.
* **Attachment Not Found**: Check that the PDF has been generated (`scripts/render_pdf.py`).
