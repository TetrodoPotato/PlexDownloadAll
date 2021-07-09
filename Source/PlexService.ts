export class PlexService {
    private readonly mUrlConfig: UrlConfig;
    private readonly mXPathConfig: XPathConfig;

    /**
     * Constructor.
     */
    public constructor() {
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
    public async getEpisodeFileItemList(pMediaUrl: string): Promise<Array<MediaFileItem>> {
        const lAccessConfiguration: LibraryAccess = await this.getLibraryAccess(pMediaUrl);
        const lMetaDataId: string = this.getMediaMetaDataId(pMediaUrl);
        const lMediaConnection: MediaFileConnection = await this.getMediaFileConnection(lAccessConfiguration, lMetaDataId);

        return [this.getMediaFileItem(lMediaConnection)];
    }

    /**
     * Get download link for all episodes of a season.
     * @param pMediaUrl - Media url.
     */
    public async getSeasonFileItemList(pMediaUrl: string): Promise<Array<MediaFileItem>> {
        const lAccessConfiguration: LibraryAccess = await this.getLibraryAccess(pMediaUrl);
        const lMetaDataId: string = this.getMediaMetaDataId(pMediaUrl);
        const lChildFileConnectionList: Array<MediaFileConnection> = await this.getMediaDirectoryChildFileConnections(lAccessConfiguration, lMetaDataId);

        // Generate file items of file connections.
        const lMediaFileItemList: Array<MediaFileItem> = new Array<MediaFileItem>();
        for (const lConnection of lChildFileConnectionList) {
            lMediaFileItemList.push(this.getMediaFileItem(lConnection));
        }

        return lMediaFileItemList;
    }

    /**
     * Get download link for all episodes of a series.
     * @param pMediaUrl - Media url.
     */
    public async getSerieFileItemList(pMediaUrl: string): Promise<Array<MediaFileItem>> {
        const lAccessConfiguration: LibraryAccess = await this.getLibraryAccess(pMediaUrl);
        const lMetaDataId: string = this.getMediaMetaDataId(pMediaUrl);
        const lDirecoryList: Array<MediaDirectoryConnection> = await this.getMediaChildDirectoryList(lAccessConfiguration, lMetaDataId);

        // Generate file items of file connections.
        const lMediaFileItemList: Array<MediaFileItem> = new Array<MediaFileItem>();

        // For each season.
        for (const lDirectory of lDirecoryList) {
            const lChildFileConnectionList: Array<MediaFileConnection> = await this.getMediaDirectoryChildFileConnections(lAccessConfiguration, lDirectory.metaDataId);

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
    private async getLibraryAccess(pLibraryUrl: string): Promise<LibraryAccess> {
        const lClientIdMatch: RegExpExecArray = /server\/([a-f0-9]{40})\//.exec(pLibraryUrl);
        const lLoginToken: string = localStorage.getItem('myPlexAccessToken');

        // Validate client id.
        if (!lClientIdMatch || lClientIdMatch.length !== 2) {
            throw Error('Invalid media item url.');
        }

        // Check if the user is logged in.
        if (!lLoginToken) {
            throw new Error('You are currently not browsing or logged into a Plex web environment.');
        }

        // Load media container information.
        const lApiXml: Document = await this.loadXml(this.mUrlConfig.apiResourceUrl.replace('{token}', lLoginToken));

        // Try to get access token and base uri.
        const lAccessTokenNode = lApiXml.evaluate(this.mXPathConfig.accessTokenXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const lBaseUriNode = lApiXml.evaluate(this.mXPathConfig.baseUriXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        // base uri list
        const lBaseUriList = new Array<string>();
        {
            // Iterate over all base uri nodes and save text content in array.
            let lIteratorNode: Node = lBaseUriNode.iterateNext();
            while (lIteratorNode) {
                lBaseUriList.push(lIteratorNode.textContent);
                lIteratorNode = lBaseUriNode.iterateNext();
            }
        }

        // Validate access token and base url.
        if (!lAccessTokenNode.singleNodeValue) {
            throw new Error('Cannot find a valid accessToken.');
        } else if (lBaseUriList.length === 0) {
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
    private async getMediaChildDirectoryList(pLibraryAccess: LibraryAccess, pMetaDataId: string): Promise<Array<MediaDirectoryConnection>> {
        for (const lBaseUri of pLibraryAccess.baseUriList) {
            // Try to get media
            try {
                // Create child url.
                let lMediaChildUrl: string = this.mUrlConfig.apiChildrenUrl;
                lMediaChildUrl = lMediaChildUrl.replace('{baseuri}', lBaseUri);
                lMediaChildUrl = lMediaChildUrl.replace('{metaId}', pMetaDataId);
                lMediaChildUrl = lMediaChildUrl.replace('{token}', pLibraryAccess.accessToken);

                // Get media childs xml.
                const lChildXml: Document = await this.loadXml(lMediaChildUrl);

                // Get child informations.
                const lMetaDataIdNodes: XPathResult = lChildXml.evaluate(this.mXPathConfig.mediaChildrenDirectoryMetaIdXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

                // Convert in string arrays.
                const lMetaDataIdList: Array<string> = new Array<string>();
                {
                    // Iterate over all base uri nodes and save text content in array.
                    let lMetaDataIdIteratorNode: Node = lMetaDataIdNodes.iterateNext();
                    while (lMetaDataIdIteratorNode) {
                        lMetaDataIdList.push(lMetaDataIdIteratorNode.textContent);
                        lMetaDataIdIteratorNode = lMetaDataIdNodes.iterateNext();
                    }
                }

                // Build media connections from ordered result lists.
                const mMediaConnectionList: Array<MediaDirectoryConnection> = new Array<MediaDirectoryConnection>();
                for (const lMetaDataId of lMetaDataIdList) {
                    mMediaConnectionList.push({
                        baseUri: lBaseUri,
                        accessToken: pLibraryAccess.accessToken,
                        metaDataId: lMetaDataId
                    });
                }

                return mMediaConnectionList;
            } catch (e) {
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
    private async getMediaDirectoryChildFileConnections(pLibraryAccess: LibraryAccess, pDirectoryMetaDataId: string): Promise<Array<MediaFileConnection>> {
        for (const lBaseUri of pLibraryAccess.baseUriList) {
            // Try to get media
            try {
                // Create child url.
                let lMediaChildUrl: string = this.mUrlConfig.apiChildrenUrl;
                lMediaChildUrl = lMediaChildUrl.replace('{baseuri}', lBaseUri);
                lMediaChildUrl = lMediaChildUrl.replace('{metaId}', pDirectoryMetaDataId);
                lMediaChildUrl = lMediaChildUrl.replace('{token}', pLibraryAccess.accessToken);

                // Get media childs xml.
                const lChildXml: Document = await this.loadXml(lMediaChildUrl);

                // Get child informations.
                const lMediaKeyNodes: XPathResult = lChildXml.evaluate(this.mXPathConfig.mediaKeyXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const lFileNameNodes: XPathResult = lChildXml.evaluate(this.mXPathConfig.mediaFilenameXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const lMetaDataIdNodes: XPathResult = lChildXml.evaluate(this.mXPathConfig.mediaChildrenFileMetaIdXpath, lChildXml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

                // Convert in string arrays.
                const lMediaKeyList: Array<string> = new Array<string>();
                const lFileNameList: Array<string> = new Array<string>();
                const lMetaDataIdList: Array<string> = new Array<string>();
                {
                    // Iterate over all base uri nodes and save text content in array.
                    let lMediaKeyIteratorNode: Node = lMediaKeyNodes.iterateNext();
                    let lFileNameIteratorNode: Node = lFileNameNodes.iterateNext();
                    let lMetaDataIdIteratorNode: Node = lMetaDataIdNodes.iterateNext();
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
                const mMediaConnectionList: Array<MediaFileConnection> = new Array<MediaFileConnection>();
                for (let lIndex: number = 0; lIndex < lMetaDataIdList.length; lIndex++) {
                    mMediaConnectionList.push({
                        mediaKey: lMediaKeyList[lIndex],
                        baseUri: lBaseUri,
                        accessToken: pLibraryAccess.accessToken,
                        metaDataId: lMetaDataIdList[lIndex],
                        fileName: lFileNameList[lIndex]
                    });
                }

                return mMediaConnectionList;
            } catch (e) {
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
    private async getMediaFileConnection(pAccessConfiguration: LibraryAccess, pFileMetaDataId: string): Promise<MediaFileConnection> {
        for (const lBaseUri of pAccessConfiguration.baseUriList) {
            // Try to get media
            try {
                // Create media url.
                let lMediaUrl: string = this.mUrlConfig.apiLibraryUrl;
                lMediaUrl = lMediaUrl.replace('{baseuri}', lBaseUri);
                lMediaUrl = lMediaUrl.replace('{id}', pFileMetaDataId);
                lMediaUrl = lMediaUrl.replace('{token}', pAccessConfiguration.accessToken);

                // Get media xml.
                const lDocument: Document = await this.loadXml(lMediaUrl);

                // Load media key and validate.
                const lMediaKeyNode: XPathResult = lDocument.evaluate(this.mXPathConfig.mediaKeyXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lMediaKeyNode.singleNodeValue) {
                    throw new Error('Media item is no file.');
                }

                // Try to get filename.
                const lFileNameNode: XPathResult = lDocument.evaluate(this.mXPathConfig.mediaFilenameXpath, lDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (!lFileNameNode.singleNodeValue) {
                    throw new Error('No filename for this media item found.');
                }

                // Get filename from last part of the path.
                const lFileName: string = lFileNameNode.singleNodeValue.textContent.split('/').pop();

                return {
                    mediaKey: lMediaKeyNode.singleNodeValue.textContent,
                    baseUri: lBaseUri,
                    accessToken: pAccessConfiguration.accessToken,
                    metaDataId: pFileMetaDataId,
                    fileName: lFileName
                };
            } catch (e) {
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
    private getMediaFileItem(pMediaFileConnection: MediaFileConnection): MediaFileItem {
        // Build download url.
        let lDownloadUrl: string = this.mUrlConfig.downloadUrl;
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
    private getMediaMetaDataId(pMediaUrl: string): string {
        const metadataId = /key=%2Flibrary%2Fmetadata%2F(\d+)/.exec(pMediaUrl);

        if (metadataId && metadataId.length === 2) {
            return metadataId[1]; // First group.
        } else {
            throw new Error('No single media item found for url.');
        }
    }

    /**
     * Get url response as xml document
     * @param pUrl - Url.
     */
    private async loadXml(pUrl: string): Promise<Document> {
        return fetch(pUrl).then(async (pResponse) => {
            return pResponse.text();
        }).then((pResponeText: string) => {
            return new DOMParser().parseFromString(pResponeText, 'text/xml');
        });
    }
}

type LibraryAccess = { accessToken: string, baseUriList: Array<string>; };
type XPathConfig = { accessTokenXpath: string, baseUriXpath: string, mediaKeyXpath: string; mediaFilenameXpath: string; mediaChildrenFileMetaIdXpath: string; mediaChildrenDirectoryMetaIdXpath: string; };
type UrlConfig = { apiResourceUrl: string, apiLibraryUrl: string, downloadUrl: string; apiChildrenUrl: string; };
type MediaFileConnection = { baseUri: string; mediaKey: string; metaDataId: string; accessToken: string; fileName: string; };
type MediaDirectoryConnection = { baseUri: string, metaDataId: string; accessToken: string; };
export type MediaFileItem = { url: string, fileName: string; };
