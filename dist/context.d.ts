export interface SaveContextOptions {
    projectRoot?: string;
    summary?: string;
    currentState?: string;
    recentChanges?: string;
    decisions?: string;
    openTasks?: string;
    knownIssues?: string;
    notes?: string;
    allowEmptyRoot?: boolean;
}
export declare function saveContext(options: SaveContextOptions): Promise<{
    success: boolean;
    path?: string;
    error?: string;
}>;
