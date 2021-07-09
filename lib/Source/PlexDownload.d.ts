export declare class PlexDownload {
    /**
     * Constructor.
     * Initialize download overlay.
     */
    constructor();
    /**
     * Add all media item file of a season to the download queue.
     * @param pUrl - Media url.
     */
    downloadSeasonMediaItemByUrl(pUrl: string): Promise<void>;
    /**
     * Add all media item file of a series to the download queue.
     * @param pUrl - Media url.
     */
    downloadSeriesMediaItemByUrl(pUrl: string): Promise<void>;
    /**
     * Add single media item file to the download queue.
     * @param pUrl - Media url.
     */
    downloadSingleMediaItemByUrl(pUrl: string): Promise<void>;
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