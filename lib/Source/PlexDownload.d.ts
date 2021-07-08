export declare class PlexDownload {
    private readonly mUrlConfig;
    private readonly mXPathConfig;
    /**
     * Constructor.
     */
    constructor();
    /**
     * Get download link for single episode or movie.
     * @param pMediaUrl - Media url.
     */
    getDownloadLinksEpisode(pMediaUrl: string): Promise<Array<string>>;
    /**
     * Get download link for all episodes of a season.
     * @param pMediaUrl - Media url.
     */
    getDownloadLinksSeason(pMediaUrl: string): Promise<Array<string>>;
    /**
     * Get download link for all episodes of a series.
     * @param pMediaUrl - Media url.
     */
    getDownloadLinksSeries(pMediaUrl: string): Promise<Array<string>>;
    /**
     * Get media id from url.
     * @param pMediaUrl - Current url.
     */
    getMetaDataId(pMediaUrl: string): string;
    /**
     * Get download url of media.
     * @param pMediaConnection - Media connection.
     * @returns download url of media.
     */
    private getDownloadUrl;
    /**
     * Get access configuration for the current viewed media container.
     * @param pCurrentUrl - Current media url.
     */
    private getLibraryAccessConfiguration;
    private getMediaChilds;
    /**
     * Get Media id of base url.
     * @param pAccessConfiguration - Device access configuration.
     * @param pMetaDataId - MetaData Id.
     */
    private getMediaKey;
    /**
     * Get url response as xml document
     * @param pUrl - Url.
     */
    private getXml;
}
//# sourceMappingURL=PlexDownload.d.ts.map