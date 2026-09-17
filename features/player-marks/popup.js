// ============================================================================
// features/player-marks/popup.js
//
// Попап-форма для редактирования метки игрока.
// Клики по цветам только выделяют кружок, без сохранения.
// Список кружков: сначала текущий + использованные, потом 5 дефолтных.
// Максимум 8 кружков. Всё пишется в storage при «Сохранить».
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const POPUP_ID = 'gh-player-mark-popup';
    const MAX_COLORS = 8;

    let popupEl = null;
    let currentUserId = null;
    let currentName = '';
    let selectedColor = '';
    let initialNote = '';
    let outsideBound = false;
    let openedAt = 0;

    function ensurePopup() {
        if (popupEl) return popupEl;
        popupEl = document.createElement('div');
        popupEl.id = POPUP_ID;
        popupEl.style.display = 'none';
        document.body.appendChild(popupEl);
        return popupEl;
    }

    function buildColorList(state, currentColor) {
        const marks = state.playerMarks || {};
        const cfg = GH.config.site.playerMarks;
        const seen = new Set();
        const list = [];

        const cur = (currentColor || '').toLowerCase();

        if (cur) {
            seen.add(cur);
            list.push(currentColor);
        }

        for (const key of Object.keys(marks)) {
            if (list.length >= MAX_COLORS) break;
            const m = marks[key];
            if (!m || !m.color) continue;
            const lc = String(m.color).toLowerCase();
            if (seen.has(lc)) continue;
            seen.add(lc);
            list.push(m.color);
        }

        const defaults = cfg.defaultColors || [];
        for (const c of defaults) {
            if (list.length >= MAX_COLORS) break;
            const lc = String(c).toLowerCase();
            if (seen.has(lc)) continue;
            seen.add(lc);
            list.push(c);
        }

        return list;
    }

    function colorButtonsHtml(colors, current) {
        return colors.map(function (c) {
            const selected = (current || '').toLowerCase() === c.toLowerCase()
                ? ' gh-pm-color-btn-selected' : '';
            return '<button type="button" class="gh-pm-color-btn' + selected +
                '" data-color="' + c + '" style="background:' + c + ';"></button>';
        }).join('');
    }

    function updateColorSelection() {
        popupEl.querySelectorAll('.gh-pm-color-btn').forEach(function (b) {
            const c = b.dataset.color.toLowerCase();
            b.classList.toggle('gh-pm-color-btn-selected', c === selectedColor.toLowerCase());
        });
        const picker = popupEl.querySelector('.gh-pm-color-input');
        if (picker) picker.value = selectedColor || '#0400ff';
    }

    function render(state) {
        const colors = buildColorList(state, selectedColor);
        if (!selectedColor && colors.length > 0) {
            selectedColor = colors[0];
        }

        popupEl.innerHTML =
            '<div class="gh-pm-header">' +
                GH.utils.escapeHtml(currentName || ('Игрок ' + currentUserId)) +
            '</div>' +
            '<div class="gh-pm-colors">' +
                colorButtonsHtml(colors, selectedColor) +
            '</div>' +
            '<div class="gh-pm-color-picker">' +
                '<label>Свой цвет:</label>' +
                '<input type="color" class="gh-pm-color-input" value="' +
                    (selectedColor || '#0400ff') + '">' +
            '</div>' +
            '<textarea class="gh-pm-textarea" maxlength="' +
                GH.config.site.playerMarks.noteMaxLength +
                '" placeholder="Заметка (необязательно)">' +
                GH.utils.escapeHtml(initialNote) +
            '</textarea>' +
            '<div class="gh-pm-buttons">' +
                '<button type="button" class="gh-pm-btn gh-pm-btn-clear">Очистить</button>' +
                '<button type="button" class="gh-pm-btn gh-pm-btn-save">Сохранить</button>' +
            '</div>';

        popupEl.querySelectorAll('.gh-pm-color-btn').forEach(function (b) {
            b.addEventListener('click', function () {
                selectedColor = b.dataset.color;
                updateColorSelection();
            });
        });

        const picker = popupEl.querySelector('.gh-pm-color-input');
        picker.addEventListener('input', function () {
            selectedColor = picker.value;
            updateColorSelection();
        });
        picker.addEventListener('change', function () {
            selectedColor = picker.value;
            updateColorSelection();
        });

        popupEl.querySelector('.gh-pm-btn-save').addEventListener('click', async function () {
            const ta = popupEl.querySelector('.gh-pm-textarea');
            const note = ta ? ta.value.trim() : '';
            await save({ color: selectedColor, note: note });
            close();
        });

        popupEl.querySelector('.gh-pm-btn-clear').addEventListener('click', async function () {
            if (!confirm('Удалить метку для этого игрока?')) return;
            await GH.store.removePlayerMark(currentUserId);
            close();
        });
    }

    async function save(patch) {
        const state = await GH.store.ensureLoaded();
        const cur = GH.store.getPlayerMark(currentUserId, state) || {};
        const next = Object.assign({}, cur, patch);
        next.lastSeenName = currentName || cur.lastSeenName || '';
        await GH.store.setPlayerMark(currentUserId, next);
    }

    function position(anchor) {
        if (!popupEl || !anchor) return;
        popupEl.style.left = '0px';
        popupEl.style.top = '0px';

        requestAnimationFrame(function () {
            const aRect = anchor.getBoundingClientRect();
            const pRect = popupEl.getBoundingClientRect();
            const gap = 6;
            const margin = 6;

            let left = aRect.left;
            let top = aRect.bottom + gap;

            if (left + pRect.width > window.innerWidth - margin) {
                left = window.innerWidth - pRect.width - margin;
            }
            if (left < margin) left = margin;

            if (top + pRect.height > window.innerHeight - margin) {
                top = aRect.top - pRect.height - gap;
            }
            if (top < margin) top = margin;

            popupEl.style.left = left + 'px';
            popupEl.style.top = top + 'px';
        });
    }

    function bindOutside() {
        if (outsideBound) return;
        outsideBound = true;

        document.addEventListener('mousedown', function (e) {
            if (!popupEl || popupEl.style.display === 'none') return;
            if (Date.now() - openedAt < 150) return;
            if (popupEl.contains(e.target)) return;
            if (e.target.closest && e.target.closest('.gh-pm-header-btn')) return;
            close();
        }, true);

        window.addEventListener('resize', function () {
            if (popupEl && popupEl.style.display !== 'none' && popupEl._anchor) {
                position(popupEl._anchor);
            }
        });
    }

    async function open(userId, name, anchor) {
        ensurePopup();
        bindOutside();
        currentUserId = userId;
        currentName = name || '';
        openedAt = Date.now();

        const state = await GH.store.ensureLoaded();
        const mark = GH.store.getPlayerMark(userId, state);

        selectedColor = (mark && mark.color) || '';
        initialNote = (mark && mark.note) || '';

        render(state);
        popupEl._anchor = anchor;
        popupEl.style.display = 'block';
        position(anchor);
    }

    function close() {
        if (!popupEl) return;
        popupEl.style.display = 'none';
        currentUserId = null;
        currentName = '';
        selectedColor = '';
        initialNote = '';
        popupEl._anchor = null;
    }

    GH.playerMarks = GH.playerMarks || {};
    GH.playerMarks.popup = { open: open, close: close };
})();