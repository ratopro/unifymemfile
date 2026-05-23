export interface StoragePaths {
    dir: string;
    context: string;
    reminders: string;
    memory: string;
    archive: string;
    config: string;
}
export declare function getStoragePaths(projectRoot: string): StoragePaths;
export declare function getLegacyPaths(projectRoot: string): {
    context: string;
    reminders: string;
};
export declare function ensureStorageDir(projectRoot: string): StoragePaths;
export declare function resolveContextPath(projectRoot: string): string;
export declare function resolveRemindersPath(projectRoot: string): string;
export declare function hasLegacyFiles(projectRoot: string): boolean;
export declare function migrateFromLegacy(projectRoot: string): boolean;
