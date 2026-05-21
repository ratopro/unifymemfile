import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { execSync } from "child_process";

interface McpServerConfig {
  command: string;
  args: string[];
}

interface OpenCodeConfig {
  mcpServers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

interface GeminiConfig {
  mcpServers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

interface ClaudeConfig {
  mcpServers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

interface VSCodeConfig {
  servers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

function getUnifymemfilePath(): string {
  const home = process.env.HOME || "";
  const localPaths = [
    path.join(home, "sistema", "unifymemfile", "dist", "index.js"),
    path.join(home, ".local", "lib", "unifymemfile", "dist", "index.js"),
    path.join(home, ".unifymemfile", "dist", "index.js"),
    path.join(__dirname, "..", "dist", "index.js"),
  ];
  for (const p of localPaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(home, "sistema", "unifymemfile", "dist", "index.js");
}

function opencodeConfigPath(): string {
  return path.join(process.env.HOME || "", ".config", "opencode", "opencode.json");
}

function geminiConfigPath(): string {
  return path.join(process.env.HOME || "", ".gemini", "antigravity", "mcp_config.json");
}

function claudeConfigPath(): string {
  return path.join(process.env.HOME || "", ".config", "claude-desktop", "claude_desktop_config.json");
}

function vscodeMcpConfigPath(): string {
  return path.join(process.env.HOME || "", ".vscode", "mcp.json");
}

function cursorConfigPath(): string {
  return path.join(process.env.HOME || "", ".cursor", "mcp.json");
}

function windsurfConfigPath(): string {
  return path.join(process.env.HOME || "", ".windsurf", "mcp.json");
}

function opencodeInstalled(): boolean {
  return fs.existsSync(opencodeConfigPath());
}

function geminiInstalled(): boolean {
  const p = geminiConfigPath();
  return fs.existsSync(p);
}

function claudeInstalled(): boolean {
  const p = claudeConfigPath();
  return fs.existsSync(p);
}

function vscodeInstalled(): boolean {
  return fs.existsSync(path.join(process.env.HOME || "", ".vscode"));
}

function cursorInstalled(): boolean {
  return fs.existsSync(path.join(process.env.HIVE || "", ".cursor"));
}

function windsurfInstalled(): boolean {
  return fs.existsSync(path.join(process.env.HOME || "", ".windsurf"));
}

function addMcpToOpencode(mcpPath: string): boolean {
  const configPath = opencodeConfigPath();
  let config: OpenCodeConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as OpenCodeConfig;
    } catch { /* empty */ }
  }
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers.unifymemfile = { command: "node", args: [mcpPath] };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}

function addMcpToGemini(mcpPath: string): boolean {
  const configPath = geminiConfigPath();
  let config: GeminiConfig = { mcpServers: {} };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as GeminiConfig;
    } catch { /* empty */ }
  }
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers.unifymemfile = { command: "node", args: [mcpPath] };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}

function addMcpToClaude(mcpPath: string): boolean {
  const configPath = claudeConfigPath();
  let config: ClaudeConfig = { mcpServers: {} };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as ClaudeConfig;
    } catch { /* empty */ }
  }
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers.unifymemfile = { command: "node", args: [mcpPath] };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}

function addMcpToVSCode(mcpPath: string): boolean {
  const configPath = vscodeMcpConfigPath();
  let config: VSCodeConfig = { servers: {} };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as VSCodeConfig;
    } catch { /* empty */ }
  }
  if (!config.servers) config.servers = {};
  config.servers.unifymemfile = { command: "node", args: [mcpPath] };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}

function addMcpToCursor(mcpPath: string): boolean {
  const configPath = cursorConfigPath();
  let config: VSCodeConfig = { servers: {} };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as VSCodeConfig;
    } catch { /* empty */ }
  }
  if (!config.servers) config.servers = {};
  config.servers.unifymemfile = { command: "node", args: [mcpPath] };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}

function addMcpToWindsurf(mcpPath: string): boolean {
  const configPath = windsurfConfigPath();
  let config: VSCodeConfig = { servers: {} };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as VSCodeConfig;
    } catch { /* empty */ }
  }
  if (!config.servers) config.servers = {};
  config.servers.unifymemfile = { command: "node", args: [mcpPath] };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function selectIDE(
  message: string,
  options: { label: string; value: string }[]
): Promise<string[]> {
  console.log("\n" + message);
  options.forEach((opt, i) => {
    console.log(`  [${i + 1}] ${opt.label}`);
  });
  const answer = await prompt(`\nEnter numbers (comma separated) or leave empty to skip: `);
  if (!answer.trim()) return [];

  const selected: string[] = [];
  const parts = answer.split(",").map((s) => s.trim());
  for (const p of parts) {
    const num = parseInt(p, 10);
    if (num >= 1 && num <= options.length) {
      selected.push(options[num - 1].value);
    }
  }
  return selected;
}

async function main() {
  console.log("\n=== unifymemfile installer ===\n");

  const mcpPath = getUnifymemfilePath();
  if (!fs.existsSync(mcpPath)) {
    console.error(`Error: MCP server not found at ${mcpPath}`);
    console.error("Run 'npm run build' first.");
    process.exit(1);
  }
  console.log(`MCP server: ${mcpPath}\n`);

  type IDE = {
    name: string;
    key: string;
    installed: boolean;
    add: (p: string) => boolean;
  };

  const ides: IDE[] = [
    { name: "OpenCode", key: "opencode", installed: opencodeInstalled(), add: addMcpToOpencode },
    { name: "Gemini CLI", key: "gemini", installed: geminiInstalled(), add: addMcpToGemini },
    { name: "Claude Desktop", key: "claude", installed: claudeInstalled(), add: addMcpToClaude },
    { name: "VS Code", key: "vscode", installed: vscodeInstalled(), add: addMcpToVSCode },
    { name: "Cursor", key: "cursor", installed: cursorInstalled(), add: addMcpToCursor },
    { name: "Windsurf", key: "windsurf", installed: windsurfInstalled(), add: addMcpToWindsurf },
  ].filter((ide) => ide.installed);

  if (ides.length === 0) {
    console.log("No supported IDEs found.");
    process.exit(0);
  }

  const choices = ides.map((ide) => ({ label: ide.name, value: ide.key }));
  const selected = await selectIDE("Select IDEs to install unifymemfile MCP:", choices);

  if (selected.length === 0) {
    console.log("No IDEs selected.");
    process.exit(0);
  }

  console.log("");
  let allOk = true;
  for (const key of selected) {
    const ide = ides.find((i) => i.key === key);
    if (!ide) continue;
    try {
      ide.add(mcpPath);
      console.log(`  [${ide.name}] installed`);
    } catch (err: unknown) {
      console.error(`  [${ide.name}] failed: ${err instanceof Error ? err.message : String(err)}`);
      allOk = false;
    }
  }

  console.log("");
  if (allOk) {
    console.log(`Done! Installed in ${selected.length} IDE(s). Restart the IDE to use unifymemfile.`);
  } else {
    console.error("Some installations failed.");
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});