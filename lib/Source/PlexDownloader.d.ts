export declare class PlexDownloader {
    private readonly mWindow;
    /**
     * Is window open.
     */
    get windowIsOpen(): boolean;
    /**
     * Is queue is empty.
     */
    get downloadsInQueue(): boolean;
    /**
     * Constructor.
     * Initialize download overlay.
     */
    constructor();
    /**
     * Adds all files from media item into the download queue.
     * @param pUrl - Media item url.
     */
    downloadMediaItems(pUrl: string): Promise<void>;
    /**
     * Open overlay.
     */
    openOverlay(): Promise<void>;
}
//# sourceMappingURL=PlexDownloader.d.ts.map