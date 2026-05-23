#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { findProjectRoot } from "./project-root.js";
import { readContextFile, writeContextFile, getContextStatus, getEmptyContextData, generateDateKey, serializeContextFile, generateCompactContext, readRemindersFile, serializeRemindersFile, } from "./markdown.js";
import { saveContext } from "./context.js";
import { migrateFromLegacy, hasLegacyFiles, getStoragePaths } from "./storage.js";
const program = new Command();
program
    .name("unifymemfile")
    .description("MCP server and CLI for persisting project context across IDEs")
    .version("1.1.0");
program
    .command("save")
    .description("Save or update the project context for today")
    .option("-r, --project-root <path>", "Project root path")
    .option("--summary <text>", "General summary")
    .option("--current-state <text>", "Current state")
    .option("--recent-changes <text>", "Recent changes")
    .option("--decisions <text>", "Technical decisions")
    .option("--open-tasks <text>", "Open tasks")
    .option("--known-issues <text>", "Known issues")
    .option("--notes <text>", "Additional notes")
    .option("--allow-empty-root", "Allow saving without project markers")
    .action(async (options) => {
    const root = options.projectRoot
        ? path.resolve(options.projectRoot)
        : findProjectRoot();
    if (!root) {
        console.error("Error: Could not determine project root.");
        process.exit(1);
    }
    const result = await saveContext({
        projectRoot: root,
        summary: options.summary,
        currentState: options.currentState,
        recentChanges: options.recentChanges,
        decisions: options.decisions,
        openTasks: options.openTasks,
        knownIssues: options.knownIssues,
        notes: options.notes,
        allowEmptyRoot: options.allowEmptyRoot,
    });
    if (result.success) {
        console.log(`Context saved to ${result.path}`);
    }
    else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
    }
});
program
    .command("read")
    .description("Read the current project context")
    .option("-r, --project-root <path>", "Project root path")
    .option("-m, --mode <mode>", "Output mode: compact (default, minimal tokens), full (complete history), recent (last N sessions)", "compact")
    .option("-n, --sessions <number>", "Number of recent sessions for --mode recent", "5")
    .action(async (options) => {
    const root = options.projectRoot
        ? path.resolve(options.projectRoot)
        : findProjectRoot();
    if (!root) {
        console.error("Error: Could not determine project root.");
        process.exit(1);
    }
    const mode = options.mode || "compact";
    const sessionCount = parseInt(options.sessions) || 5;
    if (mode === "full") {
        const data = readContextFile(root);
        let formatted = serializeContextFile(data);
        const recentSessions = data.sessions.slice(0, sessionCount);
        const sessionSummary = recentSessions
            .map((s, i) => {
            const preview = s.summary
                ? s.summary.substring(0, 60) + (s.summary.length > 60 ? "..." : "")
                : "(no summary)";
            return `${i + 1}. [${s.date}] ${preview}`;
        })
            .join("\n");
        if (data.sessions.length > 0) {
            formatted += "\n\n## Recent Sessions\n\n" + sessionSummary + "\n";
        }
        const pendingTasks = data.sessions
            .filter((s) => s.openTasks && s.openTasks.trim())
            .map((s) => `- [${s.date}] ${s.openTasks}`)
            .join("\n");
        if (pendingTasks) {
            formatted += "\n\n## Pending Tasks\n\n" + pendingTasks + "\n";
        }
        console.log(formatted);
    }
    else if (mode === "recent") {
        const data = readContextFile(root);
        const sessions = data.sessions.slice(0, sessionCount);
        let formatted = "# Project Context\n\n";
        for (let i = 0; i < sessions.length; i++) {
            const s = sessions[i];
            formatted += `## Session ${s.date}\n\n`;
            if (s.summary)
                formatted += `### Summary\n\n${s.summary}\n\n`;
            if (s.currentState)
                formatted += `### Current State\n\n${s.currentState}\n\n`;
            if (s.recentChanges)
                formatted += `### Recent Changes\n\n${s.recentChanges}\n\n`;
            if (s.decisions)
                formatted += `### Decisions\n\n${s.decisions}\n\n`;
            if (s.openTasks)
                formatted += `### Open Tasks\n\n${s.openTasks}\n\n`;
            if (s.knownIssues)
                formatted += `### Known Issues\n\n${s.knownIssues}\n\n`;
            if (s.notes)
                formatted += `### Notes\n\n${s.notes}\n\n`;
            if (i < sessions.length - 1)
                formatted += "---\n\n";
        }
        console.log(formatted.trim() + "\n");
    }
    else {
        const reminders = serializeRemindersFile(readRemindersFile(root));
        const formatted = generateCompactContext(root, reminders);
        console.log(formatted);
    }
});
program
    .command("status")
    .description("Show context file status")
    .option("-r, --project-root <path>", "Project root path")
    .action(async (options) => {
    const root = options.projectRoot
        ? path.resolve(options.projectRoot)
        : findProjectRoot();
    if (!root) {
        console.error("Error: Could not determine project root.");
        process.exit(1);
    }
    const status = getContextStatus(root);
    const storagePaths = getStoragePaths(root);
    if (status.exists) {
        console.log(`Exists: yes`);
        console.log(`Path: ${status.path}`);
        console.log(`Storage: ${storagePaths.dir}`);
        console.log(`Size: ${status.size} bytes`);
        console.log(`Last modified: ${status.lastModified}`);
        console.log(`Sessions: ${status.sessionCount}`);
        console.log(`Latest: ${status.latestSession}`);
    }
    else {
        console.log(`Exists: no`);
        console.log(`Path: ${status.path}`);
    }
});
program
    .command("note")
    .description("Append a note to today's session")
    .option("-r, --project-root <path>", "Project root path")
    .argument("<text>", "Note text")
    .action(async (note, options) => {
    const root = options.projectRoot
        ? path.resolve(options.projectRoot)
        : findProjectRoot();
    if (!root) {
        console.error("Error: Could not determine project root.");
        process.exit(1);
    }
    const data = readContextFile(root);
    const dateKey = generateDateKey();
    const existingMatch = data.sessions.findIndex((s) => s.date === dateKey);
    const timestamp = new Date().toLocaleTimeString();
    if (existingMatch >= 0) {
        const session = data.sessions[existingMatch];
        session.notes = session.notes
            ? `${session.notes}\n- [${timestamp}] ${note}`
            : `- [${timestamp}] ${note}`;
        data.sessions.splice(existingMatch, 1);
        data.sessions.unshift(session);
    }
    else {
        const newSession = {
            date: dateKey,
            summary: "",
            currentState: "",
            recentChanges: "",
            decisions: "",
            openTasks: "",
            knownIssues: "",
            notes: `- [${timestamp}] ${note}`,
        };
        data.sessions.unshift(newSession);
    }
    writeContextFile(root, data);
    console.log("Note appended.");
});
program
    .command("init")
    .description("Initialize a new .context.md file")
    .option("-r, --project-root <path>", "Project root path")
    .action(async (options) => {
    const root = options.projectRoot
        ? path.resolve(options.projectRoot)
        : findProjectRoot();
    if (!root) {
        console.error("Error: Could not determine project root.");
        process.exit(1);
    }
    const data = getEmptyContextData();
    writeContextFile(root, data);
    console.log(`Initialized context at ${root}/.unifymemfile/context.md`);
});
program
    .command("migrate")
    .description("Migrate legacy .context.md and .reminders.md to .unifymemfile/")
    .option("-r, --project-root <path>", "Project root path")
    .action(async (options) => {
    const root = options.projectRoot
        ? path.resolve(options.projectRoot)
        : findProjectRoot();
    if (!root) {
        console.error("Error: Could not determine project root.");
        process.exit(1);
    }
    if (!hasLegacyFiles(root)) {
        const storagePaths = getStoragePaths(root);
        const migrated = fs.existsSync(storagePaths.context) || fs.existsSync(storagePaths.reminders);
        console.log(migrated
            ? "Already using .unifymemfile/ storage. No legacy files found."
            : "No context or reminders files found.");
        return;
    }
    const migrated = migrateFromLegacy(root);
    console.log(migrated
        ? "Legacy files migrated to .unifymemfile/ successfully."
        : "Files already in .unifymemfile/ or migration not needed.");
});
program
    .command("compact")
    .description("Show compact project context (minimal tokens)")
    .option("-r, --project-root <path>", "Project root path")
    .action(async (options) => {
    const root = options.projectRoot
        ? path.resolve(options.projectRoot)
        : findProjectRoot();
    if (!root) {
        console.error("Error: Could not determine project root.");
        process.exit(1);
    }
    const reminders = serializeRemindersFile(readRemindersFile(root));
    const formatted = generateCompactContext(root, reminders);
    console.log(formatted);
});
program.parse();
