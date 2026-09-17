// ============================================================================
// features/pagination/index.js
//
// Переносит пагинацию наверх (клон), оставляет оригинал на месте (внизу).
//   #gh-pagination-top    — клон сверху (после #gh-panel или h3)
//   #gh-pagination-bottom — оригинал внизу (на месте)
//
// Публичный метод refresh(visibleCount):
//   visibleCount >= 5 → нижняя видна.
//   visibleCount <  5 → нижняя скрыта.
//
// Вызывается из tournament-filter после пересчёта видимых карточек.
// Если фильтр не запущен (пагинация без карточек) — считаем по DOM.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const BOTTOM_ID = 'gh-pagination-bottom';
    const TOP_ID = 'gh-pagination-top';
    const MIN_VISIBLE_FOR_BOTTOM = 5;

    let originalWrapper = null;
    let topWrapper = null;
    let lastVisibleCount = null;
    let setupDone = false;

    function applyBottomVisibility() {
        if (!originalWrapper) return;
        if (lastVisibleCount === null) return;
        if (lastVisibleCount >= MIN_VISIBLE_FOR_BOTTOM) {
            originalWrapper.style.display = '';
        } else {
            originalWrapper.style.display = 'none';
        }
    }

    function refresh(visibleCount) {
        lastVisibleCount = visibleCount;
        applyBottomVisibility();
    }

    function setup() {
        if (setupDone) return true;

        const script3 = document.querySelector('.script3');
        if (!script3) return false;

        if (document.getElementById(TOP_ID)) {
            setupDone = true;
            return true;
        }

        const pageLinks = script3.querySelectorAll('a[href*="page="]');
        if (pageLinks.length === 0) return false;

        const table = pageLinks[0].closest('table');
        if (!table) return false;

        // Оригинал оборачиваем в свой div, физически оставляем на месте.
        const parent = table.parentNode;
        if (parent.id === BOTTOM_ID) {
            originalWrapper = parent;
        } else {
            const wrap = document.createElement('div');
            wrap.id = BOTTOM_ID;
            parent.insertBefore(wrap, table);
            wrap.appendChild(table);
            originalWrapper = wrap;
        }

        // Клон для верхней части.
        const clone = table.cloneNode(true);
        topWrapper = document.createElement('div');
        topWrapper.id = TOP_ID;
        topWrapper.appendChild(clone);

        setupDone = true;
        return true;
    }

    function placeTop() {
        if (!topWrapper) return;
        if (topWrapper.parentNode) return;

        const script3 = document.querySelector('.script3');
        if (!script3) return;

        let anchor = script3.querySelector('#gh-panel');
        if (!anchor) anchor = script3.querySelector('h3');

        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(topWrapper, anchor.nextSibling);
        } else {
            script3.insertBefore(topWrapper, script3.firstChild);
        }
    }

    function waitForPanel(maxMs) {
        return new Promise(function (resolve) {
            const start = Date.now();
            (function check() {
                if (document.querySelector('.script3 #gh-panel')) return resolve(true);
                if (Date.now() - start >= maxMs) return resolve(false);
                setTimeout(check, 30);
            })();
        });
    }

    async function init() {
        try {
            if (!setup()) return;

            // Если фильтр ещё не вызывал refresh — считаем «все видимыми».
            if (lastVisibleCount === null) {
                const cards = document.querySelectorAll('.script3 .top > table[bgcolor="#918567"]');
                lastVisibleCount = cards.length;
            }
            applyBottomVisibility();

            await waitForPanel(1000);
            placeTop();
        } catch (e) {
            console.error('[GH] pagination failed:', e);
        }
    }

    GH.features = GH.features || {};
    GH.features.pagination = { init: init };
    GH.pagination = { refresh: refresh };
})();