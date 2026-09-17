// ============================================================================
// features/hall-of-fame-filter/engine.js
//
// Логика фильтра зала славы.
// Использует getRegularCategories — общий список категорий из state.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function createEngine(ctx) {
        let state = ctx.state;
        let enriched = [];

        function getUi() { return GH.store.getHallOfFameUi(state); }

        function enrich() {
            const regCats = GH.store.getRegularCategories(state);
            const catMap = {};
            regCats.forEach((c) => { catMap[c.typeid] = c; });

            enriched = ctx.blocks.map((block) => {
                const rec = GH.hallOfFameFilter.dict.lookup(block.typeid, block.tournament);
                const level = rec ? rec.level : null;
                const type = rec ? rec.type : null;

                const cat = catMap[block.typeid] || {};
                const regular = !!rec && cat.regular === true;

                return {
                    block: block,
                    record: rec,
                    level: level,
                    type: type,
                    categoryName: cat.name || ('Категория ' + block.typeid),
                    regular: regular,
                    categoryEnabled: cat.enabled !== false,
                };
            });
        }

        function collectCategories() {
            return GH.store.getRegularCategories(state)
                .filter((c) => c.enabled !== false);
        }

        function collectLevels() {
            const ui = getUi();
            const set = new Set();
            const catsMap = ui.categories || {};

            enriched.forEach((it) => {
                if (!it.regular) return;
                if (!it.categoryEnabled) return;
                if (catsMap[String(it.block.typeid)] === false) return;
                if (it.level) set.add(it.level);
            });
            return GH.utils.uniqueSorted(Array.from(set));
        }

        function collectTypes() {
            return (GH.dataDefaults.hallOfFameTypes || []).slice();
        }

        function isVisible(item, ui, cats, activeLevels, activeTypes) {
            if (ui.enabled === false) return true;
            if (!item.categoryEnabled) return false;
            if (!item.regular) return false;

            const catsMap = ui.categories || {};
            const levelsMap = ui.levels || {};
            const typesMap = ui.types || {};

            const anyCatOff = cats.some((c) => catsMap[String(c.typeid)] === false);
            if (anyCatOff) {
                if (catsMap[String(item.block.typeid)] === false) return false;
            }

            const anyLvlOn = activeLevels.some((lv) => levelsMap[lv] !== false);
            if (anyLvlOn) {
                if (item.level === null) return false;
                if (levelsMap[item.level] === false) return false;
            }

            const anyTypeOn = activeTypes.some((t) => typesMap[t.id] !== false);
            if (anyTypeOn) {
                if (item.type === null) return false;
                if (typesMap[item.type] === false) return false;
            }

            return true;
        }

        function apply() {
            const ui = getUi();
            const cats = collectCategories();
            const activeLevels = collectLevels();
            const activeTypes = collectTypes();

            let hidden = 0;

            const categoryVisible = {};
            const firstCategoryRow = {};

            enriched.forEach((item) => {
                const visible = isVisible(item, ui, cats, activeLevels, activeTypes);
                item.block.header.style.display = visible ? '' : 'none';
                item.block.content.style.display = visible ? '' : 'none';
                if (!visible) hidden++;

                const tid = item.block.typeid;
                if (tid !== null && !firstCategoryRow[tid] && item.block.categoryRow) {
                    firstCategoryRow[tid] = item.block.categoryRow;
                }
                if (visible && tid !== null) {
                    categoryVisible[tid] = true;
                }
            });

            Object.keys(firstCategoryRow).forEach(function (tid) {
                const row = firstCategoryRow[tid];
                const visible = !!categoryVisible[tid];
                row.style.display = visible ? '' : 'none';
            });

            const total = enriched.length;
            const shown = total - hidden;
            const counter = ui.enabled === false
                ? 'Фильтр выключен (всего турниров: ' + total + ')'
                : 'Показано: ' + shown + ' из ' + total;
            GH.hallOfFameFilter.panel.updateCounter(counter);
        }

        async function patchUi(patch) {
            await GH.store.setHallOfFameUi(patch);
            state = await GH.store.ensureLoaded();
        }

        async function syncLevels() {
            const newLevels = collectLevels();
            const cur = getUi();
            const levels = cur.levels || {};
            const categories = cur.categories || {};

            const isFirstRun =
                Object.keys(levels).length === 0 &&
                Object.keys(categories).length === 0;

            const cleaned = {};

            newLevels.forEach((lv) => {
                if (Object.prototype.hasOwnProperty.call(levels, lv)) {
                    cleaned[lv] = levels[lv];
                } else {
                    cleaned[lv] = isFirstRun ? true : false;
                }
            });

            Object.keys(levels).forEach((lv) => {
                if (!Object.prototype.hasOwnProperty.call(cleaned, lv)) {
                    cleaned[lv] = false;
                }
            });

            await patchUi({ levels: cleaned });
        }

        function renderPanel() {
            const ui = getUi();
            GH.hallOfFameFilter.panel.render({
                levels: collectLevels(),
                types: collectTypes(),
                categories: collectCategories(),
                ui: ui,
                callbacks: {
                    onToggleEnabled: async (v) => { await patchUi({ enabled: v }); apply(); },
                    onToggleExpanded: async () => {
                        const cur = getUi();
                        await patchUi({ expanded: !cur.expanded });
                        renderPanel();
                    },
                    onCategoryChange: async (typeid, checked) => {
                        const cur = getUi();
                        const categories = Object.assign({}, cur.categories || {});
                        categories[String(typeid)] = checked;
                        await patchUi({ categories: categories });
                        await syncLevels();
                        renderPanel();
                    },
                    onLevelChange: async (level, checked) => {
                        const cur = getUi();
                        const levels = Object.assign({}, cur.levels || {});
                        levels[level] = checked;
                        await patchUi({ levels: levels });
                        apply();
                    },
                    onTypeChange: async (type, checked) => {
                        const cur = getUi();
                        const types = Object.assign({}, cur.types || {});
                        types[type] = checked;
                        await patchUi({ types: types });
                        apply();
                    },
                    onCategoriesSelectAll: async () => {
                        const cur = getUi();
                        const categories = Object.assign({}, cur.categories || {});
                        collectCategories().forEach((c) => { categories[String(c.typeid)] = true; });
                        await patchUi({ categories: categories });
                        await syncLevels();
                        renderPanel();
                    },
                    onCategoriesClearAll: async () => {
                        const cur = getUi();
                        const categories = Object.assign({}, cur.categories || {});
                        collectCategories().forEach((c) => { categories[String(c.typeid)] = false; });
                        await patchUi({ categories: categories });
                        await syncLevels();
                        renderPanel();
                    },
                    onLevelsSelectAll: async () => {
                        const cur = getUi();
                        const levels = Object.assign({}, cur.levels || {});
                        collectLevels().forEach((lv) => { levels[lv] = true; });
                        await patchUi({ levels: levels });
                        renderPanel();
                    },
                    onLevelsClearAll: async () => {
                        const cur = getUi();
                        const levels = Object.assign({}, cur.levels || {});
                        collectLevels().forEach((lv) => { levels[lv] = false; });
                        await patchUi({ levels: levels });
                        renderPanel();
                    },
                    onTypesSelectAll: async () => {
                        const cur = getUi();
                        const types = Object.assign({}, cur.types || {});
                        collectTypes().forEach((t) => { types[t.id] = true; });
                        await patchUi({ types: types });
                        renderPanel();
                    },
                    onTypesClearAll: async () => {
                        const cur = getUi();
                        const types = Object.assign({}, cur.types || {});
                        collectTypes().forEach((t) => { types[t.id] = false; });
                        await patchUi({ types: types });
                        renderPanel();
                    },
                },
            });
            apply();
        }

        return {
            async init() {
                enrich();
                await syncLevels();
                renderPanel();
            },
            async reloadAndReapply() {
                state = await GH.store.ensureLoaded();
                enrich();
                await syncLevels();
                renderPanel();
            },
            apply: apply,
        };
    }

    GH.hallOfFameFilter = GH.hallOfFameFilter || {};
    GH.hallOfFameFilter.createEngine = createEngine;
})();