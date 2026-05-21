import * as fs from "fs";
import * as path from "path";
import { intro, outro, select, multiselect, spinner, note, isCancel, cancel } from "@clack/prompts";
import { fileURLToPath } from "url";

// Get current file path for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface McpServerConfig {
  command: string;
  args: string[];
}

interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
  servers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

function getUnifymemfilePath(): string {
  // If we are running from dist/install.js, index.js is in the same directory
  const distPath = path.join(__dirname, "index.js");
  if (fs.existsSync(distPath)) return distPath;

  // Fallback to home dir for production installs
  const home = process.env.HOME || "";
  const localPaths = [
    path.join(home, ".local", "lib", "unifymemfile", "dist", "index.js"),
    path.join(home, ".unifymemfile", "dist", "index.js"),
  ];
  for (const p of localPaths) {
    if (fs.existsSync(p)) return p;
  }
  return distPath;
}

function getConfigPath(ide: string): string {
  const home = process.env.HOME || "";
  switch (ide) {
    case "opencode": return path.join(home, ".config", "opencode", "opencode.json");
    case "gemini": return path.join(home, ".gemini", "antigravity", "mcp_config.json");
    case "claude": return path.join(home, ".config", "claude-desktop", "claude_desktop_config.json");
    case "vscode": return path.join(home, ".vscode", "mcp.json");
    case "cursor": return path.join(home, ".cursor", "mcp.json");
    case "windsurf": return path.join(home, ".windsurf", "mcp.json");
    default: return "";
  }
}

function isIdeInstalled(ide: string): boolean {
  const home = process.env.HOME || "";
  if (ide === "vscode") return fs.existsSync(path.join(home, ".vscode"));
  if (ide === "cursor") return fs.existsSync(path.join(home, ".cursor"));
  if (ide === "windsurf") return fs.existsSync(path.join(home, ".windsurf"));
  return fs.existsSync(getConfigPath(ide));
}

function getNodePath(): string {
  return process.execPath;
}

function addMcpToConfig(ide: string, mcpPath: string): void {
  const configPath = getConfigPath(ide);
  if (!configPath) return;

  let config: McpConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch { /* ignore */ }
  }

  const useServersKey = ["vscode", "cursor", "windsurf"].includes(ide);
  let key = useServersKey ? "servers" : "mcpServers";
  if (ide === "opencode") key = "mcp";

  if (!config[key]) config[key] = {};
  
  if (ide === "opencode") {
    (config[key] as Record<string, any>).unifymemfile = {
      type: "local",
      command: [getNodePath(), mcpPath],
      enabled: true,
    };
  } else {
    (config[key] as Record<string, McpServerConfig>).unifymemfile = {
      command: getNodePath(),
      args: [mcpPath],
    };
  }

  // Clean up old invalid key for OpenCode if it exists
  if (ide === "opencode" && config.mcpServers) {
    delete config.mcpServers;
  }

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function removeMcpFromConfig(ide: string): void {
  const configPath = getConfigPath(ide);
  if (!configPath || !fs.existsSync(configPath)) return;

  let config: McpConfig = {};
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch { return; }

  const useServersKey = ["vscode", "cursor", "windsurf"].includes(ide);
  let key = useServersKey ? "servers" : "mcpServers";
  if (ide === "opencode") key = "mcp";

  if (config[key] && (config[key] as Record<string, unknown>).unifymemfile) {
    delete (config[key] as Record<string, unknown>).unifymemfile;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

async function main() {
  intro("unifymemfile manager");

  const mode = await select({
    message: "What would you like to do?",
    options: [
      { label: "Install / Update", value: "install" },
      { label: "Uninstall", value: "uninstall" },
    ],
  });

  if (isCancel(mode)) {
    cancel("Operation cancelled.");
    return;
  }

  const mcpPath = getUnifymemfilePath();
  if (mode === "install" && !fs.existsSync(mcpPath)) {
    cancel(`MCP server not found at ${mcpPath}. Run 'npm run build' first.`);
    process.exit(1);
  }

  const ides = [
    { name: "OpenCode", value: "opencode" },
    { name: "Gemini CLI", value: "gemini" },
    { name: "Claude Desktop", value: "claude" },
    { name: "VS Code", value: "vscode" },
    { name: "Cursor", value: "cursor" },
    { name: "Windsurf", value: "windsurf" },
  ].filter((ide) => isIdeInstalled(ide.value));

  if (ides.length === 0) {
    outro("No supported IDEs found.");
    return;
  }

  const selected = await multiselect({
    message: `Select IDEs to ${mode} unifymemfile MCP:`,
    options: ides.map((ide) => ({ label: ide.name, value: ide.value })),
    required: false,
  });

  if (isCancel(selected)) {
    cancel("Operation cancelled.");
    return;
  }

  if (!selected || (selected as string[]).length === 0) {
    outro("No IDEs selected.");
    return;
  }

  const s = spinner();
  s.start(mode === "install" ? "Installing..." : "Uninstalling...");

  for (const ideKey of selected as string[]) {
    try {
      if (mode === "install") {
        addMcpToConfig(ideKey, mcpPath);
      } else {
        removeMcpFromConfig(ideKey);
      }
    } catch (err) {
      s.stop(`Failed for ${ideKey}: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  }

  s.stop(mode === "install" ? "Installation complete!" : "Uninstallation complete!");
  outro(`Restart your IDE(s) to apply changes.`);
}

main().catch((err) => {
  cancel(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});