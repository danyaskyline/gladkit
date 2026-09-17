// ============================================================================
// config/data-defaults.js
//
// schemaVersion 11 (не меняется).
// defaultsVersion 2:
//   v1 → v2: категории получают флаг `regular` (регулярная/нерегулярная).
//            Секции hallOfFame.categories и hallOfFame.nonRegularNames
//            удалены — вместо них единый список categories.
// ============================================================================

window.GH = window.GH || {};

window.GH.dataDefaults = {

    schemaVersion: 11,
    defaultsVersion: 2,

    categories: [
        { typeid: 2,  name: 'Турниры новичков',      enabled: true, regular: true },
        { typeid: 1,  name: 'Плебейские турниры',    enabled: true, regular: true },
        { typeid: 3,  name: 'Сенаторские турниры',   enabled: true, regular: true },
        { typeid: 7,  name: 'Призовые турниры',      enabled: true, regular: true },
        { typeid: 9,  name: 'Императорские турниры', enabled: true, regular: true },
        { typeid: 13, name: 'Смешанные турниры',     enabled: true, regular: true },
    ],

    menuItems: [
        {
            id: 'menu-default-1',
            enabled: true,
            menuKey: 'gladiators',
            title: 'Артефакт опыта',
            url: '/xml/residence/treasury.php?act=art_history',
        },
    ],

    highlights: {},
    ui: {},

    hallOfFameTypes: [
        { id: 'usual', label: 'Только основные' },
        { id: 'all',   label: 'С экстра-типами' },
    ],

    profileEnhancements: {
        hiddenBlocks: {},
        blockTitles: [
            'олимпиада',
            'римские легенды',
            'античные игры',
            'игры древнего рима',
            'значки',
            'кубки',
            'выигранные турниры',
            'особые',
            'чемпионат',
            'награды гильдии',
            'друзья',
            'подарки',
        ],
        tournamentFilter: {
            enabled: true,
            expanded: false,
            categories: {},
            nonRegular: true,
            levels: {},
            showStats: true,
        },
        tournamentHighlight: {
            enabled: true,
            color: '#d63a2e',
            width: 2,
        },
    },

    guildEnhancements: {
        hiddenBlocks: {},
        blockTitles: [
            'отряд гильдии',
            'альянсы',
            'олимпиада',
            'римские легенды',
            'кубки',
            'медали',
            'награды за кубок и чемпионат гильдий',
            'города гильдии',
            'награды',
        ],
    },

    playerMarks: {},
};