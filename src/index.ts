import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  saveContext,
  SaveContextOptions,
} from "./context.js";
import {
  readContextFile,
  writeContextFile,
  getContextStatus,
  ContextData,
  SessionData,
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
        },
      }
    );

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
          const formatted = formatContextForDisplay(data);

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
          const now = new Date();
          const dateKey = now.toISOString().slice(0, 13).replace("T", "-") + ":" + now.getMinutes().toString().padStart(2, "0");

          const existingMatch = data.sessions.findIndex((s) => s.date === dateKey);
          if (existingMatch >= 0) {
            const session = data.sessions[existingMatch];
            session.notes = session.notes
              ? `${session.notes}\n- [${dateKey}] ${note}`
              : `- [${dateKey}] ${note}`;
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
              notes: `- [${dateKey}] ${note}`,
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

function formatContextForDisplay(data: ContextData): string {
  if (data.sessions.length === 0) {
    return "# Project Context\n\n_No sessions recorded yet_\n";
  }

  let result = "# Project Context\n\n";

  for (const session of data.sessions) {
    result += `## Session ${session.date}\n\n`;
    const sections = [
      { label: "Summary", value: session.summary },
      { label: "Current State", value: session.currentState },
      { label: "Recent Changes", value: session.recentChanges },
      { label: "Decisions", value: session.decisions },
      { label: "Open Tasks", value: session.openTasks },
      { label: "Known Issues", value: session.knownIssues },
      { label: "Notes", value: session.notes },
    ];
    for (const s of sections) {
      if (s.value && s.value.trim()) {
        result += `### ${s.label}\n\n${s.value}\n\n`;
      }
    }
    result += "---\n\n";
  }

  return result;
}

const server = new ContextServer();
server.start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});