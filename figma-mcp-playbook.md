# Figma MCP Playbook — Visual CV

Use this playbook to operate the Figma MCP server against your Visual CV file for metadata, screenshots, and code extraction.

---

## 1) Prep your Figma file

- Ensure components and styles use the `CV/` prefix (e.g., `CV/Header`, `CV/Section`, `CV/ExperienceItem`).
- Keep frames organized by pages: `Library`, `CV-Template`, `Exports`.
- Name export frames clearly: `A4-Dark`, `A4-Light`.

## 2) Get fileKey and nodeId from URL

- Open a node in Figma and copy the URL. It looks like:
  - `https://www.figma.com/design/<fileKey>/<fileName>?node-id=123-456`
- Extract:
  - fileKey: `<fileKey>`
  - nodeId: `123:456` (replace the hyphen with a colon)

## 3) Quick reference — MCP tools

- Metadata overview (structure only): use `get_metadata(fileKey, nodeId)` — fast tree view for discovery.
- Design context (preferred): use `get_design_context(fileKey, nodeId)` — returns code + assets when possible.
- Screenshot capture: use `get_screenshot(fileKey, nodeId)` — high‑quality PNG for the node.

Tip: Prefer `get_design_context` for code; fall back to `get_metadata` when exploring structure.

## 4) Recommended node naming

- Page: `CV-Template`
  - Frame: `A4-Dark`
    - `CV/Header`
    - `CV/Sidebar`
    - `CV/Section: Experience`
      - Many `CV/ExperienceItem`
    - `CV/Section: Projects`
    - `CV/Section: Education`

Ensure the top frame is your export target (PDF) and reference that for screenshots.

## 5) Typical workflows

### A) Discover node IDs quickly

1. In Figma, select `CV/Header`, copy link.
2. Extract fileKey and nodeId, then run metadata retrieval to verify structure.

### B) Generate code for a component

- Use `get_design_context` with the nodeId of `CV/Header` or `CV/ExperienceItem`.
- Set `forceCode=true` if supported to return code even for bigger nodes.
- Expect HTML/CSS (or framework‑friendly) with links to asset URLs.

### C) Batch screenshots

- For `A4-Dark`, use `get_screenshot` to export the entire page frame.
- For components, target each `CV/*` component node to generate a component gallery.

## 6) Prompt templates (replace placeholders)

- Metadata (structure):
  - fileKey: `[FILE_KEY]`
  - nodeId: `[NODE_ID]`

- Design context (code):
  - fileKey: `[FILE_KEY]`
  - nodeId: `[NODE_ID]`
  - forceCode: `true`

- Screenshot:
  - fileKey: `[FILE_KEY]`
  - nodeId: `[NODE_ID]`

## 7) Tips for consistent outputs

- Keep layers atomic and properly named. Avoid unnamed groups; prefer frames.
- Use Figma Variables/Styles (tokens) instead of hardcoded values.
- Lock layout with Auto Layout to ensure consistent sizing in screenshots.
- Avoid giant nested frames when extracting code; target the smallest meaningful component.

## 8) Troubleshooting

- Missing assets in code output: ensure fills/images are exported or use vector icons.
- Blurry screenshots: ensure you target the correct node (top frame) and avoid scaling.
- Code too large/not returned: target a smaller node or set `forceCode` when supported.

---

With the naming and structure in this repo, you can target nodes like `CV/Header` or `A4-Dark` confidently for both screenshots and code generation.
