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

export interface ReminderItem {
  id: string;
  text: string;
  checked: boolean;
  createdAt: string;
}

export interface RemindersData {
  items: ReminderItem[];
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

export function generateDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}:00`;
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
      if (value && value.trim()) {
        result += `### ${label}\n\n${value}\n\n`;
      }
    }
    if (i < data.sessions.length - 1) {
      result += "---\n\n";
    }
  }

  return result;
}

export function parseContextFile(content: string): ContextData {
  const sessions: SessionData[] = [];
  const lines = content.split(/\r?\n/);

  let currentSession: SessionData | null = null;
  let currentSection: (typeof SECTION_ORDER)[number] | null = null;
  let currentValue = "";
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock) {
      if (line.trim() === "---") {
        continue;
      }
      const sessionMatch = line.match(/^## Session (\d{4}-\d{2}-\d{2}-\d{2}:\d{2})$/);
      if (sessionMatch) {
        if (currentSession && currentSection && currentValue.trim()) {
          currentSession[currentSection] = currentValue.trim();
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
        continue;
      }
    }

    if (currentSection) {
      currentValue += line + "\n";
    }
  }

  if (currentSession) {
    if (currentSection && currentValue.trim()) {
      currentSession[currentSection] = currentValue.trim();
    }
    sessions.push(currentSession);
  }

  return { sessions };
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

export function remindersFileExists(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, ".reminders.md"));
}

export function readRemindersFile(projectRoot: string): RemindersData {
  const filePath = path.join(projectRoot, ".reminders.md");

  if (!fs.existsSync(filePath)) {
    return { items: [] };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return parseRemindersFile(content);
}

export function writeRemindersFile(projectRoot: string, data: RemindersData): void {
  const filePath = path.join(projectRoot, ".reminders.md");
  const content = serializeRemindersFile(data);
  fs.writeFileSync(filePath, content, "utf-8");
}

export function serializeRemindersFile(data: RemindersData): string {
  let result = "# Reminders\n\n";

  if (data.items.length === 0) {
    result += "_No reminders yet_\n";
    return result;
  }

  for (const item of data.items) {
    const checkbox = item.checked ? "[x]" : "[ ]";
    result += `- ${checkbox} ${item.text}\n`;
  }

  return result;
}

export function parseRemindersFile(content: string): RemindersData {
  const items: ReminderItem[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^- \[([ x])\] (.+)$/);
    if (match) {
      items.push({
        id: generateReminderId(match[2]),
        text: match[2].trim(),
        checked: match[1] === "x",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return { items };
}

export function generateReminderId(text: string): string {
  return text.substring(0, 20).replace(/\s+/g, "-").toLowerCase() + "-" + Date.now();
}

export function addReminder(projectRoot: string, text: string): RemindersData {
  const data = readRemindersFile(projectRoot);
  data.items.push({
    id: generateReminderId(text),
    text,
    checked: false,
    createdAt: new Date().toISOString(),
  });
  writeRemindersFile(projectRoot, data);
  return data;
}

export function toggleReminder(projectRoot: string, id: string): RemindersData {
  const data = readRemindersFile(projectRoot);
  const item = data.items.find((i) => i.id === id);
  if (item) {
    item.checked = !item.checked;
  }
  writeRemindersFile(projectRoot, data);
  return data;
}

export function removeReminder(projectRoot: string, id: string): RemindersData {
  const data = readRemindersFile(projectRoot);
  data.items = data.items.filter((i) => i.id !== id);
  writeRemindersFile(projectRoot, data);
  return data;
}