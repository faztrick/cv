# CV Kit for Muhammed Fasil PV

Everything is now organized into a clean folder layout with a single, unified resume source. Use the master resume for updates; variants and cover letters live in their own folders.

## Folder layout

- `resumes/`
  - `resume.md` — Master, ATS‑friendly resume (single source of truth)
  - `variants/` — Styled and role‑specific variants (HTML/MD/PDF)
- `cover-letters/` — All role‑specific cover letters and templates
- `docs/` — Deployment notes, quick starts, and helper docs
- `scripts/` — PowerShell scripts for setup/deploy/utilities
- `automation/` — Job application bots and helpers (unchanged)
- `public/` — Static site assets (unchanged)
- `assets/`, `emails/`, `tools/` — Supporting files (unchanged)

## Key files

- Master resume: `resumes/resume.md`
- Visual/HTML/PDF variants: `resumes/variants/*`
- Cover letter template and role letters: `cover-letters/*`
- LinkedIn summary: `linkedin-summary.txt`
- GitHub profile snippet: `docs/github-profile-readme.md`

## Export to PDF (Windows, VS Code)

Option 1 — VS Code extension:

1. Install “Markdown PDF” (yzane.markdown-pdf).
2. Open `resumes/resume.md` (ATS) or `resumes/variants/resume-visual.md` (styled).
3. Right‑click → “Markdown PDF: Export (pdf)”.

Option 2 — Print to PDF:

1. Open the Markdown preview (Ctrl+Shift+V).
2. Use your browser’s Print → Save as PDF (set margins to Narrow, scale ~90–95% if needed).

Option 3 — Pandoc (if installed):

```powershell
# Export ATS master to PDF (requires pandoc + a PDF engine like wkhtmltopdf or LaTeX)
pandoc "e:\cv\resumes\resume.md" -o "e:\cv\resumes\resume.pdf"

# Export visual variant to PDF
pandoc "e:\cv\resumes\variants\resume-visual.md" -o "e:\cv\resumes\variants\resume-visual.pdf"
```

## Tips for tailoring

- Keep `resumes/resume.md` clean for portals; avoid images, tables, and complex layouts.
- Mirror job descriptions: add relevant keywords in the “Keywords (ATS)” section of the master resume.
- For AI/IoT‑heavy roles, move the most relevant bullets to the top of Experience/Projects in your current variant.
- Replace placeholder LinkedIn URL if needed: `https://linkedin.com/in/faztrick`.

## Next steps

- Create targeted variants under `resumes/variants/` (e.g., `resume-ai.md`, `resume-iot.md`).
- Add a Projects PDF with 1–2 screenshots per project when emailing recruiters.
- Keep a concise 3–4 sentence pitch ready for messages/intro calls.
