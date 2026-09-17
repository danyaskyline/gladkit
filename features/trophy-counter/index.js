// ============================================================================
// features/trophy-counter/index.js
//
// Панель со статистикой по датам над таблицей зала трофеев.
// Состояние свёрнутости — в state.ui.trophyCounter.expanded.
//
// Иконки 1.png / 2.png лежат внутри расширения (icons/olympic/) —
// не зависим от сервера gladiators.ru. Показываются только в шапке
// таблицы, у чисел ничего не дублируется.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const PANEL_ID = 'gh-trophy-stats';
    const STATE_KEY = 'trophyCounter';

    function buildPanelHtml(rows, expanded) {
        const iconWin = chrome.runtime.getURL('icons/olympic/1.png');
        const iconFinal = chrome.runtime.getURL('icons/olympic/2.png');

        let bodyHtml;

        if (rows.length === 0) {
            bodyHtml = '<div class="gh-trophy-stats-empty">Нет данных за эту страницу</div>';
        } else {
            const rowsHtml = rows.map(function (r) {
                return '<tr>' +
                    '<td>' + GH.utils.escapeHtml(r.date) + '</td>' +
                    '<td>' + r.wins + '</td>' +
                    '<td>' + r.finals + '</td>' +
                    '</tr>';
            }).join('');

            bodyHtml =
                '<table class="gh-trophy-stats-table">' +
                    '<thead><tr>' +
                        '<th>Дата</th>' +
                        '<th><img class="gh-trophy-icon" src="' + iconWin + '" alt="Победы" title="Победы"></th>' +
                        '<th><img class="gh-trophy-icon" src="' + iconFinal + '" alt="Финалы" title="Финалы"></th>' +
                    '</tr></thead>' +
                    '<tbody>' + rowsHtml + '</tbody>' +
                '</table>';
        }

        return '' +
            '<div class="gh-trophy-stats-header">' +
                '<span class="gh-trophy-stats-title">Статистика</span>' +
                '<button type="button" class="gh-trophy-stats-toggle">' +
                    (expanded ? '▲ Свернуть' : '▼ Развернуть') +
                '</button>' +
            '</div>' +
            '<div class="gh-trophy-stats-body"' +
                (expanded ? '' : ' style="display:none;"') + '>' +
                bodyHtml +
            '</div>';
    }

    function findAnchor() {
        const container = document.querySelector('.script3 .top');
        if (!container) return null;
        return container.querySelector('h1');
    }

    async function render() {
        const table = GH.trophyCounter.parse.findStatsTable();
        if (!table) return;

        const records = GH.trophyCounter.parse.parseRows(table);
        const rows = GH.trophyCounter.parse.groupByDate(records);

        const state = await GH.store.ensureLoaded();
        const ui = GH.store.getUiState(STATE_KEY, state);
        const expanded = ui.expanded !== false;

        const anchor = findAnchor();
        if (!anchor) return;

        let panel = document.getElementById(PANEL_ID);
        if (!panel) {
            panel = document.createElement('div');
            panel.id = PANEL_ID;
            anchor.parentNode.insertBefore(panel, anchor.nextSibling);
        }

        panel.innerHTML = buildPanelHtml(rows, expanded);

        const btn = panel.querySelector('.gh-trophy-stats-toggle');
        if (btn && !btn._ghBound) {
            btn._ghBound = true;
            btn.addEventListener('click', async function () {
                const cur = GH.store.getUiState(STATE_KEY, await GH.store.ensureLoaded());
                const next = cur.expanded === false ? true : false;
                await GH.store.setUiState(STATE_KEY, { expanded: next });
                await render();
            });
        }
    }

    async function init() {
        try {
            await render();
        } catch (e) {
            console.error('[GH] trophy-counter failed:', e);
        }

        chrome.storage.onChanged.addListener(async function (changes, area) {
            if (area !== 'local') return;
            if (changes[GH.storage.STATE_KEY]) {
                GH.store.invalidate();
                try { await render(); } catch (e) {}
            }
        });
    }

    GH.features = GH.features || {};
    GH.features.trophyCounter = { init: init };
})();