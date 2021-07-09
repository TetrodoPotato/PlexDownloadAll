"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            mediaKeyXpath: '//Media/Part[1]/@key',
            mediaFilenameXpath: '//Media/Part[1]/@file',
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
     * Get download link for single episode or movie.
     * @param pMediaUrl - Media url.
     */
    async getEpisodeFileItemList(pMediaUrl) {
        const lAccessConfiguration = await this.getLibraryAccess(pMediaUrl);
        const lMetaDataId = this.getMediaMetaDataId(pMediaUrl);
        const lMediaConnection = await this.getMediaFileConnection(lAccessConfiguration, lMetaDataId);
        return [this.getMediaFileItem(lMediaConnection)];
    }
    /**
     * Get download link for all episodes of a season.
     * @param pMediaUrl - Media url.
     */
    async getSeasonFileItemList(pMediaUrl) {
        const lAccessConfiguration = await this.getLibraryAccess(pMediaUrl);
        const lMetaDataId = this.getMediaMetaDataId(pMediaUrl);
        const lChildFileConnectionList = await this.getMediaDirectoryChildFileConnections(lAccessConfiguration, lMetaDataId);
        // Generate file items of file connections.
        const lMediaFileItemList = new Array();
        for (const lConnection of lChildFileConnectionList) {
            lMediaFileItemList.push(this.getMediaFileItem(lConnection));
        }
        return lMediaFileItemList;
    }
    /**
     * Get download link for all episodes of a series.
     * @param pMediaUrl - Media url.
     */
    async getSerieFileItemList(pMediaUrl) {
        const lAccessConfiguration = await this.getLibraryAccess(pMediaUrl);
        const lMetaDataId = this.getMediaMetaDataId(pMediaUrl);
        const lDirecoryList = await this.getMediaChildDirectoryList(lAccessConfiguration, lMetaDataId);
        // Generate file items of file connections.
        const lMediaFileItemList = new Array();
        // For each season.
        for (const lDirectory of lDirecoryList) {
            const lChildFileConnectionList = await this.getMediaDirectoryChildFileConnections(lAccessConfiguration, lDirectory.metaDataId);
            // Generate file items of file connections.
            for (const lConnection of lChildFileConnectionList) {
                lMediaFileItemList.push(this.getMediaFileItem(lConnection));
            }
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
        const lBaseUriNode = lApiXml.evaluate(this.mXPathConfig.baseUriXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        // base uri list
        const lBaseUriList = new Array();
        {
            // Iterate over all base uri nodes and save text content in array.
            let lIteratorNode = lBaseUriNode.iterateNext();
            while (lIteratorNode) {
                lBaseUriList.push(lIteratorNode.textContent);
                lIteratorNode = lBaseUriNode.iterateNext();
            }
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
     *
     * @param pLibraryAccess - Library access.
     * @param pMetaDataId - Directory meta data id.
     */
    async getMediaChildDirectoryList(pLibraryAccess, pMetaDataId) {
        for (const lBaseUri of pLibraryAccess.baseUriList) {
            // Try to get media
            try {
                // Create child url.
                let lMediaChildUrl = this.mUrlConfig.apiChildrenUrl;
                lMediaChildUrl = lMediaChildUrl.replace('{baseuri}', lBaseUri);
                lMediaChildUrl = lMediaChildUrl.replace('{metaId}', pMetaDataId);
                lMediaChildUrl = lMediaChildUrl.replace('{token}', pLibraryAccess.accessToken);
                // Get media childs xml.
                const lChildXml = await this.loadXml(lMediaChildUrl);
                // Get child informations.
                const lMetaDataIdNodes = lChildXml.evaluate(this.mXPathConfig.mediaChildrenDirectoryMetaIdXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                // Convert in string arrays.
                const lMetaDataIdList = new Array();
                {
                    // Iterate over all base uri nodes and save text content in array.
                    let lMetaDataIdIteratorNode = lMetaDataIdNodes.iterateNext();
                    while (lMetaDataIdIteratorNode) {
                        lMetaDataIdList.push(lMetaDataIdIteratorNode.textContent);
                        lMetaDataIdIteratorNode = lMetaDataIdNodes.iterateNext();
                    }
                }
                // Build media connections from ordered result lists.
                const mMediaConnectionList = new Array();
                for (const lMetaDataId of lMetaDataIdList) {
                    mMediaConnectionList.push({
                        baseUri: lBaseUri,
                        accessToken: pLibraryAccess.accessToken,
                        metaDataId: lMetaDataId
                    });
                }
                return mMediaConnectionList;
            }
            catch (e) {
                // eslint-disable-next-line no-console
                console.log(e);
                // Try next base uri.
                continue;
            }
        }
        throw new Error('No directory connection for this MetaID found');
    }
    /**
     * Get all child file connections for a media directory.
     * @param pLibraryAccess - Library access.
     * @param pDirectoryMetaDataId - Media meta data id.
     */
    async getMediaDirectoryChildFileConnections(pLibraryAccess, pDirectoryMetaDataId) {
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
                // Get child informations.
                const lMediaKeyNodes = lChildXml.evaluate(this.mXPathConfig.mediaKeyXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const lFileNameNodes = lChildXml.evaluate(this.mXPathConfig.mediaFilenameXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const lMetaDataIdNodes = lChildXml.evaluate(this.mXPathConfig.mediaChildrenFileMetaIdXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                // Convert in string arrays.
                const lMediaKeyList = new Array();
                const lFileNameList = new Array();
                const lMetaDataIdList = new Array();
                {
                    // Iterate over all base uri nodes and save text content in array.
                    let lMediaKeyIteratorNode = lMediaKeyNodes.iterateNext();
                    let lFileNameIteratorNode = lFileNameNodes.iterateNext();
                    let lMetaDataIdIteratorNode = lMetaDataIdNodes.iterateNext();
                    while (lMediaKeyIteratorNode && lFileNameIteratorNode && lMetaDataIdIteratorNode) {
                        lMediaKeyList.push(lMediaKeyIteratorNode.textContent);
                        lFileNameList.push(lFileNameIteratorNode.textContent.split('/').pop());
                        lMetaDataIdList.push(lMetaDataIdIteratorNode.textContent);
                        lMediaKeyIteratorNode = lMediaKeyNodes.iterateNext();
                        lFileNameIteratorNode = lFileNameNodes.iterateNext();
                        lMetaDataIdIteratorNode = lMetaDataIdNodes.iterateNext();
                    }
                    // Validate same same.
                    if (lMediaKeyIteratorNode || lFileNameIteratorNode || lMetaDataIdIteratorNode) {
                        throw new Error('Wrong result for media item children.');
                    }
                }
                // Build media connections from ordered result lists.
                const mMediaConnectionList = new Array();
                for (let lIndex = 0; lIndex < lMetaDataIdList.length; lIndex++) {
                    mMediaConnectionList.push({
                        mediaKey: lMediaKeyList[lIndex],
                        baseUri: lBaseUri,
                        accessToken: pLibraryAccess.accessToken,
                        metaDataId: lMetaDataIdList[lIndex],
                        fileName: lFileNameList[lIndex]
                    });
                }
                return mMediaConnectionList;
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
     * Get connection data for media item.
     * @param pAccessConfiguration - Device access configuration.
     * @param pFileMetaDataId - MetaData Id.
     */
    async getMediaFileConnection(pAccessConfiguration, pFileMetaDataId) {
        for (const lBaseUri of pAccessConfiguration.baseUriList) {
            // Try to get media
            try {
                // Create media url.
                let lMediaUrl = this.mUrlConfig.apiLibraryUrl;
                lMediaUrl = lMediaUrl.replace('{baseuri}', lBaseUri);
                lMediaUrl = lMediaUrl.replace('{id}', pFileMetaDataId);
                lMediaUrl = lMediaUrl.replace('{token}', pAccessConfiguration.accessToken);
                // Get media xml.
                const lDocument = await this.loadXml(lMediaUrl);
                // Load media key and validate.
                const lMediaKeyNode = lDocument.evaluate(this.mXPathConfig.mediaKeyXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lMediaKeyNode.singleNodeValue) {
                    throw new Error('Media item is no file.');
                }
                // Try to get filename.
                const lFileNameNode = lDocument.evaluate(this.mXPathConfig.mediaFilenameXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lFileNameNode.singleNodeValue) {
                    throw new Error('No filename for this media item found.');
                }
                // Get filename from last part of the path.
                const lFileName = lFileNameNode.singleNodeValue.textContent.split('/').pop();
                return {
                    mediaKey: lMediaKeyNode.singleNodeValue.textContent,
                    baseUri: lBaseUri,
                    accessToken: pAccessConfiguration.accessToken,
                    metaDataId: pFileMetaDataId,
                    fileName: lFileName
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
            fileName: pMediaFileConnection.fileName
        };
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
//# sourceMappingURL=PlexService.js.map