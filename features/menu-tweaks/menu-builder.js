// ============================================================================
// features/menu-tweaks/menu-builder.js
//
// Создаёт <li> и добавляет в <ul> подменю.
// Проверяет дубликаты по href.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    // Проверяет, есть ли уже в <ul> ссылка с таким href.
    function hasLink(ul, url) {
        const links = ul.querySelectorAll('a');
        for (const a of links) {
            // Сравниваем и raw href, и resolved href — на случай относительных ссылок.
            if (a.getAttribute('href') === url) return true;
            if (a.href === url) return true;
        }
        return false;
    }

    // Создаёт <li><a>Название</a></li> и возвращает.
    function buildMenuItem(item) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        li.appendChild(a);
        return li;
    }

    // Добавляет один пункт в <ul>. Возвращает true, если добавили.
    function addItemToUl(ul, item) {
        if (!ul || !item) return false;
        if (!item.enabled) return false;

        if (hasLink(ul, item.url)) {
            return false; // уже есть
        }

        const li = buildMenuItem(item);
        ul.appendChild(li);
        return true;
    }

    GH.menuTweaks = GH.menuTweaks || {};
    GH.menuTweaks.builder = {
        hasLink,
        buildMenuItem,
        addItemToUl,
    };
})();