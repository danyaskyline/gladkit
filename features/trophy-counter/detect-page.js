// ============================================================================
// features/trophy-counter/detect-page.js
//
// Определяем, что мы на странице зала трофеев.
// URL: /xml/residence/info.php?...&act=alltournaments
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function shouldRun() {
        if (!location.pathname.endsWith('/xml/residence/info.php')) return false;
        return location.search.indexOf('act=alltournaments') !== -1;
    }

    GH.trophyCounter = GH.trophyCounter || {};
    GH.trophyCounter.shouldRun = shouldRun;
})();