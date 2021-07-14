// ==UserScript==
// @name Plex download all series episodes
// @namespace https://app.plex.tv/
// @include /^https://app\.plex\.tv/desktop/.*$/
// @version 1
// @description Plex download all
// @author Kartoffeleintopf
// @run-at document-start
// @noframes 
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./Source/Index.ts":
/*!*************************!*\
  !*** ./Source/Index.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const PlexDownloader_1 = __webpack_require__(/*! ./PlexDownloader */ "./Source/PlexDownloader.ts");
{
    const lPlexDownload = new PlexDownloader_1.PlexDownloader();
    /**
     * Start download.
     * Decide single or multi download.
     */
    const lStartDownloadFunction = async () => {
        const lCurrentUrl = window.location.href;
        try {
            await lPlexDownload.downloadMediaItems(lCurrentUrl);
        }
        catch (e) {
            if (e instanceof Error) {
                alert(e.message);
            }
            else {
                alert(e);
            }
        }
    };
    /**
     * Open downloader overlay.
     */
    const lOpenOverlay = () => {
        lPlexDownload.openOverlay();
    };
    // Scan for play button and append download button.
    setInterval(() => {
        const lPlayButton = document.querySelector('*[data-qa-id="preplay-play"]');
        if (lPlayButton) {
            // Check if download button exists.
            if (!document.querySelector('.plexDownloadButton')) {
                // Create new download button.
                const lNewDownloadButton = document.createElement('button');
                lNewDownloadButton.setAttribute('style', `
                    height: 30px;
                    padding: 0 15px;
                    background-color: #e5a00d;
                    color: #1f2326;
                    border: 0;
                    font-family: Open Sans Semibold,Helvetica Neue,Helvetica,Arial,sans-serif; 
                    text-transform: uppercase;              
                    border-radius: 4px;
                    overflow: hidden;
                `);
                lNewDownloadButton.classList.add('plexDownloadButton');
                lNewDownloadButton.addEventListener('click', async () => {
                    // Set button disabled. 
                    lNewDownloadButton.disabled = true;
                    lNewDownloadButton.style.backgroundColor = '#333';
                    // Wait for all metadata to load.
                    await lStartDownloadFunction();
                    // Enable button.
                    lNewDownloadButton.disabled = false;
                    lNewDownloadButton.style.backgroundColor = '#e5a00d';
                });
                lNewDownloadButton.appendChild(document.createTextNode('Download'));
                // Append download button after play button.
                lPlayButton.after(lNewDownloadButton);
            }
        }
        // Check if overlay button exists.
        const lDiplayWindowButton = document.querySelector('.plexOpenWindowButton');
        if (!lDiplayWindowButton) {
            // Create new download button.
            const lNewOpenOverlayButton = document.createElement('button');
            lNewOpenOverlayButton.setAttribute('style', `
                    position: absolute;
                    right: 10px;
                    bottom: 10px;
                    height: 30px;
                    padding: 0 15px;
                    background-color: #e5a00d;
                    color: #1f2326;
                    border: 0;
                    font-family: Open Sans Semibold,Helvetica Neue,Helvetica,Arial,sans-serif; 
                    text-transform: uppercase;              
                    border-radius: 4px;
                    overflow: hidden;
                `);
            lNewOpenOverlayButton.classList.add('plexOpenWindowButton');
            lNewOpenOverlayButton.addEventListener('click', async () => {
                lOpenOverlay();
            });
            lNewOpenOverlayButton.appendChild(document.createTextNode('Download Overlay'));
            // Append button into body root.
            document.body.appendChild(lNewOpenOverlayButton);
        }
        else {
            // Hide button if window is open or no element is in queue
            if (!lPlexDownload.downloadsInQueue || lPlexDownload.windowIsOpen) {
                lDiplayWindowButton.style.display = 'none';
            }
            else {
                lDiplayWindowButton.style.display = 'block';
            }
        }
    }, 250);
}


/***/ }),

/***/ "./Source/PlexDownloadWindow.ts":
/*!**************************************!*\
  !*** ./Source/PlexDownloadWindow.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
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


/***/ }),

/***/ "./Source/PlexDownloader.ts":
/*!**********************************!*\
  !*** ./Source/PlexDownloader.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlexDownloader = void 0;
const PlexDownloadWindow_1 = __webpack_require__(/*! ./PlexDownloadWindow */ "./Source/PlexDownloadWindow.ts");
const PlexService_1 = __webpack_require__(/*! ./PlexService */ "./Source/PlexService.ts");
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


/***/ }),

/***/ "./Source/PlexService.ts":
/*!*******************************!*\
  !*** ./Source/PlexService.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlexService = void 0;
class PlexService {
    /**
     * Constructor.
     */
    constructor() {
        // Set XPath config.
        this.mXPathConfig = {
            accessTokenXpath: "//Device[@clientIdentifier='{clientid}']/@accessToken",
            baseUriXpath: "//Device[@clientIdentifier='{clientid}']/Connection[@local='0']/@uri",
            mediaKeyXpath: '//Video/Media[1]/Part[1]/@key',
            mediaFileNameXpath: '//Video/Media[1]/Part[1]/@file',
            mediaFileSizeXpath: '//Video/Media[1]/Part[1]/@size',
            mediaChildrenFileMetaIdXpath: '//Video/@ratingKey',
            mediaChildrenDirectoryMetaIdXpath: '//Directory/@ratingKey'
        };
        // Set url config.
        this.mUrlConfig = {
            apiResourceUrl: 'https://plex.tv/api/resources?includeHttps=1&includeRelay=1&X-Plex-Token={token}',
            apiLibraryUrl: '{baseuri}/library/metadata/{id}?X-Plex-Token={token}',
            apiChildrenUrl: '{baseuri}/library/metadata/{metaId}/children?excludeAllLeaves=1&X-Plex-Token={token}&X-Plex-Container-Start=0&X-Plex-Container-Size=2000',
            downloadUrl: '{baseuri}{mediakey}?download=1&X-Plex-Token={token}'
        };
    }
    /**
     * Get all download file items for the meta data id.
     * @param pMediaUrl - File or directory meta data id.
     */
    async getMediaItemFileList(pMediaUrl) {
        const lLibraryAccess = await this.getLibraryAccess(pMediaUrl);
        const lMetaDataId = this.getMediaMetaDataId(pMediaUrl);
        // Read all child files.
        const lFileConnectionList = await this.getMediaItemChildFileConnectionList(lLibraryAccess, lMetaDataId);
        // Generate file items of file connections.
        const lMediaFileItemList = new Array();
        for (const lConnection of lFileConnectionList) {
            lMediaFileItemList.push(this.getMediaFileItem(lConnection));
        }
        return lMediaFileItemList;
    }
    /**
     * Get access configuration for the current viewed media container.
     * @param pLibraryUrl - Url of any media item inside the library.
     */
    async getLibraryAccess(pLibraryUrl) {
        const lClientIdMatch = /server\/([a-f0-9]{40})\//.exec(pLibraryUrl);
        const lLoginToken = localStorage.getItem('myPlexAccessToken');
        // Validate client id.
        if (!lClientIdMatch || lClientIdMatch.length !== 2) {
            throw Error('Invalid media item url.');
        }
        // Check if the user is logged in.
        if (!lLoginToken) {
            throw new Error('You are currently not browsing or logged into a Plex web environment.');
        }
        // Load media container information.
        const lApiXml = await this.loadXml(this.mUrlConfig.apiResourceUrl.replace('{token}', lLoginToken));
        // Try to get access token and base uri.
        const lAccessTokenNode = lApiXml.evaluate(this.mXPathConfig.accessTokenXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const lBaseUriNode = lApiXml.evaluate(this.mXPathConfig.baseUriXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        // base uri list
        const lBaseUriList = new Array();
        for (let lIndex = 0; lIndex < lBaseUriNode.snapshotLength; lIndex++) {
            lBaseUriList.push(lBaseUriNode.snapshotItem(lIndex).textContent);
        }
        // Validate access token and base url.
        if (!lAccessTokenNode.singleNodeValue) {
            throw new Error('Cannot find a valid accessToken.');
        }
        else if (lBaseUriList.length === 0) {
            throw new Error('Cannot find a valid base uri.');
        }
        return {
            accessToken: lAccessTokenNode.singleNodeValue.textContent,
            baseUriList: lBaseUriList
        };
    }
    /**
     * Get download url of media.
     * @param pMediaFileConnection - Media connection.
     * @returns download url of media.
     */
    getMediaFileItem(pMediaFileConnection) {
        // Build download url.
        let lDownloadUrl = this.mUrlConfig.downloadUrl;
        lDownloadUrl = lDownloadUrl.replace('{baseuri}', pMediaFileConnection.baseUri);
        lDownloadUrl = lDownloadUrl.replace('{token}', pMediaFileConnection.accessToken);
        lDownloadUrl = lDownloadUrl.replace('{mediakey}', pMediaFileConnection.mediaKey);
        return {
            url: lDownloadUrl,
            fileName: pMediaFileConnection.fileName,
            baseUri: pMediaFileConnection.baseUri
        };
    }
    /**
     * Get all media item files by loading child lists with recursion
     * until media files are found.
     * @param pLibraryAccess - Library access.
     * @param pMetaDataId - File or directory metadata id.
     */
    async getMediaItemChildFileConnectionList(pLibraryAccess, pMetaDataId) {
        const lResultFileConnectionList = new Array();
        // Try to load media item childs.
        const lMediaChildList = await this.getMediaItemChildList(pLibraryAccess, pMetaDataId);
        // Check if media item has childs.
        if (!lMediaChildList) {
            lResultFileConnectionList.push(await this.getMediaItemFileConnection(pLibraryAccess, pMetaDataId));
        }
        else if (lMediaChildList.length !== 0) {
            // Check child type.
            if ('fileName' in lMediaChildList[0]) {
                // Add file connections to result
                const lFileConnectionList = lMediaChildList;
                lResultFileConnectionList.push(...lFileConnectionList);
            }
            else {
                // Load child files of directory.
                const lDirectoryConnectionList = lMediaChildList;
                for (const lDirectory of lDirectoryConnectionList) {
                    lResultFileConnectionList.push(...(await this.getMediaItemChildFileConnectionList(pLibraryAccess, lDirectory.metaDataId)));
                }
            }
        }
        return lResultFileConnectionList;
    }
    /**
     * Get all child file connections for a media directory.
     * @param pLibraryAccess - Library access.
     * @param pMetaDataId - Media meta data id.
     */
    async getMediaItemChildList(pLibraryAccess, pDirectoryMetaDataId) {
        for (const lBaseUri of pLibraryAccess.baseUriList) {
            // Try to get media
            try {
                // Create child url.
                let lMediaChildUrl = this.mUrlConfig.apiChildrenUrl;
                lMediaChildUrl = lMediaChildUrl.replace('{baseuri}', lBaseUri);
                lMediaChildUrl = lMediaChildUrl.replace('{metaId}', pDirectoryMetaDataId);
                lMediaChildUrl = lMediaChildUrl.replace('{token}', pLibraryAccess.accessToken);
                // Get media childs xml.
                const lChildXml = await this.loadXml(lMediaChildUrl);
                // Try getting directory.
                const lDirectoryMetaDataNodes = lChildXml.evaluate(this.mXPathConfig.mediaChildrenDirectoryMetaIdXpath, lChildXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (lDirectoryMetaDataNodes.snapshotLength !== 0) {
                    // Create directory connections.
                    const mMediaConnectionList = new Array();
                    for (let lNodeIndex = 0; lNodeIndex < lDirectoryMetaDataNodes.snapshotLength; lNodeIndex++) {
                        mMediaConnectionList.push({
                            baseUri: lBaseUri,
                            accessToken: pLibraryAccess.accessToken,
                            metaDataId: lDirectoryMetaDataNodes.snapshotItem(lNodeIndex).textContent
                        });
                    }
                    return mMediaConnectionList;
                }
                else {
                    // Items should be files.
                    // Get child informations.
                    const lMediaKeyNodes = lChildXml.evaluate(this.mXPathConfig.mediaKeyXpath, lChildXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    const lFileNameNodes = lChildXml.evaluate(this.mXPathConfig.mediaFileNameXpath, lChildXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    const lFileSizeNode = lChildXml.evaluate(this.mXPathConfig.mediaFileSizeXpath, lChildXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    const lMetaDataIdNodes = lChildXml.evaluate(this.mXPathConfig.mediaChildrenFileMetaIdXpath, lChildXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    // Validate same length and for not empty.
                    if (lMediaKeyNodes.snapshotLength !== lFileNameNodes.snapshotLength ||
                        lFileNameNodes.snapshotLength !== lMetaDataIdNodes.snapshotLength ||
                        lFileSizeNode.snapshotLength !== lMetaDataIdNodes.snapshotLength ||
                        lMediaKeyNodes.snapshotLength === 0) {
                        throw new Error('Wrong result for media item file children.');
                    }
                    const lMediaConnectionList = new Array();
                    for (let lNodeIndex = 0; lNodeIndex < lMediaKeyNodes.snapshotLength; lNodeIndex++) {
                        // Get filename.
                        const lFileName = lFileNameNodes.snapshotItem(lNodeIndex).textContent.split('/').pop();
                        // Build media connections from ordered result lists.
                        lMediaConnectionList.push({
                            mediaKey: lMediaKeyNodes.snapshotItem(lNodeIndex).textContent,
                            baseUri: lBaseUri,
                            accessToken: pLibraryAccess.accessToken,
                            metaDataId: lMetaDataIdNodes.snapshotItem(lNodeIndex).textContent,
                            fileName: lFileName,
                            fileSize: parseInt(lFileSizeNode.snapshotItem(lNodeIndex).textContent)
                        });
                    }
                    return lMediaConnectionList;
                }
            }
            catch (e) {
                // eslint-disable-next-line no-console
                console.log(e);
                // Try next base uri.
                continue;
            }
        }
        return null;
    }
    /**
     * Get connection data for media file item.
     * @param pLibraryAccess - Device access configuration.
     * @param pFileMetaDataId - MetaData Id.
     */
    async getMediaItemFileConnection(pLibraryAccess, pFileMetaDataId) {
        for (const lBaseUri of pLibraryAccess.baseUriList) {
            // Try to get media
            try {
                // Create media url.
                let lMediaUrl = this.mUrlConfig.apiLibraryUrl;
                lMediaUrl = lMediaUrl.replace('{baseuri}', lBaseUri);
                lMediaUrl = lMediaUrl.replace('{id}', pFileMetaDataId);
                lMediaUrl = lMediaUrl.replace('{token}', pLibraryAccess.accessToken);
                // Get media xml.
                const lDocument = await this.loadXml(lMediaUrl);
                // Load media key and validate.
                const lMediaKeyNode = lDocument.evaluate(this.mXPathConfig.mediaKeyXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lMediaKeyNode.singleNodeValue) {
                    throw new Error('Media item is no file.');
                }
                // Try to get filename.
                const lFileNameNode = lDocument.evaluate(this.mXPathConfig.mediaFileNameXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lFileNameNode.singleNodeValue) {
                    throw new Error('No filename for this media item found.');
                }
                // Try to get file size.
                const lFileSizeNode = lDocument.evaluate(this.mXPathConfig.mediaFileSizeXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lFileSizeNode.singleNodeValue) {
                    throw new Error('No file size for this media item found.');
                }
                // Get filename from last part of the path.
                const lFileName = lFileNameNode.singleNodeValue.textContent.split('/').pop();
                const lFileSize = parseInt(lFileSizeNode.singleNodeValue.textContent);
                return {
                    mediaKey: lMediaKeyNode.singleNodeValue.textContent,
                    baseUri: lBaseUri,
                    accessToken: pLibraryAccess.accessToken,
                    metaDataId: pFileMetaDataId,
                    fileName: lFileName,
                    fileSize: lFileSize
                };
            }
            catch (e) {
                // eslint-disable-next-line no-console
                console.log(e);
                // Try next base uri.
                continue;
            }
        }
        throw new Error('No file connection for this MetaID found');
    }
    /**
     * Get media id from url.
     * @param pMediaUrl - Current url.
     */
    getMediaMetaDataId(pMediaUrl) {
        const metadataId = /key=%2Flibrary%2Fmetadata%2F(\d+)/.exec(pMediaUrl);
        if (metadataId && metadataId.length === 2) {
            return metadataId[1]; // First group.
        }
        else {
            throw new Error('No single media item found for url.');
        }
    }
    /**
     * Get url response as xml document
     * @param pUrl - Url.
     */
    async loadXml(pUrl) {
        return fetch(pUrl).then(async (pResponse) => {
            return pResponse.text();
        }).then((pResponeText) => {
            return new DOMParser().parseFromString(pResponeText, 'text/xml');
        });
    }
}
exports.PlexService = PlexService;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	__webpack_require__("./Source/Index.ts");
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__("./Source/PlexDownloader.ts");
/******/ 	__webpack_require__("./Source/PlexDownloadWindow.ts");
/******/ 	var __webpack_exports__ = __webpack_require__("./Source/PlexService.ts");
/******/ 	
/******/ })()
;