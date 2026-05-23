#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/home/rafa/sistema/unifymemfile"
GEMINI_ANTIGRAVITY_DIR="$HOME/.gemini/antigravity"
SKILL_DIR="$GEMINI_ANTIGRAVITY_DIR/skills/unifymemfile"

show_banner() {
    echo -e "${BLUE}"
    echo "  _   _                      _"
    echo " | \\ | | ___ _   _ _ __ __ _| |_ ___"
    echo " |  \\| |/ _ \\ | | | '__/ _\` | __/ _ \\"
    echo " | |\\  |  __/ |_| | | | (_| | ||  __/"
    echo " |_| \\_|\\___|\\__,_|_|  \\__,_|\\__\\___|"
    echo -e "${NC}"
    echo -e "${CYAN}Project Context Persistence for IDEs${NC}\n"
}

usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --mcp       Install as MCP server (for Gemini CLI, VS Code, etc.)"
    echo "  --skill     Install as Antigravity skill"
    echo "  --both      Install both MCP and Skill"
    echo "  --uninstall Remove installation"
    echo "  --help      Show this help"
    echo ""
    exit 1
}

check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed.${NC}"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
}

clone_or_update() {
    if [ -d "$INSTALL_DIR" ]; then
        echo -e "${GREEN}Updating repository...${NC}"
        cd "$INSTALL_DIR"
        git pull origin main 2>/dev/null || echo "Could not pull, using existing version"
    else
        echo -e "${GREEN}Cloning repository...${NC}"
        git clone https://github.com/ratopro/unifymemfile.git "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
}

install_deps() {
    echo -e "${GREEN}Installing dependencies...${NC}"
    npm install --silent 2>&1 | tail -5
}

build_project() {
    echo -e "${GREEN}Building project...${NC}"
    npm run build 2>&1 | tail -3
    echo -e "${GREEN}✓ Build complete${NC}"
}

install_mcp() {
    echo -e "\n${YELLOW}=== Installing MCP Server ===${NC}"
    
    MCP_CMD="gemini mcp add unifymemfile node $INSTALL_DIR/dist/index.js"
    
    if command -v gemini &> /dev/null; then
        echo "Registering MCP server with Gemini CLI..."
        $MCP_CMD 2>/dev/null || echo "Note: gemini mcp add failed, trying alternative..."
        
        if gemini mcp list 2>/dev/null | grep -q unifymemfile; then
            echo -e "${GREEN}✓ MCP server registered successfully${NC}"
        else
            echo -e "${YELLOW}⚠ MCP registered but not showing in list (may need restart)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Gemini CLI not found. MCP config would be:${NC}"
        echo "  $MCP_CMD"
        echo ""
        echo "To install MCP manually:"
        echo "  1. Install Gemini CLI"
        echo "  2. Run: $MCP_CMD"
    fi
    
    echo ""
    echo -e "${GREEN}✓ MCP Server installed at:${NC}"
    echo "  $INSTALL_DIR/dist/index.js"
}

install_skill() {
    echo -e "\n${YELLOW}=== Installing Antigravity Skill ===${NC}"
    
    mkdir -p "$GEMINI_ANTIGRAVITY_DIR/skills"
    
    if [ -d "$SKILL_DIR" ]; then
        echo -e "${YELLOW}Skill already exists, updating...${NC}"
        rm -rf "$SKILL_DIR"
    fi
    
    mkdir -p "$SKILL_DIR"
    
    cat > "$SKILL_DIR/SKILL.md" << 'SKILLEOF'
---
name: unifymemfile
description: |
  Installs and configures unifymemfile MCP server for project context persistence.
  Use when user asks to install unifymemfile, setup context management, or enable project memory.
license: MIT
metadata:
  version: v2
  publisher: rpro
---

# unifymemfile Installer Skill

This skill installs and configures unifymemfile, an MCP server that persists and shares project context across IDEs.

## Auto Update

On the first `save_context` call, unifymemfile checks GitHub for updates.
If the local installation is clean (no uncommitted changes), it updates itself automatically:
`git pull --ff-only` → `npm install` (if deps changed) → `npm run build`.

If the user asks to update manually, run:
```bash
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash -s -- --both
```

## Installation

### One-Command Install (MCP + Skill)

```bash
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash
```

### Options

- `--mcp`       Install MCP server only
- `--skill`     Install Antigravity skill only
- `--both`      Install both (default)
- `--uninstall` Remove installation

## Storage

Files are stored in `.unifymemfile/` at the project root:

| File | Description |
|------|-------------|
| `context.md` | Full session history |
| `reminders.md` | Checklist reminders |
| `memory.md` | Synthesized persistent memory |
| `archive.md` | Archived old sessions |
| `config.json` | Preferences (autoUpdate, defaultMode, etc.) |

Legacy `.context.md` and `.reminders.md` are auto-migrated on first save.

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_context` | Save/update context fields (auto-checks updates) |
| `read_context` | Read context (modes: compact, full, recent) |
| `get_context_status` | Check if context exists and show stats |
| `append_context_note` | Add note to current session |
| `add_reminder` | Add a reminder item |
| `toggle_reminder` | Mark reminder done/pending |
| `remove_reminder` | Remove a reminder |
| `read_reminders` | Read all reminders |
| `migrate` | Migrate legacy files to .unifymemfile/ |

## Context Modes

| Mode | Description |
|------|-------------|
| `compact` (default) | Current state + decisions + tasks + recent sessions (~35 lines) |
| `full` | Complete session history with recent summary |
| `recent -n 5` | Last N sessions complete |

## CLI Commands

```bash
unifymemfile read                   # compact mode (default)
unifymemfile read --mode full       # complete history
unifymemfile read --mode recent -n 3
unifymemfile compact                # shortcut for compact
unifymemfile save --summary "..." --current-state "..."
unifymemfile note "remember this"
unifymemfile status
unifymemfile migrate                # explicit migration
unifymemfile init                   # create fresh .unifymemfile/
```

## Colloquial Phrases

| Action | Phrases |
|--------|---------|
| Save context | "save what we've done", "note our progress" |
| Read context (compact) | "what's happening?", "where are we?", "dame contexto" |
| Read context (full) | "show me everything", "full history" |
| Add note | "note this down", "don't forget", "anota esto" |
| Add reminder | "add to my todo list", "remind me to", "recuérdame" |
| Read reminders | "what's on my list?", "what's pending?", "qué tengo pendiente" |
| Update/migrate | "actualiza unifymemfile", "update unifymemfile" |

## Compact Context Format

```md
# Project Context

## Current State
...

## Key Decisions
...

## Open Tasks
- [2026-05-23] Do this task

## Recent Sessions
1. [2026-05-23] Summary of session
2. [2026-05-22] Summary of session

## Notes
...

## Reminders
- [ ] Task
```

## Full Context Format

```md
# Project Context

## Session YYYY-MM-DD-HH:00

### Summary
...

### Current State
...

### Recent Changes
...

### Decisions
...

### Open Tasks
...

### Known Issues
...

### Notes
...

---

## Session YYYY-MM-DD-HH:00
...
```

## Reminders Format

```md
# Reminders

- [ ] Task 1
- [x] Completed task
- [ ] Task 2
```
SKILLEOF

    echo -e "${GREEN}✓ Skill installed at:${NC}"
    echo "  $SKILL_DIR/SKILL.md"
    
    if command -v gemini &> /dev/null; then
        echo ""
        echo "To verify skill:"
        echo "  gemini skills list | grep unifymemfile"
    fi
}

uninstall() {
    echo -e "\n${YELLOW}=== Uninstalling ===${NC}"
    
    echo "Removing MCP server..."
    if command -v gemini &> /dev/null; then
        gemini mcp remove unifymemfile 2>/dev/null || true
    fi
    
    echo "Removing Skill..."
    rm -rf "$SKILL_DIR" 2>/dev/null || true
    
    echo ""
    echo -e "${YELLOW}⚠ Project files kept at:${NC}"
    echo "  $INSTALL_DIR"
    echo ""
    echo "To remove completely:"
    echo "  rm -rf $INSTALL_DIR"
}

main() {
    show_banner
    
    case "${1:-}" in
        --mcp)
            check_node
            clone_or_update
            install_deps
            build_project
            install_mcp
            ;;
        --skill)
            install_skill
            ;;
        --both|--"")
            check_node
            clone_or_update
            install_deps
            build_project
            install_mcp
            install_skill
            ;;
        --uninstall)
            uninstall
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}Done!${NC}"
    echo ""
}

main "$@"