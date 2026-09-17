// ============================================================================
// features/profile-enhancements/panel.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const BTN_CLASS = 'gh-profile-filter-btn';
    const PANEL_ID = 'gh-profile-filter-panel';

    let isOpen = false;
    let panelEl = null;
    let btnEl = null;
    let cachedHeader = null;
    let cachedCards = null;
    let outsideBound = false;
    let scrollBound = false;
    let rafPending = false;

    function ensurePanel() {
        if (panelEl) return panelEl;
        panelEl = document.createElement('div');
        panelEl.id = PANEL_ID;
        panelEl.style.display = 'none';
        document.body.appendChild(panelEl);
        return panelEl;
    }

    function ensureButton(header) {
        let btn = header.querySelector('.' + BTN_CLASS);
        if (btn) return btn;
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = BTN_CLASS;
        btn.textContent = 'Фильтр ▼';
        header.appendChild(btn);
        return btn;
    }

    function normalizeLevels(cards) {
        const set = new Set();
        (cards || []).forEach(function (c) { if (c.level) set.add(c.level); });
        return GH.utils.uniqueSorted(Array.from(set));
    }

    function esc(s) { return GH.utils.escapeHtml(s); }

    function buildHtml(ui, categories, levels) {
        const enabled = ui.enabled !== false;
        const catsMap = ui.categories || {};
        const levelsMap = ui.levels || {};
        const nonRegChecked = ui.nonRegular !== false;
        const statsChecked = ui.showStats !== false;

        const catsHtml = categories.length
            ? categories.map(function (c) {
                const checked = catsMap[String(c.typeid)] !== false;
                return '<label class="gh-chk"><input type="checkbox" class="gh-pf-cat" data-typeid="' +
                    c.typeid + '"' + (checked ? ' checked' : '') + '> ' + esc(c.name) + '</label>';
            }).join('')
            : '<span class="hint">Нет категорий.</span>';

        const levelsHtml = levels.length
            ? levels.map(function (lv) {
                const checked = levelsMap[lv] !== false;
                return '<label class="gh-chk"><input type="checkbox" class="gh-pf-lvl" data-level="' +
                    encodeURIComponent(lv) + '"' + (checked ? ' checked' : '') + '> ' +
                    esc(GH.utils.levelLabel(lv)) + '</label>';
            }).join('')
            : '<span class="hint">Уровни не найдены.</span>';

        return '' +
            '<div class="gh-header-row" style="padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid #918567;">' +
                '<span class="gh-row-label">Фильтр:</span>' +
                '<label class="gh-switch">' +
                    '<input type="checkbox" class="gh-pf-enabled"' + (enabled ? ' checked' : '') + '>' +
                    '<span class="gh-slider"></span>' +
                '</label>' +
            '</div>' +
            '<div class="gh-row-header">' +
                '<span class="gh-row-label">Категории:</span>' +
                '<button type="button" class="gh-mini-btn" data-act="cats-all">Все</button>' +
                '<button type="button" class="gh-mini-btn" data-act="cats-none">Ничего</button>' +
            '</div>' +
            '<div class="gh-levels-row">' + catsHtml + '</div>' +
            '<div class="gh-divider"></div>' +
            '<div class="gh-row-header">' +
                '<span class="gh-row-label">Уровни:</span>' +
                '<button type="button" class="gh-mini-btn" data-act="levels-all">Все</button>' +
                '<button type="button" class="gh-mini-btn" data-act="levels-none">Ничего</button>' +
            '</div>' +
            '<div class="gh-levels-row">' + levelsHtml + '</div>' +
            '<div class="gh-divider"></div>' +
            '<div class="gh-levels-row">' +
                '<label class="gh-chk"><input type="checkbox" class="gh-pf-nonreg"' +
                    (nonRegChecked ? ' checked' : '') + '> Показывать не основные</label>' +
                '<label class="gh-chk"><input type="checkbox" class="gh-pf-stats"' +
                    (statsChecked ? ' checked' : '') + '> Прогресс</label>' +
            '</div>';
    }

    function positionPanel() {
        if (!panelEl || !btnEl) return;
        const btnRect = btnEl.getBoundingClientRect();

        if (btnRect.bottom < 0 || btnRect.top > window.innerHeight) {
            close();
            return;
        }

        const gap = 6;

        panelEl.style.visibility = 'hidden';
        panelEl.style.display = 'block';
        panelEl.style.top = '0px';
        panelEl.style.left = '0px';
        const panelRect = panelEl.getBoundingClientRect();

        let top = btnRect.top - panelRect.height - gap;
        if (top < 4) {
            top = btnRect.bottom + gap;
            if (top + panelRect.height > window.innerHeight - 4) {
                top = Math.max(4, window.innerHeight - panelRect.height - 4);
            }
        }

        let left = btnRect.right - panelRect.width;
        if (left < 4) left = 4;
        if (left + panelRect.width > window.innerWidth - 4) {
            left = window.innerWidth - panelRect.width - 4;
        }

        panelEl.style.top = top + 'px';
        panelEl.style.left = left + 'px';
        panelEl.style.visibility = '';
    }

    function schedulePosition() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
            rafPending = false;
            if (isOpen) positionPanel();
        });
    }

    async function rebuildContent() {
        if (!panelEl) return;
        const state = await GH.store.ensureLoaded();
        const ui = GH.store.getProfileTournamentFilter(state);
        const categories = GH.store.getRegularCategories(state)
            .filter(function (c) { return c.enabled !== false; });
        const levels = normalizeLevels(cachedCards);
        panelEl.innerHTML = buildHtml(ui, categories, levels);
    }

    async function open() {
        if (!panelEl) return;
        isOpen = true;
        await rebuildContent();
        panelEl.style.display = 'block';
        positionPanel();
        if (btnEl) btnEl.textContent = 'Фильтр ▲';
    }

    function close() {
        if (!panelEl) return;
        isOpen = false;
        panelEl.style.display = 'none';
        if (btnEl) btnEl.textContent = 'Фильтр ▼';
    }

    function bindOutside() {
        if (outsideBound) return;
        outsideBound = true;
        document.addEventListener('click', function (e) {
            if (!isOpen) return;
            if (panelEl && panelEl.contains(e.target)) return;
            if (btnEl && btnEl.contains(e.target)) return;
            close();
        });
    }

    function bindScroll() {
        if (scrollBound) return;
        scrollBound = true;
        window.addEventListener('scroll', schedulePosition, { passive: true });
        window.addEventListener('resize', schedulePosition, { passive: true });
    }

    async function saveFilter(patch) {
        await GH.store.setProfileTournamentFilter(patch);
    }

    async function onChange(e) {
        const t = e.target;
        const state = await GH.store.ensureLoaded();
        const cur = GH.store.getProfileTournamentFilter(state);

        if (t.classList.contains('gh-pf-enabled')) {
            await saveFilter({ enabled: t.checked });
        } else if (t.classList.contains('gh-pf-cat')) {
            const cats = Object.assign({}, cur.categories);
            cats[String(t.dataset.typeid)] = t.checked;
            await saveFilter({ categories: cats });
        } else if (t.classList.contains('gh-pf-lvl')) {
            const lvls = Object.assign({}, cur.levels);
            const lvl = decodeURIComponent(t.dataset.level);
            lvls[lvl] = t.checked;
            await saveFilter({ levels: lvls });
        } else if (t.classList.contains('gh-pf-nonreg')) {
            await saveFilter({ nonRegular: t.checked });
        } else if (t.classList.contains('gh-pf-stats')) {
            await saveFilter({ showStats: t.checked });
        }
    }

    async function onClick(e) {
        const t = e.target;
        if (!t.dataset || !t.dataset.act) return;
        const act = t.dataset.act;

        const state = await GH.store.ensureLoaded();
        const categories = GH.store.getRegularCategories(state)
            .filter(function (c) { return c.enabled !== false; });
        const levels = normalizeLevels(cachedCards);

        if (act === 'cats-all' || act === 'cats-none') {
            const cats = {};
            categories.forEach(function (c) { cats[String(c.typeid)] = (act === 'cats-all'); });
            await saveFilter({ categories: cats });
        } else if (act === 'levels-all' || act === 'levels-none') {
            const lvls = {};
            levels.forEach(function (lv) { lvls[lv] = (act === 'levels-all'); });
            await saveFilter({ levels: lvls });
        }
        await rebuildContent();
    }

    async function render(header, cards) {
        if (!header) {
            if (panelEl) close();
            if (btnEl && btnEl.parentNode) btnEl.parentNode.removeChild(btnEl);
            btnEl = null;
            cachedHeader = null;
            cachedCards = null;
            return;
        }

        cachedHeader = header;
        cachedCards = cards || [];
        btnEl = ensureButton(header);
        const panel = ensurePanel();

        if (!btnEl._ghBound) {
            btnEl._ghBound = true;
            btnEl.addEventListener('click', function (e) {
                e.stopPropagation();
                if (isOpen) close(); else open();
            });
        }
        if (!panel._ghBound) {
            panel._ghBound = true;
            panel.addEventListener('change', onChange);
            panel.addEventListener('click', onClick);
            bindOutside();
            bindScroll();
        }

        if (!panel.dataset.rendered) {
            await rebuildContent();
            panel.dataset.rendered = '1';
        }

        if (isOpen) positionPanel();
    }

    GH.profileEnhancements = GH.profileEnhancements || {};
    GH.profileEnhancements.panel = { render: render, close: close };
})();