import * as fs from "fs";
import * as path from "path";
import { findProjectRoot } from "./project-root.js";
import {
  contextFileExists,
  readContextFile,
  writeContextFile,
  generateDateKey,
  ContextData,
  SessionData,
} from "./markdown.js";

export interface SaveContextOptions {
  projectRoot?: string;
  summary?: string;
  currentState?: string;
  recentChanges?: string;
  decisions?: string;
  openTasks?: string;
  knownIssues?: string;
  notes?: string;
  allowEmptyRoot?: boolean;
}

export async function saveContext(
  options: SaveContextOptions
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const root = options.projectRoot
      ? path.resolve(options.projectRoot)
      : findProjectRoot();

    if (!root) {
      return {
        success: false,
        error: "Could not determine project root. Please specify projectRoot or ensure the project contains a recognized file (.git, package.json, pyproject.toml, etc.)",
      };
    }

    if (
      !options.allowEmptyRoot &&
      !fs.existsSync(path.join(root, ".git")) &&
      !fs.existsSync(path.join(root, "package.json")) &&
      !fs.existsSync(path.join(root, "pyproject.toml")) &&
      !fs.existsSync(path.join(root, "Cargo.toml")) &&
      !fs.existsSync(path.join(root, "go.mod"))
    ) {
      return {
        success: false,
        error: `Project root "${root}" does not appear to be a valid project. Provide a valid project root or use --allow-empty-root.`,
      };
    }

    const contextPath = path.join(root, ".context.md");
    const data = contextFileExists(root)
      ? readContextFile(root)
      : { sessions: [] };

    const dateKey = generateDateKey();

    const existingMatch = data.sessions.findIndex((s) => s.date === dateKey);
    if (existingMatch >= 0) {
      const session = data.sessions[existingMatch];
      if (options.summary !== undefined) session.summary = options.summary;
      if (options.currentState !== undefined)
        session.currentState = options.currentState;
      if (options.recentChanges !== undefined)
        session.recentChanges = options.recentChanges;
      if (options.decisions !== undefined) session.decisions = options.decisions;
      if (options.openTasks !== undefined) session.openTasks = options.openTasks;
      if (options.knownIssues !== undefined) session.knownIssues = options.knownIssues;
      if (options.notes !== undefined) session.notes = options.notes;
      data.sessions.splice(existingMatch, 1);
      data.sessions.unshift(session);
    } else {
      const newSession: SessionData = {
        date: dateKey,
        summary: options.summary ?? "",
        currentState: options.currentState ?? "",
        recentChanges: options.recentChanges ?? "",
        decisions: options.decisions ?? "",
        openTasks: options.openTasks ?? "",
        knownIssues: options.knownIssues ?? "",
        notes: options.notes ?? "",
      };
      data.sessions.unshift(newSession);
    }

    writeContextFile(root, data);

    return { success: true, path: contextPath };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}