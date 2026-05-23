export declare function findInstallRoot(): string | null;
export interface UpdateResult {
    updated: boolean;
    message: string;
}
export declare function checkAndUpdateOnce(): UpdateResult;
export declare function resetUpdateCheck(): void;
