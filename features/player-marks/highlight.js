// ============================================================================
// features/player-marks/highlight.js
//
// Применение цвета и тултипа к нику.
//
// Красим ТОЛЬКО текст имени — иконки и хвост уровня [11] не затрагиваются.
// Для этого при первом apply находим текстовый узел с именем и оборачиваем
// его в <span class="gh-pm-name">. Дальше красим только этот span.
//
// На время показа нашего тултипа прячем родной title ссылки.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const TOOLTIP_ID = 'gh-player-mark-tooltip';
    const APPLIED_ATTR = 'data-gh-mark-color';
    const ORIG_TITLE_ATTR = 'data-gh-mark-orig-title';

    // Ищем текстовый узел с буквами (это имя) и оборачиваем в span.
    // Хвост уровня отделяем: пробелы + [цифры/дефисы] в конце.
    function wrapNameText(link) {
        if (link.querySelector('.gh-pm-name')) return;

        const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, null);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        for (const node of textNodes) {
            const text = node.textContent || '';
            if (!/[a-zA-Zа-яА-Я]/.test(text)) continue;

            // Ведущие пробелы оставляем вне span.
            const stripped = text.replace(/^\s+/, '');
            const leadingWs = text.slice(0, text.length - stripped.length);

            // Отделяем хвост уровня: " [11]", " [11-12]" и т. п.
            let name = stripped;
            let suffix = '';
            const m = stripped.match(/^([\s\S]*?)(\s+\[[\d\s\-]+\]\s*)$/);
            if (m && m[1].trim()) {
                name = m[1];
                suffix = m[2];
            }

            if (!name.trim()) continue;

            const parent = node.parentNode;

            if (leadingWs) {
                parent.insertBefore(document.createTextNode(leadingWs), node);
            }

            const span = document.createElement('span');
            span.className = 'gh-pm-name';
            span.textContent = name;
            parent.insertBefore(span, node);

            if (suffix) {
                parent.insertBefore(document.createTextNode(suffix), node);
            }

            parent.removeChild(node);
            return; // обрабатываем только первый подходящий узел
        }
    }

    function getTooltip() {
        let el = document.getElementById(TOOLTIP_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = TOOLTIP_ID;
            el.style.display = 'none';
            document.body.appendChild(el);
        }
        return el;
    }

    function showTooltip(anchor, note) {
        const tooltip = getTooltip();
        tooltip.innerHTML =
            '<div class="gh-pm-tooltip-title">Заметка</div>' +
            '<div class="gh-pm-tooltip-note">' + GH.utils.escapeHtml(note) + '</div>';
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

    function hideTooltip() {
        const el = document.getElementById(TOOLTIP_ID);
        if (el) el.style.display = 'none';
    }

    function suppressTitle(link) {
        if (link.hasAttribute('title') && !link.hasAttribute(ORIG_TITLE_ATTR)) {
            link.setAttribute(ORIG_TITLE_ATTR, link.getAttribute('title'));
            link.removeAttribute('title');
        }
    }

    function restoreTitle(link) {
        if (link.hasAttribute(ORIG_TITLE_ATTR)) {
            link.setAttribute('title', link.getAttribute(ORIG_TITLE_ATTR));
            link.removeAttribute(ORIG_TITLE_ATTR);
        }
    }

    function apply(link, mark) {
        if (!mark) return;

        wrapNameText(link);

        if (mark.color) {
            const nameSpan = link.querySelector('.gh-pm-name');
            if (nameSpan) {
                nameSpan.style.color = mark.color;
            } else {
                // Не удалось выделить имя — красим как раньше всю ссылку.
                link.style.color = mark.color;
            }
            link.setAttribute(APPLIED_ATTR, mark.color);
        }

        if (mark.note) {
            link.addEventListener('mouseenter', function () {
                suppressTitle(link);
                showTooltip(link, mark.note);
            });
            link.addEventListener('mouseleave', function () {
                restoreTitle(link);
                hideTooltip();
            });
        }
    }

    function clear(link) {
        if (link.hasAttribute(APPLIED_ATTR)) {
            const nameSpan = link.querySelector('.gh-pm-name');
            if (nameSpan) nameSpan.style.color = '';
            link.style.color = '';
            link.removeAttribute(APPLIED_ATTR);
        }
        restoreTitle(link);
    }

    GH.playerMarks = GH.playerMarks || {};
    GH.playerMarks.highlight = {
        apply: apply,
        clear: clear,
        hideTooltip: hideTooltip,
    };
})();