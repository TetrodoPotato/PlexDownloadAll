"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlexDownloadWindow = void 0;
/**
 * This class can not use any static properties or hard imports.
 */
class PlexDownloadWindow {
    /**
     * Constructor.
     * Initialize ui if in decicated window.
     */
    constructor() {
        this.LOCALSTORAGE_DOWNLOAD_LIST_KEY = 'PlexDownloadList';
        if (window.isWindow) {
            // Set body styles.
            document.body.setAttribute('style', `
                background-color: #191a1c;
                font-family: Open Sans Regular,Helvetica Neue,Helvetica,Arial,sans-serif; 
                font-size: 13px;
            `);
            // Initialize download list.
            const lDownloadList = document.createElement('div');
            lDownloadList.classList.add('DownloadList');
            document.body.appendChild(lDownloadList);
            // Initialize lists.
            this.mDownloadList = new Array();
            // Add stored to queue.
            const lStoredListJsonString = localStorage.getItem(this.LOCALSTORAGE_DOWNLOAD_LIST_KEY);
            if (lStoredListJsonString) {
                const lStoredList = JSON.parse(lStoredListJsonString);
                for (const lItem of lStoredList) {
                    this.addDownloadToQueue(lItem);
                }
            }
        }
    }
    /**
     * Is a window open.
     */
    get windowIsOpen() {
        return this.mWindow && !this.mWindow.closed;
    }
    /**
     * Is queue is empty.
     */
    get elementsInQueue() {
        var _a;
        // [] => Empty
        return ((_a = localStorage.getItem(this.LOCALSTORAGE_DOWNLOAD_LIST_KEY)) === null || _a === void 0 ? void 0 : _a.length) > 2;
    }
    /**
     * Add download url to the download queue.
     * @param pMediaItem - Download url.
     */
    async addDownloadToQueue(pMediaItem) {
        // Check if current window is not a child windw.
        if (!window.isWindow) {
            // Open new window if not already open.
            await this.openWindow();
            // Forward to actual window.
            this.mWindow.downloader.addDownloadToQueue(pMediaItem);
            return;
        }
        // Add item to download list.
        this.mDownloadList.push(pMediaItem);
        this.saveDownloadList();
        // Create download row element.
        const lDownloadElement = document.createElement('div');
        lDownloadElement.setAttribute('data-url', pMediaItem.url);
        lDownloadElement.setAttribute('data-filename', pMediaItem.fileName);
        lDownloadElement.setAttribute('style', 'display: flex; margin: 0px 6px; padding: 8px 0px; color: #eee;');
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
        document.querySelector('.DownloadList').appendChild(lDownloadElement);
        // Try to start this download.
        this.startNextDownloadElement();
    }
    /**
     * Open new window if not already open.
     */
    async openWindow() {
        // Dont open a new window inside a opened window.
        if (window.isWindow) {
            return;
        }
        // Create new window if new window exists or the last window was closed.
        if (!this.mWindow || this.mWindow.closed) {
            // Create new window and mark as child window.
            this.mWindow = window.open('', 'PlexDownloadWindow', 'height=400,width=400,resizable,scrollbars');
            this.mWindow.isWindow = true;
            // Wait for the new window to load.
            await new Promise((pResolve) => {
                if (this.mWindow.document.readyState === 'complete') {
                    pResolve();
                }
                else {
                    this.mWindow.document.addEventListener('load', () => {
                        pResolve();
                    }, true);
                }
            });
            // Inject script. Needs to be a function.
            const lInjectionFunction = function () {
                // Create new downloader and export to window.
                const lPlexDownloadWindow = new PlexDownloadWindow();
                window.downloader = lPlexDownloadWindow;
            };
            // Create script element.
            const lInjectstionScriptElement = document.createElement('script');
            lInjectstionScriptElement.innerHTML = PlexDownloadWindow.toString() + '(' + lInjectionFunction.toString() + '());';
            // Inject in new window.
            this.mWindow.document.body.appendChild(lInjectstionScriptElement);
        }
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
     * Save download list as json string into local storage.
     */
    saveDownloadList() {
        const lJsonString = JSON.stringify(this.mDownloadList);
        localStorage.setItem(this.LOCALSTORAGE_DOWNLOAD_LIST_KEY, lJsonString);
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
                // Remove HTML element from list.
                lDownloadElement.remove();
                // Remove item from download list.
                const lMediaFileListIndex = this.mDownloadList.findIndex((pItem) => {
                    return pItem.url === lDownloadUrl;
                });
                if (lMediaFileListIndex !== -1) {
                    // Remove item from download list and save to local storage.
                    this.mDownloadList.splice(lMediaFileListIndex, 1);
                    this.saveDownloadList();
                }
                // Try to start the next download.
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
exports.PlexDownloadWindow = PlexDownloadWindow;
//# sourceMappingURL=PlexDownloadWindow.js.map