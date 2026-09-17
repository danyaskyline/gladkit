// ============================================================================
// ui/welcome/welcome.js
// ============================================================================

(function () {
    'use strict';

    const GITHUB_URL = 'https://github.com/danyaskyline/gladkit';
    const DONATE_URL = 'https://www.donationalerts.com/r/cop1um';

    const $ = (sel) => document.querySelector(sel);

    const openBtn = $('#open-manager-btn');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            const url = chrome.runtime.getURL('ui/manager/manager.html');
            chrome.tabs.create({ url });
        });
    }

    const versionEl = $('#version');
    if (versionEl) {
        versionEl.textContent = chrome.runtime.getManifest().version;
    }

    const githubLink = $('#github-link');
    const donateLink = $('#donate-link');

    if (GITHUB_URL) {
        githubLink.href = GITHUB_URL;
    } else {
        githubLink.style.display = 'none';
    }

    if (DONATE_URL) {
        donateLink.href = DONATE_URL;
    } else {
        donateLink.style.display = 'none';
    }
})();