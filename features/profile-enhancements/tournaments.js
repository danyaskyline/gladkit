// ============================================================================
// features/profile-enhancements/tournaments.js
//
// Логика: словарь = единственный источник правды.
//   - Имя есть в словаре И категория регулярная → «основные».
//   - Иначе → «не основные».
//
// Плюс панель прогресса коллекции под h4 — 3 колонки × 2 строки.
// Плюс иконка «?» рядом с числом в h4 с пояснением.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    const SHORT_CATEGORY_NAMES = {
        1:  'Плебейские',
        2:  'Новички',
        3:  'Сенаторские',
        7:  'Призовые',
        9:  'Императорские',
        13: 'Смешанные',
    };

    const STATS_TOOLTIP_ID = 'gh-stats-tooltip';
    const H4_TOOLTIP_ID = 'gh-h4-tooltip';
    const STATS_TOOLTIP_MAX_SHOWN = 15;

    // -------------------------------------------------------------------------
    // Тултип у h4 «Выигранные турниры».
    // -------------------------------------------------------------------------

    function getH4Tooltip() {
        let el = document.getElementById(H4_TOOLTIP_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = H4_TOOLTIP_ID;
            el.style.display = 'none';
            document.body.appendChild(el);
        }
        return el;
    }

    function showH4Tooltip(anchor) {
        const tooltip = getH4Tooltip();
        tooltip.innerHTML =
            '<div class="gh-h4-tooltip-para">' +
                '<b>Основные</b> — турниры из 6 регулярных категорий игры: ' +
                'Новички, Плебейские, Сенаторские, Призовые, Императорские, Смешанные. ' +
                'Они повторяются, у них известны уровни и типы — фильтр работает.' +
            '</div>' +
            '<div class="gh-h4-tooltip-para">' +
                '<b>Не основные</b> — всё остальное: именные, праздничные, исторические, редкие. ' +
                'Уровни и типы для них не заданы — фильтр не работает.' +
            '</div>' +
            '<div class="gh-h4-tooltip-para">' +
                '<b>Красная рамка с «?»</b> — турнир из регулярной категории, ' +
                'но его нет в словаре расширения. Возможно, новый или пропущенный. ' +
                'Он всегда виден, чтобы не потерялся.' +
            '</div>';
        tooltip.style.display = 'block';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        const aRect = anchor.getBoundingClientRect();
        const tRect = tooltip.getBoundingClientRect();
        const gap = 6;

        let left = aRect.left;
        let top = aRect.bottom + gap;

        if (left + tRect.width > window.innerWidth - 4) {
            left = window.innerWidth - tRect.width - 4;
        }
        if (left < 4) left = 4;
        if (top + tRect.height > window.innerHeight - 4) {
            top = aRect.top - tRect.height - gap;
        }
        if (top < 4) top = 4;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function hideH4Tooltip() {
        const tooltip = document.getElementById(H4_TOOLTIP_ID);
        if (tooltip) tooltip.style.display = 'none';
    }

    function attachH4Help(header) {
        if (header.querySelector('.gh-h4-help')) return;
        const span = document.createElement('span');
        span.className = 'gh-h4-help';
        span.addEventListener('mouseenter', function () { showH4Tooltip(span); });
        span.addEventListener('mouseleave', hideH4Tooltip);
        header.appendChild(span);
    }

    // -------------------------------------------------------------------------
    // Тултип панели прогресса.
    // -------------------------------------------------------------------------

    function getStatsTooltip() {
        let el = document.getElementById(STATS_TOOLTIP_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = STATS_TOOLTIP_ID;
            el.style.display = 'none';
            document.body.appendChild(el);
        }
        return el;
    }

    function showStatsTooltip(anchor, items) {
        const tooltip = getStatsTooltip();

        if (!items || items.length === 0) {
            tooltip.innerHTML = '<div class="gh-stats-tooltip-empty">Все турниры собраны</div>';
        } else {
            const shown = items.slice(0, STATS_TOOLTIP_MAX_SHOWN);
            const rest = items.length - shown.length;
            let html = '<div class="gh-stats-tooltip-title">Не собраны (' + items.length + '):</div>';
            html += '<div class="gh-stats-tooltip-list">';
            html += shown.map(function (n) {
                return '<div>' + GH.utils.escapeHtml(n) + '</div>';
            }).join('');
            if (rest > 0) {
                html += '<div class="gh-stats-tooltip-more">И другие</div>';
            }
            html += '</div>';
            tooltip.innerHTML = html;
        }

        tooltip.style.display = 'block';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        const aRect = anchor.getBoundingClientRect();
        const tRect = tooltip.getBoundingClientRect();
        const gap = 6;

        let left = aRect.left;
        let top = aRect.bottom + gap;

        if (left + tRect.width > window.innerWidth - 4) {
            left = window.innerWidth - tRect.width - 4;
        }
        if (left < 4) left = 4;
        if (top + tRect.height > window.innerHeight - 4) {
            top = aRect.top - tRect.height - gap;
        }
        if (top < 4) top = 4;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function hideStatsTooltip() {
        const tooltip = document.getElementById(STATS_TOOLTIP_ID);
        if (tooltip) tooltip.style.display = 'none';
    }

    // -------------------------------------------------------------------------
    // Разбор карточек.
    // -------------------------------------------------------------------------

    function parseTitle(title) {
        const m = String(title || '').match(/^(.*?)\s*\(([^)]+)\)\s*$/);
        if (!m) return { name: String(title || '').trim(), categoryName: null };
        return { name: m[1].trim(), categoryName: m[2].trim() };
    }

    function findCategoryByName(name, state) {
        const list = GH.store.getCategories(state);
        return list.find(function (c) { return c.name === name; }) || null;
    }

    function parseCard(td, state) {
        const rawTitle = td.getAttribute('title') || '';
        const parsed = parseTitle(rawTitle);
        const bEl = td.querySelector('b');
        const count = bEl ? parseInt(bEl.textContent.trim(), 10) : 0;

        const cat = parsed.categoryName ? findCategoryByName(parsed.categoryName, state) : null;
        const typeid = cat ? cat.typeid : null;
        const categoryRegular = cat ? cat.regular === true : false;

        let normalizedName = '';
        if (parsed.name) {
            normalizedName = GH.hallOfFameFilter.dict.normalizeName(parsed.name);
        }

        let level = null;
        let inDict = false;
        if (typeid !== null && parsed.name) {
            const rec = GH.hallOfFameFilter.dict.lookup(typeid, parsed.name);
            if (rec) {
                inDict = true;
                level = rec.level;
            }
        }

        const regular = inDict && categoryRegular;

        return {
            td: td,
            name: parsed.name,
            normalizedName: normalizedName,
            categoryName: cat ? cat.name : (parsed.categoryName || '—'),
            typeid: typeid,
            categoryRegular: categoryRegular,
            regular: regular,
            level: level,
            count: isNaN(count) ? 0 : count,
            inDict: inDict,
        };
    }

    function findWonTournamentsBlock() {
        const prefix = GH.config.site.profile.wonTournamentsHeaderPrefix;
        const headers = Array.from(document.querySelectorAll(GH.config.site.profile.selectors.blockHeader));
        const h = headers.find(function (el) {
            return el.textContent.trim().toLowerCase().indexOf(prefix) === 0;
        });
        if (!h) return null;

        if (h._ghOriginalTable && h._ghOriginalTable.parentNode) {
            return { header: h, table: h._ghOriginalTable };
        }

        let n = h.nextElementSibling;
        let safety = 0;
        while (n && safety < 20) {
            if (n.tagName === 'TABLE') {
                h._ghOriginalTable = n;
                return { header: h, table: n };
            }
            const inner = n.querySelector && n.querySelector('table');
            if (inner) {
                h._ghOriginalTable = inner;
                return { header: h, table: inner };
            }
            n = n.nextElementSibling;
            safety++;
        }
        return null;
    }

    function collectCardTds(table) {
        return Array.from(table.querySelectorAll('td[title][background]'));
    }

    function chunk(arr, size) {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    }

    function buildTable(tds) {
        const table = document.createElement('table');
        table.setAttribute('cellpadding', '0');
        table.setAttribute('cellspacing', '4');
        table.setAttribute('border', '0');
        const tbody = document.createElement('tbody');
        chunk(tds, 5).forEach(function (row) {
            const tr = document.createElement('tr');
            row.forEach(function (td) { tr.appendChild(td); });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
    }

    function rebuildTable(table, tds) {
        if (!table) return;
        let tbody = table.querySelector('tbody');
        if (!tbody) {
            tbody = document.createElement('tbody');
            table.appendChild(tbody);
        }
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        chunk(tds, 5).forEach(function (row) {
            const tr = document.createElement('tr');
            row.forEach(function (td) { tr.appendChild(td); });
            tbody.appendChild(tr);
        });
    }

    function buildSubheader(text) {
        const h5 = document.createElement('h5');
        h5.className = 'gh-profile-subheader';
        h5.textContent = text;
        return h5;
    }

    function formatCounter(n) { return n.toLocaleString('ru-RU'); }

    function isCardVisible(card, filter) {
        if (filter.enabled === false) return true;
        if (!card.regular) return filter.nonRegular !== false;
        const catOn = filter.categories[String(card.typeid)] !== false;
        if (!catOn) return false;
        if (card.level !== null) {
            return filter.levels[card.level] !== false;
        }
        return true;
    }

    function applyHighlight(cards, highlightCfg) {
        cards.forEach(function (c) {
            const needs = c.categoryRegular === true && c.inDict === false;
            if (needs) GH.profileEnhancements.highlight.apply(c, highlightCfg);
            else GH.profileEnhancements.highlight.clear(c);
        });
    }

    // -------------------------------------------------------------------------
    // Панель прогресса коллекции.
    //   Строка 1: Новички / Императорские / Смешанные
    //   Строка 2: Плебейские / Сенаторские / Призовые
    // -------------------------------------------------------------------------

    const STATS_LAYOUT = [
        [2, 9, 13],
        [1, 3, 7]
    ];

    function computeStats(cards, dict, state) {
        const regCats = GH.store.getRegularCategories(state);

        const dictNames = {};
        const catNames = {};
        regCats.forEach(function (c) {
            dictNames[c.typeid] = new Set();
            catNames[c.typeid] = c.name;
        });

        (dict || []).forEach(function (r) {
            if (!r || typeof r !== 'object' || Array.isArray(r)) return;
            if (!dictNames[r.typeid]) return;
            if (!r.name) return;
            dictNames[r.typeid].add(r.name);
        });

        const playerSets = {};
        regCats.forEach(function (c) {
            playerSets[c.typeid] = new Set();
        });

        const totalUniqueAllSet = new Set();

        (cards || []).forEach(function (c) {
            if (c.normalizedName) totalUniqueAllSet.add(c.normalizedName);
            if (!c.categoryRegular) return;
            if (!c.inDict) return;
            if (!c.normalizedName) return;
            if (!playerSets[c.typeid]) return;
            playerSets[c.typeid].add(c.normalizedName);
        });

        const byTypeid = {};
        regCats.forEach(function (c) {
            const playerSet = playerSets[c.typeid];
            const dictSet = dictNames[c.typeid];
            const missing = [];
            dictSet.forEach(function (name) {
                if (!playerSet.has(name)) missing.push(name);
            });
            missing.sort();

            byTypeid[c.typeid] = {
                player: playerSet.size,
                dict: dictSet.size,
                missing: missing,
                name: catNames[c.typeid],
            };
        });

        const totalUniqueRegularSet = new Set();
        (cards || []).forEach(function (c) {
            if (!c.categoryRegular) return;
            if (!c.inDict) return;
            if (!c.normalizedName) return;
            totalUniqueRegularSet.add(c.typeid + '|' + c.normalizedName);
        });

        let dictTotal = 0;
        regCats.forEach(function (c) { dictTotal += dictNames[c.typeid].size; });

        return {
            byTypeid: byTypeid,
            totalUniqueRegular: totalUniqueRegularSet.size,
            totalUniqueAll: totalUniqueAllSet.size,
            dictTotal: dictTotal,
        };
    }

    function updateStatsPanel(panel, stats) {
        const row1 = STATS_LAYOUT[0];
        const row2 = STATS_LAYOUT[1];

        function cellHtml(tid) {
            const info = stats.byTypeid[tid];
            if (!info) return '<div class="gh-stats-cell"></div>';
            const catName = SHORT_CATEGORY_NAMES[tid] || info.name || ('Кат. ' + tid);
            const player = info.player;
            const dict = info.dict;
            const cls = (dict > 0 && player >= dict) ? ' gh-stats-done' : '';
            return '<div class="gh-stats-cell' + cls + '">' +
                '<span class="gh-stats-name">' + GH.utils.escapeHtml(catName) + '</span>' +
                '<span class="gh-stats-value">' +
                    '<b>' + player + '</b> / ' + dict +
                    '<span class="gh-stats-help" data-typeid="' + tid + '">?</span>' +
                '</span>' +
                '</div>';
        }

        const html =
            '<div class="gh-stats-summary">' +
                'Уникальных основных турниров: <b>' + stats.totalUniqueRegular + '</b> из <b>' + stats.dictTotal + '</b>' +
                ' &middot; Уникальных турниров: <b>' + formatCounter(stats.totalUniqueAll) + '</b>' +
            '</div>' +
            '<div class="gh-stats-grid">' +
                row1.map(cellHtml).join('') +
                row2.map(cellHtml).join('') +
            '</div>';

        panel.innerHTML = html;

        panel.querySelectorAll('.gh-stats-help').forEach(function (help) {
            const tid = parseInt(help.dataset.typeid, 10);
            const info = stats.byTypeid[tid];
            const missing = info ? info.missing : [];
            help.addEventListener('mouseenter', function () {
                showStatsTooltip(help, missing);
            });
            help.addEventListener('mouseleave', function () {
                hideStatsTooltip();
            });
        });
    }

    function buildStatsPanel() {
        const el = document.createElement('div');
        el.className = 'gh-profile-stats';
        return el;
    }

    function isBlockHiddenByToggle(header) {
        const input = header.querySelector('.gh-block-toggle input');
        if (!input) return false;
        return !input.checked;
    }

    async function reapply() {
        const block = findWonTournamentsBlock();
        if (!block || !block.header._ghCards) return;

        const state = await GH.store.ensureLoaded();
        const filter = GH.store.getProfileTournamentFilter(state);
        const highlightCfg = GH.store.getProfileTournamentHighlight(state);
        const cards = block.header._ghCards;

        const sx = window.scrollX;
        const sy = window.scrollY;

        const visibleRegularTds = [];
        const visibleNonRegularTds = [];

        cards.forEach(function (c) {
            if (isCardVisible(c, filter)) {
                if (c.regular) visibleRegularTds.push(c.td);
                else visibleNonRegularTds.push(c.td);
            }
        });

        rebuildTable(block.header._ghTableRegular, visibleRegularTds);
        rebuildTable(block.header._ghTableNonRegular, visibleNonRegularTds);

        applyHighlight(cards, highlightCfg);

        const blockHidden = isBlockHiddenByToggle(block.header);
        if (!blockHidden) {
            if (block.header._ghTableRegular) {
                block.header._ghTableRegular.style.display = visibleRegularTds.length > 0 ? '' : 'none';
            }
            if (block.header._ghTableNonRegular) {
                block.header._ghTableNonRegular.style.display = visibleNonRegularTds.length > 0 ? '' : 'none';
            }
        }

        const regCount = cards.reduce(function (s, c) { return c.regular ? s + c.count : s; }, 0);
        const nonRegCount = cards.reduce(function (s, c) { return !c.regular ? s + c.count : s; }, 0);
        if (block.header._ghH5Regular) {
            block.header._ghH5Regular.textContent =
                GH.config.site.profile.texts.subheaderRegular + ' (' + formatCounter(regCount) + ')';
        }
        if (block.header._ghH5NonRegular) {
            block.header._ghH5NonRegular.textContent =
                GH.config.site.profile.texts.subheaderNonRegular + ' (' + formatCounter(nonRegCount) + ')';
        }

        if (block.header._ghStatsPanel) {
            if (filter.showStats !== false) {
                const dictArr = await GH.storage.ensureDictLoaded();
                const stats = computeStats(cards, dictArr, state);
                updateStatsPanel(block.header._ghStatsPanel, stats);
                block.header._ghStatsPanel.style.display = '';
            } else {
                block.header._ghStatsPanel.style.display = 'none';
            }
        }

        window.scrollTo(sx, sy);
    }

    async function apply() {
        const block = findWonTournamentsBlock();
        if (!block) return;

        if (block.header._ghCards && block.header._ghTableRegular && block.header._ghTableNonRegular) {
            await reapply();
            attachH4Help(block.header);
            return;
        }

        const state = await GH.store.ensureLoaded();
        const dictArr = await GH.storage.ensureDictLoaded();
        GH.hallOfFameFilter.dict.setIndex(dictArr);

        block.table.classList.add('gh-profile-original-table');

        if (block.header._ghSplitNodes) {
            block.header._ghSplitNodes.forEach(function (el) {
                if (el && el.parentNode) el.parentNode.removeChild(el);
            });
            block.header._ghSplitNodes = null;
        }

        const sourceTable = block.table.cloneNode(true);
        const tds = collectCardTds(sourceTable);
        if (tds.length === 0) return;

        const cards = tds.map(function (td) { return parseCard(td, state); });

        const statsPanel = buildStatsPanel();
        const h5Regular = buildSubheader(GH.config.site.profile.texts.subheaderRegular + ' (0)');
        const h5NonRegular = buildSubheader(GH.config.site.profile.texts.subheaderNonRegular + ' (0)');
        const tableRegular = buildTable([]);
        const tableNonRegular = buildTable([]);
        tableRegular.classList.add('gh-profile-tournaments-regular');
        tableNonRegular.classList.add('gh-profile-tournaments-nonregular');

        const parent = block.table.parentNode;
        parent.insertBefore(statsPanel, block.table);
        parent.insertBefore(h5Regular, block.table);
        parent.insertBefore(tableRegular, block.table);
        parent.insertBefore(h5NonRegular, block.table);
        parent.insertBefore(tableNonRegular, block.table);

        block.header._ghSplitNodes = [statsPanel, h5Regular, tableRegular, h5NonRegular, tableNonRegular];
        block.header._ghStatsPanel = statsPanel;
        block.header._ghCards = cards;
        block.header._ghH5Regular = h5Regular;
        block.header._ghTableRegular = tableRegular;
        block.header._ghH5NonRegular = h5NonRegular;
        block.header._ghTableNonRegular = tableNonRegular;

        attachH4Help(block.header);

        await reapply();
    }

    GH.profileEnhancements = GH.profileEnhancements || {};
    GH.profileEnhancements.tournaments = {
        apply: apply,
        reapply: reapply,
        findWonTournamentsBlock: findWonTournamentsBlock,
        collectCardTds: collectCardTds,
        parseCard: parseCard,
    };
})();