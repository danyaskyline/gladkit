// ============================================================================
// content/main.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    const features = [
        {
            name: 'menu-tweaks',
            shouldRun: () => /gladiators\.ru/.test(location.hostname),
            init: () => GH.features.menuTweaks.init(),
        },
        {
            name: 'tournament-filter',
            shouldRun: () => location.pathname.includes(GH.config.site.urls.tournaments),
            init: () => GH.features.tournamentFilter.init(),
        },
        {
            name: 'hall-of-fame-filter',
            shouldRun: () => GH.hallOfFameFilter.shouldRun(),
            init: () => GH.features.hallOfFameFilter.init(),
        },
        {
            name: 'profile-enhancements',
            shouldRun: () => GH.profileEnhancements.shouldRun(),
            init: () => GH.features.profileEnhancements.init(),
        },
        {
            name: 'guild-enhancements',
            shouldRun: () => GH.guildEnhancements && GH.guildEnhancements.shouldRun(),
            init: () => GH.features.guildEnhancements.init(),
        },
        {
            name: 'trophy-counter',
            shouldRun: () => GH.trophyCounter && GH.trophyCounter.shouldRun(),
            init: () => GH.features.trophyCounter.init(),
        },
        {
            name: 'pagination',
            shouldRun: () => location.pathname.endsWith('/tournaments.php'),
            init: () => GH.features.pagination.init(),
        },
        {
            name: 'player-marks',
            shouldRun: () => GH.playerMarks && GH.playerMarks.shouldRun(),
            init: () => GH.features.playerMarks.init(),
        },
    ];

    function releasePending() {
        document.documentElement.removeAttribute('data-gh-pending');
    }

    function runAll() {
        const promises = [];
        features.forEach((f) => {
            if (!f.shouldRun()) return;
            promises.push(
                Promise.resolve()
                    .then(() => f.init())
                    .catch((e) => console.error(`[GH] feature ${f.name} failed:`, e))
            );
        });
        Promise.allSettled(promises).then(releasePending, releasePending);
    }

    runAll();
})();