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
export interface ReminderItem {
    id: string;
    text: string;
    checked: boolean;
    createdAt: string;
}
export interface RemindersData {
    items: ReminderItem[];
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
export declare function remindersFileExists(projectRoot: string): boolean;
export declare function readRemindersFile(projectRoot: string): RemindersData;
export declare function writeRemindersFile(projectRoot: string, data: RemindersData): void;
export declare function serializeRemindersFile(data: RemindersData): string;
export declare function parseRemindersFile(content: string): RemindersData;
export declare function generateReminderId(text: string): string;
export declare function addReminder(projectRoot: string, text: string): RemindersData;
export declare function toggleReminder(projectRoot: string, id: string): RemindersData;
export declare function removeReminder(projectRoot: string, id: string): RemindersData;
export declare function generateCompactContext(root: string, reminders?: string): string;
