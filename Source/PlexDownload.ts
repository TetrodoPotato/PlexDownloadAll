import { MediaFileItem, PlexService } from './PlexService';

export class PlexDownload {

    /**
     * Constructor.
     * Initialize download overlay.
     */
    public constructor() {
        // Create overlay if it does not exists.
        if (document.querySelector('.PlexDownloadOverlay') === null) {
            // Create overlay element.
            const lNewDownloadOverlay: HTMLDivElement = document.createElement('div');
            lNewDownloadOverlay.classList.add('PlexDownloadOverlay');
            lNewDownloadOverlay.setAttribute('style', `
                position: fixed;
                bottom: 6px;
                right: 6px;
                width: 360px;
                background-color: #191a1c;
                border-radius: 8px;
                max-height: 300px;
                overflow: auto;
                box-shadow: 0 4px 10px rgb(0 0 0 / 35%);
                font-family: Open Sans Regular,Helvetica Neue,Helvetica,Arial,sans-serif; 
                font-size: 13px;
            `);

            // Append to body root.
            document.body.appendChild(lNewDownloadOverlay);
        }
    }

    /**
     * Add all media item file of a season to the download queue.
     * @param pUrl - Media url.
     */
    public async downloadSeasonMediaItemByUrl(pUrl: string): Promise<void> {
        const lPlexService: PlexService = new PlexService();
        const lUrlList = await lPlexService.getSeasonFileItemList(pUrl);

        // Add each url to download queue
        for (const lUrl of lUrlList) {
            this.addDownloadToQueue(lUrl);
        }
    }

    /**
     * Add all media item file of a series to the download queue.
     * @param pUrl - Media url.
     */
    public async downloadSeriesMediaItemByUrl(pUrl: string): Promise<void> {
        const lPlexService: PlexService = new PlexService();
        const lUrlList = await lPlexService.getSerieFileItemList(pUrl);

        // Add each url to download queue
        for (const lUrl of lUrlList) {
            this.addDownloadToQueue(lUrl);
        }
    }

    /**
     * Add single media item file to the download queue.
     * @param pUrl - Media url.
     */
    public async downloadSingleMediaItemByUrl(pUrl: string): Promise<void> {
        const lPlexService: PlexService = new PlexService();
        const lUrlList = await lPlexService.getEpisodeFileItemList(pUrl);

        // Add each url to download queue
        for (const lUrl of lUrlList) {
            this.addDownloadToQueue(lUrl);
        }
    }

    /**
     * Add download url to the download queue.
     * @param pMediaItem - Download url.
     */
    private addDownloadToQueue(pMediaItem: MediaFileItem): void {
        // Create download row element.
        const lDownloadElement: HTMLDivElement = document.createElement('div');
        lDownloadElement.setAttribute('data-url', pMediaItem.url);
        lDownloadElement.setAttribute('data-filename', pMediaItem.fileName);
        lDownloadElement.setAttribute('style', 'display: flex; border-bottom: 1px solid #7a7b7b; margin: 0px 6px; padding: 10px 0px;');
        lDownloadElement.classList.add('PlexDownloadElement');

        // Create download file name.
        const lDownloadElementFileName: HTMLDivElement = document.createElement('div');
        lDownloadElementFileName.appendChild(document.createTextNode(pMediaItem.fileName));
        lDownloadElementFileName.classList.add('PlexDownloadElementFileName');
        lDownloadElementFileName.setAttribute('style', 'flex: 1; border-right: 2px solid #545556; padding: 0 10px; overflow: hidden; white-space: nowrap; font-family: inherit; font-size: inherit;');

        // Create download progess.
        const lDownloadElementProgress: HTMLDivElement = document.createElement('div');
        lDownloadElementProgress.appendChild(document.createTextNode('...'));
        lDownloadElementProgress.classList.add('PlexDownloadElementProgress');
        lDownloadElementProgress.setAttribute('style', 'width: 75px; padding: 0px 5px; border-right: 2px solid #545556; text-align: right;');

        // Create download progess.
        const lDownloadElementAbort: HTMLDivElement = document.createElement('div');
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
        document.querySelector('.PlexDownloadOverlay').appendChild(lDownloadElement);

        // Try to start this download.
        this.startNextDownloadElement();
    }

    /**
     * Download blob to user file system.
     * @param pBlob - Blob.
     * @param pFileName - Filename of downloaded file.
     */
    private downloadBlob(pBlob: Blob, pFileName: string): void {
        // Convert blob to download url.
        const lBlobDownloadUrl = URL.createObjectURL(pBlob);

        // Create download anchor element.
        const lAnchorElement: HTMLAnchorElement = document.createElement('a');

        // Ser file name and href.
        lAnchorElement.href = lBlobDownloadUrl;
        lAnchorElement.download = pFileName;

        // Append link to the body.
        document.body.appendChild(lAnchorElement);

        // Dispatch click event on the anchor.
        lAnchorElement.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            })
        );

        // Remove anchor from body.
        document.body.removeChild(lAnchorElement);
    }

    /**
     * Get the next download element and start downloading 
     * if no other download is running.
     */
    private startNextDownloadElement(): void {
        // Dont start next download if one is currently running.
        if (document.querySelector('.PlexDownloadElement.Running') !== null) {
            return;
        }

        // Get next download element. Should be the first.
        const lDownloadElement: HTMLDivElement = document.querySelector('.PlexDownloadElement');
        if (lDownloadElement) {
            // Set download element as running.
            lDownloadElement.classList.add('Running');

            // Get needed data.
            const lDownloadUrl: string = lDownloadElement.getAttribute('data-url');
            const lFileName: string = lDownloadElement.getAttribute('data-filename');
            const lProgressElement: HTMLDivElement = lDownloadElement.querySelector('.PlexDownloadElementProgress');
            const lAbortElement: HTMLDivElement = lDownloadElement.querySelector('.PlexDownloadElementAbort');

            // Close download element function.
            const lCloseDownloadElement = () => {
                lDownloadElement.remove();
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
                    const lProgressInPercent: number = (pProgressEvent.loaded / pProgressEvent.total) * 100;
                    const lProgressTwoDecimals: number = Math.round(lProgressInPercent * 100) / 100;

                    // Add progress as percent.      
                    lProgressElement.appendChild(document.createTextNode(`${lProgressTwoDecimals}%`));
                } else {
                    // Progress in mega byte
                    const lProgressInMegaByte: number = pProgressEvent.loaded / 1024 / 1024;

                    // Add progress as mb.      
                    lProgressElement.appendChild(document.createTextNode(`${lProgressInMegaByte}MB`));
                }
            };
            lXhrRequest.onload = () => {
                // Read response.
                const lBlob: Blob = lXhrRequest.response;

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