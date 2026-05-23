# unifymemfile

MCP server + CLI for persisting and sharing project context across IDEs and agents.

[**Español**](README-es.md)

When working across multiple IDEs (VS Code, Cursor, Gemini CLI, etc.), context is saved automatically. When another IDE or agent opens the project, it reads the stored context and knows everything that was done.

Session data is stored in `.unifymemfile/context.md` (newest first), preventing context loss between sessions and IDE switches.

## Quick Install (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash
```

This installs both MCP server and Antigravity skill by default.

### Install Options

| Option | Description |
|--------|-------------|
| `--mcp` | Install MCP server only |
| `--skill` | Install Antigravity skill only |
| `--both` | Install both MCP and skill (default) |
| `--uninstall` | Remove installation |

Examples:
```bash
# MCP only
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash -s -- --mcp

# Skill only
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash -s -- --skill

# Uninstall
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash -s -- --uninstall
```

---

## Auto Update

On the first `save_context` call, unifymemfile automatically checks GitHub for updates.
If the local installation is clean (no uncommitted changes), it performs:
`git fetch` → `git pull --ff-only` → `npm install` (if deps changed) → `npm run build`.

- Runs **once per MCP process lifetime**
- Non-blocking: update failure never aborts the save
- Configurable via `.unifymemfile/config.json` (`autoUpdate: true/false`)
- If the working tree has local changes, the update is skipped

---

## Storage

Files are stored in `.unifymemfile/` at the project root:

| File | Description |
|------|-------------|
| `context.md` | Full session history |
| `reminders.md` | Checklist reminders |
| `memory.md` | Synthesized persistent memory |
| `archive.md` | Archived old sessions |
| `config.json` | Preferences (`autoUpdate`, `defaultMode`, etc.) |

Legacy `.context.md` and `.reminders.md` are auto-migrated to `.unifymemfile/` on first save.

---

## CLI Commands

```bash
unifymemfile read                   # compact mode (default, ~35 lines)
unifymemfile read --mode full       # complete session history
unifymemfile read --mode recent -n 3 # last 3 sessions
unifymemfile compact                # shortcut for compact mode
unifymemfile save --summary "..." --current-state "..."
unifymemfile note "User note here"
unifymemfile status
unifymemfile migrate                # migrate legacy files to .unifymemfile/
unifymemfile init                   # create fresh .unifymemfile/context.md
```

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_context` | Save/update context fields (auto-checks for updates) |
| `read_context` | Read context (`compact`, `full`, or `recent` mode) |
| `get_context_status` | Check file status, size, session count |
| `append_context_note` | Append a note to the current session |
| `add_reminder` | Add a reminder in `.unifymemfile/reminders.md` |
| `toggle_reminder` | Toggle a reminder (checked/unchecked) |
| `remove_reminder` | Remove a reminder |
| `read_reminders` | Read all reminders |
| `migrate` | Explicitly migrate legacy files to `.unifymemfile/` |

### MCP Resources

| Resource | Description |
|----------|-------------|
| `context://current` | Full `.unifymemfile/context.md` file |
| `context://compact` | Compact context (minimal tokens) |
| `reminders://current` | The complete `.unifymemfile/reminders.md` file |

Access with: `@unifymemfile:context://compact`

### Read Context Modes

| Mode | Description |
|------|-------------|
| `compact` (default) | Current state + decisions + open tasks + recent sessions + notes (~35 lines, ~70% fewer tokens) |
| `full` | Complete session history with recent summary and pending tasks |
| `recent` | Show last N sessions completely (use `sessions` param, default 5) |

Example:
```json
Tool: read_context
{
  "mode": "compact"
}
```

### Compact Output Example

```
# Project Context

## Current State
Building authentication module

## Key Decisions
Use JWT tokens with refresh rotation

## Open Tasks
- [2026-05-23] Complete OAuth flow
- [2026-05-22] Write tests for auth middleware

## Recent Sessions
1. [2026-05-23] Auth implementation
2. [2026-05-22] Set up database schema

## Notes
- [10:30] Started JWT implementation
```

---

## MCP Usage

### Gemini CLI

```bash
# Check MCP status
/mcp

# Save context
> Save the current context: working on feature X, need to fix bug in auth

# Read context (compact, default)
> What's happening with the project?

# Read full context
> Read the complete project history

# Check status
> What is the context status?
```

### Claude Desktop

```
Tool: save_context
{
  "summary": "Working on authentication feature",
  "currentState": "Implementing OAuth flow",
  "recentChanges": "Added user model and migration",
  "openTasks": "Complete OAuth, write tests"
}

Tool: read_context
{
  "mode": "compact"
}
```

---

## Colloquial Phrases

| Action | Popular phrases |
|--------|-----------------|
| **Save context** | "save what we've done", "note our progress", "don't lose what we got", "update where we're at" |
| **Read context** | "what have we done?", "give me the summary", "where are we?", "catch me up" |
| **Read compact** | "dame contexto", "what's happening?", "how's it going?" |
| **Read full** | "show me everything", "full history", "todo el historial" |
| **Add note** | "note this down", "don't forget", "remember that", "keep in mind" |
| **Add reminder** | "add to my todo list", "remind me to", "don't let me forget" |
| **Read reminders** | "what's on my list?", "show my reminders", "what do I have to do?" |
| **Update / migrate** | "actualiza unifymemfile", "update unifymemfile", "upgrade" |

### Reminders

Stored in `.unifymemfile/reminders.md`:

```md
# Reminders

- [ ] Buy groceries
- [x] Call the doctor
- [ ] Finish the report
```

---

## `.unifymemfile/context.md` Format

```md
# Project Context

## Session 2026-05-21-13:00

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

- [13:07] User note here

---

## Session 2026-05-20-10:30

### Summary

Initial project setup
...
```

**Session key format:** `YYYY-MM-DD-HH:00` — duplicates within the same hour are merged into a single session.

---

## Config

`.unifymemfile/config.json` is created automatically on first use:

```json
{
  "autoUpdate": true,
  "autoUpdateBranch": "main",
  "defaultMode": "compact",
  "recentSessionCount": 5
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `autoUpdate` | `true` | Check GitHub for updates on first save |
| `autoUpdateBranch` | `main` | Branch to track for updates |
| `defaultMode` | `compact` | Default read mode (`compact`, `full`, `recent`) |
| `recentSessionCount` | `5` | Sessions to show in `recent` mode |

## Manual Installation

### From source

```bash
cd /path/to/unifymemfile
npm install
npm run build
npm link
```

### Gemini CLI

```bash
gemini mcp add unifymemfile node /path/to/unifymemfile/dist/index.js
gemini mcp list
```

### VS Code / Cursor / Windsurf

Copy `.vscode/tasks.json` and `.vscode/keybindings.json` into your project's `.vscode/` folder. Press `Ctrl+Alt+S` to save context.

### Claude Desktop

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

---

## Project Root Detection

Automatically detected by traversing upward for: `.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, `pom.xml`, `build.gradle`, `CMakeLists.txt`

Override with `--project-root` / `projectRoot` parameter, or `--allow-empty-root` to skip the check.

## License

MIT

---

If you enjoy what I do, consider supporting me on Ko-fi! Every little bit means the world! https://ko-fi.com/ratopro
