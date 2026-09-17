// ============================================================================
// features/player-marks/detect-page.js
//
// Фича работает везде на gladiators.ru, где могут быть ссылки на игроков.
// ============================================================================

(function () {
    'use strict';

    function shouldRun() {
        return /gladiators\.ru/.test(location.hostname);
    }

    GH.playerMarks = GH.playerMarks || {};
    GH.playerMarks.shouldRun = shouldRun;
})();