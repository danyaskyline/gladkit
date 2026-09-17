// ============================================================================
// features/tournament-filter/panel.js
//
// Панель фильтра на странице tournaments.php.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const PANEL_ID = 'gh-panel';

    function buildCheckboxLevel(level, checked) {
        const enc = encodeURIComponent(level);
        return `<label class="gh-chk"><input type="checkbox" class="gh-level" data-level="${enc}" ${checked ? 'checked' : ''}> ${GH.utils.escapeHtml(GH.utils.levelLabel(level))}</label>`;
    }

    function buildCheckboxCategory(category, label, checked) {
        return `<label class="gh-chk"><input type="checkbox" class="gh-category" data-category="${category}" ${checked ? 'checked' : ''}> ${GH.utils.escapeHtml(label)}</label>`;
    }

    function isLevelChecked(level, ui) {
        return (ui.levels || {})[level] !== false;
    }
    function isCategoryChecked(cat, ui) {
        return (ui.categories || {})[cat] !== false;
    }

    function render(ctx) {
        const cfg = GH.config.site.panel;
        const T = cfg.texts;

        const existing = document.getElementById(PANEL_ID);
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = PANEL_ID;

        const levelsHtml = ctx.levels
            .map((lv) => buildCheckboxLevel(lv, isLevelChecked(lv, ctx.ui)))
            .join('');
        const catsHtml =
            buildCheckboxCategory('all', T.allCategory, isCategoryChecked('all', ctx.ui)) +
            buildCheckboxCategory('usual', T.usualCategory, isCategoryChecked('usual', ctx.ui));

        panel.innerHTML = `
            <div id="gh-expand-area" class="${ctx.ui.expanded ? '' : 'gh-hidden'}">

                <div class="gh-row-header">
                    <span class="gh-row-label">Уровни:</span>
                    <button class="gh-mini-btn" id="gh-levels-all" type="button">Все</button>
                    <button class="gh-mini-btn" id="gh-levels-none" type="button">Ничего</button>
                </div>
                <div class="gh-levels-row">${levelsHtml}</div>

                <div class="gh-divider"></div>

                <div class="gh-row-header">
                    <span class="gh-row-label">Типы:</span>
                    <button class="gh-mini-btn" id="gh-cats-all" type="button">Все</button>
                    <button class="gh-mini-btn" id="gh-cats-none" type="button">Ничего</button>
                </div>
                <div class="gh-categories-row">${catsHtml}</div>
            </div>
            <div class="gh-header-row">
                <span class="gh-title">${GH.utils.escapeHtml(T.title)}</span>
                <label class="gh-switch">
                    <input type="checkbox" id="gh-enabled" ${ctx.ui.enabled !== false ? 'checked' : ''}>
                    <span class="gh-slider"></span>
                </label>
                <button id="gh-expand-btn" type="button">${ctx.ui.expanded ? GH.utils.escapeHtml(T.collapse) : GH.utils.escapeHtml(T.expand)}</button>
                <span id="gh-counter"></span>
            </div>
        `;

        const anchor = document.querySelector(cfg.insertAfterSelector);
        if (anchor && anchor.parentElement) {
            anchor.parentElement.insertBefore(panel, anchor.nextSibling);
        } else {
            const container = document.querySelector(cfg.insertIntoSelector);
            if (container) {
                container.insertBefore(panel, container.firstChild);
            } else {
                document.body.insertBefore(panel, document.body.firstChild);
            }
        }

        // Обработчики.
        panel.querySelector('#gh-enabled').addEventListener('change', (e) => {
            ctx.callbacks.onToggleEnabled(e.target.checked);
        });
        panel.querySelector('#gh-expand-btn').addEventListener('click', () => {
            ctx.callbacks.onToggleExpanded();
        });
        panel.querySelector('#gh-levels-all').addEventListener('click', () => {
            ctx.callbacks.onLevelsSelectAll();
        });
        panel.querySelector('#gh-levels-none').addEventListener('click', () => {
            ctx.callbacks.onLevelsClearAll();
        });
        panel.querySelector('#gh-cats-all').addEventListener('click', () => {
            ctx.callbacks.onCategoriesSelectAll();
        });
        panel.querySelector('#gh-cats-none').addEventListener('click', () => {
            ctx.callbacks.onCategoriesClearAll();
        });
        panel.querySelectorAll('.gh-level').forEach((input) => {
            input.addEventListener('change', (e) => {
                const level = decodeURIComponent(e.target.dataset.level);
                ctx.callbacks.onLevelChange(level, e.target.checked);
            });
        });
        panel.querySelectorAll('.gh-category').forEach((input) => {
            input.addEventListener('change', (e) => {
                ctx.callbacks.onCategoryChange(e.target.dataset.category, e.target.checked);
            });
        });
    }

    function updateCounter(text) {
        const el = document.getElementById('gh-counter');
        if (el) el.textContent = text;
    }

    function updateExpanded(expanded) {
        const T = GH.config.site.panel.texts;
        const area = document.getElementById('gh-expand-area');
        const btn = document.getElementById('gh-expand-btn');
        if (area) area.classList.toggle('gh-hidden', !expanded);
        if (btn) btn.textContent = expanded ? T.collapse : T.expand;
    }

    GH.tournamentFilter = GH.tournamentFilter || {};
    GH.tournamentFilter.panel = { render, updateCounter, updateExpanded };
})();