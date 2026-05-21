#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { findProjectRoot } from "./project-root.js";
import {
  readContextFile,
  writeContextFile,
  getContextStatus,
  getEmptyContextData,
  generateDateKey,
  serializeContextFile,
  ContextData,
  SessionData,
} from "./markdown.js";
import { saveContext } from "./context.js";

const program = new Command();

program
  .name("unifymemfile")
  .description("MCP server and CLI for persisting project context across IDEs")
  .version("1.0.0");

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
    } else {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  });

program
  .command("read")
  .description("Read the current project context")
  .option("-r, --project-root <path>", "Project root path")
  .action(async (options) => {
    const root = options.projectRoot
      ? path.resolve(options.projectRoot)
      : findProjectRoot();

    if (!root) {
      console.error("Error: Could not determine project root.");
      process.exit(1);
    }

    const data = readContextFile(root);
    console.log(serializeContextFile(data));
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
    if (status.exists) {
      console.log(`Exists: yes`);
      console.log(`Path: ${status.path}`);
      console.log(`Size: ${status.size} bytes`);
      console.log(`Last modified: ${status.lastModified}`);
      console.log(`Sessions: ${status.sessionCount}`);
      console.log(`Latest: ${status.latestSession}`);
    } else {
      console.log(`Exists: no`);
      console.log(`Path: ${status.path}`);
    }
  });

program
  .command("note")
  .description("Append a note to today's session")
  .option("-r, --project-root <path>", "Project root path")
  .argument("<text>", "Note text")
  .action(async (note: string, options) => {
    const root = options.projectRoot
      ? path.resolve(options.projectRoot)
      : findProjectRoot();

    if (!root) {
      console.error("Error: Could not determine project root.");
      process.exit(1);
    }

    const data = contextFileExists(root)
      ? readContextFile(root)
      : { sessions: [] };
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
    } else {
      const newSession: SessionData = {
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
    console.log(`Created .context.md at ${root}/.context.md`);
  });

function contextFileExists(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, ".context.md"));
}

program.parse();