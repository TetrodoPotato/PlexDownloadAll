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
const PlexDownload_1 = __webpack_require__(/*! ./PlexDownload */ "./Source/PlexDownload.ts");
{
    const lPlexDownload = new PlexDownload_1.PlexDownload();
    /**
     * Start download.
     * Decide single or multi download.
     */
    const lStartDownloadFunction = async () => {
        const lIsSingleMedia = document.querySelectorAll('*[class*="PrePlayDescendantList"').length === 0;
        const lIsSeasonMedia = document.querySelectorAll('*[data-qa-id="preplay-mainTitle"] a').length === 0;
        if (lIsSingleMedia) {
            lPlexDownload.downloadSingleMediaItemByUrl(window.location.href);
        }
        else if (lIsSeasonMedia) {
            // Season
        }
        else {
            // Series
        }
    };
    // Scan for play button and append download button.
    setInterval(() => {
        const lPlayButton = document.querySelector('*[data-qa-id="preplay-play"]');
        if (lPlayButton) {
            const lDownloadbutton = document.querySelector('.plexDownloadButton');
            if (!lDownloadbutton) {
                // Create new download button.
                const lNewDownloadButton = document.createElement('button');
                lNewDownloadButton.setAttribute('style', 'height: 30px; padding: 0 15px; background-color: #e5a00d;color: #1f2326;border: 0; font-family: Open Sans Semibold,Helvetica Neue,Helvetica,Arial,sans-serif; text-transform: uppercase; border-radius: 4px;');
                lNewDownloadButton.classList.add('plexDownloadButton');
                lNewDownloadButton.addEventListener('click', lStartDownloadFunction);
                lNewDownloadButton.appendChild(document.createTextNode('Download'));
                // Append download button after play button.
                lPlayButton.after(lNewDownloadButton);
            }
        }
    }, 250);
}


/***/ }),

/***/ "./Source/PlexDownload.ts":
/*!********************************!*\
  !*** ./Source/PlexDownload.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlexDownload = void 0;
const PlexService_1 = __webpack_require__(/*! ./PlexService */ "./Source/PlexService.ts");
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
            partKeyXpath: '//Media/Part[1]/@key'
        };
        // Set url config.
        this.mUrlConfig = {
            apiResourceUrl: 'https://plex.tv/api/resources?includeHttps=1&includeRelay=1&X-Plex-Token={token}',
            apiLibraryUrl: '{baseuri}/library/metadata/{id}?X-Plex-Token={token}',
            apiChildrenUrl: '{baseuri}/library/metadata/{metaId}/children?excludeAllLeaves=1&X-Plex-Token={token}&X-Plex-Container-Start=0&X-Plex-Container-Size=2000',
            downloadUrl: '{baseuri}{partkey}?download=1&X-Plex-Token={token}',
        };
    }
    /**
     * Get download link for single episode or movie.
     * @param pMediaUrl - Media url.
     */
    async getDownloadLinksEpisode(pMediaUrl) {
        const lAccessConfiguration = await this.getLibraryAccessConfiguration(pMediaUrl);
        const lMetaDataId = this.getMetaDataId(pMediaUrl);
        const lMediaConnection = await this.getMediaKey(lAccessConfiguration, lMetaDataId);
        return [this.getDownloadUrl(lMediaConnection)];
    }
    /**
     * Get download link for all episodes of a season.
     * @param pMediaUrl - Media url.
     */
    async getDownloadLinksSeason(pMediaUrl) {
        const lAccessConfiguration = await this.getLibraryAccessConfiguration(pMediaUrl);
        const lMetaDataId = this.getMetaDataId(pMediaUrl);
        const lChildrenMetaDataIdList = await this.getMediaChilds(lAccessConfiguration, lMetaDataId);
        console.log(lChildrenMetaDataIdList);
        return [''];
    }
    /**
     * Get download link for all episodes of a series.
     * @param pMediaUrl - Media url.
     */
    async getDownloadLinksSeries(pMediaUrl) {
        return [''];
    }
    /**
     * Get media id from url.
     * @param pMediaUrl - Current url.
     */
    getMetaDataId(pMediaUrl) {
        const metadataId = /key=%2Flibrary%2Fmetadata%2F(\d+)/.exec(pMediaUrl);
        if (metadataId && metadataId.length === 2) {
            return metadataId[1]; // First group.
        }
        else {
            throw new Error('No single media item found for url.');
        }
    }
    /**
     * Get download url of media.
     * @param pMediaConnection - Media connection.
     * @returns download url of media.
     */
    getDownloadUrl(pMediaConnection) {
        // Build download url.
        let lDownloadUrl = this.mUrlConfig.downloadUrl;
        lDownloadUrl = lDownloadUrl.replace('{baseuri}', pMediaConnection.baseUri);
        lDownloadUrl = lDownloadUrl.replace('{token}', pMediaConnection.accessToken);
        lDownloadUrl = lDownloadUrl.replace('{partkey}', pMediaConnection.mediaKey);
        return lDownloadUrl;
    }
    /**
     * Get access configuration for the current viewed media container.
     * @param pCurrentUrl - Current media url.
     */
    async getLibraryAccessConfiguration(pCurrentUrl) {
        const lClientIdMatch = /server\/([a-f0-9]{40})\//.exec(pCurrentUrl);
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
        const lApiXml = await this.getXml(this.mUrlConfig.apiResourceUrl.replace('{token}', lLoginToken));
        // Try to get access token and base uri.
        const lAccessTokenNode = lApiXml.evaluate(this.mXPathConfig.accessTokenXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const lBaseUriNode = lApiXml.evaluate(this.mXPathConfig.baseUriXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        // base uri list
        const lBaseUrlList = new Array();
        {
            // Iterate over all base uri nodes and save text content in array.
            let lIteratorNode = lBaseUriNode.iterateNext();
            while (lIteratorNode) {
                lBaseUrlList.push(lIteratorNode.textContent);
                lIteratorNode = lBaseUriNode.iterateNext();
            }
        }
        // Validate access token and base url.
        if (!lAccessTokenNode.singleNodeValue) {
            throw new Error('Cannot find a valid accessToken.');
        }
        else if (lBaseUrlList.length === 0) {
            throw new Error('Cannot find a valid base uri.');
        }
        return {
            accessToken: lAccessTokenNode.singleNodeValue.textContent,
            baseUrlList: lBaseUrlList
        };
    }
    async getMediaChilds(pAccessConfiguration, pMetaDataId) {
        for (const lBaseUri of pAccessConfiguration.baseUrlList) {
            // Try to get media
            try {
                // Create child url.
                let lMediaChildUrl = this.mUrlConfig.apiChildrenUrl;
                lMediaChildUrl = lMediaChildUrl.replace('{baseuri}', lBaseUri);
                lMediaChildUrl = lMediaChildUrl.replace('{metaId}', pMetaDataId);
                lMediaChildUrl = lMediaChildUrl.replace('{token}', pAccessConfiguration.accessToken);
                // Get media childs xml.
                const lDocument = await this.getXml(lMediaChildUrl);
                console.log(lDocument);
                return new Array();
            }
            catch (e) {
                // eslint-disable-next-line no-console
                console.log(e);
                // Try next base uri.
                continue;
            }
        }
        throw new Error('No connection for this MetaID found');
        // https://82-94-168-42.adb8db9ff33a4de8a17c2d58207d3dd2.plex.direct:8443/library/metadata/2044/children?excludeAllLeaves=1&X-Plex-Product=Plex%20Web&X-Plex-Version=4.60.3&X-Plex-Client-Identifier=kyewkgdh4brble765qe18tsa&X-Plex-Platform=Chrome&X-Plex-Platform-Version=91.0&X-Plex-Sync-Version=2&X-Plex-Features=external-media%2Cindirect-media&X-Plex-Model=hosted&X-Plex-Device=Windows&X-Plex-Device-Name=Chrome&X-Plex-Device-Screen-Resolution=938x700%2C1600x900&X-Plex-Container-Start=0&X-Plex-Container-Size=20&X-Plex-Token=QDaJT_hbhTfGTAa7ukkM&X-Plex-Provider-Version=3.2&X-Plex-Text-Format=plain&X-Plex-Drm=widevine&X-Plex-Language=de
    }
    /**
     * Get Media id of base url.
     * @param pAccessConfiguration - Device access configuration.
     * @param pMetaDataId - MetaData Id.
     */
    async getMediaKey(pAccessConfiguration, pMetaDataId) {
        for (const lBaseUri of pAccessConfiguration.baseUrlList) {
            // Try to get media
            try {
                // Create media url.
                let lMediaUrl = this.mUrlConfig.apiLibraryUrl;
                lMediaUrl = lMediaUrl.replace('{baseuri}', lBaseUri);
                lMediaUrl = lMediaUrl.replace('{id}', pMetaDataId);
                lMediaUrl = lMediaUrl.replace('{token}', pAccessConfiguration.accessToken);
                // Get media xml.
                const lDocument = await this.getXml(lMediaUrl);
                // Load media key and validate.
                const lPartKeyNode = lDocument.evaluate(this.mXPathConfig.partKeyXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lPartKeyNode.singleNodeValue) {
                    throw new Error('No MediaKey for this baseUrl, id and token found.');
                }
                return {
                    mediaKey: lPartKeyNode.singleNodeValue.textContent,
                    baseUri: lBaseUri,
                    accessToken: pAccessConfiguration.accessToken
                };
            }
            catch (e) {
                // eslint-disable-next-line no-console
                console.log(e);
                // Try next base uri.
                continue;
            }
        }
        throw new Error('No connection for this MetaID found');
    }
    /**
     * Get url response as xml document
     * @param pUrl - Url.
     */
    async getXml(pUrl) {
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
/******/ 	__webpack_require__("./Source/PlexDownload.ts");
/******/ 	var __webpack_exports__ = __webpack_require__("./Source/PlexService.ts");
/******/ 	
/******/ })()
;