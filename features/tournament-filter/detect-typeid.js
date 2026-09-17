// ============================================================================
// features/tournament-filter/detect-typeid.js
//
// Определение текущей категории (typeid) по DOM.
// Стратегии и их порядок — из config/site.js.
//
// Используется на всех страницах tournaments.php, включая act=join и
// act=cancel, где в URL нет ?typeid=NNN. Там срабатывает последняя
// стратегия — по префиксу заголовка первой «настоящей» карточки
// (уведомления без <b> пропускаются).
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const cfg = GH.config.site.typeidDetection;

    // Стратегия 1: <u> в правой панели.
    function fromUnderline() {
        const { selector, typeidRegex } = cfg.underline;
        const u = document.querySelector(selector);
        if (!u) return null;
        const link = u.closest('a');
        if (!link) return null;
        const m = link.getAttribute('href').match(typeidRegex);
        return m ? parseInt(m[1], 10) : null;
    }

    // Стратегия 2: вкладки статуса над списком.
    // Все ссылки должны дать один и тот же typeid — иначе не доверяем.
    function fromStatusTabs() {
        const { selector, typeidRegex } = cfg.statusTabs;
        const links = document.querySelectorAll(selector);
        if (!links.length) return null;
        const found = new Set();
        for (const link of links) {
            const m = link.getAttribute('href').match(typeidRegex);
            if (m) found.add(parseInt(m[1], 10));
        }
        return found.size === 1 ? [...found][0] : null;
    }

    // Стратегия 3: URL (?typeid=NNN).
    function fromUrl() {
        const m = location.search.match(cfg.url.regex);
        return m ? parseInt(m[1], 10) : null;
    }

    // Стратегия 4: префикс заголовка первой карточки с непустым <b>.
    // Заголовок выглядит как "Императорские турниры: Троянские Игры-...".
    // Уведомления типа «Вы покинули турнир» идут без <b> — пропускаем.
    function fromFirstCardTitle() {
        const container = document.querySelector('.script3 .top');
        if (!container) return null;

        const cards = container.querySelectorAll('table[bgcolor="#918567"]');
        if (!cards.length) return null;

        const cats = (GH.dataDefaults && GH.dataDefaults.categories) || [];

        for (const card of cards) {
            const b = card.querySelector('b');
            if (!b) continue;

            const fullText = b.textContent.replace(/\s+/g, ' ').trim();
            if (!fullText) continue;

            const colonIdx = fullText.indexOf(':');
            if (colonIdx === -1) continue;

            const prefix = fullText.substring(0, colonIdx).trim().toLowerCase();
            if (!prefix) continue;

            const found = cats.find(function (c) {
                return String(c.name || '').toLowerCase() === prefix;
            });
            if (found) return found.typeid;
        }
        return null;
    }

    const strategies = [fromUnderline, fromStatusTabs, fromUrl, fromFirstCardTitle];

    function detectTypeid(enabledTypeids) {
        for (const strategy of strategies) {
            try {
                const result = strategy();
                if (result !== null && enabledTypeids.includes(result)) {
                    return result;
                }
            } catch (e) {
                console.warn('[GH] strategy failed:', e);
            }
        }
        return null;
    }

    GH.tournamentFilter = GH.tournamentFilter || {};
    GH.tournamentFilter.detectTypeid = detectTypeid;
})();