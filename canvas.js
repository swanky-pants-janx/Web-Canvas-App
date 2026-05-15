/* Web Canvas — canvas.js */

import { account, databases, storage, DB_ID, COLL_ID, BUCKET_ID, Permission, Role, ID } from './appwrite.js';

/* ── Google Fonts catalogue ── */
const GOOGLE_FONTS = [
  { name: 'Inter',              cat: 'sans-serif'  },
  { name: 'Roboto',             cat: 'sans-serif'  },
  { name: 'Open Sans',          cat: 'sans-serif'  },
  { name: 'Lato',               cat: 'sans-serif'  },
  { name: 'Montserrat',         cat: 'sans-serif'  },
  { name: 'Nunito',             cat: 'sans-serif'  },
  { name: 'Poppins',            cat: 'sans-serif'  },
  { name: 'Raleway',            cat: 'sans-serif'  },
  { name: 'Source Sans 3',      cat: 'sans-serif'  },
  { name: 'Ubuntu',             cat: 'sans-serif'  },
  { name: 'Work Sans',          cat: 'sans-serif'  },
  { name: 'DM Sans',            cat: 'sans-serif'  },
  { name: 'Mulish',             cat: 'sans-serif'  },
  { name: 'Outfit',             cat: 'sans-serif'  },
  { name: 'Plus Jakarta Sans',  cat: 'sans-serif'  },
  { name: 'Figtree',            cat: 'sans-serif'  },
  { name: 'Josefin Sans',       cat: 'sans-serif'  },
  { name: 'Cabin',              cat: 'sans-serif'  },
  { name: 'Karla',              cat: 'sans-serif'  },
  { name: 'Barlow',             cat: 'sans-serif'  },
  { name: 'Rubik',              cat: 'sans-serif'  },
  { name: 'Quicksand',          cat: 'sans-serif'  },
  { name: 'Jost',               cat: 'sans-serif'  },
  { name: 'Lexend',             cat: 'sans-serif'  },
  { name: 'Merriweather',       cat: 'serif'       },
  { name: 'Playfair Display',   cat: 'serif'       },
  { name: 'Lora',               cat: 'serif'       },
  { name: 'PT Serif',           cat: 'serif'       },
  { name: 'Source Serif 4',     cat: 'serif'       },
  { name: 'EB Garamond',        cat: 'serif'       },
  { name: 'Cormorant Garamond', cat: 'serif'       },
  { name: 'Bitter',             cat: 'serif'       },
  { name: 'Libre Baskerville',  cat: 'serif'       },
  { name: 'Crimson Text',       cat: 'serif'       },
  { name: 'DM Serif Display',   cat: 'serif'       },
  { name: 'Spectral',           cat: 'serif'       },
  { name: 'Zilla Slab',         cat: 'serif'       },
  { name: 'Roboto Mono',        cat: 'monospace'   },
  { name: 'Source Code Pro',    cat: 'monospace'   },
  { name: 'JetBrains Mono',     cat: 'monospace'   },
  { name: 'Fira Code',          cat: 'monospace'   },
  { name: 'IBM Plex Mono',      cat: 'monospace'   },
  { name: 'Space Mono',         cat: 'monospace'   },
  { name: 'Inconsolata',        cat: 'monospace'   },
  { name: 'Courier Prime',      cat: 'monospace'   },
  { name: 'Ubuntu Mono',        cat: 'monospace'   },
  { name: 'Oswald',             cat: 'display'     },
  { name: 'Bebas Neue',         cat: 'display'     },
  { name: 'Anton',              cat: 'display'     },
  { name: 'Abril Fatface',      cat: 'display'     },
  { name: 'Righteous',          cat: 'display'     },
  { name: 'Fredoka One',        cat: 'display'     },
  { name: 'Lobster',            cat: 'display'     },
  { name: 'Passion One',        cat: 'display'     },
  { name: 'Russo One',          cat: 'display'     },
  { name: 'Permanent Marker',   cat: 'display'     },
  { name: 'Bangers',            cat: 'display'     },
  { name: 'Squada One',         cat: 'display'     },
  { name: 'Boogaloo',           cat: 'display'     },
  { name: 'Dancing Script',     cat: 'handwriting' },
  { name: 'Pacifico',           cat: 'handwriting' },
  { name: 'Satisfy',            cat: 'handwriting' },
  { name: 'Kaushan Script',     cat: 'handwriting' },
  { name: 'Great Vibes',        cat: 'handwriting' },
  { name: 'Sacramento',         cat: 'handwriting' },
  { name: 'Caveat',             cat: 'handwriting' },
  { name: 'Patrick Hand',       cat: 'handwriting' },
  { name: 'Indie Flower',       cat: 'handwriting' },
  { name: 'Courgette',          cat: 'handwriting' },
  { name: 'Allura',             cat: 'handwriting' },
  { name: 'Alex Brush',         cat: 'handwriting' },
];

const _loadedFonts = new Set();
function loadGoogleFont(name) {
  if (_loadedFonts.has(name)) return;
  _loadedFonts.add(name);
  const family = encodeURIComponent(name).replace(/%20/g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}:ital,wght@0,400;0,700;1,400&display=swap`;
  document.head.appendChild(link);
}

function injectFontFace(name, url) {
  const style = document.createElement('style');
  style.textContent = `@font-face { font-family: '${CSS.escape ? name : name}'; src: url('${url}'); font-display: swap; }`;
  document.head.appendChild(style);
}

function rgbToHex(rgb) {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return null;
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

function isFontFile(f) {
  return /\.(ttf|otf|woff|woff2)$/i.test(f.name);
}

/* ── Demo mode (no account required, sessionStorage only) ── */
const DEMO_MODE = sessionStorage.getItem('wc_demo') === '1';
const DEMO_STORE_KEY = 'wc_demo_projects';

/* ── Bootstrap: auth check then init ── */
let currentUser = null;
if (!DEMO_MODE) {
  try {
    currentUser = await account.get();
  } catch (_) {
    location.replace('login.html');
  }
}

/* ── Appwrite project helpers ── */
async function fetchProjects() {
  if (DEMO_MODE) {
    const raw = sessionStorage.getItem(DEMO_STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  const res = await databases.listDocuments(DB_ID, COLL_ID);
  return res.documents;
}

async function createProjectDoc(name) {
  if (DEMO_MODE) {
    const doc = { $id: 'demo_' + Date.now(), name, state: null };
    const list = JSON.parse(sessionStorage.getItem(DEMO_STORE_KEY) || '[]');
    list.push(doc);
    sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(list));
    return doc;
  }
  return databases.createDocument(DB_ID, COLL_ID, 'unique()', { name, state: null }, [
    Permission.read(Role.user(currentUser.$id)),
    Permission.update(Role.user(currentUser.$id)),
    Permission.delete(Role.user(currentUser.$id)),
  ]);
}

async function saveProjectDoc(id, stateObj) {
  if (DEMO_MODE) {
    const list = JSON.parse(sessionStorage.getItem(DEMO_STORE_KEY) || '[]');
    const p = list.find(p => p.$id === id);
    if (p) p.state = JSON.stringify(stateObj);
    sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(list));
    return;
  }
  try {
    await databases.updateDocument(DB_ID, COLL_ID, id, { state: JSON.stringify(stateObj) });
  } catch (e) {
    console.error('Save failed:', e);
    showSaveStatus('Save failed: ' + (e.message || e));
  }
}

async function deleteProjectDoc(id) {
  if (DEMO_MODE) {
    let list = JSON.parse(sessionStorage.getItem(DEMO_STORE_KEY) || '[]');
    list = list.filter(p => p.$id !== id);
    sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(list));
    return;
  }
  await databases.deleteDocument(DB_ID, COLL_ID, id);
}

async function renameProjectDoc(id, name) {
  if (DEMO_MODE) {
    const list = JSON.parse(sessionStorage.getItem(DEMO_STORE_KEY) || '[]');
    const p = list.find(p => p.$id === id);
    if (p) p.name = name;
    sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(list));
    return;
  }
  await databases.updateDocument(DB_ID, COLL_ID, id, { name });
}

/* ── Load project list ── */
let projects = await fetchProjects();
let activeProjectId = sessionStorage.getItem('wc_active_proj') || (projects[0] && projects[0].$id) || null;

/* Bootstrap first project if account is empty */
if (!projects.length) {
  const doc = await createProjectDoc('My Board');
  projects = [doc];
  activeProjectId = doc.$id;
}

if (!activeProjectId || !projects.find(p => p.$id === activeProjectId)) {
  activeProjectId = projects[0].$id;
}

sessionStorage.setItem('wc_active_proj', activeProjectId);

  /* ── State ── */
  let panX = 0, panY = 0, scale = 1;
  let dragging  = null;
  let resizing  = null;
  let selecting = null;
  let selected  = new Set();
  let spaceDown = false;
  let gridLock  = false;
  const GRID    = 24;
  let minimapVisible   = false;
  let minimapDrawTimer = null;

  function snap(v) { return gridLock ? Math.round(v / GRID) * GRID : v; }
  let folders  = {};
  let openModal = null;
  let dropperCallback = null;
  let folderDrag = null;

  /* ── Connection state ── */
  let connections    = [];
  let connDrag       = null;
  let widgetIdSeq    = 0;

  /* ── Font state ── */
  let projectCustomFonts = []; // { name, url }
  let activeTextWidget   = null;
  let fpCurrentCat   = 'all';
  let fpCurrentQuery = '';

  /* ── Text toolbar & font picker ── */
  const mainTb     = document.getElementById('main-tb');
  const textTb     = document.getElementById('text-tb');
  const fontPicker = document.getElementById('font-picker');

  function buildTextToolbar() {
    const mk = (tag, props = {}) => Object.assign(document.createElement(tag), props);
    const div = () => { const d = mk('div'); d.className = 'divider'; return d; };

    const fontBtn = mk('button', { id: 'txt-font-btn', title: 'Font family' });
    fontBtn.textContent = 'Font ▾';

    const sizeInput = mk('input');
    sizeInput.id = 'txt-size';
    sizeInput.type = 'number';
    sizeInput.min = '8'; sizeInput.max = '200'; sizeInput.value = '16';
    sizeInput.title = 'Font size';

    const boldBtn      = mk('button', { id: 'txt-bold',      title: 'Bold',      className: 'tb-style-btn', textContent: 'B' });
    const italicBtn    = mk('button', { id: 'txt-italic',    title: 'Italic',    className: 'tb-style-btn', textContent: 'I' });
    const underlineBtn = mk('button', { id: 'txt-underline', title: 'Underline', className: 'tb-style-btn', textContent: 'U' });

    const colorInput = mk('input');
    colorInput.id = 'txt-color'; colorInput.type = 'color';
    colorInput.title = 'Text colour'; colorInput.value = '#000000';

    const alignL = mk('button', { id: 'txt-align-left',   title: 'Align left',   className: 'tb-align-btn', textContent: '⬅' });
    const alignC = mk('button', { id: 'txt-align-center', title: 'Align center', className: 'tb-align-btn', textContent: '↔' });
    const alignR = mk('button', { id: 'txt-align-right',  title: 'Align right',  className: 'tb-align-btn', textContent: '➡' });

    const doneBtn = mk('button', { id: 'txt-done', title: 'Close text toolbar', textContent: 'Done' });

    [fontBtn, sizeInput, div(), boldBtn, italicBtn, underlineBtn, colorInput, div(), alignL, alignC, alignR, div(), doneBtn]
      .forEach(el => textTb.appendChild(el));

    fontBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = fontPicker.classList.toggle('visible');
      fontBtn.classList.toggle('picker-open', open);
    });

    sizeInput.addEventListener('mousedown', e => e.stopPropagation());
    sizeInput.addEventListener('keydown',   e => e.stopPropagation());
    sizeInput.addEventListener('change', () => {
      if (!activeTextWidget) return;
      getEditableEl(activeTextWidget).forEach(el => { el.style.fontSize = sizeInput.value + 'px'; });
    });

    boldBtn.addEventListener('click', () => {
      if (!activeTextWidget) return;
      const els = getEditableEl(activeTextWidget);
      const isBold = els[0]?.style.fontWeight === '700';
      els.forEach(el => { el.style.fontWeight = isBold ? '' : '700'; });
      boldBtn.classList.toggle('active', !isBold);
    });

    italicBtn.addEventListener('click', () => {
      if (!activeTextWidget) return;
      const els = getEditableEl(activeTextWidget);
      const isItalic = els[0]?.style.fontStyle === 'italic';
      els.forEach(el => { el.style.fontStyle = isItalic ? '' : 'italic'; });
      italicBtn.classList.toggle('active', !isItalic);
    });

    underlineBtn.addEventListener('click', () => {
      if (!activeTextWidget) return;
      const els = getEditableEl(activeTextWidget);
      const isUnder = els[0]?.style.textDecoration.includes('underline');
      els.forEach(el => { el.style.textDecoration = isUnder ? '' : 'underline'; });
      underlineBtn.classList.toggle('active', !isUnder);
    });

    colorInput.addEventListener('mousedown', e => e.stopPropagation());
    colorInput.addEventListener('input', () => {
      if (!activeTextWidget) return;
      getEditableEl(activeTextWidget).forEach(el => { el.style.color = colorInput.value; });
    });

    alignL.addEventListener('click', () => applyTextAlign('left'));
    alignC.addEventListener('click', () => applyTextAlign('center'));
    alignR.addEventListener('click', () => applyTextAlign('right'));

    doneBtn.addEventListener('click', () => deselectTextWidget());
  }

  function getEditableEl(widget) {
    const ed = widget.querySelector('.editable');
    if (ed) return [ed];
    const tl = widget.querySelector('.todo-list');
    return tl ? [tl] : [];
  }

  function applyTextAlign(align) {
    if (!activeTextWidget) return;
    getEditableEl(activeTextWidget).forEach(el => { el.style.textAlign = align; });
    ['txt-align-left', 'txt-align-center', 'txt-align-right'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });
    const map = { left: 'txt-align-left', center: 'txt-align-center', right: 'txt-align-right' };
    document.getElementById(map[align])?.classList.add('active');
  }

  function selectTextWidget(el) {
    activeTextWidget = el;
    mainTb.style.display = 'none';
    textTb.style.display = '';
    syncTextToolbarState(el);
  }

  function deselectTextWidget() {
    if (!activeTextWidget) return;
    activeTextWidget = null;
    mainTb.style.display = '';
    textTb.style.display = 'none';
    closeFontPicker();
  }

  function syncTextToolbarState(el) {
    const eds = getEditableEl(el);
    const ed  = eds[0];
    if (!ed) return;

    const ff = ed.style.fontFamily || '';
    const name = ff.replace(/['"]/g, '').split(',')[0].trim();
    document.getElementById('txt-font-btn').textContent = (name || 'Font') + ' ▾';

    document.getElementById('txt-size').value = parseInt(ed.style.fontSize) || 16;

    document.getElementById('txt-bold').classList.toggle('active',
      ed.style.fontWeight === '700' || ed.style.fontWeight === 'bold');
    document.getElementById('txt-italic').classList.toggle('active',
      ed.style.fontStyle === 'italic');
    document.getElementById('txt-underline').classList.toggle('active',
      ed.style.textDecoration.includes('underline'));

    const rawColor = ed.style.color;
    document.getElementById('txt-color').value = (rawColor && rgbToHex(rawColor)) || rawColor || '#000000';

    const align = ed.style.textAlign || 'left';
    ['left', 'center', 'right'].forEach(a => {
      document.getElementById('txt-align-' + a)?.classList.toggle('active', a === align);
    });
  }

  function applyFont(name, isCustom) {
    if (!activeTextWidget) return;
    if (!isCustom) loadGoogleFont(name);
    getEditableEl(activeTextWidget).forEach(el => {
      el.style.fontFamily = `'${name}', sans-serif`;
    });
    activeTextWidget.dataset.fontFamily = name;
    document.getElementById('txt-font-btn').textContent = name + ' ▾';
  }

  /* ── Font picker ── */
  function buildFontPicker() {
    const cats = [
      { id: 'all',         label: 'All'       },
      { id: 'sans-serif',  label: 'Sans'      },
      { id: 'serif',       label: 'Serif'     },
      { id: 'monospace',   label: 'Mono'      },
      { id: 'display',     label: 'Display'   },
      { id: 'handwriting', label: 'Script'    },
      { id: 'custom',      label: 'Uploaded'  },
    ];

    const catRow = document.createElement('div');
    catRow.id = 'fp-cats';
    cats.forEach(c => {
      const btn = document.createElement('button');
      btn.textContent = c.label;
      btn.dataset.cat = c.id;
      if (c.id === 'all') btn.classList.add('active');
      btn.addEventListener('click', () => {
        fpCurrentCat = c.id;
        catRow.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFontList();
      });
      catRow.appendChild(btn);
    });

    const search = document.createElement('input');
    search.type = 'text';
    search.id   = 'fp-search';
    search.placeholder = 'Search fonts…';
    search.addEventListener('mousedown', e => e.stopPropagation());
    search.addEventListener('keydown',   e => e.stopPropagation());
    search.addEventListener('input', () => {
      fpCurrentQuery = search.value.toLowerCase();
      renderFontList();
    });

    const list = document.createElement('div');
    list.id = 'fp-list';

    fontPicker.appendChild(catRow);
    fontPicker.appendChild(search);
    fontPicker.appendChild(list);

    /* Close when clicking outside */
    document.addEventListener('mousedown', e => {
      if (!fontPicker.contains(e.target) && e.target.id !== 'txt-font-btn') {
        closeFontPicker();
      }
    }, true);
  }

  function closeFontPicker() {
    fontPicker.classList.remove('visible');
    document.getElementById('txt-font-btn')?.classList.remove('picker-open');
  }

  function renderFontList() {
    const list = document.getElementById('fp-list');
    if (!list) return;
    list.innerHTML = '';

    let fonts = [
      ...projectCustomFonts.map(f => ({ name: f.name, cat: 'custom' })),
      ...GOOGLE_FONTS,
    ];

    if (fpCurrentCat !== 'all') fonts = fonts.filter(f => f.cat === fpCurrentCat);
    if (fpCurrentQuery) fonts = fonts.filter(f => f.name.toLowerCase().includes(fpCurrentQuery));

    if (!fonts.length) {
      const empty = document.createElement('div');
      empty.className = 'fp-empty';
      empty.textContent = 'No fonts found';
      list.appendChild(empty);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        const name = item.dataset.fontName;
        if (name && item.dataset.cat !== 'custom') {
          loadGoogleFont(name);
          item.style.fontFamily = `'${name}', sans-serif`;
          item.querySelector('.fp-preview').style.fontFamily = `'${name}', sans-serif`;
        }
        observer.unobserve(item);
      });
    }, { root: list, rootMargin: '120px' });

    fonts.forEach(f => {
      const item = document.createElement('div');
      item.className = 'fp-item';
      item.dataset.fontName = f.name;
      item.dataset.cat = f.cat;

      const nameEl = document.createElement('span');
      nameEl.className = 'fp-name';
      nameEl.textContent = f.name;

      const preview = document.createElement('span');
      preview.className = 'fp-preview';
      preview.textContent = 'The quick brown fox';

      if (f.cat === 'custom') {
        item.style.fontFamily = `'${f.name}', sans-serif`;
        preview.style.fontFamily = `'${f.name}', sans-serif`;
        const badge = document.createElement('span');
        badge.className = 'fp-badge';
        badge.textContent = 'Custom';
        item.appendChild(nameEl);
        item.appendChild(badge);
        item.appendChild(preview);
      } else {
        item.appendChild(nameEl);
        item.appendChild(preview);
        observer.observe(item);
      }

      item.addEventListener('mousedown', e => e.stopPropagation());
      item.addEventListener('click', () => {
        applyFont(f.name, f.cat === 'custom');
        closeFontPicker();
      });

      list.appendChild(item);
    });
  }

  /* ── Serialize / restore ── */
  function serializeCanvasState() {
    const widgets = [];
    document.querySelectorAll('#world .widget').forEach(el => {
      if (el.classList.contains('folder-modal')) return;
      const data = serializeWidgetFull(el);
      if (data) widgets.push(data);
    });
    return { panX, panY, scale, widgets, folders: JSON.parse(JSON.stringify(folders)), customFonts: [...projectCustomFonts], connections: JSON.parse(JSON.stringify(connections)) };
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
        wid:   getWidgetId(el),
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
    connections = [];
    openModal = null;
    selected.clear();
    deselectTextWidget();

    if (!state) return;

    panX = state.panX || 0;
    panY = state.panY || 0;
    scale = state.scale || 1;
    applyTransform();

    /* Restore custom fonts */
    projectCustomFonts = [];
    (state.customFonts || []).forEach(f => {
      injectFontFace(f.name, f.url);
      projectCustomFonts.push(f);
    });
    if (state.customFonts && state.customFonts.length) renderFontList();

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
        restoreFontProps(el, data);
      } else if (data.type === 'palette') {
        el = addPalette(data.left, data.top, data.colors);
        el.querySelector('.palette-name').textContent = data.name;
      } else if (data.type === 'video') {
        el = addVideo(data.videoId, 0, 0);
      } else if (data.type === 'frame') {
        el = addFrame(data.left, data.top);
        if (data.title !== undefined) el.querySelector('.frame-title').textContent = data.title;
        if (data.bgColor) el.style.backgroundColor = data.bgColor;
        el._frameChildren = data.children || [];
      }
      if (el) {
        if (data.wid) {
          el.dataset.wid = data.wid;
          widgetIdSeq = Math.max(widgetIdSeq, parseInt(data.wid.replace('w', '')) || 0);
        }
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

    connections = (state.connections || []).map(c => ({ ...c }));
    connSvg.innerHTML = '';
    world.appendChild(connSvg);
    renderConnections();
  }

  function restoreFontProps(el, data) {
    const editable = el.querySelector('.editable') || el.querySelector('.todo-list');
    if (!editable) return;
    if (data.fontFamily) {
      const name = data.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
      const isCustom = projectCustomFonts.some(f => f.name === name);
      if (name && !isCustom) loadGoogleFont(name);
      editable.style.fontFamily = data.fontFamily;
    }
    if (data.fontSize)       editable.style.fontSize       = data.fontSize;
    if (data.fontWeight)     editable.style.fontWeight     = data.fontWeight;
    if (data.fontStyle)      editable.style.fontStyle      = data.fontStyle;
    if (data.textDecoration) editable.style.textDecoration = data.textDecoration;
    if (data.textAlign)      editable.style.textAlign      = data.textAlign;
    if (data.fontColor)      editable.style.color          = data.fontColor;
  }

  let _saving = false;
  async function saveCurrentProject() {
    if (!activeProjectId || _saving) return;
    _saving = true;
    showSaveStatus('Saving…');
    const state = serializeCanvasState();
    await saveProjectDoc(activeProjectId, state);
    const doc = projects.find(p => p.$id === activeProjectId);
    if (doc) doc.state = JSON.stringify(state);
    _saving = false;
    showSaveStatus('Saved');
  }

  function showSaveStatus(msg) {
    let el = document.getElementById('save-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'save-status';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(el._hide);
    if (msg === 'Saved') el._hide = setTimeout(() => el.classList.remove('visible'), 1500);
  }

  async function switchProject(id) {
    if (id === activeProjectId) return;
    await saveCurrentProject();
    activeProjectId = id;
    sessionStorage.setItem('wc_active_proj', id);
    const doc = projects.find(p => p.$id === id);
    try { restoreCanvasState(doc && doc.state ? JSON.parse(doc.state) : null); } catch (_) { restoreCanvasState(null); }
    renderSidebar();
  }

  async function createProject(name) {
    const doc = await createProjectDoc(name);
    projects.push(doc);
    return doc.$id;
  }

  function deleteProject(id) {
    if (projects.length <= 1) return;
    deleteProjectDoc(id);
    projects = projects.filter(p => p.$id !== id);
    if (activeProjectId === id) {
      activeProjectId = projects[0].$id;
      sessionStorage.setItem('wc_active_proj', activeProjectId);
      const doc = projects[0];
      try { restoreCanvasState(doc.state ? JSON.parse(doc.state) : null); } catch (_) { restoreCanvasState(null); }
    }
    renderSidebar();
  }

  function renameProject(id, name) {
    const p = projects.find(p => p.$id === id);
    if (p) { p.name = name; renameProjectDoc(id, name); }
  }

  /* ── Sidebar rendering ── */
  function renderSidebar() {
    const list = document.getElementById('project-list');
    list.innerHTML = '';
    projects.forEach(p => {
      const item = document.createElement('div');
      item.className = 'project-item' + (p.$id === activeProjectId ? ' active' : '');
      item.dataset.id = p.$id;

      const nameEl = document.createElement('span');
      nameEl.className = 'project-name';
      nameEl.textContent = p.name;

      const actions = document.createElement('div');
      actions.className = 'project-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-proj-delete';
      deleteBtn.title = 'Delete';
      deleteBtn.textContent = 'x';
      deleteBtn.disabled = projects.length <= 1;

      deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        deleteProject(p.$id);
      });

      nameEl.addEventListener('dblclick', e => {
        e.stopPropagation();
        startRenameProject(p.$id, nameEl, item);
      });

      actions.appendChild(deleteBtn);
      item.appendChild(nameEl);
      item.appendChild(actions);
      item.addEventListener('click', () => switchProject(p.$id));
      list.appendChild(item);
    });

    /* + New Project row */
    const addRow = document.createElement('div');
    addRow.className = 'btn-new-project-row';
    const icon = document.createElement('span');
    icon.className = 'new-proj-icon';
    icon.textContent = '+';
    const label = document.createElement('span');
    label.textContent = 'New project';
    addRow.appendChild(icon);
    addRow.appendChild(label);
    addRow.addEventListener('click', async () => {
      saveCurrentProject();
      const name = 'Project ' + (projects.length + 1);
      const id = await createProject(name);
      activeProjectId = id;
      sessionStorage.setItem('wc_active_proj', id);
      restoreCanvasState(null);
      renderSidebar();
    });
    list.appendChild(addRow);
  }

  function startRenameProject(id, nameEl, item) {
    const p = projects.find(pr => pr.$id === id);
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
      newSpan.addEventListener('dblclick', e => { e.stopPropagation(); startRenameProject(id, newSpan, item); });
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = p.name; input.blur(); }
    });
    input.addEventListener('click', e => e.stopPropagation());
  }

  /* ── Demo UI ── */
  if (DEMO_MODE) {
    document.getElementById('btn-dashboard').style.display = 'none';
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
    if (minimapVisible) drawMinimap();
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
  buildTextToolbar();

  /* ── Connection SVG overlay ── */
  const connSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  connSvg.id = 'conn-svg';
  // No pointer-events:none on SVG — managed per-path via SVG attribute instead
  connSvg.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;z-index:3;';
  world.appendChild(connSvg);

  function getWidgetId(el) {
    if (!el.dataset.wid) el.dataset.wid = 'w' + (++widgetIdSeq);
    return el.dataset.wid;
  }

  function getNodePos(el, side) {
    const l = parseInt(el.style.left) || 0;
    const t = parseInt(el.style.top)  || 0;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (side === 'top')    return { x: l + w / 2, y: t };
    if (side === 'bottom') return { x: l + w / 2, y: t + h };
    if (side === 'left')   return { x: l,          y: t + h / 2 };
    if (side === 'right')  return { x: l + w,       y: t + h / 2 };
  }

  function connBezierPath(x1, y1, x2, y2, side1, side2) {
    const dist   = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const offset = Math.max(50, Math.min(200, dist * 0.45));
    const dirs   = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
    const [d1x, d1y] = dirs[side1] || [0, 0];
    const [d2x, d2y] = dirs[side2] || [0, 0];
    const cx1 = x1 + d1x * offset;
    const cy1 = y1 + d1y * offset;
    const cx2 = x2 + d2x * offset;
    const cy2 = y2 + d2y * offset;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  function guessIncomingSide(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'top' : 'bottom');
  }

  const SNAP_RADIUS_WORLD = 60; // world-px proximity for magnetic snap

  function findNearestNode(wx, wy, excludeEl) {
    let best = null, bestDist = Infinity;
    document.querySelectorAll('#world .widget').forEach(w => {
      if (w === excludeEl || w.classList.contains('folder-modal')) return;
      ['top', 'bottom', 'left', 'right'].forEach(side => {
        const p = getNodePos(w, side);
        const d = Math.hypot(p.x - wx, p.y - wy);
        if (d < bestDist) { bestDist = d; best = { el: w, side, pos: p, dist: d }; }
      });
    });
    return best && best.dist <= SNAP_RADIUS_WORLD ? best : null;
  }

  function setNodeHighlight(el, side, active) {
    if (!el) return;
    const node = el.querySelector(`.conn-node-${side}`);
    if (node) node.classList.toggle('conn-snap-target', active);
  }

  function renderConnections(previewWorldX, previewWorldY) {
    connSvg.innerHTML = '';
    document.querySelectorAll('.conn-snap-target').forEach(n => n.classList.remove('conn-snap-target'));

    connections.forEach(conn => {
      const fromEl = document.querySelector(`[data-wid="${conn.fromWid}"]`);
      const toEl   = document.querySelector(`[data-wid="${conn.toWid}"]`);
      if (!fromEl || !toEl) return;

      const p1 = getNodePos(fromEl, conn.fromSide);
      const p2 = getNodePos(toEl,   conn.toSide);
      const d  = connBezierPath(p1.x, p1.y, p2.x, p2.y, conn.fromSide, conn.toSide);

      // Fat invisible hit target — pointer-events must be set as SVG attribute
      // because CSS pointer-events:none on the parent SVG would otherwise block it
      const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hitPath.setAttribute('d', d);
      hitPath.setAttribute('stroke', 'rgba(0,0,0,0)');
      hitPath.setAttribute('stroke-width', '20');
      hitPath.setAttribute('fill', 'none');
      hitPath.setAttribute('pointer-events', 'stroke');
      hitPath.style.cursor = 'pointer';
      hitPath.addEventListener('mousedown', e => {
        e.stopPropagation();
        e.preventDefault();
        connections = connections.filter(c => c.id !== conn.id);
        renderConnections();
        scheduleSave();
      });

      // Visible line — no pointer events, hit detection is on hitPath
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', '#f97316');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('pointer-events', 'none');

      connSvg.appendChild(path);
      connSvg.appendChild(hitPath);
    });

    if (connDrag && connDrag.live && previewWorldX != null) {
      const snap = findNearestNode(previewWorldX, previewWorldY, connDrag.fromEl);
      const tx   = snap ? snap.pos.x : previewWorldX;
      const ty   = snap ? snap.pos.y : previewWorldY;
      const inSide = snap ? snap.side : guessIncomingSide(
        getNodePos(connDrag.fromEl, connDrag.fromSide), { x: previewWorldX, y: previewWorldY }
      );
      const p1 = getNodePos(connDrag.fromEl, connDrag.fromSide);

      if (snap) setNodeHighlight(snap.el, snap.side, true);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', connBezierPath(p1.x, p1.y, tx, ty, connDrag.fromSide, inSide));
      path.setAttribute('stroke', '#f97316');
      path.setAttribute('stroke-width', snap ? '2.5' : '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('pointer-events', 'none');
      if (!snap) path.setAttribute('stroke-dasharray', '7 4');
      path.style.opacity = snap ? '1' : '0.75';
      connSvg.appendChild(path);
    }
  }

  function addConnNodes(el) {
    ['top', 'bottom', 'left', 'right'].forEach(side => {
      const node = document.createElement('div');
      node.className = `conn-node conn-node-${side}`;
      node.dataset.side = side;
      node.addEventListener('mousedown', e => {
        if (el.dataset.locked === 'true') return;
        e.stopPropagation();
        e.preventDefault();
        // Clear any in-progress canvas interactions so nothing leaks
        dragging = resizing = selecting = null;
        selRect.style.display = 'none';
        canvasEl.classList.remove('selecting', 'grabbing');
        connDrag = { fromEl: el, fromSide: side, live: false, sx: e.clientX, sy: e.clientY };
      });
      node.addEventListener('mouseup', e => { e.stopPropagation(); });
      el.appendChild(node);
    });
  }
  buildFontPicker();
  renderFontList();

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
    if (!target.classList.contains('w-text')) deselectTextWidget();

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

    // When dragging a frame, also carry its children (unless already in selection)
    [target, ...others.map(o => o.el)].forEach(w => {
      if (!w.classList.contains('w-frame')) return;
      (w._frameChildren || []).forEach(wid => {
        const child = document.querySelector(`[data-wid="${wid}"]`);
        if (child && !selected.has(child)) {
          others.push({ el: child, ox: parseInt(child.style.left) || 0, oy: parseInt(child.style.top) || 0 });
        }
      });
    });

    dragging = {
      el: target,
      sx: e.clientX, sy: e.clientY,
      ox: parseInt(target.style.left) || 0,
      oy: parseInt(target.style.top)  || 0,
      others,
    };
  }

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

  /* ── Widget removal (cleans up connections) ── */
  function removeWidget(el) {
    const wid = el.dataset.wid;
    if (wid) {
      connections = connections.filter(c => c.fromWid !== wid && c.toWid !== wid);
      // Remove from any frame's children list
      document.querySelectorAll('.w-frame').forEach(f => {
        f._frameChildren = (f._frameChildren || []).filter(w => w !== wid);
      });
      renderConnections();
    }
    el.remove();
  }

  /* ── Widget delete bar ── */
  function addWidgetBar(el) {
    const bar = document.createElement('div');
    bar.className = 'widget-bar';
    const del = document.createElement('button');
    del.textContent = 'x';
    del.title = 'Delete';
    del.addEventListener('mousedown', e => { e.stopPropagation(); removeWidget(el); });
    bar.appendChild(del);
    el.appendChild(bar);
  }

  /* ── Lip (drag handle) ── */
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
    const isTextWidget  = el.classList.contains('w-text');
    const isFrameWidget = el.classList.contains('w-frame');
    if (isTextWidget || isFrameWidget) {
      bgBtn = document.createElement('button');
      bgBtn.className = 'lip-bg-btn';
      bgBtn.title = 'Background colour';
      bgBtn.textContent = '◻';

      bgPicker = document.createElement('div');
      bgPicker.className = 'lip-bg-picker';

      const TEXT_BG = [
        { value: '',        label: 'None',   cls: 'transparent' },
        { value: '#ffffff', label: 'White'  },
        { value: '#fef9c3', label: 'Yellow' },
        { value: '#dbeafe', label: 'Blue'   },
        { value: '#dcfce7', label: 'Green'  },
        { value: '#fce7f3', label: 'Pink'   },
        { value: '#ede9fe', label: 'Purple' },
      ];

      const FRAME_BG = [
        { value: '#1e1e1e', label: 'Dark'        },
        { value: '#2d2d2d', label: 'Charcoal'    },
        { value: '#1a1a2e', label: 'Navy'        },
        { value: '#1a2e1a', label: 'Forest'      },
        { value: '#f5f5f5', label: 'Light Grey'  },
        { value: '#ffffff', label: 'White'       },
        { value: '#fef9c3', label: 'Yellow'      },
        { value: '#dbeafe', label: 'Blue'        },
        { value: '#ede9fe', label: 'Purple'      },
      ];

      const LIGHT_BG = new Set(['#ffffff', '#fef9c3', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe', '#f5f5f5']);

      const BG_COLOURS = isFrameWidget ? FRAME_BG : TEXT_BG;

      BG_COLOURS.forEach(c => {
        const dot = document.createElement('button');
        dot.className = 'bg-swatch' + (c.cls ? ' ' + c.cls : '');
        dot.title = c.label;
        if (c.value) dot.style.background = c.value;
        dot.addEventListener('mousedown', e => e.stopPropagation());
        dot.addEventListener('click', e => {
          e.stopPropagation();
          el.style.backgroundColor = c.value;
          if (isFrameWidget) {
            const titleEl = el.querySelector('.frame-title');
            if (titleEl) titleEl.style.color = LIGHT_BG.has(c.value) ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';
          } else {
            el.style.setProperty('--widget-color', c.value ? '#1a1a1a' : '#ffffff');
          }
          bgPicker.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
          dot.classList.add('active');
          bgPicker.classList.remove('open');
          scheduleSave();
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
    lockBtn.innerHTML = '<span class="btn-icon" style="--icon:url(\'icons web canvas/lock.svg\')"></span>';
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
    del.addEventListener('mousedown', e => { e.stopPropagation(); removeWidget(el); });

    lip.appendChild(grip);
    if (typeSelect) lip.appendChild(typeSelect);
    if (bgBtn) { lip.appendChild(bgBtn); lip.appendChild(bgPicker); }
    lip.appendChild(lockBtn);
    lip.appendChild(del);

    lip.addEventListener('mousedown', e => {
      if (e.target === del || e.target === lockBtn || e.target === typeSelect || e.target.closest('.lip-bg-btn') || e.target.closest('.lip-bg-picker')) return;
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
      if (e.target.closest('.lip') || e.target.closest('.resize-grip') || e.target.closest('.conn-node')) return;
      startDrag(e, el);
    });

    addConnNodes(el);
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

    el.addEventListener('mousedown', e => {
      if (e.target.closest('.lip') || e.target.closest('.resize-grip') || e.target.closest('.conn-node')) return;
      selectTextWidget(el);
    });

    addConnNodes(el);
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

    const lbl = document.createElement('div');
    lbl.className = 'palette-label';
    lbl.textContent = 'Colour palette';

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
    dropperBtn.innerHTML = '<span class="btn-icon" style="--icon:url(\'icons web canvas/color picker.svg\')"></span>Pick colour';
    dropperBtn.title = 'Pick a colour from the canvas';
    dropperBtn.addEventListener('mousedown', e => e.stopPropagation());
    dropperBtn.addEventListener('click', e => {
      e.stopPropagation();
      activateDropper(hex => addSwatch(hex), dropperBtn);
    });

    header.appendChild(name);
    header.appendChild(dropperBtn);

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
    addConnNodes(el);

    world.appendChild(el);
    return el;
  }

  /* ── Colour dropper ── */
  function activateDropper(callback, btn) {
    if (window.EyeDropper) {
      if (btn) btn.classList.add('active');
      const dropper = new window.EyeDropper();
      dropper.open()
        .then(result => { callback(result.sRGBHex); })
        .catch(() => {})
        .finally(() => { if (btn) btn.classList.remove('active'); });
    } else {
      if (dropperCallback) {
        dropperCallback = null;
        document.body.classList.remove('dropper-mode');
        if (btn) btn.classList.remove('active');
        return;
      }
      dropperCallback = callback;
      document.body.classList.add('dropper-mode');
      if (btn) btn.classList.add('active');
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
    dropZone.textContent = 'Drop images or fonts here';

    el.appendChild(header);
    el.appendChild(thumbs);
    el.appendChild(dropZone);

    addLip(el);
    addResizeGrip(el);

    el.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('over'); });
    el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) dropZone.classList.remove('over'); });
    el.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('over');
      Array.from(e.dataTransfer.files).forEach(f => {
        if (f.type.startsWith('image/')) {
          readIntoFolder(f, id);
        } else if (isFontFile(f)) {
          uploadFontFile(f, id);
        }
      });
    });

    addConnNodes(el);
    world.appendChild(el);

    el._refreshThumbs = function () {
      const imgs = folders[id];
      const fonts = projectCustomFonts.filter(f => f.folderId === id);
      const total = imgs.length + fonts.length;
      count.textContent = total + ' item' + (total !== 1 ? 's' : '');
      thumbs.innerHTML = '';
      imgs.slice(0, 4).forEach((src, idx) => {
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
      fonts.forEach(font => {
        const t = document.createElement('div');
        t.className = 'folder-thumb folder-font-item';
        t.title = font.name;
        const icon = document.createElement('span');
        icon.className = 'folder-font-icon';
        icon.textContent = 'Aa';
        const label = document.createElement('span');
        label.className = 'folder-font-label';
        label.textContent = font.name;
        const delBtn = document.createElement('button');
        delBtn.className = 'folder-font-del';
        delBtn.textContent = '×';
        delBtn.title = 'Remove font';
        delBtn.addEventListener('mousedown', e => e.stopPropagation());
        delBtn.addEventListener('click', e => {
          e.stopPropagation();
          const idx = projectCustomFonts.findIndex(f => f.name === font.name && f.folderId === id);
          if (idx !== -1) projectCustomFonts.splice(idx, 1);
          renderFontList();
          el._refreshThumbs();
          scheduleSave();
        });
        t.appendChild(icon);
        t.appendChild(label);
        t.appendChild(delBtn);
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
      if (e.target.closest('.lip') || e.target.closest('.resize-grip') || e.target.closest('.conn-node')) return;
      startDrag(e, el);
    });

    addConnNodes(el);
    world.appendChild(el);
    return el;
  }

  /* ── Frame (canvas group) widget ── */
  function addFrame(x, y) {
    const el = document.createElement('div');
    el.className = 'widget w-frame';
    el.style.left   = x + 'px';
    el.style.top    = y + 'px';
    el.style.width  = '600px';
    el.style.height = '400px';
    el.style.backgroundColor = '#1e1e1e';
    el._frameChildren = [];

    const title = document.createElement('div');
    title.className = 'frame-title';
    title.contentEditable = 'true';
    title.spellcheck = false;
    title.dataset.placeholder = 'Frame';
    title.addEventListener('mousedown', e => e.stopPropagation());
    title.addEventListener('keydown', e => e.stopPropagation());
    el.appendChild(title);

    addLip(el);
    addResizeGrip(el);

    el.addEventListener('mousedown', e => {
      if (e.target.closest('.lip') || e.target.closest('.resize-grip') || e.target.closest('.conn-node') || e.target.closest('.frame-title')) return;
      startDrag(e, el);
    });

    addConnNodes(el);
    // Insert before other widgets so frame stays behind (DOM order stacking)
    const firstWidget = world.querySelector('.widget');
    if (firstWidget) world.insertBefore(el, firstWidget);
    else world.appendChild(el);
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

  async function uploadImageFile(file) {
    if (DEMO_MODE) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file, [
      Permission.read(Role.any()),
      Permission.delete(Role.user(currentUser.$id)),
    ]);
    const url = storage.getFileView(BUCKET_ID, uploaded.$id);
    console.log('[WC] uploaded image URL:', url);
    return url.toString();
  }

  async function uploadFontFile(file, folderId) {
    const fontName = file.name.replace(/\.(ttf|otf|woff2?)$/i, '').replace(/[-_]/g, ' ');
    try {
      let url;
      if (DEMO_MODE) {
        url = URL.createObjectURL(file);
      } else {
        const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file, [
          Permission.read(Role.any()),
          Permission.delete(Role.user(currentUser.$id)),
        ]);
        url = storage.getFileView(BUCKET_ID, uploaded.$id).toString();
      }
      injectFontFace(fontName, url);
      projectCustomFonts.push({ name: fontName, url, folderId });
      renderFontList();
      const folderEl = folderId && document.querySelector(`[data-folder-id="${folderId}"]`);
      if (folderEl && folderEl._refreshThumbs) folderEl._refreshThumbs();
      showSaveStatus(`Font "${fontName}" added`);
    } catch (e) {
      console.error('Font upload failed:', e);
      showSaveStatus('Font upload failed');
    }
  }

  async function readIntoFolder(file, id) {
    try {
      const url = await uploadImageFile(file);
      folders[id].push(url);
      const folderEl = document.querySelector(`[data-folder-id="${id}"]`);
      if (folderEl && folderEl._refreshThumbs) folderEl._refreshThumbs();
      refreshModalIfOpen(id);
    } catch (e) {
      console.error('Folder image upload failed:', e);
    }
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
      wid:    getWidgetId(el),
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
      const editable  = el.querySelector('.editable') || el.querySelector('.todo-list');
      const fontProps = editable ? {
        fontFamily:     editable.style.fontFamily     || '',
        fontSize:       editable.style.fontSize       || '',
        fontWeight:     editable.style.fontWeight     || '',
        fontStyle:      editable.style.fontStyle      || '',
        textDecoration: editable.style.textDecoration || '',
        textAlign:      editable.style.textAlign      || '',
        fontColor:      editable.style.color          || '',
      } : {};
      if (subtype === 'todo') {
        const items = [...el.querySelectorAll('.todo-item')].map(row => ({
          text: row.querySelector('.todo-text').textContent,
          checked: row.querySelector('.todo-check').checked,
        }));
        return { ...base, type: 'text', subtype: 'todo', items, bgColor, textColor, ...fontProps };
      }
      return { ...base, type: 'text', subtype, text: el.querySelector('.editable').textContent, bgColor, textColor, ...fontProps };
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
      const id = el.dataset.folderId;
      return { ...base, type: 'folder', folderId: id, title: el.querySelector('.folder-title').textContent, images: folders[id] || [] };
    }
    if (el.classList.contains('w-frame')) {
      const titleEl = el.querySelector('.frame-title');
      return { ...base, type: 'frame', title: titleEl ? titleEl.textContent : '', bgColor: el.style.backgroundColor || '#1e1e1e', children: [...(el._frameChildren || [])] };
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
      restoreFontProps(el, data);
    } else if (data.type === 'palette') {
      el = addPalette(x, y, data.colors);
      el.querySelector('.palette-name').textContent = data.name;
    } else if (data.type === 'video') {
      el = addVideo(data.videoId, x + data.width / 2, y + data.height / 2);
      el.style.width  = data.width  + 'px';
      el.style.height = data.height + 'px';
    } else if (data.type === 'folder') {
      const newId = 'f' + Date.now() + Math.floor(Math.random() * 1000);
      folders[newId] = [...(data.images || [])];
      el = addFolder(x, y, newId);
      el.querySelector('.folder-title').textContent = data.title || 'Assets';
      el._refreshThumbs();
      el.style.width  = data.width  + 'px';
      el.style.height = data.height + 'px';
    } else if (data.type === 'frame') {
      el = addFrame(x, y);
      el.querySelector('.frame-title').textContent = data.title || '';
      if (data.bgColor) el.style.backgroundColor = data.bgColor;
      el.style.width  = data.width  + 'px';
      el.style.height = data.height + 'px';
      el._frameChildren = [];  // children get fresh IDs on paste; don't copy child links
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

    if (e.key === 'c' && !inText) {
      if (!selected.size) return;
      clipboard = [...selected].map(serializeWidget).filter(Boolean);
      return;
    }
    if (e.key === 'v' && !inText) {
      e.preventDefault();
      pasteWidgets(clipboard, 24, 24);
      return;
    }
    if (e.key === 'd' && !inText) {
      e.preventDefault();
      if (!selected.size) return;
      const items = [...selected].map(serializeWidget).filter(Boolean);
      pasteWidgets(items, 24, 24);
    }
  });

  document.addEventListener('focusin', e => {
    if (!e.target.closest('.widget')) return;
    if (e.target.isContentEditable || e.target.tagName === 'INPUT') {
      clearSelection();
    }
  });

  document.addEventListener('mousedown', () => {
    document.querySelectorAll('.lip-bg-picker.open').forEach(p => p.classList.remove('open'));
  });

  /* ── Context menu ── */
  const ctxMenu = document.createElement('div');
  ctxMenu.id = 'ctx-menu';
  document.body.appendChild(ctxMenu);

  function closeCtxMenu() { ctxMenu.classList.remove('visible'); }

  function ctxItem(label, icon, action, disabled = false) {
    const item = document.createElement('button');
    item.className = 'ctx-item' + (disabled ? ' ctx-disabled' : '');
    item.innerHTML = `<span class="ctx-icon">${icon}</span><span>${label}</span>`;
    if (!disabled) item.addEventListener('mousedown', e => { e.stopPropagation(); closeCtxMenu(); action(); });
    return item;
  }

  function ctxDivider() {
    const d = document.createElement('div');
    d.className = 'ctx-divider';
    return d;
  }

  function showCtxMenu(e, target) {
    e.preventDefault();
    closeCtxMenu();
    ctxMenu.innerHTML = '';

    const onWidget   = target && target.classList.contains('widget') && !target.classList.contains('folder-modal');
    const multi      = selected.size > 1;
    const isLocked   = onWidget && target.dataset.locked === 'true';
    const selWidgets = [...selected];

    if (onWidget) {
      // Ensure right-clicked widget is selected
      if (!selected.has(target)) {
        clearSelection();
        selected.add(target);
        target.classList.add('selected');
      }


      ctxMenu.appendChild(ctxItem(
        multi ? `Duplicate ${selected.size} widgets` : 'Duplicate',
        '⧉',
        () => {
          const items = [...selected].map(serializeWidget).filter(Boolean);
          pasteWidgets(items, 24, 24);
        }
      ));

      ctxMenu.appendChild(ctxItem(
        multi ? `Copy ${selected.size} widgets` : 'Copy',
        '⎘',
        () => { clipboard = [...selected].map(serializeWidget).filter(Boolean); }
      ));

      ctxMenu.appendChild(ctxDivider());

      ctxMenu.appendChild(ctxItem('Bring forward', '↑', () => {
        [...selected].forEach(w => { const p = w.parentNode; p.appendChild(w); });
      }));

      ctxMenu.appendChild(ctxItem('Send backward', '↓', () => {
        [...selected].forEach(w => { const p = w.parentNode; p.insertBefore(w, p.firstChild); });
      }));

      ctxMenu.appendChild(ctxDivider());

      ctxMenu.appendChild(ctxItem(
        isLocked ? 'Unlock' : 'Lock',
        isLocked ? '🔓' : '🔒',
        () => {
          [...selected].forEach(w => {
            const locked = w.dataset.locked === 'true';
            w.dataset.locked = locked ? 'false' : 'true';
            w.classList.toggle('locked', !locked);
            const lb = w.querySelector('.lip-lock');
            if (lb) { lb.classList.toggle('active', !locked); lb.title = locked ? 'Lock widget' : 'Unlock widget'; }
          });
        }
      ));

      ctxMenu.appendChild(ctxDivider());

      ctxMenu.appendChild(ctxItem(
        multi ? `Delete ${selected.size} widgets` : 'Delete',
        '✕',
        () => {
          const toDelete = selWidgets.filter(w => w.dataset.locked !== 'true');
          toDelete.forEach(w => { removeWidget(w); selected.delete(w); });
        },
        isLocked && !multi
      ));

    } else {
      // Canvas background right-click
      if (clipboard.length) {
          const r = canvasEl.getBoundingClientRect();
        const wx = (e.clientX - r.left - panX) / scale;
        const wy = (e.clientY - r.top  - panY) / scale;
        ctxMenu.appendChild(ctxItem('Paste here', '⎘', () => {
          pasteWidgetsAt(clipboard, wx, wy);
        }));
        ctxMenu.appendChild(ctxDivider());
      }
      ctxMenu.appendChild(ctxItem('Zoom to fit', '⤢', () => {
        document.getElementById('btn-zoom-fit').click();
      }));
    }

    // Position — keep inside viewport
    ctxMenu.classList.add('visible');
    const r = ctxMenu.getBoundingClientRect();
    let x = e.clientX, y = e.clientY;
    if (x + r.width  > window.innerWidth)  x = window.innerWidth  - r.width  - 8;
    if (y + r.height > window.innerHeight) y = window.innerHeight - r.height - 8;
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top  = y + 'px';
  }

  // Helper: paste at a specific world position instead of offset
  function pasteWidgetsAt(items, wx, wy) {
    if (!items.length) return;
    const minX = Math.min(...items.map(i => i.left));
    const minY = Math.min(...items.map(i => i.top));
    clearSelection();
    items.forEach(data => {
      const el = spawnWidget(data, wx + (data.left - minX), wy + (data.top - minY));
      if (el) selected.add(el);
    });
    updateSelectionStyles();
    scheduleSave();
  }

  world.addEventListener('contextmenu', e => {
    const widget = e.target.closest('.widget:not(.folder-modal)');
    if (widget) { e.stopPropagation(); showCtxMenu(e, widget); return; }
    showCtxMenu(e, null);
  });
  canvasEl.addEventListener('contextmenu', e => showCtxMenu(e, null));
  document.addEventListener('mousedown', e => { if (!ctxMenu.contains(e.target)) closeCtxMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCtxMenu(); });


  document.addEventListener('keydown', e => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (selected.size === 0) return;
    e.preventDefault();
    const toDelete = [...selected].filter(w => w.dataset.locked !== 'true');
    toDelete.forEach(w => { removeWidget(w); selected.delete(w); });
  });

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

  canvasEl.addEventListener('mousedown', e => {
    if (dropperCallback) return;
    if (spaceDown) return;
    if (e.target !== canvasEl && e.target !== world) return;
    clearSelection();
    deselectTextWidget();
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

    if (connDrag) {
      if (!connDrag.live && (Math.abs(e.clientX - connDrag.sx) > 4 || Math.abs(e.clientY - connDrag.sy) > 4)) {
        connDrag.live = true;
      }
      if (connDrag.live) {
        const wp = toWorld(e.clientX, e.clientY);
        renderConnections(wp.x, wp.y);
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
        const p1 = toWorld(Math.min(selecting.sx, e.clientX), Math.min(selecting.sy, e.clientY));
        const p2 = toWorld(Math.max(selecting.sx, e.clientX), Math.max(selecting.sy, e.clientY));
        document.querySelectorAll('#world .widget').forEach(w => {
          if (w.dataset.locked === 'true') return;
          const wx = parseInt(w.style.left) || 0;
          const wy = parseInt(w.style.top)  || 0;
          const ww = w.offsetWidth;
          const wh = w.offsetHeight;
          const hit = wx < p2.x && wx + ww > p1.x && wy < p2.y && wy + wh > p1.y;
          w.classList.toggle('selected', hit);
        });
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
      if (dragging.el.classList.contains('w-image')) {
        const overFolder = getFolderAtPoint(e.clientX, e.clientY, dragging.el);
        clearFolderDropHighlight();
        if (overFolder) overFolder.classList.add('folder-drop-target');
      }
      // Frame drop highlight — show which frame the dragged widget will land in
      if (!dragging.el.classList.contains('w-frame')) {
        document.querySelectorAll('.w-frame').forEach(f => f.classList.remove('frame-drop-target'));
        const cx = parseInt(dragging.el.style.left) + dragging.el.offsetWidth / 2;
        const cy = parseInt(dragging.el.style.top) + dragging.el.offsetHeight / 2;
        document.querySelectorAll('.w-frame').forEach(frame => {
          const fx = parseInt(frame.style.left);
          const fy = parseInt(frame.style.top);
          if (cx >= fx && cx <= fx + frame.offsetWidth && cy >= fy && cy <= fy + frame.offsetHeight) {
            frame.classList.add('frame-drop-target');
          }
        });
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
        const isFrame   = resizing.el.classList.contains('w-frame');
        const minW = isPalette || isFolder ? 240 : isFrame ? 300 : 80;
        const minH = isPalette ? 140 : isFolder ? 160 : isFrame ? 200 : 40;
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
    if (dragging || resizing) renderConnections();
  });

  window.addEventListener('mouseup', e => {
    clearFolderDropHighlight();
    document.querySelectorAll('.w-frame').forEach(f => f.classList.remove('frame-drop-target'));

    if (connDrag) {
      if (connDrag.live) {
        const wp   = toWorld(e.clientX, e.clientY);
        const snap = findNearestNode(wp.x, wp.y, connDrag.fromEl);
        if (snap) {
          connections.push({
            id: 'c' + Date.now() + Math.random().toString(36).slice(2),
            fromWid:  getWidgetId(connDrag.fromEl),
            fromSide: connDrag.fromSide,
            toWid:    getWidgetId(snap.el),
            toSide:   snap.side,
          });
          scheduleSave();
        }
      }
      document.querySelectorAll('.conn-snap-target').forEach(n => n.classList.remove('conn-snap-target'));
      // Clean up any canvas state that might have leaked (prevents rubber-band from starting)
      dragging = resizing = selecting = null;
      selRect.style.display = 'none';
      canvasEl.classList.remove('selecting', 'grabbing');
      connDrag = null;
      renderConnections();
      return;
    }

    if (folderDrag) {
      const fd = folderDrag;
      fd.ghost.remove();
      if (fd.live) {
        const destFolder = getFolderAtPoint(e.clientX, e.clientY, null);
        if (destFolder && destFolder.dataset.folderId !== fd.folderId) {
          folders[destFolder.dataset.folderId].push(fd.src);
          destFolder._refreshThumbs();
          refreshModalIfOpen(destFolder.dataset.folderId);
          folders[fd.folderId].splice(fd.imgIdx, 1);
          const srcEl = document.querySelector(`[data-folder-id="${fd.folderId}"]`);
          if (srcEl && srcEl._refreshThumbs) srcEl._refreshThumbs();
          refreshModalIfOpen(fd.folderId);
        } else if (!destFolder) {
          const pos = toWorld(e.clientX, e.clientY);
          addImage(fd.src, pos.x, pos.y);
          folders[fd.folderId].splice(fd.imgIdx, 1);
          const srcEl = document.querySelector(`[data-folder-id="${fd.folderId}"]`);
          if (srcEl && srcEl._refreshThumbs) srcEl._refreshThumbs();
          refreshModalIfOpen(fd.folderId);
        }
      }
      folderDrag = null;
      return;
    }

    if (dragging && dragging.el.classList.contains('w-image')) {
      const destFolder = getFolderAtPoint(e.clientX, e.clientY, dragging.el);
      if (destFolder) {
        const src = dragging.el.querySelector('img').src;
        const folderId = destFolder.dataset.folderId;
        folders[folderId].push(src);
        destFolder._refreshThumbs();
        refreshModalIfOpen(folderId);
        removeWidget(dragging.el);
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

    // On-drop frame child attachment: if a non-frame widget was dragged, check if it landed inside a frame
    if (dragging && !dragging.el.classList.contains('w-frame')) {
      const movedEl = dragging.el;
      const wid = movedEl.dataset.wid || getWidgetId(movedEl);
      const cx = parseInt(movedEl.style.left) + movedEl.offsetWidth / 2;
      const cy = parseInt(movedEl.style.top) + movedEl.offsetHeight / 2;
      let landed = null;
      document.querySelectorAll('.w-frame').forEach(frame => {
        const fx = parseInt(frame.style.left);
        const fy = parseInt(frame.style.top);
        if (cx >= fx && cx <= fx + frame.offsetWidth && cy >= fy && cy <= fy + frame.offsetHeight) landed = frame;
      });
      // Remove from all frames, then add to the one it landed on (if any)
      document.querySelectorAll('.w-frame').forEach(f => {
        f._frameChildren = (f._frameChildren || []).filter(w => w !== wid);
      });
      if (landed) {
        landed._frameChildren = landed._frameChildren || [];
        if (!landed._frameChildren.includes(wid)) landed._frameChildren.push(wid);
      }
    }

    dragging = resizing = null;
    canvasEl.classList.remove('grabbing');
  });

  canvasEl.addEventListener('wheel', e => {
    e.preventDefault();
    const lineSize = 16;
    if (e.ctrlKey) {
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
      const dx = e.deltaMode === 1 ? e.deltaX * lineSize : e.deltaX;
      const dy = e.deltaMode === 1 ? e.deltaY * lineSize : e.deltaY;
      panX -= dx;
      panY -= dy;
    }
    applyTransform();
  }, { passive: false });

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
      .forEach(async (f, i) => {
        try {
          const pos = toWorld(e.clientX + i * 20, e.clientY + i * 20);
          const url = await uploadImageFile(f);
          addImage(url, pos.x, pos.y);
        } catch (err) {
          console.error('Image upload failed:', err);
        }
      });
  });

  /* ── Toolbar ── */
  document.getElementById('btn-image').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async e => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    for (let i = 0; i < files.length; i++) {
      try {
        const vc = viewCenter();
        const url = await uploadImageFile(files[i]);
        addImage(url, vc.x + i * 24, vc.y + i * 24);
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }
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

  /* ── Zoom to fit ── */
  document.getElementById('btn-zoom-fit').addEventListener('click', () => {
    const widgets = Array.from(document.querySelectorAll('#world .widget'));
    if (!widgets.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    widgets.forEach(w => {
      const wx = parseInt(w.style.left) || 0;
      const wy = parseInt(w.style.top)  || 0;
      minX = Math.min(minX, wx);
      minY = Math.min(minY, wy);
      maxX = Math.max(maxX, wx + w.offsetWidth);
      maxY = Math.max(maxY, wy + w.offsetHeight);
    });
    const PAD = 60;
    const contentW = maxX - minX + PAD * 2;
    const contentH = maxY - minY + PAD * 2;
    const r = canvasEl.getBoundingClientRect();
    const newScale = Math.min(r.width / contentW, r.height / contentH, 1);
    scale = newScale;
    panX  = r.width  / 2 - (minX - PAD + contentW / 2) * scale;
    panY  = r.height / 2 - (minY - PAD + contentH / 2) * scale;
    applyTransform();
  });

  /* ── Minimap ── */
  const minimapEl       = document.getElementById('minimap');
  const minimapCanvas   = document.getElementById('minimap-canvas');
  const minimapViewport = document.getElementById('minimap-viewport');
  const mmCtx           = minimapCanvas.getContext('2d');

  function drawMinimap() {
    const MW = minimapEl.clientWidth;
    const MH = minimapEl.clientHeight;
    minimapCanvas.width  = MW;
    minimapCanvas.height = MH;
    mmCtx.clearRect(0, 0, MW, MH);

    const widgets = Array.from(document.querySelectorAll('#world .widget'));
    if (!widgets.length) return;

    /* Compute bounding box of all widgets in world space */
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    widgets.forEach(w => {
      const wx = parseInt(w.style.left) || 0;
      const wy = parseInt(w.style.top)  || 0;
      const ww = w.offsetWidth;
      const wh = w.offsetHeight;
      if (wx       < minX) minX = wx;
      if (wy       < minY) minY = wy;
      if (wx + ww  > maxX) maxX = wx + ww;
      if (wy + wh  > maxY) maxY = wy + wh;
    });

    const PAD    = 40;
    const worldW = (maxX - minX) + PAD * 2;
    const worldH = (maxY - minY) + PAD * 2;
    const mmScale = Math.min(MW / worldW, MH / worldH);
    const offX   = -minX + PAD;
    const offY   = -minY + PAD;

    /* Draw each widget as a filled rect */
    widgets.forEach(w => {
      const wx = (parseInt(w.style.left) || 0);
      const wy = (parseInt(w.style.top)  || 0);
      const ww = w.offsetWidth;
      const wh = w.offsetHeight;
      mmCtx.fillStyle = w.classList.contains('selected')
        ? 'rgba(91,91,214,0.55)'
        : 'rgba(140,140,160,0.35)';
      mmCtx.strokeStyle = 'rgba(100,100,120,0.5)';
      mmCtx.lineWidth   = 0.5;
      const rx = (wx + offX) * mmScale;
      const ry = (wy + offY) * mmScale;
      const rw = Math.max(ww * mmScale, 3);
      const rh = Math.max(wh * mmScale, 3);
      mmCtx.beginPath();
      mmCtx.roundRect(rx, ry, rw, rh, 2);
      mmCtx.fill();
      mmCtx.stroke();
    });

    /* Draw viewport indicator */
    const canvasRect = canvasEl.getBoundingClientRect();
    const vpLeft   = (-panX / scale + offX) * mmScale;
    const vpTop    = (-panY / scale + offY) * mmScale;
    const vpWidth  = (canvasRect.width  / scale) * mmScale;
    const vpHeight = (canvasRect.height / scale) * mmScale;
    minimapViewport.style.left   = vpLeft   + 'px';
    minimapViewport.style.top    = vpTop    + 'px';
    minimapViewport.style.width  = vpWidth  + 'px';
    minimapViewport.style.height = vpHeight + 'px';
  }

  function scheduleMinimap() {
    if (!minimapVisible) return;
    clearTimeout(minimapDrawTimer);
    minimapDrawTimer = setTimeout(drawMinimap, 40);
  }

  document.getElementById('btn-minimap').addEventListener('click', () => {
    minimapVisible = !minimapVisible;
    minimapEl.classList.toggle('visible', minimapVisible);
    document.getElementById('btn-minimap').classList.toggle('active', minimapVisible);
    if (minimapVisible) drawMinimap();
  });

  /* Redraw minimap after widget changes */
  window.addEventListener('mouseup', scheduleMinimap);
  window.addEventListener('keyup',   scheduleMinimap);

  document.getElementById('btn-video').addEventListener('click', () => {
    const url = prompt('Paste a YouTube URL:');
    if (!url) return;
    const id = extractYoutubeId(url);
    if (!id) { alert('Could not find a YouTube video ID in that URL.\nTry: https://www.youtube.com/watch?v=…'); return; }
    const vc = viewCenter();
    addVideo(id, vc.x, vc.y);
  });

  document.getElementById('btn-frame').addEventListener('click', () => {
    const vc = viewCenter();
    const el = addFrame(vc.x - 300, vc.y - 200);
    scheduleSave();
    clearSelection();
    selected.add(el);
    updateSelectionStyles();
  });

  /* ── Dashboard button — save before leaving ── */
  document.getElementById('btn-dashboard').addEventListener('click', async e => {
    e.preventDefault();
    await saveCurrentProject();
    location.href = 'projects.html';
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
  document.getElementById('btn-help').addEventListener('click', () => cheatsheet.classList.toggle('active'));
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

  /* ── Debounced auto-save ── */
  let saveDebounce = null;
  function scheduleSave() {
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(saveCurrentProject, 800);
  }
  window.addEventListener('mouseup', scheduleSave);
  window.addEventListener('keyup', scheduleSave);

  /* ── Init: load active project ── */
  const activeDoc = projects.find(p => p.$id === activeProjectId);
  console.log('[WC] activeProjectId:', activeProjectId);
  console.log('[WC] activeDoc:', activeDoc);
  console.log('[WC] state length:', activeDoc && activeDoc.state ? activeDoc.state.length : 'no state');
  if (activeDoc && activeDoc.state) {
    try {
      restoreCanvasState(JSON.parse(activeDoc.state));
      console.log('[WC] restored OK');
    } catch (err) {
      console.error('[WC] restoreCanvasState failed:', err);
      seedDefaultContent();
    }
  } else {
    console.warn('[WC] no state found, seeding default');
    seedDefaultContent();
  }
  renderSidebar();

  function seedDefaultContent() {
    const vc = viewCenter();
    addText('heading', 'My Design Board', vc.x - 180, vc.y - 140, 360);
    addPalette(vc.x - 180, vc.y - 60);
    addFolder(vc.x + 80, vc.y - 60);
    addText('note', 'Drop images onto the canvas or into a folder to get started!', vc.x - 180, vc.y + 100, 240, 100);
    saveCurrentProject();
  }
