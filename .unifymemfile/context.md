# Project Context

## Session 2026-05-23-10:00

### Summary

v2.0.0 - Storage reorganized to .unifymemfile/ directory + compact context mode

### Current State

v2.0.0 - Files moved from .context.md/.reminders.md to .unifymemfile/context.md + .unifymemfile/reminders.md. Migration tool added. Context now has 3 modes: compact (default, minimal tokens), full (complete history), recent (last N sessions). Legacy files auto-migrated on first write.

### Recent Changes

- Created src/storage.ts with centralized path helpers for .unifymemfile/ directory
- All context/reminders files now stored in .unifymemfile/ instead of project root
- Automatic migration of legacy .context.md and .reminders.md on first access
- read_context now defaults to compact mode (reduced tokens, focused on current state + tasks + decisions)
- Added read_context mode options: compact (default), full, recent
- Added migrate tool for explicit legacy migration
- Added context://compact resource for minimal-token context access
- CLI updated with --mode flag and compact/migrate commands

### Decisions

Use .unifymemfile/ directory for all storage files to avoid cluttering project root. Compact mode is now default for read_context to minimize token usage while preserving maximum useful context. Legacy files auto-migrated to new location on first write operation.

### Open Tasks

Test compact mode in real IDE workflow, Test migration on a project with legacy files, Verify resource context://compact works in MCP clients

### Known Issues

- append_context_note still shows old path in response message (cosmetic, works correctly)

### Notes

New directory structure: .unifymemfile/{context.md, reminders.md, memory.md, archive.md, config.json}
- context.md: full session history (what was .context.md)
- reminders.md: todo list (what was .reminders.md)
- memory.md: future - synthesized persistent memory
- archive.md: future - archived old sessions
- config.json: future - user preferences (default mode, max chars, etc.)

Compact mode output (~40 lines vs 126 lines for full):
- Current State (from latest session)
- Summary (from latest session)
- Key Decisions (from latest session)
- Open Tasks (aggregated from all sessions)
- Known Issues (from latest session)
- Recent Sessions (last 5 summaries)
- Notes (latest session, truncated at 500 chars)
- Reminders (if any)

Space savings: ~70% fewer tokens compared to full mode, while preserving all actionable context.

