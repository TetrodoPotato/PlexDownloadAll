import { PlexDownload } from './PlexDownload';

{
    const lPlexDownload: PlexDownload = new PlexDownload();

    /**
     * Start download.
     * Decide single or multi download.
     */
    const lStartDownloadFunction = async () => {
        const lIsSingleMedia: boolean = document.querySelectorAll('*[class*="PrePlayDescendantList"').length === 0;
        const lIsSeasonMedia: boolean = document.querySelectorAll('*[data-qa-id="preplay-mainTitle"] a').length > 0;

        const lCurrentUrl: string = window.location.href;

        try {
            if (lIsSingleMedia) {
                await lPlexDownload.downloadSingleMediaItemByUrl(lCurrentUrl);
            } else if (lIsSeasonMedia) {
                await lPlexDownload.downloadSeasonMediaItemByUrl(lCurrentUrl);
            } else {
                await lPlexDownload.downloadSeriesMediaItemByUrl(lCurrentUrl);
            }
        } catch (e) {
            if (e instanceof Error) {
                alert(e.message);
            } else {
                alert(e);
            }
        }
    };


    // Scan for play button and append download button.
    setInterval(() => {
        const lPlayButton: HTMLButtonElement = document.querySelector('*[data-qa-id="preplay-play"]');

        if (lPlayButton) {
            const lDownloadbutton: HTMLButtonElement = document.querySelector('.plexDownloadButton');
            if (!lDownloadbutton) {
                // Create new download button.
                const lNewDownloadButton: HTMLButtonElement = document.createElement('button');
                lNewDownloadButton.setAttribute('style', `
                    height: 30px;
                    padding: 0 15px;
                    background-color: #e5a00d;
                    color: #1f2326;
                    border: 0;
                    font-family: Open Sans Semibold,Helvetica Neue,Helvetica,Arial,sans-serif; 
                    text-transform: uppercase;              
                    border-radius: 4px;
                    overflow: hidden;
                `);
                lNewDownloadButton.classList.add('plexDownloadButton');
                lNewDownloadButton.addEventListener('click', async () => {
                    // Set button disabled. 
                    lNewDownloadButton.disabled = true;
                    lNewDownloadButton.style.backgroundColor = '#333';

                    // Wait for all metadata to load.
                    await lStartDownloadFunction();

                    // Enable button.
                    lNewDownloadButton.disabled = false;
                    lNewDownloadButton.style.backgroundColor = '#e5a00d';
                });
                lNewDownloadButton.appendChild(document.createTextNode('Download'));

                // Append download button after play button.
                lPlayButton.after(lNewDownloadButton);
            }
        }
    }, 250);
}
