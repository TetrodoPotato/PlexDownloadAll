import { PlexDownload } from './PlexDownload';

/**
 * Open window with download url of media item.
 * @param pUrl - Media url.
 */
const lDownloadMediaItemByUrl = (pUrl: string) => {
    const lPlexDownload: PlexDownload = new PlexDownload();
    lPlexDownload.getDownloadLinksEpisode(pUrl).then((pUrlList: Array<string>) => {
        for (const lUrl of pUrlList) {
            window.open(lUrl, '_blank').focus();
        }
    }).catch((e) => {
        alert(e.message);
    });
};

/**
 * Start download.
 * Decide single or multi download.
 */
const lStartDownloadFunction = async () => {
    lDownloadMediaItemByUrl(window.location.href);
};

// Scan for play button and append download button.
setInterval(() => {
    const lPlayButton: HTMLButtonElement = document.querySelector('*[data-qa-id="preplay-play"]');

    if (lPlayButton) {
        const lDownloadbutton: HTMLButtonElement = document.querySelector('.plexDownloadButton');
        if (!lDownloadbutton) {
            // Create new download button.
            const lNewDownloadButton: HTMLButtonElement = document.createElement('button');
            lNewDownloadButton.setAttribute('style', 'height: 30px; padding: 0 15px; background-color: #e5a00d;color: #1f2326;border: 0; font-family: Open Sans Semibold,Helvetica Neue,Helvetica,Arial,sans-serif; text-transform: uppercase; border-radius: 4px;');
            lNewDownloadButton.classList.add('plexDownloadButton');
            lNewDownloadButton.addEventListener('click', lStartDownloadFunction);
            lNewDownloadButton.appendChild(document.createTextNode('Download'));

            // Append download button after play button.
            lPlayButton.after(lNewDownloadButton);
        }
    }
}, 250);