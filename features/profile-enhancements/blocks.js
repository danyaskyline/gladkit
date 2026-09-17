// ============================================================================
// features/profile-enhancements/blocks.js
//
// Блоки наград = <h4> + содержимое до следующего <h4>.
//
// Обход идёт в порядке документа (вглубь), а не по nextElementSibling —
// это работает, когда <h4> лежат внутри <li> и между ними нет прямого соседства.
//
// Стоп-правила при обходе:
//   - дошли до следующего <h4>
//   - встретили элемент, содержащий следующий <h4> внутри
//   - встретили элемент со стоп-текстом из config.site.profile.blockStopTexts
//   - вышли за пределы общего предка
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const HEADER_CLASS = 'gh-block-header';
    const TOGGLE_CLASS = 'gh-block-toggle';

    function normalizeTitle(t) {
        return String(t || '')
            .toLowerCase()
            .replace(/\s*\([^)]*\)\s*$/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function isProtected(el) {
        const cfg = GH.config.site.profile;
        const list = cfg.protectedTexts || [];
        if (list.length === 0) return false;
        const check = (node) => {
            const text = (node.textContent || '').trim().toLowerCase();
            return list.indexOf(text) !== -1;
        };
        if (check(el)) return true;
        for (const child of el.querySelectorAll('*')) {
            if (check(child)) return true;
        }
        return false;
    }

    function hasStopText(el) {
        const cfg = GH.config.site.profile;
        const list = cfg.blockStopTexts || [];
        if (list.length === 0) return false;
        const text = (el.textContent || '').toLowerCase();
        return list.some((t) => text.indexOf(t) !== -1);
    }

    function nextInDoc(node) {
        if (node.firstElementChild) return node.firstElementChild;
        let n = node;
        while (n) {
            if (n.nextElementSibling) return n.nextElementSibling;
            n = n.parentElement;
        }
        return null;
    }

    function commonAncestor(a, b) {
        if (!b) return null;
        const set = new Set();
        let n = a;
        while (n) { set.add(n); n = n.parentElement; }
        n = b;
        while (n) {
            if (set.has(n)) return n;
            n = n.parentElement;
        }
        return null;
    }

    function collectNodesBetween(h4, nextH) {
        const boundary = commonAncestor(h4, nextH);
        const nodes = [];
        let node = h4;
        let safety = 0;

        while (safety < 5000) {
            node = nextInDoc(node);
            if (!node) break;

            if (boundary && !boundary.contains(node)) break;
            if (node === nextH) break;
            if (nextH && node.contains(nextH)) break;

            // Если попался ещё один <h4> — стоп (значит, начался следующий блок).
            if (node.tagName === 'H4') break;

            // Стоп-тексты (инфраструктура и т.п.).
            if (hasStopText(node)) break;

            let skip = false;
            for (const el of nodes) {
                if (el.contains(node)) { skip = true; break; }
            }
            if (!skip && !isProtected(node)) nodes.push(node);

            safety++;
        }
        return nodes;
    }

    function collectBlocks(allowedTitles) {
        const headerSel = GH.config.site.profile.selectors.blockHeader;
        const rightPanelSel = GH.config.site.profile.selectors.rightPanel;

        const headers = Array.from(document.querySelectorAll(headerSel))
            .filter((h) => !h.closest(rightPanelSel))
            .filter((h) => !h.closest('form'));

        const blocks = [];
        headers.forEach((h, i) => {
            const title = h.textContent.trim();
            const key = normalizeTitle(title);
            if (allowedTitles.indexOf(key) === -1) return;

            const nextH = headers[i + 1] || null;
            const content = collectNodesBetween(h, nextH);
            if (content.length === 0) return;

            blocks.push({ header: h, content, title, key });
        });
        return blocks;
    }

    function buildToggle(checked, onChange) {
        const label = document.createElement('label');
        label.className = TOGGLE_CLASS + ' gh-switch';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        const slider = document.createElement('span');
        slider.className = 'gh-slider';
        label.appendChild(input);
        label.appendChild(slider);
        input.addEventListener('change', () => onChange(input.checked));
        return label;
    }

    function applyBlockState(block, hidden) {
        block.content.forEach((el) => {
            el.style.display = hidden ? 'none' : '';
        });
    }

    function attachToggles(blocks, hiddenMap, onToggle) {
        blocks.forEach((block) => {
            // Если тумблер уже был — снимаем и вешаем заново.
            // Это нужно, потому что tournaments.apply() каждый раз
            // пересобирает содержимое блока заново, и старый тумблер
            // ссылался бы на уже удалённые узлы.
            const old = block.header.querySelector('.' + TOGGLE_CLASS);
            if (old) old.remove();

            block.header.classList.add(HEADER_CLASS);
            const hidden = hiddenMap[block.key] === true;
            const toggle = buildToggle(!hidden, (checked) => {
                const nowHidden = !checked;
                applyBlockState(block, nowHidden);
                onToggle(block.key, nowHidden);
            });
            block.header.appendChild(toggle);
            applyBlockState(block, hidden);
        });
    }

    GH.profileEnhancements = GH.profileEnhancements || {};
    GH.profileEnhancements.blocks = { collectBlocks, attachToggles, normalizeTitle };
})();