// ============================================================================
// features/profile-enhancements/index.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    let applying = false;
    let pending = false;

    async function doApply() {
        const state = await GH.store.ensureLoaded();

        await GH.profileEnhancements.tournaments.apply();

        const blockTitles = GH.store.getProfileBlockTitles(state);
        const hiddenMap = GH.store.getProfileHiddenBlocks(state);
        const blocks = GH.profileEnhancements.blocks.collectBlocks(blockTitles);
        if (blocks.length > 0) {
            GH.profileEnhancements.blocks.attachToggles(blocks, hiddenMap, async (key, hidden) => {
                const cur = GH.store.getProfileHiddenBlocks(await GH.store.ensureLoaded());
                const next = Object.assign({}, cur);
                if (hidden) next[key] = true;
                else delete next[key];
                await GH.store.setProfileHiddenBlocks(next);
            });
        }

        const userId = GH.profileEnhancements.getUserId();
        if (userId) {
            GH.profileEnhancements.trophyLink.addTrophyLinkToMenu(userId);
        }

        const wb = GH.profileEnhancements.tournaments.findWonTournamentsBlock();
        if (wb && wb.header && wb.header._ghCards) {
            await GH.profileEnhancements.panel.render(wb.header, wb.header._ghCards);
        } else {
            await GH.profileEnhancements.panel.render(null, null);
        }
    }

    async function apply() {
        if (applying) { pending = true; return; }
        applying = true;
        try {
            await doApply();
        } finally {
            applying = false;
            if (pending) {
                pending = false;
                apply();
            }
        }
    }

    async function init() {
        try {
            await apply();
        } catch (e) {
            console.error('[GH] profile-enhancements failed:', e);
        }

        chrome.storage.onChanged.addListener(async (changes, area) => {
            if (area !== 'local') return;
            if (!changes[GH.storage.STATE_KEY] && !changes[GH.storage.DICT_KEY]) return;

            GH.store.invalidate();

            try {
                // Изменение словаря требует пересобрать карточки заново.
                // Всё остальное (фильтр, скрытые блоки, подсветка) — пересобрать
                // только tbody в уже существующих таблицах.
                if (changes[GH.storage.DICT_KEY]) {
                    await apply();
                } else {
                    await GH.profileEnhancements.tournaments.reapply();
                }
            } catch (e) {
                console.warn('[GH] profile-enhancements: reapply failed', e);
            }
        });
    }

    GH.features = GH.features || {};
    GH.features.profileEnhancements = { init };
})();