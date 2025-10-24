# CV Kit for Muhammed Fasil PV

This folder contains an ATS‑friendly resume, a visual resume, LinkedIn summary text, a GitHub profile snippet, and a reusable cover letter template. All content is based on the details you provided.

## Files

- `resume-ATS.md` — Clean, parser‑friendly resume (no emojis/tables). Use this for online submissions.
- `resume-visual.md` — Slightly styled resume for sharing as PDF.
- `linkedin-summary.txt` — Paste into your LinkedIn “About” section.
- `github-profile-readme.md` — Drop into a new repo named `faztrick` as `README.md` or adapt for your profile repo.
- `cover-letter-template.md` — Tweak placeholders and export per role.

## Export to PDF (Windows, VS Code)

Option 1 — VS Code extension:

1. Install “Markdown PDF” (yzane.markdown-pdf).
2. Open `resume-visual.md`.
3. Right‑click → “Markdown PDF: Export (pdf)”.

Option 2 — Print to PDF:

1. Open the Markdown preview (Ctrl+Shift+V).
2. Use your browser’s Print → Save as PDF (set margins to Narrow, scale ~90–95% if needed).

Option 3 — Pandoc (if installed):

```powershell
# Export ATS version to PDF (requires pandoc + a PDF engine like wkhtmltopdf or LaTeX)
pandoc "e:\cv\resume-ATS.md" -o "e:\cv\resume-ATS.pdf"

# Export visual version to PDF
pandoc "e:\cv\resume-visual.md" -o "e:\cv\resume-visual.pdf"
```

## Tips for tailoring

- Keep `resume-ATS.md` for portals; avoid images, tables, and complex layouts.
- Mirror job descriptions: add relevant keywords in the “Keywords (ATS)” section of the ATS resume.
- For roles emphasizing AI or IoT, move those bullets to the top of Experience and Projects.
- Replace placeholder LinkedIn URL if needed: `https://linkedin.com/in/faztrick`.

## Next steps

- Create targeted variants per role (e.g., `resume-ATS-ai.md`, `resume-ATS-iot.md`).
- Add a Projects PDF with 1–2 screenshots per project when emailing recruiters.
- Keep a concise 3–4 sentence pitch ready for messages/intro calls.

## Figma + MCP resources

- `figma-visual-cv-guide.md` — Step‑by‑step guide to build the visual CV in Figma using variables, components, and tokens.
- `visual-cv-figma-import.md` — Quick how‑to import the SVG template and wire components with Auto Layout.
- `figma-mcp-playbook.md` — How to use the Figma MCP server to fetch metadata, screenshots, and code for CV nodes.
- `figma-node-map.md` — Stable naming map for frames/components (e.g., `A4-Dark`, `CV/Header`, `CV/ExperienceItem`) to target via MCP.
- `mcp-request-examples.md` — Ready‑to‑adapt request examples for metadata, codegen, and screenshots.
- `visual-cv-content-mapping.md` — Map from your content file to the Figma components and nodes.
- `figma-file-ids.md` — Quick reference for your fileKey and example nodeId.
- `tools/README.md` — PowerShell helper to parse a Figma URL into fileKey and colon‑formatted nodeId.
