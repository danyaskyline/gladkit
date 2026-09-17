// ============================================================================
// features/hall-of-fame-filter/detect-page.js
//
// Определяет, что мы на странице зала славы (glory.php без act=cups).
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function shouldRun() {
        const cfg = GH.config.site.hallOfFame.urls;
        if (!location.pathname.endsWith(cfg.path)) return false;
        if (cfg.excludeAct && location.search.includes(cfg.excludeAct)) return false;
        return true;
    }

    GH.hallOfFameFilter = GH.hallOfFameFilter || {};
    GH.hallOfFameFilter.shouldRun = shouldRun;
})();