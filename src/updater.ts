import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
let _hasChecked = false;

export function findInstallRoot(): string | null {
  let dir = path.dirname(__filename);
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (
      fs.existsSync(path.join(dir, ".git")) &&
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "dist"))
    ) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

export interface UpdateResult {
  updated: boolean;
  message: string;
}

export function checkAndUpdateOnce(): UpdateResult {
  if (_hasChecked) {
    return { updated: false, message: "Already checked this session" };
  }
  _hasChecked = true;

  const installRoot = findInstallRoot();
  if (!installRoot) {
    return { updated: false, message: "Installation root not found, skipping update" };
  }

  try {
    const status = execSync("git status --porcelain", {
      cwd: installRoot,
      encoding: "utf-8",
      timeout: 5000,
    });

    if (status.trim()) {
      return { updated: false, message: "Working tree has local changes, skipping auto-update" };
    }

    execSync("git fetch origin --quiet", {
      cwd: installRoot,
      encoding: "utf-8",
      timeout: 15000,
    });

    const behind = execSync("git rev-list --count HEAD..origin/main", {
      cwd: installRoot,
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    if (behind === "0") {
      return { updated: false, message: "Already up to date" };
    }

    execSync("git pull --ff-only origin main", {
      cwd: installRoot,
      encoding: "utf-8",
      timeout: 30000,
    });

    const depsChanged = execSync(
      "git diff HEAD@{1} HEAD -- package.json package-lock.json 2>/dev/null || echo ''",
      {
        cwd: installRoot,
        encoding: "utf-8",
        timeout: 5000,
      }
    ).trim();

    if (depsChanged.length > 0) {
      execSync("npm install --silent", {
        cwd: installRoot,
        encoding: "utf-8",
        timeout: 60000,
      });
    }

    execSync("npm run build", {
      cwd: installRoot,
      encoding: "utf-8",
      timeout: 60000,
    });

    return {
      updated: true,
      message: `Updated to latest version (${behind} commits behind origin/main). Restart MCP server to use the new version.`,
    };
  } catch (err) {
    return {
      updated: false,
      message: `Update check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function resetUpdateCheck(): void {
  _hasChecked = false;
}
