export declare class PlexDownload {
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
     * Add download url to the download queue.
     * @param pMediaItem - Download url.
     */
    private addDownloadToQueue;
    /**
     * Download blob to user file system.
     * @param pBlob - Blob.
     * @param pFileName - Filename of downloaded file.
     */
    private downloadBlob;
    /**
     * Get the next download element and start downloading
     * if no other download is running.
     */
    private startNextDownloadElement;
}
//# sourceMappingURL=PlexDownload.d.ts.map