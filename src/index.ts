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
} from "./markdown.js";
import { resolveProjectRoot } from "./project-root.js";

class ContextServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "unifymemfile",
        version: "1.0.0",
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
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === "context://current") {
        const root = resolveProjectRoot();
        if (!root) {
          throw new Error("Could not determine project root.");
        }
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

      if (uri === "reminders://current") {
        const root = resolveProjectRoot();
        if (!root) {
          throw new Error("Could not determine project root.");
        }
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
            description: "Read the current project context",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
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

          const result = await saveContext({
            ...(args as SaveContextOptions),
            projectRoot: root,
          });

          if (result.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Context saved to ${result.path}`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `Error saving context: ${result.error}`,
                },
              ],
              isError: true,
            };
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

          const data = readContextFile(root);
          let formatted = serializeContextFile(data);

          const last5Sessions = data.sessions.slice(0, 5);
          const sessionSummary = last5Sessions
            .map((s, i) => {
              const preview = s.summary
                ? s.summary.substring(0, 60) + (s.summary.length > 60 ? "..." : "")
                : "(no summary)";
              return `${i + 1}. [${s.date}] ${preview}`;
            })
            .join("\n");

          if (data.sessions.length > 0) {
            formatted += "\n\n## Recent Sessions (Last 5)\n\n" + sessionSummary + "\n";
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
          const statusText = status.exists
            ? `Exists: yes\nPath: ${status.path}\nSize: ${status.size} bytes\nLast modified: ${status.lastModified}\nSessions: ${status.sessionCount}\nLatest: ${status.latestSession}`
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
                text: `Note appended to ${root}/.context.md`,
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
                text: `Reminder added to ${root}/.reminders.md\n\n${serializeRemindersFile(remindersData)}`,
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
                text: `Reminder toggled in ${root}/.reminders.md\n\n${serializeRemindersFile(toggledData)}`,
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
                text: `Reminder removed from ${root}/.reminders.md\n\n${serializeRemindersFile(removedData)}`,
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