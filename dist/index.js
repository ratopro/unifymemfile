import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { saveContext, } from "./context.js";
import { readContextFile, writeContextFile, getContextStatus, generateDateKey, serializeContextFile, } from "./markdown.js";
import { resolveProjectRoot } from "./project-root.js";
class ContextServer {
    server;
    constructor() {
        this.server = new Server({
            name: "unifymemfile",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        this.setupTools();
        this.setupResources();
    }
    setupResources() {
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: "context://current",
                        name: "Current Project Context",
                        mimeType: "text/markdown",
                        description: "The complete .context.md file for the current project",
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
            throw new Error(`Unknown resource: ${uri}`);
        });
    }
    setupTools() {
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
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case "save_context": {
                    const root = resolveProjectRoot(args?.projectRoot);
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
                        ...args,
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
                    }
                    else {
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
                    const root = resolveProjectRoot(args?.projectRoot);
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
                    const formatted = serializeContextFile(data);
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
                    const root = resolveProjectRoot(args?.projectRoot);
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
                    const root = resolveProjectRoot(args?.projectRoot);
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
                    const note = args?.note;
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
const server = new ContextServer();
server.start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
