// ============================================================================
// core/utils.js — общие утилиты. Без побочных эффектов и без доступа к DOM.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH = window.GH || {};

    // Экранирование для вставки в innerHTML.
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Экранирование спецсимволов regexp.
    function escapeRegex(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Ключ сортировки уровня. 'unlimited' уходит в конец.
    // '20-25' сортируется по нижней границе (20).
    function levelSortKey(level) {
        if (level === 'unlimited') return Infinity;
        const m = String(level).match(/^-?\d+/);
        return m ? parseInt(m[0], 10) : 0;
    }

    // Отображаемое имя уровня.
    function levelLabel(level) {
        if (level === 'unlimited') return 'Безлимит';
        return level + ' лвл';
    }

    // Уникальные значения с сортировкой по ключу уровня.
    function uniqueSorted(arr) {
        const seen = new Set();
        const out = [];
        for (const item of arr) {
            if (seen.has(item)) continue;
            seen.add(item);
            out.push(item);
        }
        out.sort((a, b) => levelSortKey(a) - levelSortKey(b));
        return out;
    }

    // ---- chrome.storage в Promise-обёртке ----

    function storageGet(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (data) => resolve(data || {}));
        });
    }

    function storageSet(obj) {
        return new Promise((resolve) => {
            chrome.storage.local.set(obj, () => resolve());
        });
    }

    function storageRemove(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(keys, () => resolve());
        });
    }

    // ---- Клонирование объектов (без structuredClone, для совместимости) ----

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    GH.utils = {
        escapeHtml,
        escapeRegex,
        levelSortKey,
        levelLabel,
        uniqueSorted,
        storageGet,
        storageSet,
        storageRemove,
        deepClone,
    };
})();