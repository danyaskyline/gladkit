// ============================================================================
// features/hall-of-fame-filter/dict.js
//
// Словарь турниров + нормализация имени + lookup.
//
// Записи могут быть дефолтными (без флага) или пользовательскими
// (custom: true). Пользовательские перекрывают дефолтные при совпадении
// ключа typeid|normalizedName.
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    let index = null;

    function normalizeName(raw) {
        let s = String(raw || '').trim();
        s = s.replace(/\s*\/\/\s*\d{2}\.\d{2}\.\d{4}.*$/, '');
        s = s.replace(/\s*\([^)]*турнир[^)]*\)\s*$/i, '');
        s = s.replace(
            /^\s*(императорские|сенаторские|плебейские|смешанные|призовые)\s+турнир[ыа]?\s*:\s*/i,
            ''
        );
        s = s.replace(/^\s*турниры?\s+новичков\s*:\s*/i, '');
        s = s.replace(/\s*[-–—]\s*[IVXLCDM]+\s*$/i, '');
        s = s.toLowerCase().replace(/\s+/g, ' ').trim();
        return s;
    }

    function normalizeRecord(rec) {
        if (!rec || typeof rec !== 'object') return null;
        if (Array.isArray(rec)) return null;

        const typeid = Number(rec.typeid);
        const name = String(rec.name || '').trim();
        if (!Number.isFinite(typeid) || !name) return null;

        return {
            typeid: typeid,
            name: name,
            level: rec.level || null,
            type: rec.type || null,
            custom: rec.custom === true,
        };
    }

    function normalizeDict(raw) {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object') {
            if (Array.isArray(raw.entries)) return raw.entries;
            if (Array.isArray(raw.tournaments)) return raw.tournaments;
            if (Array.isArray(raw.items)) return raw.items;
            if (Array.isArray(raw.records)) return raw.records;
        }
        throw new Error('Не удалось распознать формат словаря.');
    }

    // Строит индекс: сначала дефолтные, потом пользовательские (перекрывают).
    function buildIndex(arr) {
        const map = {};
        const custom = [];
        const defaults = [];

        (arr || []).forEach((raw) => {
            const rec = normalizeRecord(raw);
            if (!rec) return;
            if (rec.custom) custom.push(rec);
            else defaults.push(rec);
        });

        defaults.forEach((rec) => {
            map[rec.typeid + '|' + normalizeName(rec.name)] = rec;
        });
        custom.forEach((rec) => {
            map[rec.typeid + '|' + normalizeName(rec.name)] = rec;
        });

        return map;
    }

    function setIndex(arr) { index = buildIndex(arr); }

    function lookup(typeid, cleanName) {
        if (!index) return null;
        return index[typeid + '|' + normalizeName(cleanName)] || null;
    }

    function getLevelsForTypeid(arr, typeid) {
        const set = new Set();
        (arr || []).forEach((raw) => {
            const rec = normalizeRecord(raw);
            if (!rec) return;
            if (rec.typeid !== typeid) return;
            if (rec.level) set.add(rec.level);
        });
        return GH.utils.uniqueSorted(Array.from(set));
    }

    GH.hallOfFameFilter = GH.hallOfFameFilter || {};
    GH.hallOfFameFilter.dict = {
        normalizeName: normalizeName,
        normalizeRecord: normalizeRecord,
        normalizeDict: normalizeDict,
        buildIndex: buildIndex,
        setIndex: setIndex,
        lookup: lookup,
        getLevelsForTypeid: getLevelsForTypeid,
    };
})();