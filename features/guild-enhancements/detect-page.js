// ============================================================================
// features/guild-enhancements/detect-page.js
//
// Определяем, что мы на странице профиля гильдии.
// URL: /xml/politics/guilds.php?id=NNN или /guilds/NNN
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function shouldRun() {
        const path = location.pathname;
        if (path.indexOf('/guilds/') !== -1) return true;
        if (path.endsWith('/xml/politics/guilds.php')) return true;
        return false;
    }

    GH.guildEnhancements = GH.guildEnhancements || {};
    GH.guildEnhancements.shouldRun = shouldRun;
})();