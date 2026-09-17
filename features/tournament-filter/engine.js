// ============================================================================
// features/tournament-filter/engine.js
//
// Логика фильтра на tournaments.php.
//
// Уровень и тип карточки берутся из словаря — никакого парсинга DOM.
// По имени карточки делаем lookup в общем словаре: result.level, result.type.
// Если турнира нет в словаре — карточка «нераспознана», подсвечивается и
// всегда показывается, независимо от чекбоксов.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function isRealCard(card, must) {
        if (!must) return true;
        if (must.italic && !card.querySelector('i')) return false;
        if (must.levelField) {
            const bolds = card.querySelectorAll('b');
            const needLabel = GH.config.site.cardParsing.labels.level;
            const hasLevel = Array.from(bolds).some(
                (b) => b.textContent.trim().toLowerCase() === needLabel
            );
            if (!hasLevel) return false;
        }
        return true;
    }

    function getCards() {
        const cfg = GH.config.site.cards;
        const root = cfg.containerSelector
            ? document.querySelector(cfg.containerSelector)
            : document;
        if (!root) return [];

        let nodes;
        if (cfg.directChildrenOnly) {
            nodes = Array.from(root.children).filter(
                (el) => el.matches(cfg.cardSelector)
            );
        } else {
            nodes = Array.from(root.querySelectorAll(cfg.cardSelector));
        }
        return nodes.filter((card) => isRealCard(card, cfg.mustContain));
    }

    function getTrailingBr(card) {
        const next = card.nextElementSibling;
        return next && next.tagName === 'BR' ? next : null;
    }

    function extractName(card) {
        const a = card.querySelector('b a[href*="tournaments.php?id="]');
        if (a) return a.textContent.replace(/\s+/g, ' ').trim();
        const b = card.querySelector('b');
        if (b) return b.textContent.replace(/\s+/g, ' ').trim();
        return '';
    }

    function createEngine(ctx) {
        let levels = [];

        async function refreshLevels() {
            const dictArr = await GH.storage.ensureDictLoaded();
            levels = GH.hallOfFameFilter.dict.getLevelsForTypeid(dictArr, ctx.typeid);
        }

        function getUi() {
            return GH.store.getUiState(ctx.typeid, ctx.state) || {};
        }

        function isVisible(parsed, ui) {
            if (ui.enabled === false) return true;

            if (parsed.level) {
                if ((ui.levels || {})[parsed.level] === false) return false;
            }
            if (parsed.type) {
                if ((ui.categories || {})[parsed.type] === false) return false;
            }
            return true;
        }

        function apply() {
            const ui = getUi();
            const cards = getCards();
            const highlightCfg = GH.store.getHighlightConfig('unknownTournament', ctx.state);

            let hidden = 0;
            let unknown = 0;

            cards.forEach((card) => {
                const name = extractName(card);
                const rec = name
                    ? GH.hallOfFameFilter.dict.lookup(ctx.typeid, name)
                    : null;

                const parsed = {
                    name: name,
                    level: rec ? rec.level : null,
                    type: rec ? rec.type : null,
                };

                if (!rec) {
                    unknown++;
                    GH.tournamentFilter.highlight.applyUnknown(card, highlightCfg, {
                        name: name,
                    });
                } else {
                    GH.tournamentFilter.highlight.clearUnknown(card);
                }

                const visible = isVisible(parsed, ui);
                card.style.display = visible ? '' : 'none';
                const br = getTrailingBr(card);
                if (br) br.style.display = visible ? '' : 'none';
                if (!visible) hidden++;
            });

            const total = cards.length;
            const shown = total - hidden;
            const counterText = ui.enabled === false
                ? 'Фильтр выключен (всего: ' + total + ')'
                : 'Показано: ' + shown + ' из ' + total +
                  (unknown ? ' (не распознано: ' + unknown + ')' : '');
            GH.tournamentFilter.panel.updateCounter(counterText);

            // Сообщаем пагинации, сколько карточек видно сейчас.
            // Она сама решит, показывать ли нижнюю пагинацию.
            if (GH.pagination && GH.pagination.refresh) {
                GH.pagination.refresh(shown);
            }
        }

        function renderPanel() {
            const ui = getUi();
            GH.tournamentFilter.panel.render({
                typeid: ctx.typeid,
                levels: levels,
                ui: ui,
                callbacks: {
                    onToggleEnabled: async (checked) => {
                        await GH.store.setUiState(ctx.typeid, { enabled: checked });
                        ctx.state = await GH.store.ensureLoaded();
                        apply();
                    },
                    onToggleExpanded: async () => {
                        const cur = getUi();
                        await GH.store.setUiState(ctx.typeid, { expanded: !cur.expanded });
                        ctx.state = await GH.store.ensureLoaded();
                        GH.tournamentFilter.panel.updateExpanded(!!getUi().expanded);
                    },
                    onLevelChange: async (level, checked) => {
                        const cur = getUi();
                        const levelsMap = Object.assign({}, cur.levels || {});
                        levelsMap[level] = checked;
                        await GH.store.setUiState(ctx.typeid, { levels: levelsMap });
                        ctx.state = await GH.store.ensureLoaded();
                        apply();
                    },
                    onCategoryChange: async (category, checked) => {
                        const cur = getUi();
                        const catsMap = Object.assign({}, cur.categories || {});
                        catsMap[category] = checked;
                        await GH.store.setUiState(ctx.typeid, { categories: catsMap });
                        ctx.state = await GH.store.ensureLoaded();
                        apply();
                    },
                    onLevelsSelectAll: async () => {
                        const cur = getUi();
                        const levelsMap = Object.assign({}, cur.levels || {});
                        levels.forEach((lv) => { levelsMap[lv] = true; });
                        await GH.store.setUiState(ctx.typeid, { levels: levelsMap });
                        ctx.state = await GH.store.ensureLoaded();
                        renderPanel();
                    },
                    onLevelsClearAll: async () => {
                        const cur = getUi();
                        const levelsMap = Object.assign({}, cur.levels || {});
                        levels.forEach((lv) => { levelsMap[lv] = false; });
                        await GH.store.setUiState(ctx.typeid, { levels: levelsMap });
                        ctx.state = await GH.store.ensureLoaded();
                        renderPanel();
                    },
                    onCategoriesSelectAll: async () => {
                        const cur = getUi();
                        const catsMap = Object.assign({}, cur.categories || {});
                        catsMap.all = true;
                        catsMap.usual = true;
                        await GH.store.setUiState(ctx.typeid, { categories: catsMap });
                        ctx.state = await GH.store.ensureLoaded();
                        renderPanel();
                    },
                    onCategoriesClearAll: async () => {
                        const cur = getUi();
                        const catsMap = Object.assign({}, cur.categories || {});
                        catsMap.all = false;
                        catsMap.usual = false;
                        await GH.store.setUiState(ctx.typeid, { categories: catsMap });
                        ctx.state = await GH.store.ensureLoaded();
                        renderPanel();
                    },
                },
            });
            apply();
        }

        return {
            async init() {
                await refreshLevels();
                renderPanel();
            },
            async reloadAndReapply() {
                ctx.state = await GH.store.ensureLoaded();
                await refreshLevels();
                renderPanel();
            },
            apply: apply,
        };
    }

    GH.tournamentFilter = GH.tournamentFilter || {};
    GH.tournamentFilter.createEngine = createEngine;
    GH.tournamentFilter.getCards = getCards;
    GH.tournamentFilter.extractName = extractName;
})();