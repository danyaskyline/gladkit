// ============================================================================
// features/tournament-filter/highlight.js
//
// Подсветка карточек, которых нет в словаре.
//
// - inset box-shadow — не сдвигает вёрстку.
// - Иконка «?» в левом нижнем углу первой <td>.
// - Тултип — глобальный элемент, показывается при наведении на иконку.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    const TOOLTIP_ID = 'gh-global-tooltip';
    const BADGE_CLASS = 'gh-unknown-badge';

    function hexToRgb(hex) {
        const m = String(hex).match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (!m) return null;
        return {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16),
        };
    }

    function mixWithWhite(rgb, whiteRatio) {
        return {
            r: Math.round(rgb.r * (1 - whiteRatio) + 255 * whiteRatio),
            g: Math.round(rgb.g * (1 - whiteRatio) + 255 * whiteRatio),
            b: Math.round(rgb.b * (1 - whiteRatio) + 255 * whiteRatio),
        };
    }

    function deriveColors(baseHex) {
        const rgb = hexToRgb(baseHex) || { r: 214, g: 58, b: 46 };
        const bg = mixWithWhite(rgb, 0.92);
        return {
            bg: 'rgb(' + bg.r + ', ' + bg.g + ', ' + bg.b + ')',
            border: 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')',
            title: 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')',
        };
    }

    function getGlobalTooltip() {
        let el = document.getElementById(TOOLTIP_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = TOOLTIP_ID;
            el.style.display = 'none';
            document.body.appendChild(el);
        }
        return el;
    }

    function buildTooltipContent(info, colors) {
        const parts = [];
        parts.push('<div class="gh-tooltip-title" style="color:' + colors.title + ';">' +
            '⚠ Турнир не найден в словаре</div>');

        if (info && info.name) {
            parts.push('<div class="gh-tooltip-item"><b>Турнир:</b> «' +
                GH.utils.escapeHtml(info.name) + '»</div>');
        }

        parts.push('<div class="gh-tooltip-item" style="color:#777;">' +
            'Возможно, новый турнир. Добавьте его в словарь через менеджер.</div>');

        return parts.join('');
    }

    function showTooltip(badgeEl, info, colors) {
        const tooltip = getGlobalTooltip();
        tooltip.innerHTML = buildTooltipContent(info, colors);
        tooltip.style.background = colors.bg;
        tooltip.style.borderColor = colors.border;
        tooltip.style.display = 'block';

        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        const badgeRect = badgeEl.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const gap = 8;

        let left = badgeRect.left - tooltipRect.width - gap;
        let top = badgeRect.top;

        if (left < 4) left = badgeRect.right + gap;
        if (left + tooltipRect.width > window.innerWidth - 4) {
            left = window.innerWidth - tooltipRect.width - 4;
        }
        if (top < 4) top = 4;
        if (top + tooltipRect.height > window.innerHeight - 4) {
            top = window.innerHeight - tooltipRect.height - 4;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function hideTooltip() {
        const tooltip = document.getElementById(TOOLTIP_ID);
        if (tooltip) tooltip.style.display = 'none';
    }

    function removeBadge(card) {
        const b = card.querySelector('.' + BADGE_CLASS);
        if (b) b.remove();
    }

    function attachBadge(card, info, colors) {
        removeBadge(card);

        const firstTd = card.querySelector('td');
        if (!firstTd) return;

        if (getComputedStyle(firstTd).position === 'static') {
            firstTd.style.position = 'relative';
        }

        const badge = document.createElement('div');
        badge.className = BADGE_CLASS;
        badge.textContent = '?';

        badge.addEventListener('mouseenter', function () {
            showTooltip(badge, info, colors);
        });
        badge.addEventListener('mouseleave', function () {
            hideTooltip();
        });

        firstTd.appendChild(badge);
    }

    function applyUnknown(card, cfg, info) {
        if (!cfg || cfg.enabled === false) {
            clearUnknown(card);
            return;
        }

        card.classList.add('gh-unknown');
        card.style.boxShadow = '0 0 0 ' + cfg.width + 'px ' + cfg.color;

        const colors = deriveColors(cfg.color);
        attachBadge(card, info || {}, colors);
    }

    function clearUnknown(card) {
        card.classList.remove('gh-unknown');
        card.style.boxShadow = '';
        removeBadge(card);
        hideTooltip();
    }

    GH.tournamentFilter = GH.tournamentFilter || {};
    GH.tournamentFilter.highlight = { applyUnknown: applyUnknown, clearUnknown: clearUnknown };
})();