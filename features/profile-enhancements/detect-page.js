// ============================================================================
// features/profile-enhancements/detect-page.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function getUserId() {
        const m = location.pathname.match(GH.config.site.profile.urls.pathRegex);
        return m ? m[1] : null;
    }

    function shouldRun() {
        return getUserId() !== null;
    }

    GH.profileEnhancements = GH.profileEnhancements || {};
    GH.profileEnhancements.shouldRun = shouldRun;
    GH.profileEnhancements.getUserId = getUserId;
})();