// ============================================================================
// features/player-marks/index.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;
    const APPLIED_LINK = 'gh-user-link';
    const HEADER_BTN_CLASS = 'gh-pm-header-btn';
    const HEADER_BTN_HAS_MARK = 'gh-pm-header-btn-has-mark';
    const PROCESSED_ATTR = 'data-gh-pm-processed';

    const NAV_TEXTS = [
        'мой профиль', 'профиль', 'изменить информацию', 'архив боёв',
        'выход', 'форум', 'правила', 'поддержка', 'главная',
        'друзья', 'враги', 'список гильдий', 'моя гильдия',
        'сделать взнос', 'сделать взнос (бонусы)', 'сделать взнос (доспехи)',
        'склад', 'настройки на бой', 'войти', 'регистрация',
    ];

    const CHAT_SELECTOR = '#chat, .chat, .chat-window, #chatWindow';
    const SCAN_DEBOUNCE_MS = 200;

    let currentState = null;
    let scanTimer = null;
    const pendingRoots = new Set();

    function getProfileOwnerId() {
        const m = location.pathname.match(/^\/users\/(\d+)/);
        return m ? m[1] : null;
    }

    function isExcludedId(userId) {
        const cfg = GH.config.site.playerMarks;
        return (cfg.excludeIds || []).indexOf(Number(userId)) !== -1;
    }

    function parseUserId(href) {
        if (!href) return null;
        const m = String(href).match(GH.config.site.playerMarks.urlRegex);
        return m ? m[1] : null;
    }

    function isInChat(el) {
        if (!el) return false;
        return !!el.closest(CHAT_SELECTOR);
    }

    function isNavigationLink(link) {
        if (link.closest('tr.wooden')) return true;
        const text = link.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
        return NAV_TEXTS.indexOf(text) !== -1;
    }

    function isShortLink(link) {
        const text = link.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return true;
        if (text.length < 3) return true;
        if (/^[\s\d\[\]\(\)\.,\-\+]+$/.test(text)) return true;
        return false;
    }

    function findProfileHeader() {
        const h1s = document.querySelectorAll('h1');
        for (const h of h1s) {
            const text = h.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
            if (text === 'профиль') return h;
        }
        return null;
    }

    // Извлекаем чистый ник из текста вида "Руслан (КиКим) [24]" или "copium [11]".
    function extractNick(raw) {
        let s = String(raw || '').trim();
        s = s.replace(/\s*\[\d+\]\s*$/, '').trim();
        const m = s.match(/\(([^)]+)\)\s*$/);
        if (m) s = m[1].trim();
        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }

    // Ник берём строго из таблицы профиля:
    //   <td><b>Пользователь</b></td>
    //   <td><a href="/users/NNN">copium</a>  [11]</td>
    // Никаких ссылок из шапки, меню и прочих мест.
    function getProfileOwnerName(ownerId) {
        const idStr = String(ownerId);
        const bolds = document.querySelectorAll('b');
        for (const b of bolds) {
            if (b.textContent.replace(/\s+/g, ' ').trim().toLowerCase() !== 'пользователь') continue;
            const tdLabel = b.closest('td');
            if (!tdLabel) continue;
            const tdValue = tdLabel.nextElementSibling;
            if (!tdValue) continue;
            const link = tdValue.querySelector('a[href^="/users/"]');
            if (!link) continue;
            const id = parseUserId(link.getAttribute('href'));
            if (id !== idStr) continue;
            const text = link.textContent.replace(/\s+/g, ' ').trim();
            if (!text) continue;
            return extractNick(text);
        }
        return '';
    }

    function updateHeaderButtonColor(btn, mark) {
        if (mark && mark.color) {
            btn.classList.add(HEADER_BTN_HAS_MARK);
            const dot = btn.querySelector('.gh-pm-header-btn-dot');
            if (dot) dot.style.background = mark.color;
        } else {
            btn.classList.remove(HEADER_BTN_HAS_MARK);
            const dot = btn.querySelector('.gh-pm-header-btn-dot');
            if (dot) dot.style.background = '';
        }
    }

    function attachHeaderButton(header, userId, mark) {
        let btn = header.querySelector('.' + HEADER_BTN_CLASS);

        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = HEADER_BTN_CLASS;
            btn.dataset.userId = userId;
            btn.innerHTML =
                '<span class="gh-pm-header-btn-label">Заметка</span>' +
                '<span class="gh-pm-header-btn-icon"></span>' +
                '<span class="gh-pm-header-btn-dot"></span>';

            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const name = getProfileOwnerName(userId);
                GH.playerMarks.popup.open(userId, name, btn);
            });

            header.appendChild(btn);
        }

        updateHeaderButtonColor(btn, mark);
    }

    function updateProfileHeader() {
        const ownerId = getProfileOwnerId();
        if (!ownerId) return;
        if (isExcludedId(ownerId)) return;

        const header = findProfileHeader();
        if (!header) return;

        const state = currentState || {};
        const mark = GH.store.getPlayerMark(ownerId, state);

        attachHeaderButton(header, ownerId, mark);
    }

    function processLink(link) {
        if (link.hasAttribute(PROCESSED_ATTR)) return;
        if (isInChat(link)) return;
        if (isNavigationLink(link)) return;
        if (isShortLink(link)) return;

        const userId = parseUserId(link.getAttribute('href'));
        if (!userId) return;

        link.setAttribute(PROCESSED_ATTR, '1');
        link.classList.add(APPLIED_LINK);

        const mark = GH.store.getPlayerMark(userId, currentState);
        if (mark) {
            GH.playerMarks.highlight.apply(link, mark);
        }
    }

    function scan(root) {
        const container = root && root.isConnected ? root : document.body;
        if (!container) return;
        const links = container.querySelectorAll('a[href^="/users/"]');
        links.forEach(function (link) {
            processLink(link);
        });

        if (container === document.body) {
            updateProfileHeader();
        }
    }

    function scheduleScan(root) {
        pendingRoots.add(root);
        if (scanTimer) return;
        scanTimer = setTimeout(function () {
            scanTimer = null;
            const roots = Array.from(pendingRoots);
            pendingRoots.clear();
            roots.forEach(function (r) {
                if (r && r.isConnected) scan(r);
            });
        }, SCAN_DEBOUNCE_MS);
    }

    function startObserver() {
        const observer = new MutationObserver(function (mutations) {
            for (const m of mutations) {
                if (!m.addedNodes || m.addedNodes.length === 0) continue;
                if (isInChat(m.target)) continue;

                let hasElement = false;
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1 && !isInChat(node)) {
                        hasElement = true;
                        break;
                    }
                }
                if (hasElement) {
                    scheduleScan(m.target);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    async function init() {
        try {
            currentState = await GH.store.ensureLoaded();
            scan(document.body);
            startObserver();
        } catch (e) {
            console.error('[GH] player-marks failed:', e);
        }

        chrome.storage.onChanged.addListener(async function (changes, area) {
            if (area !== 'local') return;
            if (changes[GH.storage.STATE_KEY]) {
                GH.store.invalidate();
                currentState = await GH.store.ensureLoaded();

                document.querySelectorAll('.' + APPLIED_LINK).forEach(function (link) {
                    const userId = parseUserId(link.getAttribute('href'));
                    if (!userId) return;
                    GH.playerMarks.highlight.clear(link);
                    const mark = GH.store.getPlayerMark(userId, currentState);
                    if (mark) GH.playerMarks.highlight.apply(link, mark);
                });

                const ownerId = getProfileOwnerId();
                if (ownerId) {
                    const header = findProfileHeader();
                    if (header) {
                        const btn = header.querySelector('.' + HEADER_BTN_CLASS);
                        if (btn) {
                            const mark = GH.store.getPlayerMark(ownerId, currentState);
                            updateHeaderButtonColor(btn, mark);
                        }
                    }
                }
            }
        });
    }

    GH.features = GH.features || {};
    GH.features.playerMarks = { init: init };
})();