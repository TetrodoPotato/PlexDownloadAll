import { MediaFileItem } from './PlexService';
/**
 * This class can not use any static properties or hard imports.
 */
export declare class PlexDownloadWindow {
    private readonly LOCALSTORAGE_DOWNLOAD_LIST_KEY;
    private readonly mDownloadList;
    private mWindow;
    /**
     * Is a window open.
     */
    get windowIsOpen(): boolean;
    /**
     * Is queue is empty.
     */
    get elementsInQueue(): boolean;
    /**
     * Constructor.
     * Initialize ui if in decicated window.
     */
    constructor();
    /**
     * Add download url to the download queue.
     * @param pMediaItem - Download url.
     */
    addDownloadToQueue(pMediaItem: MediaFileItem): Promise<void>;
    /**
     * Open new window if not already open.
     */
    openWindow(): Promise<void>;
    /**
     * Download blob to user file system.
     * @param pBlob - Blob.
     * @param pFileName - Filename of downloaded file.
     */
    private downloadBlob;
    /**
     * Save download list as json string into local storage.
     */
    private saveDownloadList;
    /**
     * Get the next download element and start downloading
     * if no other download is running.
     */
    private startNextDownloadElement;
}
declare global {
    interface Window {
        isWindow?: boolean;
        downloader: PlexDownloadWindow;
    }
}
//# sourceMappingURL=PlexDownloadWindow.d.ts.map