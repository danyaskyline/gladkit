// ============================================================================
// content/preload.js
//
// document_start. Запускается только на страницах, где есть фильтр —
// см. matches в manifest.json (tournaments.php и glory.php).
//
// Ставит data-gh-pending, чтобы CSS скрыл контейнер до инициализации фичи.
// main.js снимает атрибут после применения фильтра.
// ============================================================================

(function () {
    'use strict';

    // glory.php?act=cups — фильтр зала славы там не работает.
    if (location.pathname.endsWith('/xml/residence/glory.php')
        && location.search.includes('act=cups')) {
        return;
    }

    const root = document.documentElement;
    if (!root) return;

    root.setAttribute('data-gh-pending', '');

    // Страховка: если main.js не снял атрибут — снимем через 5 секунд.
    setTimeout(() => {
        if (root.hasAttribute('data-gh-pending')) {
            root.removeAttribute('data-gh-pending');
        }
    }, 5000);

    // Ранний release при выключенном фильтре — чтобы не было лишней задержки.
    try {
        chrome.storage.local.get('gh_state', (data) => {
            const s = data && data.gh_state;
            if (!s) return;

            const path = location.pathname;
            const onTournaments = path.endsWith('/xml/arena/tournaments.php');
            const onGlory = path.endsWith('/xml/residence/glory.php');

            let tournamentOff = false;
            if (onTournaments) {
                const ui = s.ui || {};
                const keys = Object.keys(ui);
                tournamentOff = keys.length === 0
                    || keys.every((k) => (ui[k] || {}).enabled === false);
            }

            const fofOff = onGlory
                && s.hallOfFame
                && s.hallOfFame.ui
                && s.hallOfFame.ui.enabled === false;

            if (tournamentOff || fofOff) {
                root.removeAttribute('data-gh-pending');
            }
        });
    } catch (e) {
        // chrome.storage недоступен — ждём main.js.
    }
})();