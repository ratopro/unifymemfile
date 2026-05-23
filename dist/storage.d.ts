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
export declare function getDefaultConfig(): UnifymemfileConfig;
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
export declare function readConfig(projectRoot: string): UnifymemfileConfig;
export declare function writeConfig(projectRoot: string, config: UnifymemfileConfig): void;
