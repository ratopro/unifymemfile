export interface SessionData {
    date: string;
    summary: string;
    currentState: string;
    recentChanges: string;
    decisions: string;
    openTasks: string;
    knownIssues: string;
    notes: string;
}
export interface ContextData {
    sessions: SessionData[];
}
export declare function contextFileExists(projectRoot: string): boolean;
export declare function readContextFile(projectRoot: string): ContextData;
export declare function writeContextFile(projectRoot: string, data: ContextData): void;
export declare function getEmptyContextData(): ContextData;
export declare function generateDateKey(date?: Date): string;
export declare function serializeContextFile(data: ContextData): string;
export declare function parseContextFile(content: string): ContextData;
export declare function getContextStatus(projectRoot: string): {
    exists: boolean;
    path: string;
    size?: number;
    lastModified?: string;
    sessionCount?: number;
    latestSession?: string;
};
