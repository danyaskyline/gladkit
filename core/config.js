// ============================================================================
// core/config.js
//
// Точка сборки: собирает config/site.js в GH.config.site.
// Валидирует структуру data-defaults.js.
//
// Подключать ПОСЛЕ config/site.js и config/data-defaults.js,
// но ДО всех фич.
//
// schemaVersion 11:
//   - убраны валидации levelsByTypeid, italicModeByTypeid,
//     typeRulesByTypeid, levelRulesByTypeid
//   - убрана валидация hallOfFameCategories (категории теперь в categories)
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH = window.GH || {};

    function assert(cond, msg) {
        if (!cond) throw new Error('[GH config] ' + msg);
    }

    assert(GH.siteConfig, 'config/site.js не загружен');
    assert(GH.dataDefaults, 'config/data-defaults.js не загружен');

    const site = GH.siteConfig;
    const data = GH.dataDefaults;

    // ---- Валидация site ----

    assert(site.typeidDetection, 'site.typeidDetection обязателен');
    assert(site.typeidDetection.underline, 'site.typeidDetection.underline обязателен');
    assert(site.cards, 'site.cards обязателен');
    assert(site.cards.cardSelector, 'site.cards.cardSelector обязателен');
    assert(site.cardParsing, 'site.cardParsing обязателен');
    assert(site.cardParsing.labels && site.cardParsing.labels.level && site.cardParsing.labels.type,
        'site.cardParsing.labels.{level,type} обязательны');
    assert(site.panel && site.panel.texts, 'site.panel.texts обязателен');
    assert(site.highlights, 'site.highlights обязателен');

    // ---- Валидация data-defaults ----

    assert(Array.isArray(data.categories) && data.categories.length > 0,
        'data-defaults.categories должен быть непустым массивом');

    GH.config = {
        site: site,
    };

    Object.freeze(GH.config);
})();