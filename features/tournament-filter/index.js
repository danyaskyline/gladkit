// ============================================================================
// features/tournament-filter/index.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    async function init() {
        const cards = GH.tournamentFilter.getCards();
        if (cards.length === 0) return;

        const state = await GH.store.ensureLoaded();
        const enabled = GH.store.getEnabledTypeids(state);
        const typeid = GH.tournamentFilter.detectTypeid(enabled);
        if (typeid === null) return;

        const dictArr = await GH.storage.ensureDictLoaded();
        GH.hallOfFameFilter.dict.setIndex(dictArr);

        const engine = GH.tournamentFilter.createEngine({ typeid, state });
        await engine.init();

        chrome.storage.onChanged.addListener(async (changes, area) => {
            if (area !== 'local') return;
            if (changes[GH.storage.STATE_KEY] || changes[GH.storage.DICT_KEY]) {
                GH.store.invalidate();
                if (changes[GH.storage.DICT_KEY]) {
                    const fresh = await GH.storage.ensureDictLoaded();
                    GH.hallOfFameFilter.dict.setIndex(fresh);
                }
                await engine.reloadAndReapply();
            }
        });
    }

    GH.features = GH.features || {};
    GH.features.tournamentFilter = { init };
})();