// ============================================================================
// features/hall-of-fame-filter/panel.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const PANEL_ID = 'gh-panel';

    function buildCheckboxLevel(level, checked) {
        const enc = encodeURIComponent(level);
        return `<label class="gh-chk"><input type="checkbox" class="gh-level" data-level="${enc}" ${checked ? 'checked' : ''}> ${GH.utils.escapeHtml(GH.utils.levelLabel(level))}</label>`;
    }
    function buildCheckboxType(type, label, checked) {
        return `<label class="gh-chk"><input type="checkbox" class="gh-type" data-type="${type}" ${checked ? 'checked' : ''}> ${GH.utils.escapeHtml(label)}</label>`;
    }
    function buildCheckboxCategory(typeid, label, checked) {
        return `<label class="gh-chk"><input type="checkbox" class="gh-category" data-typeid="${typeid}" ${checked ? 'checked' : ''}> ${GH.utils.escapeHtml(label)}</label>`;
    }

    function render(ctx) {
        const T = GH.config.site.panel.texts;
        const existing = document.getElementById(PANEL_ID);
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = PANEL_ID;

        const ui = ctx.ui || {};

        const catsHtml = ctx.categories
            .map((c) => buildCheckboxCategory(c.typeid, c.name, (ui.categories || {})[String(c.typeid)] !== false))
            .join('') || '<span class="hint">Нет категорий.</span>';

        const levelsHtml = ctx.levels
            .map((lv) => buildCheckboxLevel(lv, (ui.levels || {})[lv] !== false))
            .join('') || '<span class="hint">Уровни не найдены.</span>';

        const typesHtml = ctx.types
            .map((t) => buildCheckboxType(t.id, t.label, (ui.types || {})[t.id] !== false))
            .join('');

        const helpText = [
            'Фильтр автоматически скрывает не основные турниры — призовые, именные, Премию Рунета и прочие.',
            'Чтобы увидеть какой-то из них, выключите фильтр тумблером.',
            '',
            'Категории, уровни и типы работают вместе:',
            '— Сняли категорию, её уровни исчезли из списка.',
            '— Если в оси ничего не отмечено, эта ось не фильтрует (все видны).',
            '— Если отметить хотя бы один пункт, остальные скрываются.',
        ].join('\n');

        panel.innerHTML = `
            <div id="gh-expand-area" class="${ui.expanded ? '' : 'gh-hidden'}">

                <div class="gh-row-header">
                    <span class="gh-row-label">Категории:</span>
                    <button class="gh-mini-btn" id="gh-cats-all" type="button">Все</button>
                    <button class="gh-mini-btn" id="gh-cats-none" type="button">Ничего</button>
                </div>
                <div class="gh-categories-row">${catsHtml}</div>

                <div class="gh-divider"></div>

                <div class="gh-row-header">
                    <span class="gh-row-label">Уровни:</span>
                    <button class="gh-mini-btn" id="gh-levels-all" type="button">Все</button>
                    <button class="gh-mini-btn" id="gh-levels-none" type="button">Ничего</button>
                </div>
                <div class="gh-levels-row">${levelsHtml}</div>

                <div class="gh-divider"></div>

                <div class="gh-row-header">
                    <span class="gh-row-label">Типы:</span>
                    <button class="gh-mini-btn" id="gh-types-all" type="button">Все</button>
                    <button class="gh-mini-btn" id="gh-types-none" type="button">Ничего</button>
                </div>
                <div class="gh-levels-row">${typesHtml}</div>
            </div>
            <div class="gh-header-row">
                <span class="gh-title">Фильтр</span>
                <label class="gh-switch">
                    <input type="checkbox" id="gh-enabled" ${ui.enabled !== false ? 'checked' : ''}>
                    <span class="gh-slider"></span>
                </label>
                <button id="gh-expand-btn" type="button">${ui.expanded ? GH.utils.escapeHtml(T.collapse) : GH.utils.escapeHtml(T.expand)}</button>
                <span id="gh-counter"></span>
                <span class="gh-help" data-tip="${GH.utils.escapeHtml(helpText)}">?</span>
            </div>
        `;

        const container = GH.hallOfFameFilter.getContainer();
        if (container && container.parentNode) container.parentNode.insertBefore(panel, container);
        else document.body.insertBefore(panel, document.body.firstChild);

        panel.querySelector('#gh-enabled').addEventListener('change', (e) => ctx.callbacks.onToggleEnabled(e.target.checked));
        panel.querySelector('#gh-expand-btn').addEventListener('click', () => ctx.callbacks.onToggleExpanded());

        panel.querySelector('#gh-cats-all').addEventListener('click', () => ctx.callbacks.onCategoriesSelectAll());
        panel.querySelector('#gh-cats-none').addEventListener('click', () => ctx.callbacks.onCategoriesClearAll());
        panel.querySelector('#gh-levels-all').addEventListener('click', () => ctx.callbacks.onLevelsSelectAll());
        panel.querySelector('#gh-levels-none').addEventListener('click', () => ctx.callbacks.onLevelsClearAll());
        panel.querySelector('#gh-types-all').addEventListener('click', () => ctx.callbacks.onTypesSelectAll());
        panel.querySelector('#gh-types-none').addEventListener('click', () => ctx.callbacks.onTypesClearAll());

        panel.querySelectorAll('.gh-level').forEach((input) => {
            input.addEventListener('change', (e) => ctx.callbacks.onLevelChange(decodeURIComponent(e.target.dataset.level), e.target.checked));
        });
        panel.querySelectorAll('.gh-type').forEach((input) => {
            input.addEventListener('change', (e) => ctx.callbacks.onTypeChange(e.target.dataset.type, e.target.checked));
        });
        panel.querySelectorAll('.gh-category').forEach((input) => {
            input.addEventListener('change', (e) => ctx.callbacks.onCategoryChange(parseInt(e.target.dataset.typeid, 10), e.target.checked));
        });
    }

    function updateCounter(text) {
        const el = document.getElementById('gh-counter');
        if (el) el.textContent = text;
    }

    GH.hallOfFameFilter = GH.hallOfFameFilter || {};
    GH.hallOfFameFilter.panel = { render, updateCounter };
})();