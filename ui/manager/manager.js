// ============================================================================
// ui/manager/manager.js
// ============================================================================

(function () {
    'use strict';

    const GH = window.GH;

    let state = null;
    let dict = [];
    let dictFilterTypeid = '';
    let dictSearch = '';
    let playersSearch = '';

    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

    function toast(msg) {
        let t = document.querySelector('.toast');
        if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.classList.add('visible');
        clearTimeout(t._timer);
        t._timer = setTimeout(() => t.classList.remove('visible'), 1800);
    }

    async function persist() {
        await GH.storage.save(state);
        GH.store.invalidate();
    }

    function normalizeName(s) { return GH.hallOfFameFilter.dict.normalizeName(s); }

    // ==========================================================================
    // Категории
    // ==========================================================================

    function getCustomCategories() {
        return (state.categories || []).filter((c) => c && c.custom === true);
    }
    function getDefaultCategories() {
        return (state.categories || []).filter((c) => c && c.custom !== true);
    }

    function renderCategories() {
        const custom = getCustomCategories();
        const tbodyCustom = $('#categories-custom-tbody');
        tbodyCustom.innerHTML = '';
        $('#categories-custom-count').textContent = String(custom.length);

        if (custom.length === 0) {
            tbodyCustom.innerHTML = '<tr><td colspan="5" class="hint">Своих категорий пока нет.</td></tr>';
        } else {
            custom.forEach((cat) => {
                const tr = document.createElement('tr');
                const tdTypeid = document.createElement('td'); tdTypeid.textContent = cat.typeid; tr.appendChild(tdTypeid);

                const tdName = document.createElement('td');
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = cat.name;
                nameInput.className = 'inline-input';
                nameInput.addEventListener('change', async () => {
                    const v = nameInput.value.trim();
                    if (!v) { nameInput.value = cat.name; toast('Название не может быть пустым'); return; }
                    cat.name = v;
                    await persist();
                    toast('Сохранено');
                });
                tdName.appendChild(nameInput); tr.appendChild(tdName);

                const tdEnabled = document.createElement('td');
                const enabledInput = document.createElement('input');
                enabledInput.type = 'checkbox';
                enabledInput.checked = cat.enabled !== false;
                enabledInput.addEventListener('change', async () => {
                    cat.enabled = enabledInput.checked;
                    await persist();
                    toast('Сохранено');
                });
                tdEnabled.appendChild(enabledInput); tr.appendChild(tdEnabled);

                const tdReg = document.createElement('td');
                const regInput = document.createElement('input');
                regInput.type = 'checkbox';
                regInput.checked = cat.regular === true;
                regInput.addEventListener('change', async () => {
                    cat.regular = regInput.checked;
                    await persist();
                    toast('Сохранено');
                });
                tdReg.appendChild(regInput); tr.appendChild(tdReg);

                const tdActions = document.createElement('td');
                tdActions.className = 'actions-cell';
                const btnDel = document.createElement('button');
                btnDel.className = 'icon-btn danger';
                btnDel.textContent = '×';
                btnDel.title = 'Удалить пользовательскую категорию';
                btnDel.addEventListener('click', async () => {
                    if (!confirm('Удалить категорию «' + cat.name + '»?')) return;
                    state.categories = state.categories.filter((c) => c !== cat);
                    if (state.ui) delete state.ui[cat.typeid];
                    await persist();
                    renderCategories();
                    renderFofCategoriesTable();
                    renderDictFilterOptions();
                    toast('Удалено');
                });
                tdActions.appendChild(btnDel); tr.appendChild(tdActions);

                tbodyCustom.appendChild(tr);
            });
        }

        const defaults = getDefaultCategories();
        const tbodyDef = $('#categories-default-tbody');
        tbodyDef.innerHTML = '';
        $('#categories-default-count').textContent = String(defaults.length);

        if (defaults.length === 0) {
            tbodyDef.innerHTML = '<tr><td colspan="3" class="hint">Стандартных категорий нет.</td></tr>';
        } else {
            defaults.forEach((cat) => {
                const tr = document.createElement('tr');
                const tdTypeid = document.createElement('td'); tdTypeid.textContent = cat.typeid; tr.appendChild(tdTypeid);
                const tdName = document.createElement('td'); tdName.textContent = cat.name; tr.appendChild(tdName);
                const tdReg = document.createElement('td');
                tdReg.textContent = cat.regular === true ? 'да' : 'нет';
                tr.appendChild(tdReg);
                tbodyDef.appendChild(tr);
            });
        }
    }

    $('#add-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const typeidRaw = $('#add-category-typeid').value.trim();
        const name = $('#add-category-name').value.trim();
        if (!typeidRaw || !name) return;
        const typeid = parseInt(typeidRaw, 10);
        if (!Number.isFinite(typeid) || typeid < 1) { toast('typeid должен быть положительным'); return; }
        if ((state.categories || []).some((c) => c.typeid === typeid)) {
            toast('typeid уже занят');
            return;
        }
        state.categories = state.categories || [];
        state.categories.push({ typeid: typeid, name: name, enabled: true, regular: true, custom: true });
        await persist();
        $('#add-category-typeid').value = '';
        $('#add-category-name').value = '';
        renderCategories();
        renderFofCategoriesTable();
        renderDictFilterOptions();
        toast('Категория добавлена');
    });

    // ==========================================================================
    // Меню
    // ==========================================================================

    function renderMenuItems() {
        const container = $('#menu-items-container');
        container.innerHTML = '';
        if (!state.menuItems || state.menuItems.length === 0) {
            container.innerHTML = '<p class="hint">Пунктов пока нет.</p>';
            return;
        }
        const groups = {};
        state.menuItems.forEach((item) => {
            const key = item.menuKey || 'misc';
            (groups[key] = groups[key] || []).push(item);
        });
        const constants = GH.menuTweaks && GH.menuTweaks.constants;
        const order = constants ? constants.MENU_ORDER : [];
        order.forEach((menuInfo) => {
            const group = groups[menuInfo.key];
            const groupDiv = document.createElement('div');
            groupDiv.className = 'menu-group';
            const groupTitle = document.createElement('h3');
            groupTitle.className = 'menu-group-title';
            groupTitle.textContent = menuInfo.label;
            groupDiv.appendChild(groupTitle);
            if (!group || group.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'hint menu-empty';
                empty.textContent = '(пусто)';
                groupDiv.appendChild(empty);
            } else {
                group.forEach((item) => groupDiv.appendChild(buildMenuItemCard(item)));
            }
            container.appendChild(groupDiv);
        });
    }

    function buildMenuItemCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-item-card';

        const header = document.createElement('div');
        header.className = 'menu-item-header';

        const upBtn = document.createElement('button');
        upBtn.className = 'icon-btn';
        upBtn.textContent = '▲';
        upBtn.addEventListener('click', () => moveMenuItem(item, -1));
        header.appendChild(upBtn);

        const downBtn = document.createElement('button');
        downBtn.className = 'icon-btn';
        downBtn.textContent = '▼';
        downBtn.addEventListener('click', () => moveMenuItem(item, +1));
        header.appendChild(downBtn);

        const enabledLabel = document.createElement('label');
        enabledLabel.className = 'chk';
        const enabledInput = document.createElement('input');
        enabledInput.type = 'checkbox';
        enabledInput.checked = item.enabled !== false;
        enabledInput.addEventListener('change', async () => {
            item.enabled = enabledInput.checked;
            await persist();
            toast('Сохранено');
        });
        enabledLabel.appendChild(enabledInput);
        enabledLabel.appendChild(document.createTextNode(' Вкл'));
        header.appendChild(enabledLabel);

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn danger';
        delBtn.textContent = '×';
        delBtn.style.marginLeft = 'auto';
        delBtn.addEventListener('click', async () => {
            if (!confirm('Удалить пункт «' + item.title + '»?')) return;
            state.menuItems = state.menuItems.filter((m) => m.id !== item.id);
            await persist();
            renderMenuItems();
            toast('Удалено');
        });
        header.appendChild(delBtn);
        card.appendChild(header);

        const fields = document.createElement('div');
        fields.className = 'menu-item-fields';
        fields.appendChild(buildMenuField('Меню', buildMenuSelect(item)));
        fields.appendChild(buildMenuField('Название', buildTextInput(item, 'title', 'Название')));
        fields.appendChild(buildMenuField('Ссылка', buildTextInput(item, 'url', 'Ссылка')));
        card.appendChild(fields);
        return card;
    }

    function buildMenuField(labelText, inputEl) {
        const row = document.createElement('div');
        row.className = 'menu-field-row';
        const label = document.createElement('label');
        label.className = 'menu-field-label';
        label.textContent = labelText;
        row.appendChild(label);
        row.appendChild(inputEl);
        return row;
    }

    function buildMenuSelect(item) {
        const select = document.createElement('select');
        select.className = 'inline-select';
        const constants = GH.menuTweaks && GH.menuTweaks.constants;
        const order = constants ? constants.MENU_ORDER : [];
        order.forEach((menuInfo) => {
            const opt = document.createElement('option');
            opt.value = menuInfo.key;
            opt.textContent = menuInfo.label;
            select.appendChild(opt);
        });
        select.value = item.menuKey || 'misc';
        select.addEventListener('change', async () => {
            item.menuKey = select.value;
            await persist();
            renderMenuItems();
            toast('Сохранено');
        });
        return select;
    }

    function buildTextInput(item, key, label) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-input';
        input.value = item[key] || '';
        input.addEventListener('change', async () => {
            const v = input.value.trim();
            if (!v) { input.value = item[key]; toast(label + ' не может быть пустым'); return; }
            item[key] = v;
            await persist();
            toast('Сохранено');
        });
        return input;
    }

    async function moveMenuItem(item, direction) {
        const arr = state.menuItems;
        const i = arr.findIndex((m) => m.id === item.id);
        if (i === -1) return;
        let j = -1;
        if (direction < 0) {
            for (let k = i - 1; k >= 0; k--) if (arr[k].menuKey === item.menuKey) { j = k; break; }
        } else {
            for (let k = i + 1; k < arr.length; k++) if (arr[k].menuKey === item.menuKey) { j = k; break; }
        }
        if (j === -1) return;
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        await persist();
        renderMenuItems();
    }

    $('#add-menu-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const menuKey = $('#add-menu-item-key').value;
        const title = $('#add-menu-item-title').value.trim();
        const url = $('#add-menu-item-url').value.trim();
        if (!title || !url) return;
        state.menuItems = state.menuItems || [];
        state.menuItems.push({ id: 'menu-' + Date.now(), enabled: true, menuKey: menuKey, title: title, url: url });
        await persist();
        $('#add-menu-item-title').value = '';
        $('#add-menu-item-url').value = '';
        renderMenuItems();
        toast('Добавлено');
    });

    // ==========================================================================
    // Зал славы
    // ==========================================================================

    function renderFofCategoriesTable() {
        const tbody = $('#fof-categories-tbody');
        tbody.innerHTML = '';
        const cats = GH.store.getCategories(state);
        if (cats.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="hint">Категорий пока нет.</td></tr>';
            return;
        }
        cats.forEach((cat) => {
            const tr = document.createElement('tr');
            const tdTypeid = document.createElement('td'); tdTypeid.textContent = cat.typeid; tr.appendChild(tdTypeid);
            const tdName = document.createElement('td'); tdName.textContent = cat.name; tr.appendChild(tdName);
            const tdReg = document.createElement('td');
            tdReg.textContent = cat.regular === true ? 'да' : 'нет';
            tr.appendChild(tdReg);
            tbody.appendChild(tr);
        });
    }

    function ensureFofState() {
        state.hallOfFame = state.hallOfFame || {};
        if (!Array.isArray(state.hallOfFame.nonRegularNames)) state.hallOfFame.nonRegularNames = [];
    }
    function getFofNonRegularNames() { ensureFofState(); return state.hallOfFame.nonRegularNames; }

    function renderFofNonRegularList() {
        const list = $('#fof-nonregular-list');
        list.innerHTML = '';
        const names = getFofNonRegularNames();
        if (names.length === 0) {
            list.innerHTML = '<span class="hint">Список пуст.</span>';
            return;
        }
        names.forEach((name) => {
            const chip = document.createElement('div');
            chip.className = 'level-chip';
            chip.innerHTML = '<span>' + GH.utils.escapeHtml(name) + '</span><button class="remove" type="button">×</button>';
            chip.querySelector('.remove').addEventListener('click', async () => {
                state.hallOfFame.nonRegularNames = state.hallOfFame.nonRegularNames.filter((x) => x !== name);
                await persist();
                renderFofNonRegularList();
                toast('Удалено');
            });
            list.appendChild(chip);
        });
    }

    $('#add-fof-nonregular-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ensureFofState();
        const input = $('#add-fof-nonregular-name');
        const raw = input.value.trim();
        if (!raw) return;
        const name = normalizeName(raw);
        if (state.hallOfFame.nonRegularNames.indexOf(name) !== -1) { toast('Уже есть'); return; }
        state.hallOfFame.nonRegularNames.push(name);
        await persist();
        input.value = '';
        renderFofNonRegularList();
        toast('Добавлено');
    });

    // ==========================================================================
    // Профиль игрока
    // ==========================================================================

    function ensureProfileEnhancementsState() {
        state.profileEnhancements = state.profileEnhancements || {};
        if (!Array.isArray(state.profileEnhancements.blockTitles)) state.profileEnhancements.blockTitles = [];
        if (!state.profileEnhancements.hiddenBlocks || typeof state.profileEnhancements.hiddenBlocks !== 'object') {
            state.profileEnhancements.hiddenBlocks = {};
        }
        if (!state.profileEnhancements.tournamentHighlight || typeof state.profileEnhancements.tournamentHighlight !== 'object') {
            state.profileEnhancements.tournamentHighlight = {};
        }
        if (!Array.isArray(state.profileEnhancements.nonRegularNames)) {
            state.profileEnhancements.nonRegularNames = [];
        }
    }

    function renderProfileBlocksList() {
        ensureProfileEnhancementsState();
        const list = $('#profile-blocks-list');
        list.innerHTML = '';
        const titles = state.profileEnhancements.blockTitles;
        if (titles.length === 0) {
            list.innerHTML = '<span class="hint">Список пуст.</span>';
            return;
        }
        titles.forEach((title) => {
            const chip = document.createElement('div');
            chip.className = 'level-chip';
            chip.innerHTML = '<span>' + GH.utils.escapeHtml(title) + '</span><button class="remove" type="button">×</button>';
            chip.querySelector('.remove').addEventListener('click', async () => {
                state.profileEnhancements.blockTitles = titles.filter((x) => x !== title);
                if (state.profileEnhancements.hiddenBlocks[title]) {
                    delete state.profileEnhancements.hiddenBlocks[title];
                }
                await persist();
                renderProfileBlocksList();
                renderProfileHiddenCount();
                toast('Удалено');
            });
            list.appendChild(chip);
        });
    }

    $('#add-profile-block-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ensureProfileEnhancementsState();
        const input = $('#add-profile-block-title');
        const raw = input.value.trim();
        if (!raw) return;
        const title = normalizeName(raw);
        if (state.profileEnhancements.blockTitles.indexOf(title) !== -1) { toast('Уже есть'); return; }
        state.profileEnhancements.blockTitles.push(title);
        await persist();
        input.value = '';
        renderProfileBlocksList();
        toast('Добавлено');
    });

    function renderProfileHiddenCount() {
        ensureProfileEnhancementsState();
        const n = Object.keys(state.profileEnhancements.hiddenBlocks).length;
        $('#profile-hidden-count').textContent = 'скрыто ' + n;
    }

    $('#profile-reset-hidden-btn').addEventListener('click', async () => {
        ensureProfileEnhancementsState();
        if (!confirm('Показать все скрытые блоки на профилях?')) return;
        state.profileEnhancements.hiddenBlocks = {};
        await persist();
        renderProfileHiddenCount();
        toast('Все блоки снова видимы');
    });

    function renderProfileNonRegularList() {
        ensureProfileEnhancementsState();
        const list = $('#profile-nonregular-list');
        list.innerHTML = '';
        const names = state.profileEnhancements.nonRegularNames || [];
        if (names.length === 0) {
            list.innerHTML = '<span class="hint">Список пуст.</span>';
            return;
        }
        names.forEach((name) => {
            const chip = document.createElement('div');
            chip.className = 'level-chip';
            chip.innerHTML = '<span>' + GH.utils.escapeHtml(name) + '</span><button class="remove" type="button">×</button>';
            chip.querySelector('.remove').addEventListener('click', async () => {
                state.profileEnhancements.nonRegularNames = names.filter((x) => x !== name);
                await persist();
                renderProfileNonRegularList();
                toast('Удалено');
            });
            list.appendChild(chip);
        });
    }

    $('#add-profile-nonregular-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ensureProfileEnhancementsState();
        if (!Array.isArray(state.profileEnhancements.nonRegularNames)) state.profileEnhancements.nonRegularNames = [];
        const input = $('#add-profile-nonregular-name');
        const raw = input.value.trim();
        if (!raw) return;
        const name = normalizeName(raw);
        if (state.profileEnhancements.nonRegularNames.indexOf(name) !== -1) { toast('Уже есть'); return; }
        state.profileEnhancements.nonRegularNames.push(name);
        await persist();
        input.value = '';
        renderProfileNonRegularList();
        toast('Добавлено');
    });

    function renderProfileHighlightSettings() {
        ensureProfileEnhancementsState();
        const cfg = state.profileEnhancements.tournamentHighlight || {};
        const def = (GH.config.site.profile && GH.config.site.profile.defaultTournamentHighlight) || {};
        $('#profile-highlight-enabled').checked = (cfg.enabled !== undefined ? cfg.enabled : def.enabled) !== false;
        $('#profile-highlight-color').value = cfg.color || def.color || '#d63a2e';
        $('#profile-highlight-width').value = cfg.width || def.width || 2;
    }

    function bindProfileHighlightSetting(el, key, transform) {
        el.addEventListener('change', async () => {
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if (transform) val = transform(val);
            state.profileEnhancements.tournamentHighlight = state.profileEnhancements.tournamentHighlight || {};
            state.profileEnhancements.tournamentHighlight[key] = val;
            await persist();
            toast('Сохранено');
        });
    }

    bindProfileHighlightSetting($('#profile-highlight-enabled'), 'enabled');
    bindProfileHighlightSetting($('#profile-highlight-color'), 'color');
    bindProfileHighlightSetting($('#profile-highlight-width'), 'width', (v) => parseInt(v, 10));

    // ==========================================================================
    // Гильдия
    // ==========================================================================

    function ensureGuildEnhancementsState() {
        state.guildEnhancements = state.guildEnhancements || {};
        if (!Array.isArray(state.guildEnhancements.blockTitles)) state.guildEnhancements.blockTitles = [];
        if (!state.guildEnhancements.hiddenBlocks || typeof state.guildEnhancements.hiddenBlocks !== 'object') {
            state.guildEnhancements.hiddenBlocks = {};
        }
    }

    function renderGuildBlocksList() {
        ensureGuildEnhancementsState();
        const list = $('#guild-blocks-list');
        list.innerHTML = '';
        const titles = state.guildEnhancements.blockTitles;
        if (titles.length === 0) {
            list.innerHTML = '<span class="hint">Список пуст.</span>';
            return;
        }
        titles.forEach((title) => {
            const chip = document.createElement('div');
            chip.className = 'level-chip';
            chip.innerHTML = '<span>' + GH.utils.escapeHtml(title) + '</span><button class="remove" type="button">×</button>';
            chip.querySelector('.remove').addEventListener('click', async () => {
                state.guildEnhancements.blockTitles = titles.filter((x) => x !== title);
                if (state.guildEnhancements.hiddenBlocks[title]) {
                    delete state.guildEnhancements.hiddenBlocks[title];
                }
                await persist();
                renderGuildBlocksList();
                renderGuildHiddenCount();
                toast('Удалено');
            });
            list.appendChild(chip);
        });
    }

    $('#add-guild-block-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ensureGuildEnhancementsState();
        const input = $('#add-guild-block-title');
        const raw = input.value.trim();
        if (!raw) return;
        const title = normalizeName(raw);
        if (state.guildEnhancements.blockTitles.indexOf(title) !== -1) { toast('Уже есть'); return; }
        state.guildEnhancements.blockTitles.push(title);
        await persist();
        input.value = '';
        renderGuildBlocksList();
        toast('Добавлено');
    });

    function renderGuildHiddenCount() {
        ensureGuildEnhancementsState();
        const n = Object.keys(state.guildEnhancements.hiddenBlocks).length;
        $('#guild-hidden-count').textContent = 'скрыто ' + n;
    }

    $('#guild-reset-hidden-btn').addEventListener('click', async () => {
        ensureGuildEnhancementsState();
        if (!confirm('Показать все скрытые блоки на страницах гильдий?')) return;
        state.guildEnhancements.hiddenBlocks = {};
        await persist();
        renderGuildHiddenCount();
        toast('Все блоки снова видимы');
    });

    // ==========================================================================
    // Словарь турниров
    // ==========================================================================

    function getCustomDict() { return dict.filter((r) => r && r.custom === true); }
    function getDefaultDict() { return dict.filter((r) => r && r.custom !== true); }

    function renderDict() {
        const custom = getCustomDict();
        const tbodyCustom = $('#dict-custom-tbody');
        tbodyCustom.innerHTML = '';
        $('#dict-custom-count').textContent = String(custom.length);

        if (custom.length === 0) {
            tbodyCustom.innerHTML = '<tr><td colspan="5" class="hint">Своих записей пока нет.</td></tr>';
        } else {
            custom.forEach((rec) => {
                const tr = buildDictEditRow(rec);
                tbodyCustom.appendChild(tr);
            });
        }

        const defaults = getDefaultDict();
        $('#dict-default-count').textContent = String(defaults.length);

        let filtered = defaults.slice();
        if (dictFilterTypeid) {
            const tid = parseInt(dictFilterTypeid, 10);
            filtered = filtered.filter((r) => r.typeid === tid);
        }
        if (dictSearch) {
            const q = dictSearch.toLowerCase();
            filtered = filtered.filter((r) => (r.name || '').toLowerCase().indexOf(q) !== -1);
        }
        filtered.sort((a, b) => (a.typeid - b.typeid) || (a.name || '').localeCompare(b.name || ''));

        $('#dict-filtered-count').textContent = 'Показано: ' + filtered.length + ' из ' + defaults.length;

        const tbodyDef = $('#dict-default-tbody');
        tbodyDef.innerHTML = '';
        if (filtered.length === 0) {
            tbodyDef.innerHTML = '<tr><td colspan="4" class="hint">Ничего не найдено.</td></tr>';
        } else {
            filtered.forEach((rec) => {
                const tr = buildDictViewRow(rec);
                tbodyDef.appendChild(tr);
            });
        }
    }

    function buildDictEditRow(rec) {
        const tr = document.createElement('tr');

        const tdTypeid = document.createElement('td');
        tdTypeid.textContent = rec.typeid;
        tr.appendChild(tdTypeid);

        const tdName = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = rec.name;
        nameInput.className = 'inline-input';
        nameInput.addEventListener('change', async () => {
            const v = normalizeName(nameInput.value);
            if (!v) { nameInput.value = rec.name; toast('Имя не может быть пустым'); return; }
            rec.name = v;
            nameInput.value = v;
            await saveDict();
            toast('Сохранено');
        });
        tdName.appendChild(nameInput);
        tr.appendChild(tdName);

        const tdLevel = document.createElement('td');
        const levelInput = document.createElement('input');
        levelInput.type = 'text';
        levelInput.value = rec.level || '';
        levelInput.className = 'inline-input';
        levelInput.placeholder = '10 / 10-15 / unlimited';
        levelInput.addEventListener('change', async () => {
            rec.level = levelInput.value.trim() || null;
            await saveDict();
            toast('Сохранено');
        });
        tdLevel.appendChild(levelInput);
        tr.appendChild(tdLevel);

        const tdType = document.createElement('td');
        const typeSelect = document.createElement('select');
        typeSelect.className = 'inline-select';
        const optNone = document.createElement('option'); optNone.value = ''; optNone.textContent = '—';
        const optUsual = document.createElement('option'); optUsual.value = 'usual'; optUsual.textContent = 'usual';
        const optAll = document.createElement('option'); optAll.value = 'all'; optAll.textContent = 'all';
        typeSelect.appendChild(optNone);
        typeSelect.appendChild(optUsual);
        typeSelect.appendChild(optAll);
        typeSelect.value = rec.type || '';
        typeSelect.addEventListener('change', async () => {
            rec.type = typeSelect.value || null;
            await saveDict();
            toast('Сохранено');
        });
        tdType.appendChild(typeSelect);
        tr.appendChild(tdType);

        const tdActions = document.createElement('td');
        tdActions.className = 'actions-cell';
        const btnDel = document.createElement('button');
        btnDel.className = 'icon-btn danger';
        btnDel.textContent = '×';
        btnDel.title = 'Удалить пользовательскую запись';
        btnDel.addEventListener('click', async () => {
            if (!confirm('Удалить запись «' + rec.name + '»?')) return;
            dict = dict.filter((r) => r !== rec);
            await saveDict();
            renderDict();
            toast('Удалено');
        });
        tdActions.appendChild(btnDel);
        tr.appendChild(tdActions);

        return tr;
    }

    function buildDictViewRow(rec) {
        const tr = document.createElement('tr');
        const tdTypeid = document.createElement('td'); tdTypeid.textContent = rec.typeid; tr.appendChild(tdTypeid);
        const tdName = document.createElement('td'); tdName.textContent = rec.name; tr.appendChild(tdName);
        const tdLevel = document.createElement('td'); tdLevel.textContent = rec.level || '—'; tr.appendChild(tdLevel);
        const tdType = document.createElement('td'); tdType.textContent = rec.type || '—'; tr.appendChild(tdType);
        return tr;
    }

    async function loadDict() {
        dict = await GH.storage.ensureDictLoaded();
        dict = dict.filter((r) => r && typeof r === 'object' && !Array.isArray(r));
    }

    async function saveDict() {
        await GH.storage.saveDict(dict);
    }

    function renderDictFilterOptions() {
        const sel = $('#dict-filter-typeid');
        const cur = sel.value;
        sel.innerHTML = '<option value="">Все</option>';
        const cats = GH.store.getCategories(state);
        cats.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = String(c.typeid);
            opt.textContent = c.typeid + ' — ' + c.name;
            sel.appendChild(opt);
        });
        sel.value = cur;
    }

    $('#add-dict-entry-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const typeidRaw = $('#add-dict-typeid').value.trim();
        const nameRaw = $('#add-dict-name').value.trim();
        const level = $('#add-dict-level').value.trim() || null;
        const type = $('#add-dict-type').value || null;
        if (!typeidRaw || !nameRaw) return;
        const typeid = parseInt(typeidRaw, 10);
        if (!Number.isFinite(typeid) || typeid < 1) { toast('typeid должен быть положительным'); return; }
        const name = normalizeName(nameRaw);
        if (!name) { toast('Имя пустое после нормализации'); return; }

        const existCustom = dict.find((r) => r.custom === true && r.typeid === typeid && r.name === name);
        if (existCustom) {
            existCustom.level = level;
            existCustom.type = type;
        } else {
            dict.push({ typeid: typeid, name: name, level: level, type: type, custom: true });
        }
        await saveDict();
        $('#add-dict-typeid').value = '';
        $('#add-dict-name').value = '';
        $('#add-dict-level').value = '';
        renderDict();
        toast('Добавлено');
    });

    $('#dict-filter-typeid').addEventListener('change', () => {
        dictFilterTypeid = $('#dict-filter-typeid').value;
        renderDict();
    });
    $('#dict-search').addEventListener('input', () => {
        dictSearch = $('#dict-search').value.trim();
        renderDict();
    });

    // ==========================================================================
    // Метки игроков
    // ==========================================================================

    function ensurePlayerMarksState() {
        if (!state.playerMarks || typeof state.playerMarks !== 'object') state.playerMarks = {};
    }

    function isExcludedPlayer(userId) {
        const cfg = GH.config.site.playerMarks;
        return (cfg.excludeIds || []).indexOf(Number(userId)) !== -1;
    }

    function renderPlayersStatus() {
        ensurePlayerMarksState();
        const n = Object.keys(state.playerMarks).length;
        $('#players-status').textContent = 'Меток: ' + n + '.';
    }

    function filteredPlayerMarks() {
        ensurePlayerMarksState();
        const q = playersSearch.toLowerCase().trim();
        let list = Object.keys(state.playerMarks).map((id) => {
            return Object.assign({ id: id }, state.playerMarks[id]);
        });
        if (q) {
            list = list.filter((m) => {
                if (m.id.indexOf(q) !== -1) return true;
                if ((m.lastSeenName || '').toLowerCase().indexOf(q) !== -1) return true;
                if ((m.note || '').toLowerCase().indexOf(q) !== -1) return true;
                return false;
            });
        }
        return list;
    }

    function groupByColor(list) {
        const groups = {};
        list.forEach((m) => {
            const key = m.color ? String(m.color).toLowerCase() : '_none';
            (groups[key] = groups[key] || []).push(m);
        });

        const defaultOrder = (GH.config.site.playerMarks.defaultColors || [])
            .map((c) => c.toLowerCase());
        const keys = Object.keys(groups).filter((k) => k !== '_none');
        keys.sort((a, b) => {
            const ia = defaultOrder.indexOf(a);
            const ib = defaultOrder.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b);
        });
        if (groups._none) keys.push('_none');

        return keys.map((k) => {
            const items = groups[k].slice();
            items.sort((a, b) => {
                const an = (a.lastSeenName || '').toLowerCase();
                const bn = (b.lastSeenName || '').toLowerCase();
                if (an && bn) return an.localeCompare(bn);
                if (an) return -1;
                if (bn) return 1;
                return Number(a.id) - Number(b.id);
            });
            return {
                color: k === '_none' ? null : groups[k][0].color,
                items: items,
            };
        });
    }

    function buildPlayerRow(mark) {
        const tr = document.createElement('tr');
        const excluded = isExcludedPlayer(mark.id);

        const tdColor = document.createElement('td');
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = mark.color || '#0400ff';
        colorInput.className = 'players-color-input';
        colorInput.addEventListener('change', async () => {
            state.playerMarks[mark.id].color = colorInput.value;
            await persist();
            renderPlayersTable();
            toast('Цвет сохранён');
        });
        tdColor.appendChild(colorInput);
        tr.appendChild(tdColor);

        const tdName = document.createElement('td');
        const link = document.createElement('a');
        link.href = 'https://www.gladiators.ru/users/' + mark.id;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'players-name-link';
        link.textContent = mark.lastSeenName || ('ID ' + mark.id);
        if (!mark.lastSeenName) link.classList.add('players-name-empty');
        tdName.appendChild(link);
        tr.appendChild(tdName);

        const tdNote = document.createElement('td');
        const noteInput = document.createElement('textarea');
        noteInput.value = mark.note || '';
        noteInput.placeholder = '—';
        noteInput.className = 'players-note-textarea';
        noteInput.rows = 2;
        noteInput.addEventListener('change', async () => {
            state.playerMarks[mark.id].note = noteInput.value.trim();
            await persist();
            toast('Заметка сохранена');
        });
        tdNote.appendChild(noteInput);
        tr.appendChild(tdNote);

        const tdActions = document.createElement('td');
        tdActions.className = 'actions-cell';
        if (excluded) {
            const lock = document.createElement('span');
            lock.className = 'players-lock';
            lock.textContent = '🔒';
            lock.title = 'Этот профиль защищён';
            tdActions.appendChild(lock);
        } else {
            const btnDel = document.createElement('button');
            btnDel.className = 'icon-btn danger';
            btnDel.textContent = '×';
            btnDel.addEventListener('click', async () => {
                if (!confirm('Удалить метку для ' + (mark.lastSeenName || ('ID ' + mark.id)) + '?')) return;
                delete state.playerMarks[mark.id];
                await persist();
                renderPlayersTable();
                renderPlayersStatus();
                toast('Удалено');
            });
            tdActions.appendChild(btnDel);
        }
        tr.appendChild(tdActions);

        return tr;
    }

    function renderPlayersTable() {
        ensurePlayerMarksState();
        const tbody = $('#players-tbody');
        tbody.innerHTML = '';

        const list = filteredPlayerMarks();
        const total = Object.keys(state.playerMarks).length;
        $('#players-filtered-count').textContent = 'Показано: ' + list.length + ' из ' + total;

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="hint">Меток нет.</td></tr>';
            return;
        }

        const groups = groupByColor(list);
        groups.forEach((group) => {
            const divTr = document.createElement('tr');
            divTr.className = 'players-group-row';
            const divTd = document.createElement('td');
            divTd.colSpan = 4;

            const dot = document.createElement('span');
            dot.className = 'players-group-dot';
            if (group.color) dot.style.background = group.color;
            dot.title = 'Изменить цвет всех меток в группе';

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.className = 'players-group-color-input';
            colorInput.value = group.color || '#0400ff';

            colorInput.addEventListener('input', () => {
                dot.style.background = colorInput.value;
            });

            colorInput.addEventListener('change', async () => {
                const newColor = colorInput.value;
                group.items.forEach((m) => {
                    if (state.playerMarks[m.id]) {
                        state.playerMarks[m.id].color = newColor;
                    }
                });
                await persist();
                toast('Цвет обновлён у ' + group.items.length + ' меток');
            });

            dot.addEventListener('click', () => {
                colorInput.click();
            });

            divTd.appendChild(dot);
            divTd.appendChild(colorInput);
            divTd.appendChild(document.createTextNode(String(group.items.length)));
            divTr.appendChild(divTd);
            tbody.appendChild(divTr);

            group.items.forEach((mark) => {
                tbody.appendChild(buildPlayerRow(mark));
            });
        });
    }

    $('#players-search').addEventListener('input', () => {
        playersSearch = $('#players-search').value.trim();
        renderPlayersTable();
    });

    $('#players-export-btn').addEventListener('click', () => {
        ensurePlayerMarksState();
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            marks: state.playerMarks,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gladiators-player-marks.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    $('#players-import-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const parsed = JSON.parse(reader.result);
                let marks = null;
                if (parsed && typeof parsed === 'object') {
                    if (parsed.marks && typeof parsed.marks === 'object') marks = parsed.marks;
                    else marks = parsed;
                }
                if (!marks || typeof marks !== 'object') {
                    alert('Не удалось распознать формат.');
                    return;
                }
                if (!confirm('Заменить все текущие метки на те, что в файле?')) return;
                const clean = {};
                for (const key of Object.keys(marks)) {
                    const id = String(key).trim();
                    if (!/^\d+$/.test(id)) continue;
                    const m = marks[key];
                    if (!m || typeof m !== 'object') continue;
                    clean[id] = {
                        color: typeof m.color === 'string' ? m.color : null,
                        note: typeof m.note === 'string' ? m.note : '',
                        lastSeenName: typeof m.lastSeenName === 'string' ? m.lastSeenName : '',
                    };
                }
                state.playerMarks = clean;
                await persist();
                renderPlayersTable();
                renderPlayersStatus();
                toast('Импортировано ' + Object.keys(clean).length + ' меток');
            } catch (err) {
                alert('Ошибка импорта: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    $('#players-clear-btn').addEventListener('click', async () => {
        ensurePlayerMarksState();
        const n = Object.keys(state.playerMarks).length;
        if (n === 0) { toast('Меток и так нет'); return; }
        if (!confirm('Удалить все ' + n + ' меток?')) return;
        state.playerMarks = {};
        await persist();
        renderPlayersTable();
        renderPlayersStatus();
        toast('Все метки удалены');
    });

    // ==========================================================================
    // Настройки подсветки (tournaments.php)
    // ==========================================================================

    function renderHighlightSettings() {
        const cfg = GH.store.getHighlightConfig('unknownTournament', state);
        $('#highlight-enabled').checked = cfg.enabled !== false;
        $('#highlight-color').value = cfg.color || '#d63a2e';
        $('#highlight-width').value = cfg.width || 3;
    }

    function bindHighlightSetting(el, key, transform) {
        el.addEventListener('change', async () => {
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if (transform) val = transform(val);
            state.highlights = state.highlights || {};
            state.highlights.unknownTournament = state.highlights.unknownTournament || {};
            state.highlights.unknownTournament[key] = val;
            await persist();
            toast('Сохранено');
        });
    }

    bindHighlightSetting($('#highlight-enabled'), 'enabled');
    bindHighlightSetting($('#highlight-color'), 'color');
    bindHighlightSetting($('#highlight-width'), 'width', (v) => parseInt(v, 10));

    // ==========================================================================
    // Бэкап и сброс
    // ==========================================================================

    // Собираем только пользовательские данные. Дефолтные категории и словарь
    // не попадают — они придут с новой версией расширения.
    function buildConfigPayload() {
        ensurePlayerMarksState();
        ensureProfileEnhancementsState();
        ensureGuildEnhancementsState();
        ensureFofState();

        const customCategories = getCustomCategories();
        const customDict = getCustomDict();
        const userMenuItems = (state.menuItems || []).filter((item) =>
            item && item.id !== 'menu-default-1'
        );

        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            customCategories: customCategories,
            customDict: customDict,
            userMenuItems: userMenuItems,
            playerMarks: state.playerMarks || {},
            settings: {
                ui: state.ui || {},
                highlights: state.highlights || {},
                hallOfFame: { ui: (state.hallOfFame && state.hallOfFame.ui) || {} },
                profileEnhancements: state.profileEnhancements || {},
                guildEnhancements: state.guildEnhancements || {},
            },
        };
    }

    // Импорт: свежие дефолтные данные из расширения + пользовательские из файла.
    async function importConfig(parsed) {
        if (!parsed || typeof parsed !== 'object') throw new Error('Ожидается объект JSON');
        if (typeof parsed.version !== 'number') {
            throw new Error('Файл не от этого расширения (нет поля version)');
        }

        // Категории: свежие дефолтные + custom из файла.
        const freshDefaultCats = GH.utils.deepClone(GH.dataDefaults.categories || []);
        const customCatsRaw = Array.isArray(parsed.customCategories) ? parsed.customCategories : [];
        const cleanCats = [];
        const seenTypeids = new Set(freshDefaultCats.map((c) => c.typeid));
        customCatsRaw.forEach((c) => {
            if (!c || typeof c !== 'object') return;
            const tid = Number(c.typeid);
            if (!Number.isFinite(tid) || tid < 1) return;
            if (seenTypeids.has(tid)) return;
            seenTypeids.add(tid);
            cleanCats.push({
                typeid: tid,
                name: String(c.name || '').trim() || ('Категория ' + tid),
                enabled: c.enabled !== false,
                regular: c.regular === true,
                custom: true,
            });
        });

        // Меню: свежий дефолтный пункт + пользовательские из файла.
        const freshMenuItems = GH.utils.deepClone(GH.dataDefaults.menuItems || []);
        const userMenuItemsRaw = Array.isArray(parsed.userMenuItems) ? parsed.userMenuItems : [];
        const cleanMenuItems = [];
        userMenuItemsRaw.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            const id = String(item.id || '').trim();
            const title = String(item.title || '').trim();
            const url = String(item.url || '').trim();
            const menuKey = String(item.menuKey || 'misc').trim();
            if (!id || !title || !url) return;
            if (id === 'menu-default-1') return;
            cleanMenuItems.push({
                id: id,
                enabled: item.enabled !== false,
                menuKey: menuKey,
                title: title,
                url: url,
            });
        });

        // Словарь: свежие дефолтные + custom из файла.
        const freshDefaultsDict = GH.storage.loadDefaultDict();
        const customDictRaw = Array.isArray(parsed.customDict) ? parsed.customDict : [];
        const cleanDict = [];
        customDictRaw.forEach((r) => {
            if (!r || typeof r !== 'object') return;
            const tid = Number(r.typeid);
            const name = normalizeName(r.name);
            if (!Number.isFinite(tid) || !name) return;
            cleanDict.push({
                typeid: tid,
                name: name,
                level: r.level || null,
                type: r.type || null,
                custom: true,
            });
        });

        // Собираем новый state из дефолтов.
        const newState = GH.storage.stateFromDefaults();
        newState.categories = freshDefaultCats.concat(cleanCats);
        newState.menuItems = freshMenuItems.concat(cleanMenuItems);

        // Применяем настройки из файла.
        const s = parsed.settings || {};
        if (s.ui && typeof s.ui === 'object') newState.ui = s.ui;
        if (s.highlights && typeof s.highlights === 'object') newState.highlights = s.highlights;
        newState.hallOfFame = newState.hallOfFame || {};
        if (s.hallOfFame && s.hallOfFame.ui && typeof s.hallOfFame.ui === 'object') {
            newState.hallOfFame.ui = s.hallOfFame.ui;
        }
        if (s.profileEnhancements && typeof s.profileEnhancements === 'object') {
            newState.profileEnhancements = s.profileEnhancements;
        }
        if (s.guildEnhancements && typeof s.guildEnhancements === 'object') {
            newState.guildEnhancements = s.guildEnhancements;
        }
        if (parsed.playerMarks && typeof parsed.playerMarks === 'object') {
            newState.playerMarks = parsed.playerMarks;
        }

        // Нормализация через migrate (заполняет пропущенные поля, страхует).
        state = GH.storage.migrate(newState);
        await persist();

        // Словарь сохраняем отдельно.
        await GH.storage.saveDict(freshDefaultsDict.concat(cleanDict));
        await loadDict();

        renderAll();
    }

    $('#export-config-btn').addEventListener('click', () => {
        const payload = buildConfigPayload();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gladiators-config.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    $('#import-config-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (!confirm('Заменить текущие пользовательские данные тем, что в файле?')) return;
                await importConfig(parsed);
                toast('Импорт успешен');
            } catch (err) {
                alert('Ошибка импорта: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Экспорт/импорт словаря — только пользовательские записи.
    $('#dict-export-json-btn').addEventListener('click', () => {
        const custom = getCustomDict();
        const blob = new Blob([JSON.stringify(custom, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gladiators-tournaments-custom.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    $('#dict-import-json-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const raw = JSON.parse(reader.result);
                let arr;
                try { arr = GH.hallOfFameFilter.dict.normalizeDict(raw); }
                catch (err) { alert('Ошибка: ' + err.message); return; }

                const clean = [];
                arr.forEach((r) => {
                    if (!r || typeof r !== 'object' || Array.isArray(r)) return;
                    const typeid = Number(r.typeid);
                    const name = normalizeName(r.name);
                    if (!Number.isFinite(typeid) || !name) return;
                    clean.push({
                        typeid: typeid,
                        name: name,
                        level: r.level || null,
                        type: r.type || null,
                        custom: true,
                    });
                });
                if (clean.length === 0) { alert('Пусто.'); return; }

                const defaults = getDefaultDict();
                dict = defaults.concat(clean);
                await saveDict();
                renderDict();
                toast('Импортировано ' + clean.length + ' записей');
            } catch (err) {
                alert('Ошибка импорта: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    $('#reset-btn').addEventListener('click', async () => {
        if (!confirm('Сбросить ВСЁ к дефолтам? Пользовательские категории, ' +
            'словарь и метки игроков тоже удалятся.')) return;
        state = await GH.storage.resetToDefaults();
        await loadDict();
        renderAll();
        toast('Всё сброшено');
    });

    // ==========================================================================
    // Вкладки (sidebar) + Collapse-секции
    // ==========================================================================

    function switchView(view) {
        $$('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
        $$('.view').forEach((sec) => {
            const name = sec.id.replace(/^view-/, '');
            sec.classList.toggle('hidden', name !== view);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    $$('.nav-item').forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.view)));

    function ensureManagerUi() {
        state.ui = state.ui || {};
        if (!state.ui.manager || typeof state.ui.manager !== 'object') {
            state.ui.manager = {};
        }
        const m = state.ui.manager;

        if (!Array.isArray(m.collapsed)) {
            m.collapsed = [];
            if (m.categoriesCollapsed !== false) m.collapsed.push('block-categories');
            if (m.dictCollapsed !== false) m.collapsed.push('block-dict');
            m.collapsed.push('block-profile-player');
            m.collapsed.push('block-profile-guild');
            delete m.categoriesCollapsed;
            delete m.dictCollapsed;
        }
    }

    function isCollapsed(blockId) {
        ensureManagerUi();
        return state.ui.manager.collapsed.indexOf(blockId) !== -1;
    }

    function applyCollapseState() {
        $$('.collapse-block').forEach((block) => {
            const id = block.id;
            if (!id) return;
            block.classList.toggle('collapsed', isCollapsed(id));
            updateCollapseBtn(block);
        });
    }

    function updateCollapseBtn(block) {
        const btn = block.querySelector('.collapse-btn');
        if (!btn) return;
        const collapsed = block.classList.contains('collapsed');
        btn.textContent = collapsed ? '▶ Развернуть' : '▼ Свернуть';
    }

    $$('.collapse-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const block = btn.closest('.collapse-block');
            if (!block || !block.id) return;
            block.classList.toggle('collapsed');
            updateCollapseBtn(block);
            ensureManagerUi();
            const id = block.id;
            const list = state.ui.manager.collapsed;
            const idx = list.indexOf(id);
            if (block.classList.contains('collapsed')) {
                if (idx === -1) list.push(id);
            } else {
                if (idx !== -1) list.splice(idx, 1);
            }
            await persist();
        });
    });

    // ==========================================================================
    // Общий рендер / инициализация
    // ==========================================================================

    function renderAll() {
        renderCategories();
        renderMenuItems();
        renderFofCategoriesTable();
        renderFofNonRegularList();
        renderProfileBlocksList();
        renderProfileHiddenCount();
        renderProfileNonRegularList();
        renderProfileHighlightSettings();
        renderGuildBlocksList();
        renderGuildHiddenCount();
        renderPlayersTable();
        renderPlayersStatus();
        renderDictFilterOptions();
        renderDict();
        renderHighlightSettings();
        applyCollapseState();
    }

    async function init() {
        state = await GH.store.ensureLoaded();
        await loadDict();
        renderAll();

        chrome.storage.onChanged.addListener(async (changes, area) => {
            if (area !== 'local') return;
            if (changes[GH.storage.STATE_KEY]) {
                GH.store.invalidate();
                state = await GH.store.ensureLoaded();
                renderAll();
            }
            if (changes[GH.storage.DICT_KEY]) {
                await loadDict();
                renderDict();
            }
        });
    }

    init();
})();