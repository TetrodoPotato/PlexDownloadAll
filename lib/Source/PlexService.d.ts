export declare class PlexService {
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
    getEpisodeFileItemList(pMediaUrl: string): Promise<Array<MediaFileItem>>;
    /**
     * Get download link for all episodes of a season.
     * @param pMediaUrl - Media url.
     */
    getSeasonFileItemList(pMediaUrl: string): Promise<Array<MediaFileItem>>;
    /**
     * Get download link for all episodes of a series.
     * @param pMediaUrl - Media url.
     */
    getSerieFileItemList(pMediaUrl: string): Promise<Array<MediaFileItem>>;
    /**
     * Get access configuration for the current viewed media container.
     * @param pLibraryUrl - Url of any media item inside the library.
     */
    private getLibraryAccess;
    /**
     *
     * @param pLibraryAccess - Library access.
     * @param pMetaDataId - Directory meta data id.
     */
    private getMediaChildDirectoryList;
    /**
     * Get all child file connections for a media directory.
     * @param pLibraryAccess - Library access.
     * @param pDirectoryMetaDataId - Media meta data id.
     */
    private getMediaDirectoryChildFileConnections;
    /**
     * Get connection data for media item.
     * @param pAccessConfiguration - Device access configuration.
     * @param pFileMetaDataId - MetaData Id.
     */
    private getMediaFileConnection;
    /**
     * Get download url of media.
     * @param pMediaFileConnection - Media connection.
     * @returns download url of media.
     */
    private getMediaFileItem;
    /**
     * Get media id from url.
     * @param pMediaUrl - Current url.
     */
    private getMediaMetaDataId;
    /**
     * Get url response as xml document
     * @param pUrl - Url.
     */
    private loadXml;
}
export declare type MediaFileItem = {
    url: string;
    fileName: string;
};
//# sourceMappingURL=PlexService.d.ts.map