# Visual CV — Component Specs (Figma)

These specs define the key components used in the Visual CV. Create them in a `Library` page and reuse in your `CV-Template` page.

---

## 1) CV/Header

- Frame: Auto Layout horizontal
- Padding: 24 all sides; Spacing: 24
- Background: Surface-Alt; Radius: 12
- Left group:
  - Avatar (optional): 128 × 128, corner 999; Use placeholder if none
  - Name (Display/56)
  - Role (H2/18, On-Surface-Muted)
- Right group: Contact Pills (Auto Layout wrap)
  - Each pill: 8/12 padding, 8 radius, Surface background
  - Icon (16 px) + Label (Caption/12)

## 2) CV/Section

- Title: H1/24; Underline divider (1 px Divider color) 8 px below title
- Body: Vertical Auto Layout, gap 12

## 3) CV/Card

- Container: Surface-Alt; 16 padding; 12 spacing; Radius 12
- Optional Title: H2/18
- Body: Body/14

## 4) CV/ExperienceItem

- Top row: Auto Layout horizontal, space-between
  - Left: Role (H2/18) · Company (Caption/12) · Location (Caption/12)
  - Right: Dates (Caption/12, On-Surface-Muted)
- Bullets: Body/14 with 12 spacing between li items
- Use variants: with/without bullets; with/without meta row

## 5) CV/SkillGroup

- Label: Caption/12 uppercase
- Chips: Auto Layout wrap; chip pill 8/12 padding; Text 12; Radius 999

## 6) CV/TwoColumnFrame

- Outer: A4 Frame with 24 padding; Auto Layout horizontal; gap 24
- Sidebar: 320 px fixed width, vertical Auto Layout, gap 16
  - Sections: Summary, Contact (use pills), Skills (use SkillGroup)
- Content: Flexible; sections: Experience, Projects, Education

---

## Constraints & Resizing

- All inner frames set to Hug contents in one axis and Fill container in the other depending on layout.
- Use "Space between" for header rows to keep dates aligned to the right.
- Ensure text layers use text styles; color layers use color styles.

---

## Accessibility & Contrast

- For dark theme, maintain AA contrast (≥ 4.5:1) for Body text against Surface-Alt.
- Prefer larger text for headings (H1/24+, H2/18+). Keep line length 55–75 characters.

---

## Variants & Tokens

- Add light variant of colors if needed (Surface: #FFFFFF, On-Surface: #0B0F14, Divider: #E7ECF2)
- Keep spacing via 8pt grid multiples (4/8/12/16/24/32)
- Import `visual-cv-design-tokens.json` via Tokens Studio and map variables to layers.
