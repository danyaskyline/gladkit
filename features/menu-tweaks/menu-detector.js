// ============================================================================
// features/menu-tweaks/menu-detector.js
//
// Определяет <li> нужного меню в главном меню сайта.
//
// Стратегия:
//   1. Сначала пробуем по индексу (MENU_ORDER[key].index).
//   2. Проверяем текст <span> внутри <li>.
//   3. Если по индексу не совпало — проходим по всем <li> и ищем по тексту.
//
// Так мы устойчивы к перестановкам меню на сайте.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const { MENU_BY_KEY, MAIN_MENU_SELECTOR } = GH.menuTweaks.constants;

    // Проверяет, что текст <span> внутри <li> совпадает с ожидаемым.
    function checkLiText(li, expectedText) {
        const span = li.querySelector('span');
        if (!span) return false;
        return span.textContent.trim() === expectedText;
    }

    // Возвращает <li> для указанного ключа меню или null.
    function findMenuLi(menuKey) {
        const info = MENU_BY_KEY[menuKey];
        if (!info) {
            console.warn('[GH] menu-tweaks: unknown menuKey', menuKey);
            return null;
        }

        const menuUl = document.querySelector(MAIN_MENU_SELECTOR);
        if (!menuUl) return null;

        // 1. Пробуем по индексу.
        const byIndex = menuUl.children[info.index];
        if (byIndex && checkLiText(byIndex, info.checkText)) {
            return byIndex;
        }

        // 2. Fallback: ищем по тексту среди всех <li>.
        for (const li of menuUl.children) {
            if (checkLiText(li, info.checkText)) {
                return li;
            }
        }

        return null;
    }

    // Возвращает <ul> внутри .sub-menu выбранного <li> или null.
    function findSubMenuUl(menuLi) {
        if (!menuLi) return null;
        const subMenu = menuLi.querySelector('.sub-menu');
        if (!subMenu) return null;
        return subMenu.querySelector('ul');
    }

    GH.menuTweaks = GH.menuTweaks || {};
    GH.menuTweaks.detector = {
        findMenuLi,
        findSubMenuUl,
    };
})();