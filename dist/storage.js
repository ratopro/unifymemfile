import * as fs from "fs";
import * as path from "path";
export function getStoragePaths(projectRoot) {
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
export function getLegacyPaths(projectRoot) {
    return {
        context: path.join(projectRoot, ".context.md"),
        reminders: path.join(projectRoot, ".reminders.md"),
    };
}
export function ensureStorageDir(projectRoot) {
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
export function resolveContextPath(projectRoot) {
    const paths = getStoragePaths(projectRoot);
    if (fs.existsSync(paths.context))
        return paths.context;
    const legacy = getLegacyPaths(projectRoot);
    if (fs.existsSync(legacy.context))
        return legacy.context;
    return paths.context;
}
export function resolveRemindersPath(projectRoot) {
    const paths = getStoragePaths(projectRoot);
    if (fs.existsSync(paths.reminders))
        return paths.reminders;
    const legacy = getLegacyPaths(projectRoot);
    if (fs.existsSync(legacy.reminders))
        return legacy.reminders;
    return paths.reminders;
}
export function hasLegacyFiles(projectRoot) {
    const legacy = getLegacyPaths(projectRoot);
    return fs.existsSync(legacy.context) || fs.existsSync(legacy.reminders);
}
export function migrateFromLegacy(projectRoot) {
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
