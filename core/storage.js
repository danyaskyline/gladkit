// ============================================================================
// core/storage.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const STATE_KEY = 'gh_state';
    const DICT_KEY = 'gh_dict';
    const SCHEMA_VERSION = GH.dataDefaults.schemaVersion;
    const DEFAULTS_VERSION = GH.dataDefaults.defaultsVersion || 1;

    function emptyState() {
        return {
            schemaVersion: SCHEMA_VERSION,
            defaultsVersion: DEFAULTS_VERSION,
            categories: [],
            menuItems: [],
            highlights: {},
            ui: {},
            hallOfFame: { ui: {} },
            profileEnhancements: {},
            guildEnhancements: {},
            playerMarks: {},
        };
    }

    function ensureProfileEnhancements(state) {
        const d = GH.dataDefaults.profileEnhancements || {};
        if (!state.profileEnhancements || typeof state.profileEnhancements !== 'object') state.profileEnhancements = {};
        const p = state.profileEnhancements;

        if (!p.hiddenBlocks || typeof p.hiddenBlocks !== 'object') p.hiddenBlocks = {};
        if (!Array.isArray(p.blockTitles) || p.blockTitles.length === 0) {
            p.blockTitles = GH.utils.deepClone(d.blockTitles || []);
        }
        if (!p.tournamentFilter || typeof p.tournamentFilter !== 'object') {
            p.tournamentFilter = GH.utils.deepClone(d.tournamentFilter || {});
        } else {
            const tf = p.tournamentFilter;
            if (typeof tf.enabled !== 'boolean') tf.enabled = true;
            if (typeof tf.expanded !== 'boolean') tf.expanded = false;
            if (!tf.categories || typeof tf.categories !== 'object') tf.categories = {};
            if (typeof tf.nonRegular !== 'boolean') tf.nonRegular = true;
            if (!tf.levels || typeof tf.levels !== 'object') tf.levels = {};
            if (typeof tf.showStats !== 'boolean') tf.showStats = true;
        }
        if (!p.tournamentHighlight || typeof p.tournamentHighlight !== 'object') {
            p.tournamentHighlight = GH.utils.deepClone(d.tournamentHighlight || {});
        }
        if (!Array.isArray(p.nonRegularNames)) p.nonRegularNames = [];
        return state;
    }

    function ensureGuildEnhancements(state) {
        const d = GH.dataDefaults.guildEnhancements || {};
        if (!state.guildEnhancements || typeof state.guildEnhancements !== 'object') state.guildEnhancements = {};
        const g = state.guildEnhancements;
        if (!g.hiddenBlocks || typeof g.hiddenBlocks !== 'object') g.hiddenBlocks = {};
        if (!Array.isArray(g.blockTitles) || g.blockTitles.length === 0) {
            g.blockTitles = GH.utils.deepClone(d.blockTitles || []);
        }
        return state;
    }

    function ensurePlayerMarks(state) {
        if (!state.playerMarks || typeof state.playerMarks !== 'object') state.playerMarks = {};
        return state;
    }

    // Убеждаемся, что hallOfFame есть, но содержит только ui.
    function ensureHallOfFame(state) {
        if (!state.hallOfFame || typeof state.hallOfFame !== 'object') state.hallOfFame = {};
        if (!state.hallOfFame.ui || typeof state.hallOfFame.ui !== 'object') state.hallOfFame.ui = {};
        // Убираем устаревшие поля, если остались от старых версий.
        delete state.hallOfFame.categories;
        delete state.hallOfFame.nonRegularNames;
        return state;
    }

    function stateFromDefaults() {
        const d = GH.utils.deepClone(GH.dataDefaults);
        return ensurePlayerMarks(ensureGuildEnhancements(ensureProfileEnhancements(ensureHallOfFame({
            schemaVersion: d.schemaVersion,
            defaultsVersion: d.defaultsVersion || 1,
            categories: d.categories || [],
            menuItems: d.menuItems || [],
            highlights: d.highlights || {},
            ui: d.ui || {},
            hallOfFame: { ui: {} },
            profileEnhancements: {
                hiddenBlocks: {},
                blockTitles: (d.profileEnhancements && d.profileEnhancements.blockTitles) || [],
                tournamentFilter: (d.profileEnhancements && d.profileEnhancements.tournamentFilter) || {},
                tournamentHighlight: (d.profileEnhancements && d.profileEnhancements.tournamentHighlight) || {},
            },
            guildEnhancements: {
                hiddenBlocks: {},
                blockTitles: (d.guildEnhancements && d.guildEnhancements.blockTitles) || [],
            },
            playerMarks: {},
        }))));
    }

    function migrate(raw) {
        if (!raw || typeof raw !== 'object') return stateFromDefaults();
        const state = Object.assign({}, raw);

        if (!Array.isArray(state.categories) || state.categories.length === 0) {
            state.categories = GH.utils.deepClone(GH.dataDefaults.categories || []);
        }
        if (!Array.isArray(state.menuItems)) state.menuItems = [];
        if (!state.highlights) state.highlights = {};
        if (!state.ui) state.ui = {};
        if (typeof state.defaultsVersion !== 'number') state.defaultsVersion = 0;

        state.schemaVersion = SCHEMA_VERSION;

        return ensurePlayerMarks(ensureGuildEnhancements(ensureProfileEnhancements(ensureHallOfFame(state))));
    }

    // Обновление дефолтов: категории перезаписываются, пользовательские остаются.
    async function applyDefaultsUpdate(state) {
        const stateVersion = state.defaultsVersion || 0;
        if (stateVersion >= DEFAULTS_VERSION) return false;

        // Категории.
        const customCats = (state.categories || []).filter((c) => c && c.custom === true);

        // У пользовательских категорий — если не было regular, ставим true.
        customCats.forEach((c) => {
            if (typeof c.regular !== 'boolean') c.regular = true;
        });

        const freshCats = GH.utils.deepClone(GH.dataDefaults.categories || []);
        state.categories = freshCats.concat(customCats);

        // Словарь перезаписываем: дефолт + пользовательские.
        const dictArr = await loadDict();
        const customDict = (dictArr || []).filter((r) => r && r.custom === true);
        const freshDict = loadDefaultDict();
        await saveDict(freshDict.concat(customDict));

        state.defaultsVersion = DEFAULTS_VERSION;
        return true;
    }

    async function load() {
        const data = await GH.utils.storageGet(STATE_KEY);
        const raw = data[STATE_KEY];
        if (!raw) {
            const fresh = stateFromDefaults();
            await save(fresh);
            const d = loadDefaultDict();
            if (d.length > 0) await saveDict(d);
            return fresh;
        }
        const migrated = migrate(raw);
        const versionChanged = await applyDefaultsUpdate(migrated);
        if (migrated.schemaVersion !== raw.schemaVersion || versionChanged) await save(migrated);
        return migrated;
    }

    async function save(state) { await GH.utils.storageSet({ [STATE_KEY]: state }); }
    async function resetToDefaults() {
        const fresh = stateFromDefaults();
        await save(fresh);
        const d = loadDefaultDict();
        await saveDict(d.slice());
        return fresh;
    }
    async function clear() { await GH.utils.storageRemove(STATE_KEY); }

    async function loadDict() {
        const data = await GH.utils.storageGet(DICT_KEY);
        const arr = data[DICT_KEY];
        return Array.isArray(arr) ? arr : [];
    }
    async function saveDict(arr) {
        if (!Array.isArray(arr)) throw new Error('Словарь должен быть массивом');
        await GH.utils.storageSet({ [DICT_KEY]: arr });
    }
    async function clearDict() { await GH.utils.storageRemove(DICT_KEY); }

    function loadDefaultDict() {
        const d = GH.defaultDict;
        if (!d) return [];
        if (Array.isArray(d)) return d;
        if (Array.isArray(d.entries)) return d.entries;
        return [];
    }

    async function ensureDictLoaded() {
        const existing = await loadDict();
        if (existing.length > 0) return existing;
        const arr = loadDefaultDict();
        if (arr.length > 0) { await saveDict(arr); return arr; }
        return [];
    }

    GH.storage = {
        STATE_KEY: STATE_KEY,
        DICT_KEY: DICT_KEY,
        load: load,
        save: save,
        resetToDefaults: resetToDefaults,
        clear: clear,
        stateFromDefaults: stateFromDefaults,
        migrate: migrate,
        loadDict: loadDict,
        saveDict: saveDict,
        clearDict: clearDict,
        loadDefaultDict: loadDefaultDict,
        ensureDictLoaded: ensureDictLoaded,
    };
})();