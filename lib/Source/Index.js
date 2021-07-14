"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PlexDownloader_1 = require("./PlexDownloader");
{
    const lPlexDownload = new PlexDownloader_1.PlexDownloader();
    /**
     * Start download.
     * Decide single or multi download.
     */
    const lStartDownloadFunction = async () => {
        const lCurrentUrl = window.location.href;
        try {
            await lPlexDownload.downloadMediaItems(lCurrentUrl);
        }
        catch (e) {
            if (e instanceof Error) {
                alert(e.message);
            }
            else {
                alert(e);
            }
        }
    };
    /**
     * Open downloader overlay.
     */
    const lOpenOverlay = () => {
        lPlexDownload.openOverlay();
    };
    // Scan for play button and append download button.
    setInterval(() => {
        const lPlayButton = document.querySelector('*[data-qa-id="preplay-play"]');
        if (lPlayButton) {
            // Check if download button exists.
            if (!document.querySelector('.plexDownloadButton')) {
                // Create new download button.
                const lNewDownloadButton = document.createElement('button');
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
        // Check if overlay button exists.
        const lDiplayWindowButton = document.querySelector('.plexOpenWindowButton');
        if (!lDiplayWindowButton) {
            // Create new download button.
            const lNewOpenOverlayButton = document.createElement('button');
            lNewOpenOverlayButton.setAttribute('style', `
                    position: absolute;
                    right: 10px;
                    bottom: 10px;
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
            lNewOpenOverlayButton.classList.add('plexOpenWindowButton');
            lNewOpenOverlayButton.addEventListener('click', async () => {
                lOpenOverlay();
            });
            lNewOpenOverlayButton.appendChild(document.createTextNode('Download Overlay'));
            // Append button into body root.
            document.body.appendChild(lNewOpenOverlayButton);
        }
        else {
            // Hide button if window is open or no element is in queue
            if (!lPlexDownload.downloadsInQueue || lPlexDownload.windowIsOpen) {
                lDiplayWindowButton.style.display = 'none';
            }
            else {
                lDiplayWindowButton.style.display = 'block';
            }
        }
    }, 250);
}
//# sourceMappingURL=Index.js.map