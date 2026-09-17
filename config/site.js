// ============================================================================
// config/site.js
//
// ВСЁ, что специфично для разметки и текстов gladiators.ru.
// ============================================================================

window.GH = window.GH || {};

window.GH.siteConfig = {

    urls: {
        tournaments: '/xml/arena/tournaments.php',
        glory: '/xml/residence/glory.php',
    },

    typeidDetection: {
        underline: { selector: 'td.wooden a u, a u', typeidRegex: /typeid=(\d+)/ },
        statusTabs: { selector: 'a[href*="typeid="][href*="act="]', typeidRegex: /typeid=(\d+)/ },
        url: { regex: /[?&]typeid=(\d+)/ },
    },

    cards: {
        containerSelector: '.script3 .top',
        cardSelector: 'table[bgcolor="#918567"]',
        directChildrenOnly: true,
        mustContain: { italic: true, levelField: true },
    },

    cardParsing: {
        italicSelector: 'i',
        labels: { level: 'уровень гладиаторов:', type: 'типы гладиаторов:' },
    },

    panel: {
        insertAfterSelector: '.script3 h3',
        insertIntoSelector: '.script3 .top',
        texts: {
            title: 'Фильтр',
            expand: '▼ Развернуть',
            collapse: '▲ Свернуть',
            allCategory: 'С экстра-типами',
            usualCategory: 'Только основные',
        },
    },

    highlights: {
        unknownTournament: { enabled: true, color: '#d63a2e', width: 4 },
    },

    hallOfFame: {
        urls: { path: '/xml/residence/glory.php', excludeAct: 'act=cups' },
        selectors: {
            container: '#tableMain > tbody > tr > td:nth-child(1) > div > div > div > table',
        },
    },

    profile: {
        urls: {
            pathRegex: /^\/users\/(\d+)/,
        },
        selectors: {
            blockHeader: 'h4',
            rightPanel: '.right-panel',
            sideMenuRow: 'tr.wooden',
        },
        texts: {
            trophyLink: 'Зал трофеев',
            filterBtnClosed: 'Фильтр ▼',
            filterBtnOpen: 'Фильтр ▲',
            subheaderRegular: 'Основные турниры',
            subheaderNonRegular: 'Не основные турниры',
            unknownTooltipTitle: 'Турнир не найден в словаре',
            unknownTooltipSubtitle: 'Возможно, старый турнир',
        },
        trophyUrlTemplate: '/xml/residence/info.php?user={userId}&act=alltournaments',
        protectedTexts: ['зал трофеев'],
        blockStopTexts: ['инфраструктура'],
        wonTournamentsHeaderPrefix: 'выигранные турниры',
        defaultTournamentHighlight: {
            enabled: true,
            color: '#d63a2e',
            width: 2,
        },
    },

    guild: {
        urls: {
            pathRegex: /\/(guilds\/\d+|xml\/politics\/guilds\.php)/,
        },
        selectors: {
            blockHeader: 'h4',
            rightPanel: '.right-panel',
        },
        protectedTexts: [],
        blockStopTexts: ['инфраструктура'],
    },

    playerMarks: {
        // Хвост URL профиля игрока.
        urlRegex: /^\/users\/(\d+)/,
        // Профили, которые нельзя помечать (например, администрация).
        excludeIds: [15],
        // Максимальная длина заметки.
        noteMaxLength: 500,
        // 5 дефолтных цветов. Подобраны так, чтобы хорошо читаться
        // на бежевом пергаменте сайта и отличаться друг от друга по тону.
        defaultColors: [
            '#0400ff', // синий
            '#c81e1e', // красный
            '#0a8f2f', // зелёный
            '#c2410c', // оранжевый
            '#7c3aed', // фиолетовый
        ],
    },
};