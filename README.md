# unifymemfile

MCP server + CLI for persisting and sharing project context across IDEs and agents via `.context.md`.

[**Español**](README-es.md)

When working on a project across multiple IDEs (VS Code, Cursor, Gemini CLI, etc.), each session's context is saved to a `.context.md` file. When another IDE or agent opens the project, it can read this file and know everything that has been done.

Sessions are stored in reverse chronological order (newest first), preventing context loss between sessions and IDE switches.

## Quick Install (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash
```

This will:
1. Download the repository
2. Install dependencies
3. Build the project
4. Run the interactive installer

---

## Manual Installation

### From source

```bash
cd /path/to/unifymemfile
npm install
npm run build
npm link  # makes `unifymemfile` available globally
```

## CLI Commands

```bash
unifymemfile save --summary "..." --open-tasks "..." --recent-changes "..."
unifymemfile read
unifymemfile status
unifymemfile note "User note here"
unifymemfile init
```

## Initialize Context

The context file (`.context.md`) is created automatically when you first save. But you can also initialize it explicitly:

### CLI

```bash
# Initialize in current directory
unifymemfile init

# Initialize with first context
unifymemfile save --summary "Project started, initial setup complete"
```

### MCP Tool

```
"Initialize the project context"
# or
Tool: save_context
{
  "summary": "Project started, initial setup complete"
}
```

### First Time Usage

When you start a new project:

```bash
# Option 1: CLI
cd /your/project
unifymemfile init

# Option 2: MCP (in Gemini CLI, Claude, etc.)
"Initialize context for this project"
```

The `.context.md` file will be created in your project root with an empty session. It will be populated when you first save context.

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_context` | Save/update context fields in `.context.md` |
| `read_context` | Read all context data |
| `get_context_status` | Check if `.context.md` exists, size, sessions count |
| `append_context_note` | Append a note to the current session |

### MCP Resource

| Resource | Description |
|----------|-------------|
| `context://current` | The complete `.context.md` file for the current project |

Access it with: `@unifymemfile:context://current`

---

## MCP Usage

### Gemini CLI

#### Check MCP Status

```bash
/mcp
```

This shows all connected MCP servers and their tools.

#### Using MCP Tools

In Gemini CLI, simply describe what you want:

```bash
# Save context
> Save the current context: working on feature X, need to fix bug in auth

# Read context
> Read the project context

# Check status
> What is the context status?

# Append a note
> Add a note: Remember to test the login flow
```

#### Using MCP Resources

```bash
# Access the context file directly
> @unifymemfile:context://current
```

### Claude Desktop

In Claude Desktop, use the tools in conversation:

```
# Save context
Tool: save_context
{
  "summary": "Working on authentication feature",
  "currentState": "Implementing OAuth flow",
  "recentChanges": "Added user model and migration",
  "openTasks": "Complete OAuth, write tests"
}

# Read context
Tool: read_context
{}

# Check status
Tool: get_context_status
{}

# Append note
Tool: append_context_note
{
  "note": "OAuth token refresh needs testing"
}
```

### VS Code / Cursor (with MCP enabled)

Same as Gemini CLI - use natural language:

```
# Save context
"Save context: working on API integration, found endpoint issues"

# Read context
"Read the project context to understand current state"
```

### Colloquial Phrases

Use them as you would naturally say them:

| Action | Popular phrases |
|--------|-----------------|
| **Save context** | "save what we've done", "note our progress", "don't lose what we got", "update where we're at", "record where we're at" |
| **Read context** | "what have we done?", "give me the summary", "where are we?", "what's the status?", "catch me up", "remind me what we were doing" |
| **Add note** | "note this down", "don't forget", "remember that", "keep in mind", "take a note", "mark this" |
| **Check status** | "what's there?", "how's it going?", "what do we have?", "tell me the status", "what's saved?" |

---

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

```bash
gemini mcp add unifymemfile node /path/to/unifymemfile/dist/index.js
gemini mcp list  # Verify it shows as Connected
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