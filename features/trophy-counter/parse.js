// ============================================================================
// features/trophy-counter/parse.js
//
// Разбор таблицы зала трофеев.
//
// Структура строки:
//   <tr>
//     <td><nobr>17.09.2026</nobr></td>
//     <td><a>Турнир Фонса-CMLXVIII</a></td>
//     <td><img src="/images/status/4.gif"> победитель</td>
//   </tr>
//
// Считаем только два результата: «победитель» и «финалист».
// Всё остальное (и, вероятно, несуществующее) — игнор.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    function findStatsTable() {
        const container = document.querySelector('.script3');
        if (!container) return null;
        return container.querySelector('table.maintable');
    }

    function parseRows(table) {
        if (!table) return [];
        const rows = Array.from(table.querySelectorAll('tr'));
        const out = [];

        for (const tr of rows) {
            const tds = Array.from(tr.children).filter(function (el) {
                return el.tagName === 'TD';
            });
            if (tds.length !== 3) continue; // пропускаем header и footer

            const nobr = tds[0].querySelector('nobr');
            if (!nobr) continue;
            const date = nobr.textContent.trim();
            if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) continue;

            const resultText = tds[2].textContent.trim().toLowerCase();
            let result = null;
            if (resultText.indexOf('победитель') !== -1) result = 'win';
            else if (resultText.indexOf('финалист') !== -1) result = 'final';
            else continue;

            out.push({ date: date, result: result });
        }

        return out;
    }

    function groupByDate(records) {
        const map = new Map();
        for (const r of records) {
            if (!map.has(r.date)) {
                map.set(r.date, { date: r.date, wins: 0, finals: 0 });
            }
            const entry = map.get(r.date);
            if (r.result === 'win') entry.wins++;
            else if (r.result === 'final') entry.finals++;
        }
        return Array.from(map.values());
    }

    GH.trophyCounter = GH.trophyCounter || {};
    GH.trophyCounter.parse = {
        findStatsTable: findStatsTable,
        parseRows: parseRows,
        groupByDate: groupByDate,
    };
})();