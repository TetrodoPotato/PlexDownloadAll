export declare class PlexService {
    private readonly mUrlConfig;
    private readonly mXPathConfig;
    /**
     * Constructor.
     */
    constructor();
    /**
     * Get all download file items for the meta data id.
     * @param pMediaUrl - File or directory meta data id.
     */
    getMediaItemFileList(pMediaUrl: string): Promise<Array<MediaFileItem>>;
    /**
     * Get access configuration for the current viewed media container.
     * @param pLibraryUrl - Url of any media item inside the library.
     */
    private getLibraryAccess;
    /**
     * Get download url of media.
     * @param pMediaFileConnection - Media connection.
     * @returns download url of media.
     */
    private getMediaFileItem;
    /**
     * Get all media item files by loading child lists with recursion
     * until media files are found.
     * @param pLibraryAccess - Library access.
     * @param pMetaDataId - File or directory metadata id.
     */
    private getMediaItemChildFileConnectionList;
    /**
     * Get all child file connections for a media directory.
     * @param pLibraryAccess - Library access.
     * @param pMetaDataId - Media meta data id.
     */
    private getMediaItemChildList;
    /**
     * Get connection data for media file item.
     * @param pLibraryAccess - Device access configuration.
     * @param pFileMetaDataId - MetaData Id.
     */
    private getMediaItemFileConnection;
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
    baseUri: string;
};
//# sourceMappingURL=PlexService.d.ts.map