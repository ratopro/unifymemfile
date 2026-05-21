# unifymemfile

MCP server + CLI for persisting and sharing project context across IDEs via `.context.md`.

## MCP Tools

- `save_context` — Save/update context fields in `.context.md`
- `read_context` — Read all context data
- `get_context_status` — Check if `.context.md` exists, size, last modified
- `append_context_note` — Append a note to the Notes section

## CLI

```bash
unifymemfile save --summary "..." --recent-changes "..."
unifymemfile read
unifymemfile status
unifymemfile note "user note text"
unifymemfile init
```

## `.context.md` Format

Sessions are stored in reverse chronological order (newest first).

```md
# Project Context

## Session 2026-05-21-13:07

### Summary

Project setup complete

### Current State

Building the MCP server

### Recent Changes

Added context persistence

### Decisions

Using TypeScript

### Open Tasks

Write tests

### Known Issues

None

### Notes

User notes here

---

## Session 2026-05-20

### Summary

Initial commit

...
```

## IDE Integration

### VS Code / Cursor / Windsurf

Create a `.vscode/tasks.json` with a task that runs the CLI, or use a keybinding:

```json
{
  "tasks": [
    {
      "label": "Save Context",
      "type": "shell",
      "command": "unifymemfile",
      "args": ["save", "--summary", "${input:contextSummary}"],
      "problemMatcher": []
    }
  ]
}
```

Or bind a key in `keybindings.json`:

```json
{
  "key": "ctrl+alt+s",
  "command": "workbench.action.tasks.runTask",
  "args": "Save Context"
}
```

## VS Code Extension

The extension in `vscode-extension/` provides `Ctrl+Alt+S` to save context directly.

```bash
cd vscode-extension
npm install
# Install from local .vsix for development:
code --install-extension unifymemfile-*.vsix
```

Or use the built-in task + keybinding approach (no extension install needed):

**`.vscode/tasks.json`** — Task definition:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "unifymemfile: Save Context",
      "type": "shell",
      "command": "unifymemfile",
      "args": ["save", "--project-root", "${workspaceFolder}"],
      "problemMatcher": [],
      "group": "none"
    }
  ]
}
```

**`.vscode/keybindings.json`** — Keybinding:
```json
[
  {
    "key": "ctrl+alt+s",
    "command": "workbench.action.tasks.runTask",
    "args": "unifymemfile: Save Context",
    "when": "editorTextFocus"
  }
]
```

## Gemini CLI

Add to your Gemini CLI MCP config (`~/.gemini/antigravity/mcp_config.json` or equivalent):

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

Restart Gemini CLI and the tools `save_context`, `read_context`, `get_context_status`, and `append_context_note` will be available.

## JetBrains IDEs

Add an External Tool:

- Program: `unifymemfile`
- Arguments: `save --summary "$Prompt$"`
- Keymap: Assign `Ctrl+Alt+S`

### Neovim

```vim
nnoremap <C-A-s> :!unifymemfile save --summary "$(input('Summary: '))"<CR>
```

Or via Lua + telescope or lazy.nvim.

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

## Project Root Detection

The project root is detected by traversing upward and looking for:
`.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, `pom.xml`, `build.gradle`, `CMakeLists.txt`

You can override with `--project-root` / `projectRoot` parameter, or `--allow-empty-root` to skip the check.