"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlexDownload = void 0;
const PlexService_1 = require("./PlexService");
class PlexDownload {
    /**
     * Constructor.
     * Initialize download overlay.
     */
    constructor() {
        // Create overlay if it does not exists.
        if (document.querySelector('.PlexDownloadOverlay') === null) {
            // Create overlay element.
            const lNewDownloadOverlay = document.createElement('div');
            lNewDownloadOverlay.classList.add('PlexDownloadOverlay');
            lNewDownloadOverlay.setAttribute('style', `
                position: fixed;
                bottom: 6px;
                right: 15px;
                width: 360px;
                background-color: #191a1c;
                border-radius: 8px;
                max-height: 300px;
                overflow: auto;
                box-shadow: 0 4px 10px rgb(0 0 0 / 35%);
                font-family: Open Sans Regular,Helvetica Neue,Helvetica,Arial,sans-serif; 
                font-size: 13px;
            `);
            // Append to body root.
            document.body.appendChild(lNewDownloadOverlay);
        }
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
            this.addDownloadToQueue(lUrl);
        }
    }
    /**
     * Add download url to the download queue.
     * @param pMediaItem - Download url.
     */
    addDownloadToQueue(pMediaItem) {
        // Create download row element.
        const lDownloadElement = document.createElement('div');
        lDownloadElement.setAttribute('data-url', pMediaItem.url);
        lDownloadElement.setAttribute('data-filename', pMediaItem.fileName);
        lDownloadElement.setAttribute('style', 'display: flex; margin: 0px 6px; padding: 8px 0px;');
        lDownloadElement.classList.add('PlexDownloadElement');
        // Create download file name.
        const lDownloadElementFileName = document.createElement('div');
        lDownloadElementFileName.appendChild(document.createTextNode(pMediaItem.fileName));
        lDownloadElementFileName.classList.add('PlexDownloadElementFileName');
        lDownloadElementFileName.setAttribute('style', 'flex: 1; border-right: 2px solid #545556; padding: 0 10px; overflow: hidden; white-space: nowrap; font-family: inherit; font-size: inherit; text-overflow: ellipsis;');
        // Create download progess.
        const lDownloadElementProgress = document.createElement('div');
        lDownloadElementProgress.appendChild(document.createTextNode('...'));
        lDownloadElementProgress.classList.add('PlexDownloadElementProgress');
        lDownloadElementProgress.setAttribute('style', 'width: 65px; padding: 0px 5px; border-right: 2px solid #545556; text-align: right;');
        // Create download progess.
        const lDownloadElementAbort = document.createElement('div');
        lDownloadElementAbort.appendChild(document.createTextNode('X'));
        lDownloadElementAbort.classList.add('PlexDownloadElementAbort');
        lDownloadElementAbort.setAttribute('style', 'color: #ff3f3f; padding: 0px 10px; font-weight: bolder; cursor: pointer;');
        lDownloadElementAbort.addEventListener('click', () => {
            lDownloadElement.remove();
        });
        // Add data element to download element.
        lDownloadElement.appendChild(lDownloadElementFileName);
        lDownloadElement.appendChild(lDownloadElementProgress);
        lDownloadElement.appendChild(lDownloadElementAbort);
        // Append download element to download overlay.
        document.querySelector('.PlexDownloadOverlay').appendChild(lDownloadElement);
        // Try to start this download.
        this.startNextDownloadElement();
    }
    /**
     * Download blob to user file system.
     * @param pBlob - Blob.
     * @param pFileName - Filename of downloaded file.
     */
    downloadBlob(pBlob, pFileName) {
        // Convert blob to download url.
        const lBlobDownloadUrl = URL.createObjectURL(pBlob);
        // Create download anchor element.
        const lAnchorElement = document.createElement('a');
        // Ser file name and href.
        lAnchorElement.href = lBlobDownloadUrl;
        lAnchorElement.download = pFileName;
        // Append link to the body.
        document.body.appendChild(lAnchorElement);
        // Dispatch click event on the anchor.
        lAnchorElement.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true
        }));
        // Remove anchor from body.
        document.body.removeChild(lAnchorElement);
    }
    /**
     * Get the next download element and start downloading
     * if no other download is running.
     */
    startNextDownloadElement() {
        // Dont start next download if one is currently running.
        if (document.querySelector('.PlexDownloadElement.Running') !== null) {
            return;
        }
        // Get next download element. Should be the first.
        const lDownloadElement = document.querySelector('.PlexDownloadElement');
        if (lDownloadElement) {
            // Set download element as running.
            lDownloadElement.classList.add('Running');
            // Get needed data.
            const lDownloadUrl = lDownloadElement.getAttribute('data-url');
            const lFileName = lDownloadElement.getAttribute('data-filename');
            const lProgressElement = lDownloadElement.querySelector('.PlexDownloadElementProgress');
            const lAbortElement = lDownloadElement.querySelector('.PlexDownloadElementAbort');
            // Close download element function.
            const lCloseDownloadElement = () => {
                lDownloadElement.remove();
                this.startNextDownloadElement();
            };
            // Create and start xhr.
            const lXhrRequest = new XMLHttpRequest();
            lXhrRequest.open('GET', lDownloadUrl, true);
            lXhrRequest.responseType = 'blob';
            lXhrRequest.onprogress = function (pProgressEvent) {
                // Clear progress content.
                lProgressElement.innerHTML = '';
                if (pProgressEvent.lengthComputable) {
                    // Add progress in percent.
                    const lProgressInPercent = (pProgressEvent.loaded / pProgressEvent.total) * 100;
                    const lProgressTwoDecimals = Math.round(lProgressInPercent * 100) / 100;
                    // Add progress as percent.      
                    lProgressElement.appendChild(document.createTextNode(`${lProgressTwoDecimals}%`));
                }
                else {
                    // Progress in mega byte
                    const lProgressInMegaByte = pProgressEvent.loaded / 1024 / 1024;
                    // Add progress as mb.      
                    lProgressElement.appendChild(document.createTextNode(`${lProgressInMegaByte}MB`));
                }
            };
            lXhrRequest.onload = () => {
                // Read response.
                const lBlob = lXhrRequest.response;
                // Download blob.
                this.downloadBlob(lBlob, lFileName);
                // Start next download.
                lCloseDownloadElement();
            };
            lXhrRequest.send();
            // Add abort download event.
            lAbortElement.addEventListener('click', () => {
                lXhrRequest.abort();
                lCloseDownloadElement();
            });
        }
    }
}
exports.PlexDownload = PlexDownload;
//# sourceMappingURL=PlexDownload.js.map