# Visual CV Content ↔ Components Mapping

Use this as a bridge between `visual-cv-content.md` and your Figma components so you can paste content quickly and target nodes via MCP.

---

## Header

- Component: `CV/Header`
  - `CV/Name` → Name (from Summary header)
  - `CV/Title` → Title (e.g., “Full‑Stack Developer”)
  - `CV/ContactGroup`
    - `CV/ContactPill (icon=mail)` → email from Contact section
    - `CV/ContactPill (icon=phone)` → phone from Contact
    - `CV/ContactPill (icon=link)` → website/portfolio
    - `CV/ContactPill (icon=github)` → GitHub profile

## Sidebar

- Component: `CV/Sidebar`
  - `CV/Skills` → map skills list into pills (primary first)
  - `CV/Links` → external links (LinkedIn, portfolio, GitHub if not in header)

## Summary

- Component: `CV/Section: Summary`
  - Paste the short professional summary paragraph

## Experience

- Component: `CV/Section: Experience`
  - Repeat `CV/ExperienceItem` per role
    - `Company` / `Role` / `Dates`
    - 3–5 bullet points from `visual-cv-content.md` Experience

## Projects

- Component: `CV/Section: Projects`
  - Repeat `CV/ProjectItem` per project
    - Name / short one‑liner
    - 2–3 bullets for impact/tech

## Education

- Component: `CV/Section: Education`
  - Repeat `CV/EducationItem` per institution
    - Degree / School / Year

---

## MCP target quick picks

- Full resume screenshot: `A4-Dark` or `A4-Light`
- Header screenshot or code: `CV/Header`
- Single experience card code: `CV/ExperienceItem`
- Skill chip code: `CV/SkillPill`

For the exact node names and structure, see `figma-node-map.md`. For usage patterns, see `figma-mcp-playbook.md`.
