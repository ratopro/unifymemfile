import * as fs from "fs";
import * as path from "path";

export interface SessionData {
  date: string;
  summary: string;
  currentState: string;
  recentChanges: string;
  decisions: string;
  openTasks: string;
  knownIssues: string;
  notes: string;
}

export interface ContextData {
  sessions: SessionData[];
}

const SECTION_ORDER = [
  "summary",
  "currentState",
  "recentChanges",
  "decisions",
  "openTasks",
  "knownIssues",
  "notes",
] as const;

const SECTION_LABELS: Record<(typeof SECTION_ORDER)[number], string> = {
  summary: "Summary",
  currentState: "Current State",
  recentChanges: "Recent Changes",
  decisions: "Decisions",
  openTasks: "Open Tasks",
  knownIssues: "Known Issues",
  notes: "Notes",
};

export function contextFileExists(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, ".context.md"));
}

export function readContextFile(projectRoot: string): ContextData {
  const filePath = path.join(projectRoot, ".context.md");

  if (!fs.existsSync(filePath)) {
    return { sessions: [] };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return parseContextFile(content);
}

export function writeContextFile(projectRoot: string, data: ContextData): void {
  const filePath = path.join(projectRoot, ".context.md");
  const content = serializeContextFile(data);
  fs.writeFileSync(filePath, content, "utf-8");
}

export function getEmptyContextData(): ContextData {
  return { sessions: [] };
}

export function parseContextFile(content: string): ContextData {
  const sessions: SessionData[] = [];
  const lines = content.split("\n");

  let currentSession: SessionData | null = null;
  let currentSection: (typeof SECTION_ORDER)[number] | null = null;
  let currentValue = "";

  for (const line of lines) {
    const sessionMatch = line.match(/^## Session (\d{4}-\d{2}-\d{2}-\d{2}:\d{2})$/);
    if (sessionMatch) {
      if (currentSession && currentValue.trim()) {
        if (currentSection) {
          currentSession[currentSection] = currentValue.trim();
        }
      }
      if (currentSession) {
        sessions.push(currentSession);
      }
      currentSession = {
        date: sessionMatch[1],
        summary: "",
        currentState: "",
        recentChanges: "",
        decisions: "",
        openTasks: "",
        knownIssues: "",
        notes: "",
      };
      currentSection = null;
      currentValue = "";
      continue;
    }

    const sectionMatch = line.match(/^### (.+)$/);
    if (sectionMatch && currentSession) {
      if (currentSection && currentValue.trim()) {
        currentSession[currentSection] = currentValue.trim();
      }
      currentSection = null;
      currentValue = "";

      const title = sectionMatch[1].trim();
      for (const key of SECTION_ORDER) {
        if (SECTION_LABELS[key] === title) {
          currentSection = key;
          break;
        }
      }
    } else if (currentSection) {
      currentValue += line + "\n";
    }
  }

  if (currentSession && currentValue.trim()) {
    if (currentSection) {
      currentSession[currentSection] = currentValue.trim();
    }
    sessions.push(currentSession);
  }

  return { sessions };
}

export function serializeContextFile(data: ContextData): string {
  if (data.sessions.length === 0) {
    return "# Project Context\n\n_No sessions recorded yet_\n";
  }

  let result = "# Project Context\n\n";

  for (let i = 0; i < data.sessions.length; i++) {
    const session = data.sessions[i];
    result += `## Session ${session.date}\n\n`;
    for (const key of SECTION_ORDER) {
      const label = SECTION_LABELS[key];
      const value = session[key] ?? "";
      if (value) {
        result += `### ${label}\n\n${value}\n\n`;
      }
    }
    if (i < data.sessions.length - 1) {
      result += "---\n\n";
    }
  }

  return result;
}

export function getContextStatus(
  projectRoot: string
): {
  exists: boolean;
  path: string;
  size?: number;
  lastModified?: string;
  sessionCount?: number;
  latestSession?: string;
} {
  const filePath = path.join(projectRoot, ".context.md");

  if (!fs.existsSync(filePath)) {
    return { exists: false, path: filePath };
  }

  const stats = fs.statSync(filePath);
  const data = readContextFile(projectRoot);

  return {
    exists: true,
    path: filePath,
    size: stats.size,
    lastModified: stats.mtime.toISOString(),
    sessionCount: data.sessions.length,
    latestSession: data.sessions[0]?.date || "(no session)",
  };
}