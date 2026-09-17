// ============================================================================
// features/menu-tweaks/index.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    async function applyMenuItems() {
        const state = await GH.store.ensureLoaded();
        const items = GH.store.getMenuItems(state);

        if (!items || items.length === 0) {
            return;
        }

        const grouped = {};
        items.forEach((item) => {
            if (!item.enabled) return;
            if (!item.menuKey) return;
            if (!grouped[item.menuKey]) grouped[item.menuKey] = [];
            grouped[item.menuKey].push(item);
        });

        Object.keys(grouped).forEach((menuKey) => {
            const menuLi = GH.menuTweaks.detector.findMenuLi(menuKey);
            if (!menuLi) return;

            const subUl = GH.menuTweaks.detector.findSubMenuUl(menuLi);
            if (!subUl) return;

            grouped[menuKey].forEach((item) => {
                GH.menuTweaks.builder.addItemToUl(subUl, item);
            });
        });
    }

    async function init() {
        try {
            await applyMenuItems();
        } catch (e) {
            console.error('[GH] menu-tweaks failed:', e);
        }
    }

    GH.features = GH.features || {};
    GH.features.menuTweaks = { init };
})();