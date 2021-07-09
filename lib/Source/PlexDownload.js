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
            const lNewDownloadOverlay = document.createElement('div');
            lNewDownloadOverlay.classList.add('PlexDownloadOverlay');
            lNewDownloadOverlay.setAttribute('style', 'display: flex; border-bottom: 1px solid #5a5a5a; padding: 5px 0; margin: 3px 8px;');
            document.body.appendChild(lNewDownloadOverlay);
        }
    }
    /**
     * Open window with download url of media item.
     * @param pUrl - Media url.
     */
    async downloadSingleMediaItemByUrl(pUrl) {
        const lPlexService = new PlexService_1.PlexService();
        const lUrlList = await lPlexService.getDownloadLinksEpisode(pUrl);
        // Add each url to download queue
        for (const lUrl of lUrlList) {
            this.addDownloadToQueue(lUrl);
        }
    }
    /**
     * Add download url to the download queue.
     * @param pDownloadUrl - Download url.
     */
    addDownloadToQueue(pDownloadUrl) {
        // Create download row element.
        const lDownloadElement = document.createElement('div');
        lDownloadElement.setAttribute('data-url', pDownloadUrl);
        lDownloadElement.setAttribute('style', 'display: flex; border-bottom: 2px solid #333;');
        lDownloadElement.classList.add('PlexDownloadElement');
        // Get Media Key as temporary file name.
        const lTemporaryFileName = pDownloadUrl.match(/\/library\/parts\/(\d+)\//)[1];
        // Create download file name.
        const lDownloadElementFileName = document.createElement('div');
        lDownloadElementFileName.appendChild(document.createTextNode(lTemporaryFileName));
        lDownloadElementFileName.classList.add('PlexDownloadElementFileName');
        lDownloadElementFileName.setAttribute('style', 'flex: 1; border-right: 2px solid #545556;');
        // Create download progess.
        const lDownloadElementProgress = document.createElement('div');
        lDownloadElementProgress.appendChild(document.createTextNode('...'));
        lDownloadElementProgress.classList.add('PlexDownloadElementProgress');
        lDownloadElementProgress.setAttribute('style', 'width: 75px; padding: 0px 5px; border-right: 2px solid #545556; text-align: right;');
        // Create download progess.
        const lDownloadElementAbort = document.createElement('div');
        lDownloadElementAbort.appendChild(document.createTextNode('X'));
        lDownloadElementAbort.classList.add('PlexDownloadElementAbort');
        lDownloadElementAbort.setAttribute('style', 'color: #ff3f3f; padding: 0px 10px; font-weight: bolder; cursor: pointer;');
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
            cancelable: true,
            view: window
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
            const lProgressElement = lDownloadElement.querySelector('.PlexDownloadElementProgress');
            const lFileNameElement = lDownloadElement.querySelector('.PlexDownloadElementFileName');
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
            lXhrRequest.onreadystatechange = function () {
                // On header loaded
                if (lXhrRequest.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                    const aaa = lXhrRequest.getAllResponseHeaders();
                    // Get file name.
                    //const lContentDispositionHeader = lXhrRequest.getResponseHeader('Content-Disposition');
                    const lFileName = 'FILEMANETEST'; //lContentDispositionHeader.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1];
                    // Update file name.
                    lFileNameElement.innerHTML = '';
                    lFileNameElement.appendChild(document.createTextNode(lFileName));
                }
            };
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
                // Get file name.
                // const lContentDispositionHeader = lXhrRequest.getResponseHeader('Content-Disposition');
                const lFileName = 'FILEMANETEST'; //lContentDispositionHeader.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1];
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