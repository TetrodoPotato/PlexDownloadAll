"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlexDownloader = void 0;
const PlexDownloadWindow_1 = require("./PlexDownloadWindow");
const PlexService_1 = require("./PlexService");
class PlexDownloader {
    /**
     * Constructor.
     * Initialize download overlay.
     */
    constructor() {
        this.mWindow = new PlexDownloadWindow_1.PlexDownloadWindow();
    }
    /**
     * Is window open.
     */
    get windowIsOpen() {
        return this.mWindow.windowIsOpen;
    }
    /**
     * Is queue is empty.
     */
    get downloadsInQueue() {
        return this.mWindow.elementsInQueue;
    }
    /**
     * Adds all files from media item into the download queue.
     * @param pUrl - Media item url.
     */
    async downloadMediaItems(pUrl) {
        const lPlexService = new PlexService_1.PlexService();
        const lUrlList = await lPlexService.getMediaItemFileList(pUrl);
        // Add each url to download queue
        for (const lUrl of lUrlList) {
            await this.mWindow.addDownloadToQueue(lUrl);
        }
    }
    /**
     * Open overlay.
     */
    async openOverlay() {
        await this.mWindow.openWindow();
    }
}
exports.PlexDownloader = PlexDownloader;
//# sourceMappingURL=PlexDownloader.js.map