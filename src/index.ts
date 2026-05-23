import * as fs from "fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  saveContext,
  SaveContextOptions,
} from "./context.js";
import {
  readContextFile,
  writeContextFile,
  getContextStatus,
  generateDateKey,
  serializeContextFile,
  ContextData,
  SessionData,
  readRemindersFile,
  writeRemindersFile,
  serializeRemindersFile,
  addReminder,
  toggleReminder,
  removeReminder,
  RemindersData,
  generateCompactContext,
} from "./markdown.js";
import { resolveProjectRoot } from "./project-root.js";
import { ensureStorageDir, migrateFromLegacy, hasLegacyFiles, getStoragePaths, readConfig } from "./storage.js";
import { checkAndUpdateOnce } from "./updater.js";

class ContextServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "unifymemfile",
        version: "1.1.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupTools();
    this.setupResources();
  }

  private setupResources() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "context://current",
            name: "Current Project Context",
            mimeType: "text/markdown",
            description: "The complete .context.md file for the current project",
          },
          {
            uri: "reminders://current",
            name: "Current Reminders",
            mimeType: "text/markdown",
            description: "The complete .reminders.md file for the current project",
          },
          {
            uri: "context://compact",
            name: "Compact Project Context",
            mimeType: "text/markdown",
            description: "Compact view of the current project context for minimal token usage",
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      const root = resolveProjectRoot();
      if (!root) {
        throw new Error("Could not determine project root.");
      }

      if (uri === "context://current") {
        const data = readContextFile(root);
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: serializeContextFile(data),
            },
          ],
        };
      }

      if (uri === "context://compact") {
        const data = readContextFile(root);
        const reminders = serializeRemindersFile(readRemindersFile(root));
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: generateCompactContext(root, reminders),
            },
          ],
        };
      }

      if (uri === "reminders://current") {
        const data = readRemindersFile(root);
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: serializeRemindersFile(data),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "save_context",
            description: "Save or update the project context",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                summary: { type: "string" },
                currentState: { type: "string" },
                recentChanges: { type: "string" },
                decisions: { type: "string" },
                openTasks: { type: "string" },
                knownIssues: { type: "string" },
                notes: { type: "string" },
                allowEmptyRoot: { type: "boolean" },
              },
            },
          },
          {
            name: "read_context",
            description: "Read the current project context (compact by default)",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                mode: {
                  type: "string",
                  description: "Context mode: compact (default, minimal tokens), full (complete history), recent (last N sessions)",
                },
                sessions: {
                  type: "number",
                  description: "Number of recent sessions to show (default: 5, used with mode=recent)",
                },
              },
            },
          },
          {
            name: "get_context_status",
            description: "Show context file status",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
              },
            },
          },
          {
            name: "append_context_note",
            description: "Append a note to today's session",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                note: { type: "string" },
              },
              required: ["note"],
            },
          },
          {
            name: "add_reminder",
            description: "Add a new reminder item to the reminders list",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                text: { type: "string" },
              },
              required: ["text"],
            },
          },
          {
            name: "toggle_reminder",
            description: "Toggle a reminder item (checked/unchecked)",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                id: { type: "string" },
              },
              required: ["id"],
            },
          },
          {
            name: "remove_reminder",
            description: "Remove a reminder item from the list",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                id: { type: "string" },
              },
              required: ["id"],
            },
          },
          {
            name: "read_reminders",
            description: "Read all reminders",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
              },
            },
          },
          {
            name: "migrate",
            description: "Migrate legacy .context.md and .reminders.md files to .unifymemfile/ directory",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "save_context": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root. Please specify projectRoot or run from within a project.",
                },
              ],
              isError: true,
            };
          }

          let updateMsg: string | undefined;
          try {
            const config = readConfig(root);
            if (config.autoUpdate) {
              const updateResult = checkAndUpdateOnce();
              if (updateResult.updated) {
                updateMsg = updateResult.message;
              }
            }
          } catch {
            // Non-blocking: update failure should not abort save
          }

          const result = await saveContext({
            ...(args as SaveContextOptions),
            projectRoot: root,
          });

          const messages: string[] = [];
          if (result.success) {
            messages.push(`Context saved to ${result.path}`);
            if (updateMsg) messages.push(updateMsg);
            return { content: [{ type: "text", text: messages.join("\n\n") }] };
          } else {
            messages.push(`Error saving context: ${result.error}`);
            if (updateMsg) messages.push(updateMsg);
            return { content: [{ type: "text", text: messages.join("\n\n") }], isError: true };
          }
        }

        case "read_context": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          const mode = (args?.mode as string) || "compact";
          const sessionCount = (args?.sessions as number) || 5;

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

            return {
              content: [
                {
                  type: "text",
                  text: formatted,
                },
              ],
            };
          }

          if (mode === "recent") {
            const data = readContextFile(root);
            const sessions = data.sessions.slice(0, sessionCount);

            let formatted = "# Project Context\n\n";
            for (let i = 0; i < sessions.length; i++) {
              const s = sessions[i];
              formatted += `## Session ${s.date}\n\n`;
              if (s.summary) formatted += `### Summary\n\n${s.summary}\n\n`;
              if (s.currentState) formatted += `### Current State\n\n${s.currentState}\n\n`;
              if (s.recentChanges) formatted += `### Recent Changes\n\n${s.recentChanges}\n\n`;
              if (s.decisions) formatted += `### Decisions\n\n${s.decisions}\n\n`;
              if (s.openTasks) formatted += `### Open Tasks\n\n${s.openTasks}\n\n`;
              if (s.knownIssues) formatted += `### Known Issues\n\n${s.knownIssues}\n\n`;
              if (s.notes) formatted += `### Notes\n\n${s.notes}\n\n`;
              if (i < sessions.length - 1) formatted += "---\n\n";
            }

            return {
              content: [
                {
                  type: "text",
                  text: formatted.trim() + "\n",
                },
              ],
            };
          }

          const reminders = serializeRemindersFile(readRemindersFile(root));
          const formatted = generateCompactContext(root, reminders);
          return {
            content: [
              {
                type: "text",
                text: formatted,
              },
            ],
          };
        }

        case "get_context_status": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          const status = getContextStatus(root);
          const storagePaths = getStoragePaths(root);
          const statusText = status.exists
            ? `Exists: yes\nPath: ${status.path}\nStorage: ${storagePaths.dir}\nSize: ${status.size} bytes\nLast modified: ${status.lastModified}\nSessions: ${status.sessionCount}\nLatest: ${status.latestSession}`
            : `Exists: no\nPath: ${status.path}`;

          return {
            content: [
              {
                type: "text",
                text: statusText,
              },
            ],
          };
        }

        case "append_context_note": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          const note = args?.note as string | undefined;
          if (!note) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'note' parameter is required.",
                },
              ],
              isError: true,
            };
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

          return {
            content: [
              {
                type: "text",
                text: `Note appended to ${root}`,
              },
            ],
          };
        }

        case "migrate": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          if (!hasLegacyFiles(root)) {
            const storagePaths = getStoragePaths(root);
            const migrated = fs.existsSync(storagePaths.context) || fs.existsSync(storagePaths.reminders);
            return {
              content: [
                {
                  type: "text",
                  text: migrated
                    ? "Already using .unifymemfile/ storage. No legacy files found."
                    : "No context or reminders files found.",
                },
              ],
            };
          }

          const migrated = migrateFromLegacy(root);
          return {
            content: [
              {
                type: "text",
                text: migrated
                  ? "Legacy files migrated to .unifymemfile/ successfully."
                  : "Files already in .unifymemfile/ or migration not needed.",
              },
            ],
          };
        }

        case "add_reminder": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          const text = args?.text as string | undefined;
          if (!text) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'text' parameter is required.",
                },
              ],
              isError: true,
            };
          }

          const remindersData = addReminder(root, text);

          return {
            content: [
              {
                type: "text",
                text: `Reminder added\n\n${serializeRemindersFile(remindersData)}`,
              },
            ],
          };
        }

        case "toggle_reminder": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          const id = args?.id as string | undefined;
          if (!id) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'id' parameter is required.",
                },
              ],
              isError: true,
            };
          }

          const toggledData = toggleReminder(root, id);

          return {
            content: [
              {
                type: "text",
                text: `Reminder toggled\n\n${serializeRemindersFile(toggledData)}`,
              },
            ],
          };
        }

        case "remove_reminder": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          const id = args?.id as string | undefined;
          if (!id) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'id' parameter is required.",
                },
              ],
              isError: true,
            };
          }

          const removedData = removeReminder(root, id);

          return {
            content: [
              {
                type: "text",
                text: `Reminder removed\n\n${serializeRemindersFile(removedData)}`,
              },
            ],
          };
        }

        case "read_reminders": {
          const root = resolveProjectRoot(
            args?.projectRoot as string | undefined
          );
          if (!root) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Could not determine project root.",
                },
              ],
              isError: true,
            };
          }

          const remindersData = readRemindersFile(root);

          return {
            content: [
              {
                type: "text",
                text: serializeRemindersFile(remindersData),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new ContextServer();
server.start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
