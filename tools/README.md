# Tools — Figma Helpers

This folder contains helper utilities for working with Figma links.

## figma-url-parse.ps1

Parses a Figma design URL and outputs the fileKey and nodeId (with a colon).

Usage (PowerShell):

```powershell
# Parse a Figma URL
pwsh -File "e:\cv\tools\figma-url-parse.ps1" "https://www.figma.com/design/TcTlYk6EnBph2a3cZXXZO9/Untitled?node-id=0-1&m=dev"

# Sample output
#
# FileKey NodeId
# ------- ------
# TcTlYk6EnBph2a3cZXXZO9 0:1
```

Notes:

- If the URL has no node-id, NodeId will be empty. You can still use the FileKey.
- Replace the hyphen in node-id with a colon manually when needed: `123-456` → `123:456`.
