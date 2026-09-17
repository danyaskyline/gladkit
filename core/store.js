// ============================================================================
// core/store.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    let cachedState = null;

    async function ensureLoaded() {
        if (cachedState) return cachedState;
        cachedState = await GH.storage.load();
        return cachedState;
    }

    function invalidate() { cachedState = null; }

    function getCategories(state) { return (state.categories || []).slice(); }

    // Только регулярные категории (regular: true). Используется для фильтров
    // зала славы и профиля.
    function getRegularCategories(state) {
        return (state.categories || []).filter((c) => c.regular === true);
    }

    function getEnabledTypeids(state) {
        return (state.categories || [])
            .filter((c) => c.enabled !== false)
            .map((c) => c.typeid);
    }

    function getCategoryName(typeid, state) {
        const c = (state.categories || []).find((c) => c.typeid === typeid);
        return c ? c.name : ('Категория ' + typeid);
    }

    function getMenuItems(state) { return (state.menuItems || []).slice(); }

    function getHighlightConfig(name, state) {
        const user = (state.highlights || {})[name] || {};
        const def = GH.config.site.highlights[name] || {};
        return Object.assign({}, def, user);
    }

    function getUiState(typeid, state) { return (state.ui || {})[typeid] || {}; }

    async function setUiState(typeid, patch) {
        const state = await ensureLoaded();
        state.ui = state.ui || {};
        state.ui[typeid] = Object.assign({}, state.ui[typeid] || {}, patch);
        await GH.storage.save(state);
    }

    function getHallOfFameUi(state) { return (state.hallOfFame || {}).ui || {}; }

    async function setHallOfFameUi(patch) {
        const state = await ensureLoaded();
        state.hallOfFame = state.hallOfFame || {};
        state.hallOfFame.ui = Object.assign({}, state.hallOfFame.ui || {}, patch);
        await GH.storage.save(state);
    }

    function getProfileHiddenBlocks(state) {
        return Object.assign({}, ((state.profileEnhancements || {}).hiddenBlocks || {}));
    }

    async function setProfileHiddenBlocks(map) {
        const state = await ensureLoaded();
        state.profileEnhancements = state.profileEnhancements || {};
        state.profileEnhancements.hiddenBlocks = Object.assign({}, map || {});
        await GH.storage.save(state);
    }

    function getProfileBlockTitles(state) {
        return ((state.profileEnhancements || {}).blockTitles || []).slice();
    }

    async function setProfileBlockTitles(arr) {
        const state = await ensureLoaded();
        state.profileEnhancements = state.profileEnhancements || {};
        state.profileEnhancements.blockTitles = arr.slice();
        await GH.storage.save(state);
    }

    function getProfileNonRegularNames(state) {
        return ((state.profileEnhancements || {}).nonRegularNames || []).slice();
    }

    async function setProfileNonRegularNames(arr) {
        const state = await ensureLoaded();
        state.profileEnhancements = state.profileEnhancements || {};
        state.profileEnhancements.nonRegularNames = arr.slice();
        await GH.storage.save(state);
    }

    function getProfileTournamentFilter(state) {
        const p = (state.profileEnhancements || {});
        const tf = p.tournamentFilter || {};
        return {
            enabled: tf.enabled !== false,
            expanded: tf.expanded === true,
            categories: Object.assign({}, tf.categories || {}),
            nonRegular: tf.nonRegular !== false,
            levels: Object.assign({}, tf.levels || {}),
            showStats: tf.showStats !== false,
        };
    }

    async function setProfileTournamentFilter(patch) {
        const state = await ensureLoaded();
        state.profileEnhancements = state.profileEnhancements || {};
        const cur = state.profileEnhancements.tournamentFilter || {};
        state.profileEnhancements.tournamentFilter = Object.assign({}, cur, patch || {});
        await GH.storage.save(state);
    }

    function getProfileTournamentHighlight(state) {
        const p = (state.profileEnhancements || {});
        const user = p.tournamentHighlight || {};
        const def = (GH.config.site.profile && GH.config.site.profile.defaultTournamentHighlight) || {};
        return Object.assign({}, def, user);
    }

    async function setProfileTournamentHighlight(patch) {
        const state = await ensureLoaded();
        state.profileEnhancements = state.profileEnhancements || {};
        const cur = state.profileEnhancements.tournamentHighlight || {};
        state.profileEnhancements.tournamentHighlight = Object.assign({}, cur, patch || {});
        await GH.storage.save(state);
    }

    function getGuildHiddenBlocks(state) {
        return Object.assign({}, ((state.guildEnhancements || {}).hiddenBlocks || {}));
    }

    async function setGuildHiddenBlocks(map) {
        const state = await ensureLoaded();
        state.guildEnhancements = state.guildEnhancements || {};
        state.guildEnhancements.hiddenBlocks = Object.assign({}, map || {});
        await GH.storage.save(state);
    }

    function getGuildBlockTitles(state) {
        return ((state.guildEnhancements || {}).blockTitles || []).slice();
    }

    async function setGuildBlockTitles(arr) {
        const state = await ensureLoaded();
        state.guildEnhancements = state.guildEnhancements || {};
        state.guildEnhancements.blockTitles = arr.slice();
        await GH.storage.save(state);
    }

    function getPlayerMarks(state) {
        return Object.assign({}, state.playerMarks || {});
    }
    function getPlayerMark(userId, state) {
        return (state.playerMarks || {})[String(userId)] || null;
    }
    async function setPlayerMark(userId, patch) {
        const state = await ensureLoaded();
        state.playerMarks = state.playerMarks || {};
        const key = String(userId);
        if (!state.playerMarks[key]) state.playerMarks[key] = {};
        Object.assign(state.playerMarks[key], patch);
        await GH.storage.save(state);
    }
    async function removePlayerMark(userId) {
        const state = await ensureLoaded();
        if (!state.playerMarks) return;
        delete state.playerMarks[String(userId)];
        await GH.storage.save(state);
    }

    async function setState(patch) {
        const state = await ensureLoaded();
        Object.assign(state, patch);
        await GH.storage.save(state);
    }

    async function resetToDefaults() {
        cachedState = await GH.storage.resetToDefaults();
        return cachedState;
    }

    GH.store = {
        ensureLoaded: ensureLoaded,
        invalidate: invalidate,
        getCategories: getCategories,
        getRegularCategories: getRegularCategories,
        getEnabledTypeids: getEnabledTypeids,
        getCategoryName: getCategoryName,
        getMenuItems: getMenuItems,
        getHighlightConfig: getHighlightConfig,
        getUiState: getUiState,
        setUiState: setUiState,
        getHallOfFameUi: getHallOfFameUi,
        setHallOfFameUi: setHallOfFameUi,
        getProfileHiddenBlocks: getProfileHiddenBlocks,
        setProfileHiddenBlocks: setProfileHiddenBlocks,
        getProfileBlockTitles: getProfileBlockTitles,
        setProfileBlockTitles: setProfileBlockTitles,
        getProfileNonRegularNames: getProfileNonRegularNames,
        setProfileNonRegularNames: setProfileNonRegularNames,
        getProfileTournamentFilter: getProfileTournamentFilter,
        setProfileTournamentFilter: setProfileTournamentFilter,
        getProfileTournamentHighlight: getProfileTournamentHighlight,
        setProfileTournamentHighlight: setProfileTournamentHighlight,
        getGuildHiddenBlocks: getGuildHiddenBlocks,
        setGuildHiddenBlocks: setGuildHiddenBlocks,
        getGuildBlockTitles: getGuildBlockTitles,
        setGuildBlockTitles: setGuildBlockTitles,
        getPlayerMarks: getPlayerMarks,
        getPlayerMark: getPlayerMark,
        setPlayerMark: setPlayerMark,
        removePlayerMark: removePlayerMark,
        setState: setState,
        resetToDefaults: resetToDefaults,
    };
})();