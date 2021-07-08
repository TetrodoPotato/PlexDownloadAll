"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlexDownload = void 0;
class PlexDownload {
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
            apiResourceUrl: 'https://plex.tv/api/resources?includeHttps=1&X-Plex-Token={token}',
            apiLibraryUrl: '{baseuri}/library/metadata/{id}?X-Plex-Token={token}',
            downloadUrl: '{baseuri}{partkey}?download=1&X-Plex-Token={token}'
        };
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
    /**
     * Get download url of media.
     * @param pMediaXml - Xml media metadata response.
     * @param pAccessConfig - Access config.
     * @returns download url of media.
     */
    getDownloadUrl(pMediaXml, pAccessConfig) {
        const lPartKeyNode = pMediaXml.evaluate(this.mXPathConfig.partKeyXpath, pMediaXml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        // Throw execption if no node was found.
        if (!lPartKeyNode.singleNodeValue) {
            throw new Error('You are currently not viewing a media item.');
        }
        // Build download url.
        let lDownloadUrl = this.mUrlConfig.downloadUrl;
        lDownloadUrl = lDownloadUrl.replace('{baseuri}', pAccessConfig.baseUrl);
        lDownloadUrl = lDownloadUrl.replace('{token}', pAccessConfig.accessToken);
        lDownloadUrl = lDownloadUrl.replace('{partkey}', lPartKeyNode.singleNodeValue.textContent);
        return lDownloadUrl;
    }
    async getAccessConfig(pMediaUrl) {
        const lClientIdMatch = /server\/([a-f0-9]{40})\//.exec(pMediaUrl);
        const lLoginToken = localStorage.getItem('myPlexAccessToken');
        if (!lClientIdMatch || lClientIdMatch.length !== 2) {
            alert('Invalid media item Url.');
        }
        // Check if the user is logged in.
        if (!lLoginToken) {
            throw new Error('You are currently not browsing or logged into a Plex web environment.');
        }
        const lApiXml = await this.getXml(this.mUrlConfig.apiResourceUrl.replace('{token}', lLoginToken));
        const accessTokenNode = lApiXml.evaluate(this.mXPathConfig.accessTokenXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const baseUriNode = lApiXml.evaluate(this.mXPathConfig.baseUriXpath.replace('{clientid}', lClientIdMatch[1]), lApiXml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (!accessTokenNode.singleNodeValue || !baseUriNode.singleNodeValue) {
            throw new Error('Cannot find a valid accessToken.');
        }
        return {
            accessToken: accessTokenNode.singleNodeValue.textContent,
            baseUrl: baseUriNode.singleNodeValue.textContent
        };
    }
}
exports.PlexDownload = PlexDownload;
/*


if (typeof plxDwnld === "undefined") {

    window.plxDwnld = (function () {

        const self = {};
        const clientIdRegex = new RegExp("server\/([a-f0-9]{40})\/");
        const metadataIdRegex = new RegExp("key=%2Flibrary%2Fmetadata%2F(\\d+)");
        const apiResourceUrl = "https://plex.tv/api/resources?includeHttps=1&X-Plex-Token={token}";
        const apiLibraryUrl = "{baseuri}/library/metadata/{id}?X-Plex-Token={token}";
        const downloadUrl = "{baseuri}{partkey}?download=1&X-Plex-Token={token}";
        const accessTokenXpath = "//Device[@clientIdentifier='{clientid}']/@accessToken";
        const baseUriXpath = "//Device[@clientIdentifier='{clientid}']/Connection[@local='0']/@uri";
        const partKeyXpath = "//Media/Part[1]/@key";
        let accessToken: string = null;
        let baseUri: string = null;

        const getXml = function (url, callback) {
            const request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    callback(request.responseXML);
                }
            };
            request.open("GET", url);
            request.send();
        };

        const getMetadata = function (xml) {
            const clientId = clientIdRegex.exec(window.location.href);

            if (clientId && clientId.length == 2) {
                const accessTokenNode = xml.evaluate(accessTokenXpath.replace('{clientid}', clientId[1]), xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const baseUriNode = xml.evaluate(baseUriXpath.replace('{clientid}', clientId[1]), xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

                if (accessTokenNode.singleNodeValue && baseUriNode.singleNodeValue) {
                    accessToken = accessTokenNode.singleNodeValue.textContent;
                    baseUri = baseUriNode.singleNodeValue.textContent;
                    const metadataId = metadataIdRegex.exec(window.location.href);

                    if (metadataId && metadataId.length == 2) {
                        getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId[1]).replace('{token}', accessToken), getDownloadUrl);
                    } else {
                        alert("You are currently not viewing a media item.");
                    }
                } else {
                    alert("Cannot find a valid accessToken.");
                }
            } else {
                alert("You are currently not viewing a media item.");
            }
        };

        const getDownloadUrl = function (xml) {
            const partKeyNode = xml.evaluate(partKeyXpath, xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

            if (partKeyNode.singleNodeValue) {
                window.location.href = downloadUrl.replace('{baseuri}', baseUri).replace('{partkey}', partKeyNode.singleNodeValue.textContent).replace('{token}', accessToken);
            } else {
                alert("You are currently not viewing a media item.");
            }
        };

        self.init = function () {
            if (typeof localStorage.myPlexAccessToken != "undefined") {
                getXml(apiResourceUrl.replace('{token}', localStorage.myPlexAccessToken), getMetadata);
            } else {
                alert("You are currently not browsing or logged into a Plex web environment.");
            }
        };

        return self;
    })();
}

plxDwnld.init();
*/ 
//# sourceMappingURL=PlexDownload.js.map