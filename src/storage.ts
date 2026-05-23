import * as fs from "fs";
import * as path from "path";

export interface StoragePaths {
  dir: string;
  context: string;
  reminders: string;
  memory: string;
  archive: string;
  config: string;
}

export interface UnifymemfileConfig {
  autoUpdate: boolean;
  autoUpdateBranch: string;
  defaultMode: "compact" | "full" | "recent";
  recentSessionCount: number;
}

export function getDefaultConfig(): UnifymemfileConfig {
  return {
    autoUpdate: true,
    autoUpdateBranch: "main",
    defaultMode: "compact",
    recentSessionCount: 5,
  };
}

export function getStoragePaths(projectRoot: string): StoragePaths {
  const dir = path.join(projectRoot, ".unifymemfile");
  return {
    dir,
    context: path.join(dir, "context.md"),
    reminders: path.join(dir, "reminders.md"),
    memory: path.join(dir, "memory.md"),
    archive: path.join(dir, "archive.md"),
    config: path.join(dir, "config.json"),
  };
}

export function getLegacyPaths(projectRoot: string) {
  return {
    context: path.join(projectRoot, ".context.md"),
    reminders: path.join(projectRoot, ".reminders.md"),
  };
}

export function ensureStorageDir(projectRoot: string): StoragePaths {
  const paths = getStoragePaths(projectRoot);
  const legacy = getLegacyPaths(projectRoot);

  if (!fs.existsSync(paths.dir)) {
    fs.mkdirSync(paths.dir, { recursive: true });

    if (fs.existsSync(legacy.context) && !fs.existsSync(paths.context)) {
      fs.renameSync(legacy.context, paths.context);
    }
    if (fs.existsSync(legacy.reminders) && !fs.existsSync(paths.reminders)) {
      fs.renameSync(legacy.reminders, paths.reminders);
    }

  }

  return paths;
}

export function resolveContextPath(projectRoot: string): string {
  const paths = getStoragePaths(projectRoot);
  if (fs.existsSync(paths.context)) return paths.context;
  const legacy = getLegacyPaths(projectRoot);
  if (fs.existsSync(legacy.context)) return legacy.context;
  return paths.context;
}

export function resolveRemindersPath(projectRoot: string): string {
  const paths = getStoragePaths(projectRoot);
  if (fs.existsSync(paths.reminders)) return paths.reminders;
  const legacy = getLegacyPaths(projectRoot);
  if (fs.existsSync(legacy.reminders)) return legacy.reminders;
  return paths.reminders;
}

export function hasLegacyFiles(projectRoot: string): boolean {
  const legacy = getLegacyPaths(projectRoot);
  return fs.existsSync(legacy.context) || fs.existsSync(legacy.reminders);
}

export function migrateFromLegacy(projectRoot: string): boolean {
  const paths = getStoragePaths(projectRoot);
  const legacy = getLegacyPaths(projectRoot);
  let migrated = false;

  if (!fs.existsSync(paths.dir)) {
    fs.mkdirSync(paths.dir, { recursive: true });
  }

  if (fs.existsSync(legacy.context) && !fs.existsSync(paths.context)) {
    fs.renameSync(legacy.context, paths.context);
    migrated = true;
  }
  if (fs.existsSync(legacy.reminders) && !fs.existsSync(paths.reminders)) {
    fs.renameSync(legacy.reminders, paths.reminders);
    migrated = true;
  }

  return migrated;
}

export function readConfig(projectRoot: string): UnifymemfileConfig {
  const paths = getStoragePaths(projectRoot);
  const configPath = paths.config;

  if (!fs.existsSync(configPath)) {
    const defaults = getDefaultConfig();
    writeConfig(projectRoot, defaults);
    return defaults;
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return { ...getDefaultConfig(), ...JSON.parse(content) };
  } catch {
    return getDefaultConfig();
  }
}

export function writeConfig(projectRoot: string, config: UnifymemfileConfig): void {
  const paths = getStoragePaths(projectRoot);
  fs.mkdirSync(paths.dir, { recursive: true });
  fs.writeFileSync(paths.config, JSON.stringify(config, null, 2), "utf-8");
}
