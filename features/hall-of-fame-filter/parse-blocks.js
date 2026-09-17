// ============================================================================
// features/hall-of-fame-filter/parse-blocks.js
//
// Разбор DOM зала славы в список блоков.
//
// <h2 id="typeidN"> встречается у первого блока каждой категории.
// Мы вынимаем его из <b> в отдельный <tr class="gh-category-row">, чтобы
// engine мог управлять его видимостью отдельно от самого блока.
// Так заголовок категории виден, пока в категории есть хоть один видимый
// блок, даже если первый блок скрыт фильтром.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function getContainer() {
        const sel = GH.config.site.hallOfFame.selectors.container;
        return document.querySelector(sel);
    }

    // Прямые дети <tr> — только <td>, не влезаем во вложенные таблицы.
    function getDirectTds(tr) {
        const out = [];
        for (const child of tr.children) {
            if (child.tagName === 'TD') out.push(child);
        }
        return out;
    }

    function extractTournamentName(cell) {
        const b = cell.querySelector('b');
        if (!b) return '';
        const clone = b.cloneNode(true);
        const h2 = clone.querySelector('h2');
        if (h2) h2.remove();
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function parseBlocks() {
        const table = getContainer();
        if (!table) return [];

        const tbody = table.querySelector('tbody') || table;
        const rows = Array.from(tbody.children).filter((el) => el.tagName === 'TR');

        const blocks = [];
        let currentTypeid = null;
        let currentCategoryRow = null;
        let pendingHeader = null;

        for (const tr of rows) {
            const cells = getDirectTds(tr);

            if (cells.length === 1 && cells[0].getAttribute('colspan') === '2') {
                // Первый блок категории содержит <h2 id="typeidN">.
                // Вынимаем его в отдельный <tr> перед этой строкой.
                const h2 = cells[0].querySelector('h2[id^="typeid"]');
                if (h2) {
                    const m = h2.id.match(/^typeid(\d+)$/);
                    if (m) currentTypeid = parseInt(m[1], 10);

                    const catTr = document.createElement('tr');
                    catTr.className = 'gh-category-row';
                    const catTd = document.createElement('td');
                    catTd.setAttribute('colspan', '2');
                    catTd.appendChild(h2); // перемещаем h2 из старого места
                    catTr.appendChild(catTd);
                    tr.parentNode.insertBefore(catTr, tr);
                    currentCategoryRow = catTr;
                }

                const name = extractTournamentName(cells[0]);
                if (name) {
                    pendingHeader = {
                        tr: tr,
                        name: name,
                        typeid: currentTypeid,
                        categoryRow: currentCategoryRow,
                    };
                }
                continue;
            }

            if (cells.length === 2 && pendingHeader) {
                blocks.push({
                    typeid: pendingHeader.typeid,
                    tournament: pendingHeader.name,
                    header: pendingHeader.tr,
                    content: tr,
                    categoryRow: pendingHeader.categoryRow,
                });
                pendingHeader = null;
            }
        }

        return blocks;
    }

    GH.hallOfFameFilter = GH.hallOfFameFilter || {};
    GH.hallOfFameFilter.parseBlocks = parseBlocks;
    GH.hallOfFameFilter.getContainer = getContainer;
})();