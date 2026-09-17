// ============================================================================
// features/profile-enhancements/highlight.js
//
// Родной title НЕ трогаем — браузерный тултип игры работает на всей
// карточке. Наш «?» при наведении ВРЕМЕННО прячет title, чтобы поверх
// нашего тултипа не вылез родной, и возвращает обратно при уходе мыши.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    const TOOLTIP_ID = 'gh-profile-tooltip';
    const BADGE_CLASS = 'gh-profile-badge';
    const HIGHLIGHT_ATTR = 'data-gh-profile-highlight';
    const ORIG_TITLE_ATTR = 'data-gh-profile-orig-title';

    function hexToRgb(hex) {
        const m = String(hex).match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (!m) return null;
        return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
    }

    function mixWithWhite(rgb, ratio) {
        return {
            r: Math.round(rgb.r * (1 - ratio) + 255 * ratio),
            g: Math.round(rgb.g * (1 - ratio) + 255 * ratio),
            b: Math.round(rgb.b * (1 - ratio) + 255 * ratio),
        };
    }

    function deriveColors(baseHex) {
        const rgb = hexToRgb(baseHex) || { r: 214, g: 58, b: 46 };
        const bg = mixWithWhite(rgb, 0.9);
        return {
            bg: 'rgb(' + bg.r + ', ' + bg.g + ', ' + bg.b + ')',
            border: 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')',
            title: 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')',
        };
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

    function showTooltip(badge, colors, name) {
        const tooltip = getTooltip();
        const T = GH.config.site.profile.texts;
        const safeName = GH.utils.escapeHtml(name);
        tooltip.innerHTML =
            '<div class="gh-profile-tooltip-title" style="color:' + colors.title + ';">' +
            GH.utils.escapeHtml(T.unknownTooltipTitle) +
            '</div>' +
            (safeName ? '<div class="gh-profile-tooltip-item"><b>Турнир:</b> «' + safeName + '»</div>' : '') +
            '<div class="gh-profile-tooltip-item" style="color:#777;">' +
            GH.utils.escapeHtml(T.unknownTooltipSubtitle) +
            '</div>';
        tooltip.style.background = colors.bg;
        tooltip.style.borderColor = colors.border;
        tooltip.style.display = 'block';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        const badgeRect = badge.getBoundingClientRect();
        const tipRect = tooltip.getBoundingClientRect();
        const gap = 4;

        let left = badgeRect.left;
        let top = badgeRect.bottom + gap;

        if (top + tipRect.height > window.innerHeight - 4) {
            top = badgeRect.top - tipRect.height - gap;
        }
        if (left + tipRect.width > window.innerWidth - 4) {
            left = window.innerWidth - tipRect.width - 4;
        }
        if (left < 4) left = 4;
        if (top < 4) top = 4;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function hideTooltip() {
        const tooltip = document.getElementById(TOOLTIP_ID);
        if (tooltip) tooltip.style.display = 'none';
    }

    function removeBadge(td) {
        const b = td.querySelector('.' + BADGE_CLASS);
        if (b) b.remove();
    }

    function attachBadge(td, colors, name, cfg) {
        removeBadge(td);

        const badge = document.createElement('div');
        badge.className = BADGE_CLASS;
        badge.textContent = '?';
        badge.style.color = cfg.color;

        badge.addEventListener('mouseenter', function () {
            if (td.hasAttribute('title')) {
                td.setAttribute(ORIG_TITLE_ATTR, td.getAttribute('title'));
                td.removeAttribute('title');
            }
            showTooltip(badge, colors, name);
        });
        badge.addEventListener('mouseleave', function () {
            if (td.hasAttribute(ORIG_TITLE_ATTR)) {
                td.setAttribute('title', td.getAttribute(ORIG_TITLE_ATTR));
                td.removeAttribute(ORIG_TITLE_ATTR);
            }
            hideTooltip();
        });

        td.appendChild(badge);
    }

    function apply(card, cfg) {
        if (!cfg || cfg.enabled === false) { clear(card); return; }

        const td = card.td;
        if (!td) return;

        if (td.getAttribute(HIGHLIGHT_ATTR) === '1') clear(card);

        td.setAttribute(HIGHLIGHT_ATTR, '1');
        td.style.boxShadow = 'inset 0 0 0 ' + cfg.width + 'px ' + cfg.color;

        if (getComputedStyle(td).position === 'static') {
            td.style.position = 'relative';
        }

        const colors = deriveColors(cfg.color);
        attachBadge(td, colors, card.name, cfg);
    }

    function clear(card) {
        const td = card && card.td;
        if (!td || td.getAttribute(HIGHLIGHT_ATTR) !== '1') return;

        td.removeAttribute(HIGHLIGHT_ATTR);
        td.style.boxShadow = '';

        if (td.hasAttribute(ORIG_TITLE_ATTR)) {
            td.setAttribute('title', td.getAttribute(ORIG_TITLE_ATTR));
            td.removeAttribute(ORIG_TITLE_ATTR);
        }

        removeBadge(td);
        hideTooltip();
    }

    GH.profileEnhancements = GH.profileEnhancements || {};
    GH.profileEnhancements.highlight = { apply: apply, clear: clear };
})();