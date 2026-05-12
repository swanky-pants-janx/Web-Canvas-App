/* Web Canvas — canvas.js */

(function () {

  /* ── State ── */
  let panX = 0, panY = 0, scale = 1;
  let dragging  = null;     // { el, sx, sy, ox, oy, others[] }
  let resizing  = null;     // { el, sx, sy, ow, oh, ratio }
  let selecting = null;     // { sx, sy, moved }
  let selected  = new Set();
  let spaceDown = false;
  let gridLock  = false;
  const GRID    = 24;

  function snap(v) { return gridLock ? Math.round(v / GRID) * GRID : v; }
  let folders  = {};    // folderId -> [dataURL, ...]
  let openModal = null;
  let dropperCallback = null; // set when dropper is active
  let folderDrag = null;      // { src, folderId, imgIdx, ghost, sx, sy, live }

  /* ── Projects ── */
  const META_KEY = 'wc_projects';
  let projects = [];          // [{ id, name }, ...]
  let activeProjectId = null;

  function genId() { return 'p' + Date.now() + Math.random().toString(36).slice(2, 6); }

  function loadMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY)); } catch { return null; }
  }

  function saveMeta() {
    localStorage.setItem(META_KEY, JSON.stringify({ projects, activeId: activeProjectId }));
  }

  function getProjectData(id) {
    try { return JSON.parse(localStorage.getItem('wc_proj_' + id)); } catch { return null; }
  }

  function saveProjectData(id, data) {
    try { localStorage.setItem('wc_proj_' + id, JSON.stringify(data)); } catch (e) {
      console.warn('Could not save project (storage full?)', e);
    }
  }

  function deleteProjectData(id) {
    localStorage.removeItem('wc_proj_' + id);
  }

  function serializeCanvasState() {
    const widgets = [];
    document.querySelectorAll('#world .widget').forEach(el => {
      if (el.classList.contains('folder-modal')) return;
      const data = serializeWidgetFull(el);
      if (data) widgets.push(data);
    });
    return { panX, panY, scale, widgets, folders: JSON.parse(JSON.stringify(folders)) };
  }

  function serializeWidgetFull(el) {
    if (el.classList.contains('w-folder')) {
      const id = el.dataset.folderId;
      return {
        type: 'folder',
        left: parseInt(el.style.left) || 0,
        top:  parseInt(el.style.top)  || 0,
        width: el.offsetWidth,
        height: el.offsetHeight,
        locked: el.dataset.locked === 'true',
        title: el.querySelector('.folder-title').textContent,
        folderId: id,
        images: folders[id] || [],
      };
    }
    return serializeWidget(el);
  }

  function restoreCanvasState(state) {
    world.innerHTML = '';
    folders = {};
    openModal = null;
    selected.clear();

    if (!state) return;

    panX = state.panX || 0;
    panY = state.panY || 0;
    scale = state.scale || 1;
    applyTransform();

    (state.widgets || []).forEach(data => {
      let el = null;
      if (data.type === 'folder') {
        folders[data.folderId] = (state.folders && state.folders[data.folderId]) || data.images || [];
        el = addFolder(data.left, data.top, data.folderId);
        el.querySelector('.folder-title').textContent = data.title || 'Assets';
        el._refreshThumbs();
      } else if (data.type === 'image') {
        el = addImage(data.src, 0, 0);
      } else if (data.type === 'text') {
        el = addText(data.subtype, '', data.left, data.top, data.width, data.height, true, data.items);
        if (data.subtype !== 'todo') el.querySelector('.editable').textContent = data.text || '';
        if (data.bgColor) el.style.backgroundColor = data.bgColor;
        if (data.textColor) el.style.setProperty('--widget-color', data.textColor);
      } else if (data.type === 'palette') {
        el = addPalette(data.left, data.top, data.colors);
        el.querySelector('.palette-name').textContent = data.name;
      } else if (data.type === 'video') {
        el = addVideo(data.videoId, 0, 0);
      }
      if (el) {
        el.style.left  = data.left  + 'px';
        el.style.top   = data.top   + 'px';
        el.style.width = data.width + 'px';
        if (data.type !== 'text') el.style.height = data.height + 'px';
        if (data.locked) {
          el.dataset.locked = 'true';
          el.classList.add('locked');
          const lb = el.querySelector('.lip-lock');
          if (lb) { lb.classList.add('active'); lb.title = 'Unlock widget'; }
        }
      }
    });
  }

  function saveCurrentProject() {
    if (!activeProjectId) return;
    saveProjectData(activeProjectId, serializeCanvasState());
  }

  function switchProject(id) {
    if (id === activeProjectId) return;
    saveCurrentProject();
    activeProjectId = id;
    saveMeta();
    restoreCanvasState(getProjectData(id));
    renderSidebar();
  }

  function createProject(name) {
    const id = genId();
    projects.push({ id, name });
    saveProjectData(id, { panX: 0, panY: 0, scale: 1, widgets: [], folders: {} });
    saveMeta();
    return id;
  }

  function deleteProject(id) {
    if (projects.length <= 1) return;
    deleteProjectData(id);
    projects = projects.filter(p => p.id !== id);
    if (activeProjectId === id) {
      activeProjectId = projects[0].id;
      restoreCanvasState(getProjectData(activeProjectId));
    }
    saveMeta();
    renderSidebar();
  }

  function renameProject(id, name) {
    const p = projects.find(p => p.id === id);
    if (p) { p.name = name; saveMeta(); }
  }

  /* ── Sidebar rendering ── */
  function renderSidebar() {
    const list = document.getElementById('project-list');
    list.innerHTML = '';
    projects.forEach(p => {
      const item = document.createElement('div');
      item.className = 'project-item' + (p.id === activeProjectId ? ' active' : '');
      item.dataset.id = p.id;

      const nameEl = document.createElement('span');
      nameEl.className = 'project-name';
      nameEl.textContent = p.name;

      const actions = document.createElement('div');
      actions.className = 'project-actions';

      const renameBtn = document.createElement('button');
      renameBtn.className = 'btn-proj-rename';
      renameBtn.title = 'Rename';
      renameBtn.textContent = '✎';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-proj-delete';
      deleteBtn.title = 'Delete';
      deleteBtn.textContent = 'x';
      deleteBtn.disabled = projects.length <= 1;

      renameBtn.addEventListener('click', e => {
        e.stopPropagation();
        startRenameProject(p.id, nameEl, item);
      });

      deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        deleteProject(p.id);
      });

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(nameEl);
      item.appendChild(actions);
      item.addEventListener('click', () => switchProject(p.id));
      list.appendChild(item);
    });

    /* + New Project row at the bottom of the list */
    const addRow = document.createElement('div');
    addRow.className = 'btn-new-project-row';
    const icon = document.createElement('span');
    icon.className = 'new-proj-icon';
    icon.textContent = '+';
    const label = document.createElement('span');
    label.textContent = 'New project';
    addRow.appendChild(icon);
    addRow.appendChild(label);
    addRow.addEventListener('click', () => {
      saveCurrentProject();
      const name = 'Project ' + (projects.length + 1);
      const id = createProject(name);
      activeProjectId = id;
      saveMeta();
      restoreCanvasState(null);
      renderSidebar();
    });
    list.appendChild(addRow);
  }

  function startRenameProject(id, nameEl, item) {
    const p = projects.find(pr => pr.id === id);
    if (!p) return;
    const input = document.createElement('input');
    input.className = 'project-rename-input';
    input.value = p.name;
    nameEl.replaceWith(input);
    input.focus();
    input.select();

    function commit() {
      const val = input.value.trim() || p.name;
      renameProject(id, val);
      const newSpan = document.createElement('span');
      newSpan.className = 'project-name';
      newSpan.textContent = val;
      input.replaceWith(newSpan);
      newSpan.closest('.project-item').addEventListener('click', () => switchProject(id));
      newSpan.closest('.project-item').querySelector('.btn-proj-rename')
        .addEventListener('click', e => { e.stopPropagation(); startRenameProject(id, newSpan, item); });
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = p.name; input.blur(); }
    });
    input.addEventListener('click', e => e.stopPropagation());
  }

  /* ── DOM ── */
  const canvasEl  = document.getElementById('canvas');
  const world     = document.getElementById('world');
  const fileInput = document.getElementById('file-input');
  const dropHint  = document.getElementById('drop-hint');
  const selRect = document.createElement('div');
  selRect.id = 'sel-rect';
  document.body.appendChild(selRect);

  /* ── Transform ── */
  function applyTransform() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  function toWorld(cx, cy) {
    const r = canvasEl.getBoundingClientRect();
    return {
      x: (cx - r.left - panX) / scale,
      y: (cy - r.top  - panY) / scale,
    };
  }

  function viewCenter() {
    const r = canvasEl.getBoundingClientRect();
    return toWorld(r.left + r.width / 2, r.top + r.height / 2);
  }

  applyTransform();

  /* ── Selection helpers ── */
  function updateSelectionStyles() {
    document.querySelectorAll('#world .widget').forEach(w => {
      w.classList.toggle('selected', selected.has(w));
    });
  }

  function clearSelection() {
    selected.clear();
    updateSelectionStyles();
  }

  function finalizeSelection(x1, y1, x2, y2) {
    const p1 = toWorld(Math.min(x1, x2), Math.min(y1, y2));
    const p2 = toWorld(Math.max(x1, x2), Math.max(y1, y2));
    selected.clear();
    document.querySelectorAll('#world .widget').forEach(w => {
      if (w.dataset.locked === 'true') return;
      const wx = parseInt(w.style.left) || 0;
      const wy = parseInt(w.style.top)  || 0;
      const ww = w.offsetWidth;
      const wh = w.offsetHeight;
      if (wx < p2.x && wx + ww > p1.x && wy < p2.y && wy + wh > p1.y) {
        selected.add(w);
      }
    });
    updateSelectionStyles();
  }

  /* ── Drag (shared) ── */
  function startDrag(e, el) {
    if (spaceDown) return;
    const target = el || e.currentTarget;
    if (target.dataset.locked === 'true') return;
    e.stopPropagation();

    /* if clicking a widget not in the selection, clear and drag only it */
    if (!selected.has(target)) {
      clearSelection();
      selected.add(target);
      updateSelectionStyles();
    }

    const others = selected.size > 1
      ? [...selected].filter(x => x !== target).map(x => ({
          el: x,
          ox: parseInt(x.style.left) || 0,
          oy: parseInt(x.style.top)  || 0,
        }))
      : [];

    dragging = {
      el: target,
      sx: e.clientX, sy: e.clientY,
      ox: parseInt(target.style.left) || 0,
      oy: parseInt(target.style.top)  || 0,
      others,
    };
  }

  /* drag for palette/folder (click anywhere on card, skip interactive children) */
  function startCardDrag(e) {
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT') return;
    if (e.target.isContentEditable) return;
    if (e.target.closest('.resize-grip')) return;
    if (e.target.closest('.swatch')) return;
    if (e.target.closest('.add-swatch')) return;
    if (e.target.closest('.folder-header')) return;
    if (e.target.closest('.widget-bar')) return;
    startDrag(e);
  }

  /* ── Resize grip ── */
  function addResizeGrip(el) {
    const grip = document.createElement('div');
    grip.className = 'resize-grip';
    grip.addEventListener('mousedown', e => {
      if (el.dataset.locked === 'true') return;
      e.stopPropagation();
      const ow = el.offsetWidth, oh = el.offsetHeight;
      resizing = { el, sx: e.clientX, sy: e.clientY, ow, oh, ratio: ow / oh };
    });
    el.appendChild(grip);
  }

  /* ── Widget delete bar (for card widgets) ── */
  function addWidgetBar(el) {
    const bar = document.createElement('div');
    bar.className = 'widget-bar';
    const del = document.createElement('button');
    del.textContent = 'x';
    del.title = 'Delete';
    del.addEventListener('mousedown', e => { e.stopPropagation(); el.remove(); });
    bar.appendChild(del);
    el.appendChild(bar);
  }

  /* ── Lip (drag handle for text/note/heading) ── */
  function addLip(el) {
    const lip = document.createElement('div');
    lip.className = 'lip';

    const grip = document.createElement('div');
    grip.className = 'grip';

    let typeSelect = null;
    if (el.classList.contains('w-text')) {
      typeSelect = document.createElement('select');
      typeSelect.className = 'lip-type-select';
      [['body', 'Paragraph'], ['heading', 'Header'], ['todo', 'To-do list']].forEach(([val, label]) => {
        const opt = document.createElement('option');
        opt.value = val; opt.textContent = label;
        typeSelect.appendChild(opt);
      });
      const currentType = el.classList.contains('heading') ? 'heading'
                        : el.classList.contains('note')    ? 'note'
                        : el.classList.contains('todo')    ? 'todo' : 'body';
      typeSelect.value = currentType;
      typeSelect.addEventListener('mousedown', e => e.stopPropagation());
      typeSelect.addEventListener('change', () => {
        const oldType = el.classList.contains('heading') ? 'heading'
                      : el.classList.contains('note')    ? 'note'
                      : el.classList.contains('todo')    ? 'todo' : 'body';
        const newType = typeSelect.value;
        el.classList.remove('heading', 'note', 'body', 'todo');
        el.classList.add(newType);
        if (newType === 'todo' && oldType !== 'todo') {
          const ed = el.querySelector('.editable');
          if (ed) ed.remove();
          el.insertBefore(buildTodoList([]), el.querySelector('.lip'));
        } else if (newType !== 'todo' && oldType === 'todo') {
          const tl = el.querySelector('.todo-list');
          if (tl) tl.remove();
          const div = document.createElement('div');
          div.className = 'editable';
          div.contentEditable = 'true';
          div.spellcheck = false;
          div.textContent = '';
          div.addEventListener('focus', () => { if (!div.textContent.trim()) div.textContent = ''; });
          div.addEventListener('blur',  () => { if (!div.textContent.trim()) div.textContent = ''; });
          el.insertBefore(div, el.querySelector('.lip'));
          setTimeout(() => div.focus(), 30);
        }
      });
    }

    let bgPicker = null;
    let bgBtn = null;
    if (el.classList.contains('w-text')) {
      bgBtn = document.createElement('button');
      bgBtn.className = 'lip-bg-btn';
      bgBtn.title = 'Background colour';
      bgBtn.textContent = '◻';

      bgPicker = document.createElement('div');
      bgPicker.className = 'lip-bg-picker';

      const BG_COLOURS = [
        { value: '',        label: 'None',   cls: 'transparent' },
        { value: '#ffffff', label: 'White'  },
        { value: '#fef9c3', label: 'Yellow' },
        { value: '#dbeafe', label: 'Blue'   },
        { value: '#dcfce7', label: 'Green'  },
        { value: '#fce7f3', label: 'Pink'   },
        { value: '#ede9fe', label: 'Purple' },
      ];

      BG_COLOURS.forEach(c => {
        const dot = document.createElement('button');
        dot.className = 'bg-swatch' + (c.cls ? ' ' + c.cls : '');
        dot.title = c.label;
        if (c.value) dot.style.background = c.value;
        dot.addEventListener('mousedown', e => e.stopPropagation());
        dot.addEventListener('click', e => {
          e.stopPropagation();
          el.style.backgroundColor = c.value;
          el.style.setProperty('--widget-color', c.value ? '#1a1a1a' : '#ffffff');
          bgPicker.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
          dot.classList.add('active');
          bgPicker.classList.remove('open');
        });
        bgPicker.appendChild(dot);
      });

      bgBtn.addEventListener('mousedown', e => e.stopPropagation());
      bgBtn.addEventListener('click', e => { e.stopPropagation(); bgPicker.classList.toggle('open'); });
      bgPicker.addEventListener('mousedown', e => e.stopPropagation());
    }

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lip-lock';
    lockBtn.title = 'Lock widget';
    lockBtn.textContent = 'lock';
    lockBtn.addEventListener('mousedown', e => e.stopPropagation());
    lockBtn.addEventListener('click', e => {
      e.stopPropagation();
      const locked = el.dataset.locked === 'true';
      el.dataset.locked = locked ? 'false' : 'true';
      el.classList.toggle('locked', !locked);
      lockBtn.classList.toggle('active', !locked);
      lockBtn.title = locked ? 'Lock widget' : 'Unlock widget';
    });

    const del = document.createElement('button');
    del.className = 'lip-del';
    del.textContent = 'x';
    del.title = 'Delete';
    del.addEventListener('mousedown', e => { e.stopPropagation(); el.remove(); });

    lip.appendChild(grip);
    if (typeSelect) lip.appendChild(typeSelect);
    if (bgBtn) { lip.appendChild(bgBtn); lip.appendChild(bgPicker); }
    lip.appendChild(lockBtn);
    lip.appendChild(del);

    lip.addEventListener('mousedown', e => {
      if (e.target === del || e.target === lockBtn || e.target === typeSelect) return;
      startDrag(e, el);
    });

    el.appendChild(lip);
  }

  /* ── Image widget ── */
  function addImage(src, x, y) {
    const el = document.createElement('div');
    el.className = 'widget w-image';
    el.style.left   = (x - 110) + 'px';
    el.style.top    = (y - 80)  + 'px';
    el.style.width  = '220px';
    el.style.height = '160px';

    const inner = document.createElement('div');
    inner.className = 'img-inner';
    const img = document.createElement('img');
    img.src = src;
    inner.appendChild(img);
    el.appendChild(inner);

    addLip(el);
    addResizeGrip(el);

    el.addEventListener('mousedown', e => {
      if (e.target.closest('.lip') || e.target.closest('.resize-grip')) return;
      startDrag(e, el);
    });

    world.appendChild(el);
    return el;
  }

  /* ── To-do list builder ── */
  function buildTodoList(items) {
    const list = document.createElement('div');
    list.className = 'todo-list';

    const addBtn = document.createElement('button');
    addBtn.className = 'todo-add';
    addBtn.textContent = '+ Add item';
    addBtn.addEventListener('mousedown', e => e.stopPropagation());

    function addTodoItem(text, checked) {
      const row = document.createElement('div');
      row.className = 'todo-item' + (checked ? ' done' : '');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'todo-check';
      cb.checked = !!checked;
      cb.addEventListener('mousedown', e => e.stopPropagation());
      cb.addEventListener('change', () => row.classList.toggle('done', cb.checked));

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.contentEditable = 'true';
      span.spellcheck = false;
      span.textContent = text || '';
      span.addEventListener('mousedown', e => e.stopPropagation());
      span.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const nr = addTodoItem('', false);
          row.after(nr);
          nr.querySelector('.todo-text').focus();
        } else if (e.key === 'Backspace' && span.textContent === '') {
          e.preventDefault();
          const prev = row.previousElementSibling;
          if (prev && prev.classList.contains('todo-item')) prev.querySelector('.todo-text').focus();
          row.remove();
        }
      });

      row.appendChild(cb);
      row.appendChild(span);
      list.insertBefore(row, addBtn);
      return row;
    }

    addBtn.addEventListener('click', e => {
      e.stopPropagation();
      addTodoItem('', false).querySelector('.todo-text').focus();
    });

    list.appendChild(addBtn);
    (items && items.length ? items : [{ text: '', checked: false }]).forEach(i => addTodoItem(i.text, i.checked));
    return list;
  }

  /* ── Text / Heading / Note / Todo widget ── */
  function addText(type, placeholder, x, y, w, h, noFocus, todoItems) {
    const el = document.createElement('div');
    el.className = 'widget w-text ' + type;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    if (w) el.style.width = w + 'px';

    if (type === 'todo') {
      el.appendChild(buildTodoList(todoItems));
    } else {
      const div = document.createElement('div');
      div.className = 'editable';
      div.contentEditable = 'true';
      div.spellcheck = false;
      div.textContent = placeholder;
      div.addEventListener('focus', () => { if (div.textContent === placeholder) div.textContent = ''; });
      div.addEventListener('blur',  () => { if (!div.textContent.trim()) div.textContent = placeholder; });
      el.appendChild(div);
      if (!noFocus) setTimeout(() => div.focus(), 30);
    }

    addLip(el);
    addResizeGrip(el);

    world.appendChild(el);
    return el;
  }

  /* ── Palette widget ── */
  function addPalette(x, y, colors) {
    colors = colors || ['#5b5bd6', '#f59e0b', '#10b981', '#f43f5e'];

    const el = document.createElement('div');
    el.className = 'widget w-palette';
    el.style.left   = x + 'px';
    el.style.top    = y + 'px';
    el.style.width  = '240px';
    el.style.height = '168px';

    /* label */
    const lbl = document.createElement('div');
    lbl.className = 'palette-label';
    lbl.textContent = 'Colour palette';

    /* header row: name + dropper */
    const header = document.createElement('div');
    header.className = 'palette-header';

    const name = document.createElement('div');
    name.className = 'palette-name';
    name.contentEditable = 'true';
    name.spellcheck = false;
    name.textContent = 'My Palette';
    name.addEventListener('mousedown', e => e.stopPropagation());

    const dropperBtn = document.createElement('button');
    dropperBtn.className = 'dropper-btn';
    dropperBtn.textContent = 'Pick colour';
    dropperBtn.title = 'Pick a colour from the canvas';
    dropperBtn.addEventListener('mousedown', e => e.stopPropagation());
    dropperBtn.addEventListener('click', e => {
      e.stopPropagation();
      activateDropper(hex => addSwatch(hex), dropperBtn);
    });

    header.appendChild(name);
    header.appendChild(dropperBtn);

    /* swatches row */
    const swatchRow = document.createElement('div');
    swatchRow.className = 'swatches';

    const addBtn = document.createElement('div');
    addBtn.className = 'add-swatch';
    addBtn.textContent = '+';
    addBtn.title = 'Add colour';
    addBtn.addEventListener('mousedown', e => e.stopPropagation());
    addBtn.addEventListener('click', e => {
      e.stopPropagation();
      const hex = prompt('Enter hex colour (e.g. #ff6600)', '#5b5bd6');
      if (hex && /^#[0-9a-fA-F]{3,6}$/.test(hex.trim())) addSwatch(hex.trim().toLowerCase());
    });
    swatchRow.appendChild(addBtn);

    function addSwatch(hex) {
      const s = document.createElement('div');
      s.className = 'swatch';
      s.style.background = hex;

      const hexLbl = document.createElement('div');
      hexLbl.className = 'swatch-hex';
      hexLbl.textContent = hex;

      const copied = document.createElement('div');
      copied.className = 'swatch-copied';
      copied.textContent = 'copied';

      const delBtn = document.createElement('button');
      delBtn.className = 'swatch-del';
      delBtn.textContent = 'x';
      delBtn.title = 'Remove colour';
      delBtn.addEventListener('mousedown', e => e.stopPropagation());
      delBtn.addEventListener('click', e => { e.stopPropagation(); s.remove(); });

      s.appendChild(hexLbl);
      s.appendChild(copied);
      s.appendChild(delBtn);

      s.addEventListener('mousedown', e => e.stopPropagation());
      s.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(hex).catch(() => {});
        s.classList.add('flash');
        setTimeout(() => s.classList.remove('flash'), 700);
      });

      swatchRow.insertBefore(s, addBtn);
    }

    colors.forEach(addSwatch);

    el.appendChild(lbl);
    el.appendChild(header);
    el.appendChild(swatchRow);

    addLip(el);
    addResizeGrip(el);

    world.appendChild(el);
    return el;
  }

  /* ── Colour dropper ── */
  function activateDropper(callback, btn) {
    if (window.EyeDropper) {
      if (btn) btn.classList.add('active');
      const dropper = new window.EyeDropper();
      dropper.open()
        .then(result => {
          callback(result.sRGBHex);
        })
        .catch(() => {})
        .finally(() => { if (btn) btn.classList.remove('active'); });
    } else {
      /* fallback: enter manual pick mode — click anywhere on canvas reads approximate colour */
      if (dropperCallback) {
        /* cancel existing */
        dropperCallback = null;
        document.body.classList.remove('dropper-mode');
        if (btn) btn.classList.remove('active');
        return;
      }
      dropperCallback = callback;
      document.body.classList.add('dropper-mode');
      if (btn) btn.classList.add('active');
      /* clicking the canvas picks white/background as fallback */
      const msg = document.createElement('div');
      msg.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:7px 16px;border-radius:20px;font-size:12px;z-index:9999;pointer-events:none';
      msg.textContent = 'EyeDropper not supported — use Chrome/Edge for colour picking';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3500);
      dropperCallback = null;
      document.body.classList.remove('dropper-mode');
      if (btn) btn.classList.remove('active');
    }
  }

  /* ── Folder drag helpers ── */
  function getFolderAtPoint(cx, cy, excludeEl) {
    for (const el of document.elementsFromPoint(cx, cy)) {
      const f = el.closest('.w-folder');
      if (f && f !== excludeEl) return f;
    }
    return null;
  }

  function startFolderDrag(e, src, folderId, imgIdx) {
    e.stopPropagation();
    e.preventDefault();
    const ghost = document.createElement('div');
    ghost.style.cssText = `position:fixed;left:${e.clientX - 44}px;top:${e.clientY - 44}px;width:88px;height:88px;pointer-events:none;z-index:9999;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.3);opacity:0.88;transition:none;`;
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;';
    ghost.appendChild(img);
    document.body.appendChild(ghost);
    folderDrag = { src, folderId, imgIdx, ghost, sx: e.clientX, sy: e.clientY, live: false };
  }

  function clearFolderDropHighlight() {
    document.querySelectorAll('.w-folder.folder-drop-target').forEach(f => f.classList.remove('folder-drop-target'));
  }

  /* ── Folder widget ── */
  function addFolder(x, y, existingId) {
    const id = existingId || 'f' + Date.now();
    if (!existingId) folders[id] = [];

    const el = document.createElement('div');
    el.className = 'widget w-folder';
    el.style.left   = x + 'px';
    el.style.top    = y + 'px';
    el.style.width  = '240px';
    el.style.height = '168px';
    el.dataset.folderId = id;

    /* header */
    const header = document.createElement('div');
    header.className = 'folder-header';

    const icon = document.createElement('div');
    icon.className = 'folder-icon';

    const title = document.createElement('div');
    title.className = 'folder-title';
    title.contentEditable = 'true';
    title.spellcheck = false;
    title.textContent = 'Assets';
    title.addEventListener('mousedown', e => e.stopPropagation());
    title.addEventListener('click', e => e.stopPropagation());

    const count = document.createElement('span');
    count.className = 'folder-count';
    count.textContent = '0 items';

    const dlBtn = document.createElement('button');
    dlBtn.className = 'folder-dl';
    dlBtn.title = 'Download all images';
    dlBtn.textContent = '↓';
    dlBtn.addEventListener('mousedown', e => e.stopPropagation());
    dlBtn.addEventListener('click', e => {
      e.stopPropagation();
      const imgs = folders[id] || [];
      if (!imgs.length) return;
      imgs.forEach((src, i) => {
        setTimeout(() => {
          const ext = src.match(/data:image\/(\w+)/)?.[1] || 'png';
          const a = document.createElement('a');
          a.href = src;
          a.download = `${(el.querySelector('.folder-title').textContent || 'folder').trim()}-${i + 1}.${ext}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, i * 120);
      });
    });

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(count);
    header.appendChild(dlBtn);
    header.addEventListener('click', e => {
      if (e.target === title) return;
      e.stopPropagation();
      openFolderModal(id, el);
    });

    const thumbs = document.createElement('div');
    thumbs.className = 'folder-thumbs';
    thumbs.id = 'thumbs-' + id;

    const dropZone = document.createElement('div');
    dropZone.className = 'folder-drop';
    dropZone.textContent = 'Drop images here';

    el.appendChild(header);
    el.appendChild(thumbs);
    el.appendChild(dropZone);

    addLip(el);
    addResizeGrip(el);

    /* folder drop */
    el.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('over'); });
    el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) dropZone.classList.remove('over'); });
    el.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('over');
      Array.from(e.dataTransfer.files)
        .filter(f => f.type.startsWith('image/'))
        .forEach(f => readIntoFolder(f, id));
    });

    world.appendChild(el);

    el._refreshThumbs = function () {
      const imgs = folders[id];
      count.textContent = imgs.length + ' item' + (imgs.length !== 1 ? 's' : '');
      thumbs.innerHTML = '';
      imgs.slice(0, 6).forEach((src, idx) => {
        const t = document.createElement('div');
        t.className = 'folder-thumb';
        const img = document.createElement('img');
        img.src = src;
        t.appendChild(img);
        t.addEventListener('mousedown', e => {
          if (e.button !== 0) return;
          startFolderDrag(e, src, id, idx);
        });
        thumbs.appendChild(t);
      });
    };
    return el;
  }

  /* ── YouTube video widget ── */
  function extractYoutubeId(url) {
    const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function addVideo(videoId, x, y) {
    const el = document.createElement('div');
    el.className = 'widget w-video';
    el.style.left   = (x - 200) + 'px';
    el.style.top    = (y - 113) + 'px';
    el.style.width  = '400px';
    el.style.height = '225px';
    el.dataset.videoId = videoId;

    const inner = document.createElement('div');
    inner.className = 'video-inner';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    inner.appendChild(iframe);
    el.appendChild(inner);

    addLip(el);
    addResizeGrip(el);

    el.addEventListener('mousedown', e => {
      if (e.target.closest('.lip') || e.target.closest('.resize-grip')) return;
      startDrag(e, el);
    });

    world.appendChild(el);
    return el;
  }

  /* ── JPEG conversion ── */
  function toJpeg(src, callback) {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width  = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      callback(c.toDataURL('image/jpeg', 0.85));
    };
    img.src = src;
  }

  function readIntoFolder(file, id) {
    const r = new FileReader();
    r.onload = ev => {
      toJpeg(ev.target.result, jpeg => {
        folders[id].push(jpeg);
        const folderEl = document.querySelector(`[data-folder-id="${id}"]`);
        if (folderEl && folderEl._refreshThumbs) folderEl._refreshThumbs();
        refreshModalIfOpen(id);
      });
    };
    r.readAsDataURL(file);
  }

  /* ── Folder modal ── */
  function openFolderModal(id, folderEl) {
    if (openModal) { openModal.remove(); openModal = null; }

    const modal = document.createElement('div');
    modal.className = 'folder-modal widget';
    modal.dataset.modalFor = id;

    const vc = viewCenter();
    modal.style.left = (vc.x - 160) + 'px';
    modal.style.top  = (vc.y - 120) + 'px';

    const head = document.createElement('div');
    head.className = 'modal-head';

    const ttl = document.createElement('span');
    ttl.textContent = folderEl.querySelector('.folder-title').textContent || 'Assets';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'x';
    closeBtn.addEventListener('mousedown', e => { e.stopPropagation(); modal.remove(); openModal = null; });

    head.appendChild(ttl);
    head.appendChild(closeBtn);

    const grid = document.createElement('div');
    grid.className = 'modal-grid';
    grid.id = 'modal-grid-' + id;

    const hint = document.createElement('div');
    hint.className = 'modal-hint';
    hint.textContent = 'Click an image to place it on the canvas';

    modal.appendChild(head);
    modal.appendChild(grid);
    modal.appendChild(hint);

    modal.addEventListener('mousedown', e => startDrag(e, modal));
    world.appendChild(modal);
    openModal = modal;

    renderModalGrid(id);
  }

  function renderModalGrid(id) {
    const grid = document.getElementById('modal-grid-' + id);
    if (!grid) return;
    grid.innerHTML = '';
    const imgs = folders[id] || [];
    if (imgs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'modal-empty';
      empty.textContent = 'No images yet — drop files onto the folder';
      grid.appendChild(empty);
      return;
    }
    imgs.forEach((src, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'modal-img-wrap';
      const img = document.createElement('img');
      img.src = src;
      wrap.appendChild(img);
      wrap.addEventListener('mousedown', e => {
        e.stopPropagation();
        if (e.button === 0) startFolderDrag(e, src, id, i);
      });
      wrap.addEventListener('click', e => {
        e.stopPropagation();
        const vc = viewCenter();
        addImage(src, vc.x + (Math.random() * 60 - 30), vc.y + (Math.random() * 60 - 30));
        folders[id].splice(i, 1);
        const folderEl = document.querySelector(`[data-folder-id="${id}"]`);
        if (folderEl && folderEl._refreshThumbs) folderEl._refreshThumbs();
        renderModalGrid(id);
      });
      grid.appendChild(wrap);
    });
  }

  function refreshModalIfOpen(id) {
    if (openModal && openModal.dataset.modalFor === id) renderModalGrid(id);
  }

  /* ── Copy / Paste / Duplicate ── */
  let clipboard = [];

  function serializeWidget(el) {
    const base = {
      left:   parseInt(el.style.left)  || 0,
      top:    parseInt(el.style.top)   || 0,
      width:  el.offsetWidth,
      height: el.offsetHeight,
      locked: el.dataset.locked === 'true',
    };
    if (el.classList.contains('w-image')) {
      return { ...base, type: 'image', src: el.querySelector('img').src };
    }
    if (el.classList.contains('w-text')) {
      const subtype = el.classList.contains('heading') ? 'heading'
                    : el.classList.contains('note')    ? 'note'
                    : el.classList.contains('todo')    ? 'todo' : 'body';
      const bgColor   = el.style.backgroundColor || '';
      const textColor = el.style.getPropertyValue('--widget-color') || '';
      if (subtype === 'todo') {
        const items = [...el.querySelectorAll('.todo-item')].map(row => ({
          text: row.querySelector('.todo-text').textContent,
          checked: row.querySelector('.todo-check').checked,
        }));
        return { ...base, type: 'text', subtype: 'todo', items, bgColor, textColor };
      }
      return { ...base, type: 'text', subtype, text: el.querySelector('.editable').textContent, bgColor, textColor };
    }
    if (el.classList.contains('w-palette')) {
      const colors = [...el.querySelectorAll('.swatch-hex')].map(h => h.textContent);
      const name   = el.querySelector('.palette-name').textContent;
      return { ...base, type: 'palette', name, colors };
    }
    if (el.classList.contains('w-video')) {
      return { ...base, type: 'video', videoId: el.dataset.videoId };
    }
    if (el.classList.contains('w-folder')) {
      return null;
    }
    return null;
  }

  function spawnWidget(data, x, y) {
    let el = null;
    if (data.type === 'image') {
      el = addImage(data.src, x + data.width / 2, y + data.height / 2);
      el.style.width  = data.width  + 'px';
      el.style.height = data.height + 'px';
    } else if (data.type === 'text') {
      el = addText(data.subtype, data.text || '', x, y, data.width, data.height, true, data.items);
      if (data.subtype !== 'todo') el.querySelector('.editable').textContent = data.text || '';
      if (data.bgColor) el.style.backgroundColor = data.bgColor;
      if (data.textColor) el.style.setProperty('--widget-color', data.textColor);
    } else if (data.type === 'palette') {
      el = addPalette(x, y, data.colors);
      el.querySelector('.palette-name').textContent = data.name;
    } else if (data.type === 'video') {
      el = addVideo(data.videoId, x + data.width / 2, y + data.height / 2);
      el.style.width  = data.width  + 'px';
      el.style.height = data.height + 'px';
    }
    return el;
  }

  function pasteWidgets(items, dx, dy) {
    if (!items.length) return;
    clearSelection();
    items.forEach(data => {
      const el = spawnWidget(data, data.left + dx, data.top + dy);
      if (el) selected.add(el);
    });
    updateSelectionStyles();
  }

  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const inText = (e.target.isContentEditable && document.activeElement === e.target)
                 || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

    /* Copy */
    if (e.key === 'c' && !inText) {
      if (!selected.size) return;
      clipboard = [...selected].map(serializeWidget).filter(Boolean);
      return;
    }

    /* Paste */
    if (e.key === 'v' && !inText) {
      e.preventDefault();
      pasteWidgets(clipboard, 24, 24);
      return;
    }

    /* Duplicate */
    if (e.key === 'd' && !inText) {
      e.preventDefault();
      if (!selected.size) return;
      const items = [...selected].map(serializeWidget).filter(Boolean);
      pasteWidgets(items, 24, 24);
    }
  });

  /* ── Deselect when interacting with widget internals ── */
  document.addEventListener('focusin', e => {
    if (!e.target.closest('.widget')) return;
    if (e.target.isContentEditable || e.target.tagName === 'INPUT') {
      clearSelection();
    }
  });

  /* ── Close bg picker on outside click ── */
  document.addEventListener('mousedown', () => {
    document.querySelectorAll('.lip-bg-picker.open').forEach(p => p.classList.remove('open'));
  });

  /* ── Delete selected widgets ── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (selected.size === 0) return;
    e.preventDefault();
    const toDelete = [...selected].filter(w => w.dataset.locked !== 'true');
    toDelete.forEach(w => { w.remove(); selected.delete(w); });
  });

  /* ── Spacebar pan ── */
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (!spaceDown) {
      spaceDown = true;
      canvasEl.classList.add('space-pan');
    }
  });

  document.addEventListener('keyup', e => {
    if (e.code !== 'Space') return;
    spaceDown = false;
    canvasEl.classList.remove('space-pan');
    canvasEl.classList.remove('grabbing');
  });

  /* ── Selection & zoom ── */
  canvasEl.addEventListener('mousedown', e => {
    if (dropperCallback) return;
    if (spaceDown) return;
    if (e.target !== canvasEl && e.target !== world) return;
    clearSelection();
    selecting = { sx: e.clientX, sy: e.clientY, moved: false };
    canvasEl.classList.add('selecting');
  });

  let lastMX = 0, lastMY = 0;

  window.addEventListener('mousemove', e => {
    const mdx = e.clientX - lastMX;
    const mdy = e.clientY - lastMY;
    lastMX = e.clientX;
    lastMY = e.clientY;

    if (spaceDown) {
      panX += mdx;
      panY += mdy;
      applyTransform();
      return;
    }

    /* Shift + move = zoom (only when not resizing/dragging/selecting) */
    if (e.shiftKey && !resizing && !dragging && !selecting) {
      if (mdy !== 0) {
        const r  = canvasEl.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        const factor = Math.max(0.5, Math.min(2, 1 - mdy * 0.005));
        const ns = Math.max(0.15, Math.min(5, scale * factor));
        panX = mx - (mx - panX) * (ns / scale);
        panY = my - (my - panY) * (ns / scale);
        scale = ns;
        applyTransform();
      }
      return;
    }

    if (folderDrag) {
      const fd = folderDrag;
      if (!fd.live && (Math.abs(e.clientX - fd.sx) > 4 || Math.abs(e.clientY - fd.sy) > 4)) {
        fd.live = true;
      }
      if (fd.live) {
        fd.ghost.style.left = (e.clientX - 44) + 'px';
        fd.ghost.style.top  = (e.clientY - 44) + 'px';
        const overFolder = getFolderAtPoint(e.clientX, e.clientY, null);
        clearFolderDropHighlight();
        if (overFolder && overFolder.dataset.folderId !== fd.folderId) {
          overFolder.classList.add('folder-drop-target');
        }
      }
      return;
    }

    if (selecting) {
      const dx2 = e.clientX - selecting.sx;
      const dy2 = e.clientY - selecting.sy;
      if (!selecting.moved && (Math.abs(dx2) > 4 || Math.abs(dy2) > 4)) {
        selecting.moved = true;
        selRect.style.display = 'block';
      }
      if (selecting.moved) {
        selRect.style.left   = Math.min(selecting.sx, e.clientX) + 'px';
        selRect.style.top    = Math.min(selecting.sy, e.clientY) + 'px';
        selRect.style.width  = Math.abs(dx2) + 'px';
        selRect.style.height = Math.abs(dy2) + 'px';
      }
      return;
    }

    if (dragging) {
      const dx = (e.clientX - dragging.sx) / scale;
      const dy = (e.clientY - dragging.sy) / scale;
      dragging.el.style.left = snap(dragging.ox + dx) + 'px';
      dragging.el.style.top  = snap(dragging.oy + dy) + 'px';
      dragging.others.forEach(o => {
        o.el.style.left = snap(o.ox + dx) + 'px';
        o.el.style.top  = snap(o.oy + dy) + 'px';
      });
      /* highlight folder if dragging a canvas image over one */
      if (dragging.el.classList.contains('w-image')) {
        const overFolder = getFolderAtPoint(e.clientX, e.clientY, dragging.el);
        clearFolderDropHighlight();
        if (overFolder) overFolder.classList.add('folder-drop-target');
      }
    } else if (resizing) {
      const dx = (e.clientX - resizing.sx) / scale;
      const dy = (e.clientY - resizing.sy) / scale;
      const isText = resizing.el.classList.contains('w-text');
      if (isText) {
        resizing.el.style.width = snap(Math.max(180, resizing.ow + dx)) + 'px';
      } else {
        const isPalette = resizing.el.classList.contains('w-palette');
        const isFolder  = resizing.el.classList.contains('w-folder');
        const minW = isPalette || isFolder ? 240 : 80;
        const minH = isPalette ? 140 : isFolder ? 160 : 40;
        if (e.shiftKey) {
          const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
          const nw = snap(Math.max(minW, resizing.ow + d));
          resizing.el.style.width  = nw + 'px';
          resizing.el.style.height = Math.max(minH, nw / resizing.ratio) + 'px';
        } else {
          resizing.el.style.width  = snap(Math.max(minW, resizing.ow + dx)) + 'px';
          resizing.el.style.height = snap(Math.max(minH, resizing.oh + dy)) + 'px';
        }
      }
    }
  });

  window.addEventListener('mouseup', e => {
    clearFolderDropHighlight();

    /* folder thumbnail / modal → canvas (or between folders) */
    if (folderDrag) {
      const fd = folderDrag;
      fd.ghost.remove();
      if (fd.live) {
        const destFolder = getFolderAtPoint(e.clientX, e.clientY, null);
        if (destFolder && destFolder.dataset.folderId !== fd.folderId) {
          /* move to another folder */
          folders[destFolder.dataset.folderId].push(fd.src);
          destFolder._refreshThumbs();
          refreshModalIfOpen(destFolder.dataset.folderId);
          folders[fd.folderId].splice(fd.imgIdx, 1);
          const srcEl = document.querySelector(`[data-folder-id="${fd.folderId}"]`);
          if (srcEl && srcEl._refreshThumbs) srcEl._refreshThumbs();
          refreshModalIfOpen(fd.folderId);
        } else if (!destFolder) {
          /* place on canvas */
          const pos = toWorld(e.clientX, e.clientY);
          addImage(fd.src, pos.x, pos.y);
          folders[fd.folderId].splice(fd.imgIdx, 1);
          const srcEl = document.querySelector(`[data-folder-id="${fd.folderId}"]`);
          if (srcEl && srcEl._refreshThumbs) srcEl._refreshThumbs();
          refreshModalIfOpen(fd.folderId);
        }
        /* if released over same folder, cancel — image stays */
      }
      folderDrag = null;
      return;
    }

    /* canvas image dragged onto a folder → move into folder */
    if (dragging && dragging.el.classList.contains('w-image')) {
      const destFolder = getFolderAtPoint(e.clientX, e.clientY, dragging.el);
      if (destFolder) {
        const src = dragging.el.querySelector('img').src;
        const folderId = destFolder.dataset.folderId;
        folders[folderId].push(src);
        destFolder._refreshThumbs();
        refreshModalIfOpen(folderId);
        dragging.el.remove();
        selected.delete(dragging.el);
        dragging = null;
        canvasEl.classList.remove('grabbing');
        return;
      }
    }

    if (selecting) {
      if (selecting.moved) {
        finalizeSelection(selecting.sx, selecting.sy, e.clientX, e.clientY);
      }
      selecting = null;
      selRect.style.display = 'none';
      selRect.style.width = selRect.style.height = '0';
      canvasEl.classList.remove('selecting');
    }
    dragging = resizing = null;
    canvasEl.classList.remove('grabbing');
  });

  canvasEl.addEventListener('wheel', e => {
    e.preventDefault();
    const lineSize = 16; // px per line for mice that report in lines
    if (e.ctrlKey) {
      /* Pinch-to-zoom (trackpad) or Ctrl+scroll (mouse) */
      const r  = canvasEl.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const dy = e.deltaMode === 1 ? e.deltaY * lineSize : e.deltaY;
      const factor = Math.pow(0.994, dy);
      const ns = Math.max(0.15, Math.min(5, scale * factor));
      panX = mx - (mx - panX) * (ns / scale);
      panY = my - (my - panY) * (ns / scale);
      scale = ns;
    } else {
      /* Two-finger swipe pan (trackpad) or plain scroll (mouse) */
      const dx = e.deltaMode === 1 ? e.deltaX * lineSize : e.deltaX;
      const dy = e.deltaMode === 1 ? e.deltaY * lineSize : e.deltaY;
      panX -= dx;
      panY -= dy;
    }
    applyTransform();
  }, { passive: false });

  /* ── File drag onto canvas ── */
  document.addEventListener('dragover', e => {
    e.preventDefault();
    if (!e.target.closest('.w-folder')) dropHint.classList.add('active');
  });

  document.addEventListener('dragleave', e => {
    if (!document.contains(e.relatedTarget)) dropHint.classList.remove('active');
  });

  document.addEventListener('drop', e => {
    e.preventDefault();
    dropHint.classList.remove('active');
    if (e.target.closest('.w-folder')) return;
    Array.from(e.dataTransfer.files)
      .filter(f => f.type.startsWith('image/'))
      .forEach((f, i) => {
        const reader = new FileReader();
        reader.onload = ev => {
          const pos = toWorld(e.clientX + i * 20, e.clientY + i * 20);
          toJpeg(ev.target.result, jpeg => addImage(jpeg, pos.x, pos.y));
        };
        reader.readAsDataURL(f);
      });
  });

  /* ── Toolbar ── */
  document.getElementById('btn-image').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    Array.from(e.target.files).forEach((f, i) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const vc = viewCenter();
        toJpeg(ev.target.result, jpeg => addImage(jpeg, vc.x + i * 24, vc.y + i * 24));
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  });

  document.getElementById('btn-text').addEventListener('click', () => {
    const vc = viewCenter();
    addText('body', 'Text...', vc.x - 130, vc.y - 14, 260);
  });

  document.getElementById('btn-palette').addEventListener('click', () => {
    const vc = viewCenter();
    addPalette(vc.x - 100, vc.y - 60);
  });

  document.getElementById('btn-folder').addEventListener('click', () => {
    const vc = viewCenter();
    addFolder(vc.x - 100, vc.y - 55);
  });

  document.getElementById('btn-grid').addEventListener('click', () => {
    gridLock = !gridLock;
    document.getElementById('btn-grid').classList.toggle('active', gridLock);
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    panX = 0; panY = 0; scale = 1;
    applyTransform();
  });

  document.getElementById('btn-video').addEventListener('click', () => {
    const url = prompt('Paste a YouTube URL:');
    if (!url) return;
    const id = extractYoutubeId(url);
    if (!id) { alert('Could not find a YouTube video ID in that URL.\nTry: https://www.youtube.com/watch?v=…'); return; }
    const vc = viewCenter();
    addVideo(id, vc.x, vc.y);
  });

  /* ── Keyboard shortcut cheatsheet ── */
  const cheatsheet = document.createElement('div');
  cheatsheet.id = 'cheatsheet';
  cheatsheet.innerHTML = `
    <div id="cs-box">
      <div class="cs-head">
        <span>Keyboard Shortcuts</span>
        <button id="cs-close">×</button>
      </div>
      <div class="cs-body">
        <div class="cs-section">Canvas</div>
        <div class="cs-row"><div class="cs-keys"><kbd>Space</kbd> + drag</div><div class="cs-desc">Pan canvas</div></div>
        <div class="cs-row"><div class="cs-keys"><kbd>Scroll</kbd> / pinch</div><div class="cs-desc">Zoom in / out</div></div>
        <div class="cs-row"><div class="cs-keys"><kbd>Shift</kbd> + move mouse</div><div class="cs-desc">Zoom with mouse</div></div>
        <div class="cs-section">Widgets</div>
        <div class="cs-row"><div class="cs-keys"><kbd>Del</kbd> / <kbd>Backspace</kbd></div><div class="cs-desc">Delete selected</div></div>
        <div class="cs-row"><div class="cs-keys"><kbd>Shift</kbd> + resize corner</div><div class="cs-desc">Resize proportionally</div></div>
        <div class="cs-section">Selection &amp; Edit</div>
        <div class="cs-row"><div class="cs-keys"><kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>C</kbd></div><div class="cs-desc">Copy selected</div></div>
        <div class="cs-row"><div class="cs-keys"><kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>V</kbd></div><div class="cs-desc">Paste</div></div>
        <div class="cs-row"><div class="cs-keys"><kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>D</kbd></div><div class="cs-desc">Duplicate selected</div></div>
        <div class="cs-section">Other</div>
        <div class="cs-row"><div class="cs-keys"><kbd>?</kbd></div><div class="cs-desc">Toggle this cheatsheet</div></div>
      </div>
    </div>
  `;
  document.body.appendChild(cheatsheet);

  document.getElementById('cs-close').addEventListener('click', () => cheatsheet.classList.remove('active'));
  cheatsheet.addEventListener('mousedown', e => { if (e.target === cheatsheet) cheatsheet.classList.remove('active'); });

  document.addEventListener('keydown', e => {
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '?') cheatsheet.classList.toggle('active');
    if (e.key === 'Escape') cheatsheet.classList.remove('active');
  });

  /* ── Sidebar toggle ── */
  document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
    document.body.classList.add('sidebar-collapsed');
  });
  document.getElementById('btn-expand-sidebar').addEventListener('click', () => {
    document.body.classList.remove('sidebar-collapsed');
  });

  /* ── Auto-save on unload ── */
  window.addEventListener('beforeunload', saveCurrentProject);

  /* ── Debounced auto-save after interactions ── */
  let saveDebounce = null;
  function scheduleSave() {
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(saveCurrentProject, 2000);
  }
  window.addEventListener('mouseup', scheduleSave);
  window.addEventListener('keyup', scheduleSave);

  /* ── Init projects ── */
  (function initProjects() {
    const meta = loadMeta();
    if (meta && meta.projects && meta.projects.length) {
      projects = meta.projects;
      activeProjectId = meta.activeId || projects[0].id;
      const state = getProjectData(activeProjectId);
      restoreCanvasState(state || null);
      renderSidebar();
      return;
    }
    /* First launch: create default project with seed content */
    const id = genId();
    projects = [{ id, name: 'My Board' }];
    activeProjectId = id;
    const vc = viewCenter();
    addText('heading', 'My Design Board', vc.x - 180, vc.y - 140, 360);
    addPalette(vc.x - 180, vc.y - 60);
    addFolder(vc.x + 80, vc.y - 60);
    addText('note', 'Drop images onto the canvas or into a folder to get started!', vc.x - 180, vc.y + 100, 240, 100);
    saveCurrentProject();
    saveMeta();
    renderSidebar();
  })();

})();
