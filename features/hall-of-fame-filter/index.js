// ============================================================================
// features/hall-of-fame-filter/index.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    async function init() {
        const blocks = GH.hallOfFameFilter.parseBlocks();
        if (blocks.length === 0) return;

        const dict = await GH.storage.ensureDictLoaded();
        GH.hallOfFameFilter.dict.setIndex(dict);

        const state = await GH.store.ensureLoaded();

        const engine = GH.hallOfFameFilter.createEngine({ blocks, state });
        await engine.init();

        chrome.storage.onChanged.addListener(async (changes, area) => {
            if (area !== 'local') return;
            if (changes[GH.storage.STATE_KEY] || changes[GH.storage.DICT_KEY]) {
                GH.store.invalidate();
                const fresh = await GH.storage.ensureDictLoaded();
                GH.hallOfFameFilter.dict.setIndex(fresh);
                await engine.reloadAndReapply();
            }
        });
    }

    GH.features = GH.features || {};
    GH.features.hallOfFameFilter = { init };
})();