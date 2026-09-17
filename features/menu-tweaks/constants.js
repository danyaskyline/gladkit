// ============================================================================
// features/menu-tweaks/constants.js
//
// Константы для фичи menu-tweaks.
//
// MENU_ORDER — единственный источник правды о меню сайта.
// Используется и content-скриптом, и менеджером (через GH.menuTweaks.constants).
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH = window.GH || {};

    // Порядок меню в главном меню сайта (слева направо).
    // index — позиция <li> внутри <ul class="menu">.
    // checkText — текст <span> внутри <li>, для надёжной проверки.
    const MENU_ORDER = [
        { key: 'residence',  index: 0, label: 'Резиденция',      checkText: 'Резиденция' },
        { key: 'gladiators', index: 1, label: 'Отряд',           checkText: 'Отряд' },
        { key: 'city',       index: 2, label: 'Город',           checkText: 'Город' },
        { key: 'arena',      index: 3, label: 'Арена',           checkText: 'Арена' },
        { key: 'bonus',      index: 4, label: 'Платные опции',   checkText: 'Платные опции' },
        { key: 'politics',   index: 5, label: 'Политика',        checkText: 'Политика' },
        { key: 'misc',       index: 6, label: 'Разное',          checkText: 'Разное' },
    ];

    // Быстрый доступ: ключ → объект.
    const MENU_BY_KEY = {};
    MENU_ORDER.forEach((m) => {
        MENU_BY_KEY[m.key] = m;
    });

    // Селектор главного меню.
    const MAIN_MENU_SELECTOR = 'ul.menu';

    GH.menuTweaks = GH.menuTweaks || {};
    GH.menuTweaks.constants = {
        MENU_ORDER,
        MENU_BY_KEY,
        MAIN_MENU_SELECTOR,
    };
})();