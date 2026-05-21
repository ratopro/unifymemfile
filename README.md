# unifymemfile

MCP server + CLI for persisting and sharing project context across IDEs and agents via `.context.md`.

When working on a project across multiple IDEs (VS Code, Cursor, Gemini CLI, etc.), each session's context is saved to a `.context.md` file. When another IDE or agent opens the project, it can read this file and know everything that has been done.

Sessions are stored in reverse chronological order (newest first), preventing context loss between sessions and IDE switches.

## Quick Start

```bash
npm install -g /path/to/unifymemfile
unifymemfile init
unifymemfile save --summary "Working on feature X"
```

## CLI Commands

```bash
unifymemfile save --summary "..." --open-tasks "..." --recent-changes "..."
unifymemfile read
unifymemfile status
unifymemfile note "User note here"
unifymemfile init
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_context` | Save/update context fields in `.context.md` |
| `read_context` | Read all context data |
| `get_context_status` | Check if `.context.md` exists, size, sessions count |
| `append_context_note` | Append a note to the current session |

## `.context.md` Format

```md
# Project Context

## Session 2026-05-21-13:07

### Summary

Working on MCP server integration

### Current State

Building the context persistence layer

### Recent Changes

Added session-based storage

### Decisions

Using TypeScript for type safety

### Open Tasks

Write tests for the CLI

### Known Issues

None

### Notes

- [2026-05-21-13:07] User note here

---

## Session 2026-05-20-10:30

### Summary

Initial project setup
...
```

**Session key format:** `YYYY-MM-DD-HH:MM` — duplicates within the same hour are merged into a single session.

## Installation

### From source

```bash
cd /path/to/unifymemfile
npm install
npm run build
npm link  # makes `unifymemfile` available globally
```

### VS Code / Cursor / Windsurf

**Option A — Tasks + Keybinding (no extension install needed):**

Copy `.vscode/tasks.json` and `.vscode/keybindings.json` into your project's `.vscode/` folder. Press `Ctrl+Alt+S` to save context.

**Option B — VS Code Extension:**

```bash
cd vscode-extension
npm install
# Build .vsix and install manually
```

### Gemini CLI

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "unifymemfile": {
      "command": "node",
      "args": ["/absolute/path/to/unifymemfile/dist/index.js"]
    }
  }
}
```

Restart Gemini CLI. The tools `save_context`, `read_context`, `get_context_status`, and `append_context_note` will be available.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "unifymemfile": {
      "command": "node",
      "args": ["/path/to/unifymemfile/dist/index.js"]
    }
  }
}
```

### JetBrains IDEs

Add an External Tool:

- Program: `unifymemfile`
- Arguments: `save --summary "$Prompt$"`
- Keymap: Assign `Ctrl+Alt+S`

### Neovim

```vim
nnoremap <C-A-s> :!unifymemfile save --summary "$(input('Summary: '))"<CR>
```

## Project Root Detection

Automatically detected by traversing upward for:
`.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, `pom.xml`, `build.gradle`, `CMakeLists.txt`

Override with `--project-root` / `projectRoot` parameter, or `--allow-empty-root` to skip the check.

## License

MIT