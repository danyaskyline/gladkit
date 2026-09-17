// ============================================================================
// content/menu-main.js
//
// Точка входа для content_script на всех страницах gladiators.ru.
//
// Запускает фичи, которые нужны на каждой странице сайта.
// Фильтр турниров — отдельный content script (content/main.js).
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    // Список фич, работающих на всех страницах gladiators.ru.
    const features = [
        {
            name: 'menu-tweaks',
            shouldRun: () => /gladiators\.ru/.test(location.hostname),
            init: () => GH.features.menuTweaks.init(),
        },
        // Будущие фичи (например, memory-indicator) — сюда.
    ];

    function runAll() {
        features.forEach((f) => {
            if (!f.shouldRun()) return;
            Promise.resolve()
                .then(() => f.init())
                .catch((e) => console.error(`[GH] feature ${f.name} failed:`, e));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(runAll, 100));
    } else {
        setTimeout(runAll, 100);
    }
})();