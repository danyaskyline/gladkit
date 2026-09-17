// ============================================================================
// features/guild-enhancements/index.js
//
// Тумблеры «скрыть / показать» у блоков наград в профиле гильдии.
// Никаких фильтров — только скрытие.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    async function apply() {
        const state = await GH.store.ensureLoaded();

        const blockTitles = GH.store.getGuildBlockTitles(state);
        const hiddenMap = GH.store.getGuildHiddenBlocks(state);
        const blocks = GH.guildEnhancements.blocks.collectBlocks(blockTitles);

        if (blocks.length > 0) {
            GH.guildEnhancements.blocks.attachToggles(blocks, hiddenMap, async (key, hidden) => {
                const cur = GH.store.getGuildHiddenBlocks(await GH.store.ensureLoaded());
                const next = Object.assign({}, cur);
                if (hidden) next[key] = true;
                else delete next[key];
                await GH.store.setGuildHiddenBlocks(next);
            });
        }
    }

    async function init() {
        try {
            await apply();
        } catch (e) {
            console.error('[GH] guild-enhancements failed:', e);
        }

        chrome.storage.onChanged.addListener(async function (changes, area) {
            if (area !== 'local') return;
            if (changes[GH.storage.STATE_KEY]) {
                GH.store.invalidate();
                try {
                    await apply();
                } catch (e) {
                    console.warn('[GH] guild-enhancements: reapply failed', e);
                }
            }
        });
    }

    GH.features = GH.features || {};
    GH.features.guildEnhancements = { init: init };
})();