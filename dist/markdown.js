import * as fs from "fs";
import * as path from "path";
const SECTION_ORDER = [
    "summary",
    "currentState",
    "recentChanges",
    "decisions",
    "openTasks",
    "knownIssues",
    "notes",
];
const SECTION_LABELS = {
    summary: "Summary",
    currentState: "Current State",
    recentChanges: "Recent Changes",
    decisions: "Decisions",
    openTasks: "Open Tasks",
    knownIssues: "Known Issues",
    notes: "Notes",
};
export function contextFileExists(projectRoot) {
    return fs.existsSync(path.join(projectRoot, ".context.md"));
}
export function readContextFile(projectRoot) {
    const filePath = path.join(projectRoot, ".context.md");
    if (!fs.existsSync(filePath)) {
        return { sessions: [] };
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return parseContextFile(content);
}
export function writeContextFile(projectRoot, data) {
    const filePath = path.join(projectRoot, ".context.md");
    const content = serializeContextFile(data);
    fs.writeFileSync(filePath, content, "utf-8");
}
export function getEmptyContextData() {
    return { sessions: [] };
}
export function generateDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    return `${year}-${month}-${day}-${hour}:00`;
}
export function serializeContextFile(data) {
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
export function parseContextFile(content) {
    const sessions = [];
    const lines = content.split(/\r?\n/);
    let currentSession = null;
    let currentSection = null;
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
export function getContextStatus(projectRoot) {
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
