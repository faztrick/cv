# Figma Node Naming Map — Visual CV

A stable naming scheme for frames and components so you can reliably target them via MCP for screenshots, metadata, and code extraction.

---

## Top-level structure

- Page: `CV-Template`
  - Frame: `A4-Dark` (export frame)
  - Frame: `A4-Light` (export frame)
- Page: `Library` (optional component library)
  - Components prefixed with `CV/…`
- Page: `Exports` (optional for snapshots)

## Component and section map (recommended)

- `CV/Header`
  - `CV/Avatar`
  - `CV/Name`
  - `CV/Title`
  - `CV/ContactGroup`
    - `CV/ContactPill` (uses 16px icon + text)
- `CV/Sidebar`
  - `CV/Skills`
    - `CV/SkillPill`
  - `CV/Links`
- `CV/Section: Summary`
- `CV/Section: Experience`
  - `CV/ExperienceItem` (repeatable)
- `CV/Section: Projects`
  - `CV/ProjectItem` (repeatable)
- `CV/Section: Education`
  - `CV/EducationItem` (repeatable)

Use the `CV/Section: <Label>` pattern for clarity while keeping a consistent prefix.

## Node ID retrieval pattern

- Open any layer in Figma → right‑click → Copy link.
- URL shape: `https://www.figma.com/design/<fileKey>/<fileName>?node-id=123-456`
- Extract:
  - fileKey: `<fileKey>`
  - nodeId: `123:456` (replace `-` with `:`)

## Selection guidance for MCP

- For full‑page screenshots: target the `A4-Dark` or `A4-Light` frame.
- For code generation: target atomic components like `CV/Header`, `CV/ExperienceItem`, `CV/ContactPill`.
- For sections: target `CV/Section: Experience` if you want a composite preview; expect larger outputs.

## Naming best practices

- Prefix everything with `CV/` for easy filtering in searches.
- Prefer Frames to Groups; name every frame and component.
- Avoid duplicated sibling names at the same hierarchy level.
- Keep component variants small and purposeful; name variants with properties if used (e.g., `CV/ContactPill (icon=github)`).

## Example MCP targets

- Screenshot of full resume (dark): `A4-Dark`
- Screenshot of header only: `CV/Header`
- Code for a single experience item: `CV/ExperienceItem`
- Code for a contact pill: `CV/ContactPill`

## Quick MCP prompt examples

- Screenshot
  - fileKey: `[FILE_KEY]`
  - nodeId: `[NODE_ID]` (e.g., `A4-Dark` node)
- Design context (code)
  - fileKey: `[FILE_KEY]`
  - nodeId: `[NODE_ID]` (e.g., `CV/ExperienceItem`)
  - forceCode: `true`

## Consistency checklist

- Top export frames named `A4-Dark` and `A4-Light` exist.
- All atomic components use `CV/` prefix and are unique.
- Sections follow `CV/Section: <Label>` pattern.
- Reusable items (`ExperienceItem`, `ProjectItem`, `EducationItem`) are separate components.
- Contact pills use vector icons (16px) to avoid asset misses in code/output.

---

This map complements the Visual CV template and icons in this folder and aligns with the Figma MCP Playbook for automated operations.
