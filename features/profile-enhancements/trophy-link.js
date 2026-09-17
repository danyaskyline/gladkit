// ============================================================================
// features/profile-enhancements/trophy-link.js
//
// Дублирует ссылку «Зал трофеев» в правом меню профиля (в конец).
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const ROW_CLASS = 'gh-trophy-link-row';

    function buildUrl(userId) {
        return GH.config.site.profile.trophyUrlTemplate.replace('{userId}', userId);
    }

    function addTrophyLinkToMenu(userId) {
        const cfg = GH.config.site.profile;
        const rightPanel = document.querySelector(cfg.selectors.rightPanel);
        if (!rightPanel) return false;

        const firstRow = rightPanel.querySelector(cfg.selectors.sideMenuRow);
        if (!firstRow) return false;

        const tbody = firstRow.closest('tbody');
        if (!tbody) return false;

        if (tbody.querySelector('.' + ROW_CLASS)) return false;

        const tr = document.createElement('tr');
        tr.className = 'wooden ' + ROW_CLASS;

        const td = document.createElement('td');
        td.className = 'wooden';

        const a = document.createElement('a');
        a.href = buildUrl(userId);
        a.textContent = cfg.texts.trophyLink;

        td.appendChild(a);
        tr.appendChild(td);
        tbody.appendChild(tr);
        return true;
    }

    GH.profileEnhancements = GH.profileEnhancements || {};
    GH.profileEnhancements.trophyLink = { addTrophyLinkToMenu };
})();