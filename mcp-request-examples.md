# MCP Request Examples — Figma Visual CV

This guide provides ready-to-adapt request examples for common tasks when using the Figma MCP server with your Visual CV.

> Replace placeholders like [FILE_KEY] and [NODE_ID] before running.

---

## Prefilled examples for your file

- fileKey: `TcTlYk6EnBph2a3cZXXZO9`
- nodeId (from your link): `0:1`

Example (metadata overview):

```text
get_metadata(
  fileKey="TcTlYk6EnBph2a3cZXXZO9",
  nodeId="0:1"
)
```

Example (design context):

```text
get_design_context(
  fileKey="TcTlYk6EnBph2a3cZXXZO9",
  nodeId="0:1",
  forceCode=true
)
```

Example (screenshot):

```text
get_screenshot(
  fileKey="TcTlYk6EnBph2a3cZXXZO9",
  nodeId="0:1"
)
```

Use these to validate connectivity, then substitute nodeId for specific components like `CV/Header` or `CV/ExperienceItem` once your file has those nodes.

---

## 1) Discover structure quickly

- Goal: inspect a node’s children and confirm naming/IDs
- Use when: you have a node link but need to navigate its subtree

Example (metadata overview):

```text
get_metadata(
  fileKey="[FILE_KEY]",
  nodeId="[NODE_ID]"
)
```

Expected: A compact tree with node names (e.g., `CV/Header`, `CV/ExperienceItem`) and IDs.

---

## 2) Generate code for a component

- Goal: obtain HTML/CSS (or framework-friendly) for a specific component
- Use when: you want clean, focused output from an atomic CV component

Example (design context):

```text
get_design_context(
  fileKey="[FILE_KEY]",
  nodeId="[NODE_ID]",  # e.g., CV/Header
  forceCode=true
)
```

Tips:

- Target small, atomic components like `CV/Header`, `CV/ExperienceItem`, or `CV/ContactPill`.
- Ensure fills/images are vector or exported; prefer the provided 16px icons.

---

## 3) Capture screenshots

- Goal: export a crisp image for a node (component or full page frame)
- Use when: you need a quick preview or a component gallery

Example (screenshot):

```text
get_screenshot(
  fileKey="[FILE_KEY]",
  nodeId="[NODE_ID]"   # e.g., A4-Dark or CV/Header
)
```

Tips:

- For full resume, target `A4-Dark` or `A4-Light`.
- Lock layout with Auto Layout to avoid unexpected spacing.

---

## 4) Node ID extraction refresher

From a Figma URL:

- `https://www.figma.com/design/<fileKey>/<fileName>?node-id=123-456`
- fileKey: `<fileKey>`
- nodeId: `123:456` (replace `-` with `:`)

---

## 5) Common pitfalls

- Blank or giant outputs: target smaller components, avoid entire page frames for code.
- Missing assets in code: ensure icons are vectors or exported fills.
- Blurry screenshots: double-check you selected the top export frame, not an inner frame.

---

For naming conventions and recommended targets, see:

- `figma-node-map.md`
- `figma-mcp-playbook.md`
