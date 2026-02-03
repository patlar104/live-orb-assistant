# Live Orb Assistant — Context

## Workspace
- Path: `/Users/patrick/Downloads/live-orb-assistant`
- Workspace file: `live-orb-assistant.code-workspace`
- Open with Insiders:
  - `code-insiders /Users/patrick/Downloads/live-orb-assistant/live-orb-assistant.code-workspace`

## Project Summary
- Vite + TypeScript + Lit app using Gemini Live Audio via `@google/genai`.
- Captures mic audio (16k PCM), streams to Gemini Live, plays back 24k audio.
- 3D orb visual using Three.js + shaders.

## Current Status
- Branch: `main`
- Remote: `origin` (GitHub)
- Most recent commits:
  - `70b51e7` Revert watcher excludes
  - `5c7cbd8` Add MCP workspace config
  - `e3079a3` Switch to flat ESLint config
  - `ef62805` Upgrade ESLint to v9

## Open Items
- **Push failing** due to DNS/SSH: `ssh: Could not resolve hostname github.com`.
  - Possible fix: configure DNS/network or switch remote to HTTPS.
- **SSH setup**: An SSH key already exists at `~/.ssh/id_ed25519`. Add its public key to GitHub if needed.

## MCP Configuration
- Workspace MCP server configured in `.vscode/mcp.json`:
  - `openaiDeveloperDocs` -> `https://developers.openai.com/mcp`
- Codex MCP server configured in `~/.codex/config.toml`:
  - `[mcp_servers.openaiDeveloperDocs]` with same URL.

## Useful Commands
- Check status: `git status -sb`
- Push: `git push`
- Lint: `npm run lint`
- Dev: `npm run dev`

