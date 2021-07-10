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
            fileName: pMediaFileConnection.fileName
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
                    const lFileNameNodes = lChildXml.evaluate(this.mXPathConfig.mediaFilenameXpath, lChildXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    const lMetaDataIdNodes = lChildXml.evaluate(this.mXPathConfig.mediaChildrenFileMetaIdXpath, lChildXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    // Validate same length and for not empty.
                    if (lMediaKeyNodes.snapshotLength !== lFileNameNodes.snapshotLength || lFileNameNodes.snapshotLength !== lMetaDataIdNodes.snapshotLength || lMediaKeyNodes.snapshotLength === 0) {
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
                            fileName: lFileName
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
                const lFileNameNode = lDocument.evaluate(this.mXPathConfig.mediaFilenameXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lFileNameNode.singleNodeValue) {
                    throw new Error('No filename for this media item found.');
                }
                // Get filename from last part of the path.
                const lFileName = lFileNameNode.singleNodeValue.textContent.split('/').pop();
                return {
                    mediaKey: lMediaKeyNode.singleNodeValue.textContent,
                    baseUri: lBaseUri,
                    accessToken: pLibraryAccess.accessToken,
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
//# sourceMappingURL=PlexService.js.map