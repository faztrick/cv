# Visual CV — Figma Import Steps

This is the quickest way to get a working layout in Figma without building from scratch.

## 1) Import assets

- Drag and drop `visual-cv-template.svg` into a new Figma file.
- Optional: Import icons from `assets/icons/` (mail.svg, phone.svg, link.svg, github.svg).

## 2) Convert to components & styles

- Select the imported SVG frame → Right‑click → “Create component” → name `CV/TwoColumnFrame`.
- Select each panel (sidebar/content) and header row to make nested components if you prefer.
- Create text styles (Display/56, H1/24, H2/18, Body/14, Caption/12).
- Create color styles (Surface, Surface-Alt, On-Surface, On-Surface-Muted, Divider).

## 3) Replace placeholder text

- Paste content from `visual-cv-content.md`:
  - Identity (name, role, contact pills)
  - Summary, Skills
  - Experience, Projects, Education

## 4) Wire up Auto Layout

- Convert the top-level frame to Auto Layout (vertical) with 24 padding and 24 spacing between sections.
- In the Experience and Projects groups, use Auto Layout vertical with 12 spacing between bullets.
- Set “Space between” on rows that need right-aligned dates.

## 5) Add variables (optional)

- Install Tokens Studio in Figma.
- Import `visual-cv-design-tokens.json` and map variables to your styles.
- Switch between Dark/Light by flipping Surface/On-Surface tokens and re-check contrast.

## 6) Export

- Use the `visual-cv-export-checklist.md` to confirm spacing, contrast, naming.
- Export the top frame as PDF (vector text) and optionally PNG @2x.
