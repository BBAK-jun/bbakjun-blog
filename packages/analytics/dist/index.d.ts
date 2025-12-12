declare class ViewCounter {
    private static readonly VIEW_KEY_PREFIX;
    private static getHashKey;
    private static getSessionField;
    private static migrateToHash;
    static incrementWithSession(sessionId: string, slug: string): Promise<[number, boolean]>;
    static increment(slug: string): Promise<number>;
    static get(slug: string): Promise<number>;
    static getMultiple(slugs: string[]): Promise<Record<string, number>>;
    static getTotalViews(): Promise<number>;
    static getPopularPosts(limit?: number): Promise<Array<{
        slug: string;
        views: number;
    }>>;
}

export { ViewCounter };
