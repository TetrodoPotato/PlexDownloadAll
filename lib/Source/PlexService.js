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
//# sourceMappingURL=PlexService.js.map