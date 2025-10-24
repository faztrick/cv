# Visual CV — Figma Build Guide

This guide helps you build a polished, printable Visual CV in Figma using a small design system, ready components, and clean Auto Layout. It aligns with an MCP-based workflow so you can later generate code snippets or screenshots if needed.

---

## 1) Page setup

- Document size: A4 — 2480 × 3508 px (print quality) or 1240 × 1754 px (lighter). Export as PDF for vector text.
- Margins: 120 px outer margins (A4 2480 × 3508). Keep key text within margins.
- Grid: 12-column layout, 80 px gutter, 120 px margins. Alternatively, use a two-column layout (Sidebar 320 px, Content flexible).
- Auto Layout: Enable on all sections for consistent spacing.

---

## 2) Variables (Design Tokens)

Create Figma Variables (or import via Tokens Studio using `visual-cv-design-tokens.json`).

### Color

- Surface / Background: `#0B0F14` (dark) or `#FFFFFF` (light variant)
- Surface-Alt / Card: `#10151B`
- Primary: `#4CC2FF`
- Accent: `#A1E3A1`
- Text / On-Surface: `#E8EEF5`
- Text-Muted: `#B7C2CF`
- Divider: `#1B2430`

### Typography (Inter or SF Pro)

- Display (Name): 56 / 64, SemiBold
- H1 (Section titles): 24 / 32, SemiBold, LetterSpacing: -0.2%
- H2 (Item titles): 18 / 28, Medium
- Body: 14 / 22, Regular
- Caption / Meta: 12 / 18, Regular, Uppercase for labels

### Spacing and Radius

- Spacing scale: 4, 8, 12, 16, 20, 24, 32
- Corner radius: 8 (Cards), 999 (Pills)
- Shadows (optional): Elevation 1: 0 1 2 0 rgba(0,0,0,0.25)

---

## 3) Components (Auto Layout)

Create these as components with variants when helpful.

### Header / Identity

- Container: Auto Layout horizontal, 24 padding, 24 spacing
- Left: Avatar (optional 128×128, circular), Name (Display), Role (H2, Text-Muted)
- Right: Contact pill group — each pill uses icon + label (email, phone, website, GitHub, LinkedIn)
- Background: Surface-Alt; radius 12

### Section / Card

- Section Header: H1, divider line below (Divider 1 px)
- Body: Vertical Auto Layout, 12 spacing
- Card: Surface-Alt, 16 padding, radius 12, 12 spacing

### Experience Item

- Top row: Role (H2) • Company (Caption) • Location (Caption) • Dates (Caption, right aligned)
- Bullets: Body text with 12 spacing between items; keep each bullet ≤ 2 lines when possible

### Skill Group

- Category label: Caption uppercase (e.g., “AI / LLM”)
- Chip list: Auto Layout wrap; each chip is pill with 8 vertical / 12 horizontal padding, Text size 12

### Two-column Template (Recommended)

- Frame (A4), Auto Layout horizontal, 24 gap, 24 outer padding
- Sidebar: 320 px fixed width; sections: Summary, Contact, Skills
- Content: Flexible; sections: Experience, Projects, Education

---

## 4) Layer naming and styles

- Text styles: Display/56, H1/24, H2/18, Body/14, Caption/12
- Color styles: Primary, Accent, Surface, Surface-Alt, On-Surface, On-Surface-Muted, Divider
- Use prefix: `CV/` for styles and `CV/` for components (e.g., `CV/Header`, `CV/Card`)

---

## 5) Content mapping (use `visual-cv-content.md`)

- Paste content from the prepared file to keep typography and spacing consistent.
- Emphasize scope/impact in bullets: led, designed, shipped, reduced, improved, scaled.

---

## 6) Export settings

- Export format: PDF (Vectors preserved). Also export PNG @2x for quick sharing.
- Accessibility: Maintain contrast (WCAG AA). Dark theme: ensure `On-Surface` on dark backgrounds ≥ 4.5:1.
- File naming: `Muhammed-Fasil-PV-CV.pdf`

---

## 7) Using an MCP-driven workflow (optional)

- Once sections are built, you can use MCP-integrated assistants to:
  - Generate code snippets for the header/cards (if you later port this design to web)
  - Capture node screenshots for previews
- Keep components atomic and well-named so programmatic access works reliably (e.g., `CV/Header`, `CV/ExperienceItem`).

---

## 8) Baseline rules (from MCP server design rules prompt)

Include a rules document in your repo/workspace to standardize design integration:

- Token Definitions: keep tokens in a JSON (see `visual-cv-design-tokens.json`) and sync with Figma Variables via Tokens Studio.
- Component Library: keep components in a single Figma page `Library` and publish as a team library if needed.
- Asset Management: prefer vector icons; embed images at 2× for print clarity. Reference assets logically in an `Assets` page.
- Icon System: consistent naming `icon/mail`, `icon/phone` and size 16/20.
- Styling: prefer Auto Layout + variables; use text and color styles, avoid hard-coded values.
- Project Structure: Pages — `Library`, `CV-Template`, `Exports`. Frames — `A4-Dark`, `A4-Light`.

See also the general checklist from the MCP design rules prompt to document your final setup.
