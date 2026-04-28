# MCP Job Agent (this repo)

This folder adds a small **Model Context Protocol (MCP)** server for the CV/job-search toolkit.

It exposes a few safe tools to:

- return recommended job-search defaults (Dubai/UAE)
- draft a cover letter
- draft a follow-up message
- show the paths to your current resume files

## Requirements

- Node.js
- An OpenAI-compatible API key in your **local** `.env` (do not commit it)

Required env:

- `OPENAI_API_KEY`

Optional env:

- `OPENAI_MODEL` (default: `qwen/qwen3.5-9b`)
- `OPENAI_BASE_URL` (default: `http://localhost:1234/v1`)

See: `.env.example`

## Run the MCP server

From the repo root:

- `npm run mcp:job-agent`

The server uses stdio transport (for MCP clients that launch local servers).

## Suggested MCP servers to pair with this project

If you use Docker MCP / an MCP-capable client, these are typically helpful:

- `filesystem` (allow access to this repo path)
- `playwright` or `puppeteer` (browser automation)

Those are configured in your MCP client settings (not inside this repo).
