import { PlexDownloadWindow } from './PlexDownloadWindow';
import { PlexService } from './PlexService';

export class PlexDownloader {
    private readonly mWindow: PlexDownloadWindow;

    /**
     * Is window open.
     */
    public get windowIsOpen(): boolean {
        return this.mWindow.windowIsOpen;
    }

    /**
     * Is queue is empty.
     */
    public get downloadsInQueue(): boolean {
        return this.mWindow.elementsInQueue;
    }

    /**
     * Constructor.
     * Initialize download overlay.
     */
    public constructor() {
        this.mWindow = new PlexDownloadWindow();
    }

    /**
     * Adds all files from media item into the download queue.
     * @param pUrl - Media item url.
     */
    public async downloadMediaItems(pUrl: string): Promise<void> {
        const lPlexService: PlexService = new PlexService();
        const lUrlList = await lPlexService.getMediaItemFileList(pUrl);

        // Add each url to download queue
        for (const lUrl of lUrlList) {
            await this.mWindow.addDownloadToQueue(lUrl);
        }
    }

    /**
     * Open overlay.
     */
    public async openOverlay(): Promise<void> {
        await this.mWindow.openWindow();
    }
}