(async () => {
  const ACCESS_CODE = 'atlas';
  const STORAGE_KEY = 'cm-admin-gallery-state-v2';
  const SESSION_TOKEN_KEY = 'cm-admin-session-token';
  const API_BASE_KEY = 'cm-admin-api-base';
  const LOCAL_MODE = location.protocol === 'file:';
  const apiBaseMeta = document.querySelector('meta[name="admin-api-base"]');
  const queryApiBase = (() => {
    try {
      const value = new URLSearchParams(location.search).get('api') || '';
      return String(value).trim();
    } catch {
      return '';
    }
  })();
  if (queryApiBase) {
    localStorage.setItem(API_BASE_KEY, queryApiBase);
  }
  const savedApiBase = String(localStorage.getItem(API_BASE_KEY) || '').trim();
  const API_BASE = String(window.ADMIN_API_BASE || queryApiBase || savedApiBase || apiBaseMeta?.content || '').trim().replace(/\/$/, '');
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm';
  const ALLOWED_UPLOAD_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm'
  ]);

  const gate = document.querySelector('[data-admin-gate]');
  const app = document.querySelector('[data-admin-app]');
  const gateForm = document.querySelector('[data-gate-form]');
  const gateInput = document.querySelector('[data-gate-input]');
  const gateStatus = document.querySelector('[data-gate-status]');
  const gateMessage = document.querySelector('[data-gate-message]');
  const kindStatus = document.querySelector('[data-kind-status]');
  const draftStatus = document.querySelector('[data-draft-status]');
  const logoutBtn = document.querySelector('[data-logout]');

  const newItemBtn = document.querySelector('[data-new-item]');
  const bulkImportBtn = document.querySelector('[data-bulk-import]');
  const duplicateBtn = document.querySelector('[data-duplicate-item]');
  const deleteBtn = document.querySelector('[data-delete-item]');
  const saveBtn = document.querySelector('[data-save-draft]');
  const exportJsonBtn = document.querySelector('[data-export-json]');
  const exportHtmlBtn = document.querySelector('[data-export-html]');
  const publishBtn = document.querySelector('[data-publish]');
  const toggleOverlayBtn = document.querySelector('[data-toggle-overlay]');

  const searchInput = document.querySelector('[data-search]');
  const listRoot = document.querySelector('[data-content-list]');
  const formRoot = document.querySelector('[data-editor-form]');
  const previewCard = document.querySelector('[data-preview-card]');
  const publishStatus = document.querySelector('[data-publish-status]');
  const editorTitle = document.querySelector('[data-editor-title]');
  const editorMeta = document.querySelector('[data-editor-meta]');

  const gallerySeed = [
    {
      id: 'img_0705',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_0705/img_0705-media-1791594590980.jpg',
      posterSrc: '',
      tags: []
    },
    {
      id: 'img_2149',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_2149/img_2149-media-1791594495612.jpg',
      posterSrc: '',
      tags: []
    },
    {
      id: 'img_2191',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_2191/img_2191-media-1791594477503.jpg',
      posterSrc: '',
      tags: []
    },
    {
      id: 'img_2468',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_2468/img_2468-media-1791594434766.jpg',
      posterSrc: '',
      tags: []
    },
    {
      id: 'img_2519',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_2519/img_2519-media-1791594420891.jpg',
      posterSrc: '',
      tags: []
    },
    {
      id: 'img_2546',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_2546/img_2546-media-1791594406526.jpg',
      posterSrc: '',
      tags: []
    },
    {
      id: 'img_2610',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_2610/img_2610-media-1791594464151.jpg',
      posterSrc: '',
      tags: []
    },
    {
      id: 'img_2620',
      title: '',
      kicker: '',
      description: '',
      link: '',
      mediaType: 'image',
      mediaSrc: 'gallery/img_2620/img_2620-media-1791594448625.jpg',
      posterSrc: '',
      tags: []
    }
  ];

  const deepClone = (val) => JSON.parse(JSON.stringify(val));
  const authHeaders = () => {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const storeSessionToken = (token) => {
    if (!token) return;
    sessionStorage.setItem(SESSION_TOKEN_KEY, String(token));
  };
  const clearSessionToken = () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  };
  const apiUrl = (path) => {
    if (LOCAL_MODE || !API_BASE) return path;
    return `${API_BASE}${path}`;
  };

  const normalizeTags = (val) => {
    if (Array.isArray(val)) return val.map((t) => String(t).trim()).filter(Boolean);
    return String(val || '').split(',').map((t) => t.trim()).filter(Boolean);
  };

  const previewAssetPath = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('../') || value.startsWith('./') || value.startsWith('blob:')) {
      return value;
    }
    return `../${value}`;
  };

    const sanitizeLinkUrl = (raw) => {
    const val = String(raw || '').trim();
    if (!val) return '';
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(val)) return val;
    return `https://${val}`;
  };

const normalizeAssetPath = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('blob:')) {
      return value;
    }
    return value.replace(/^\.\.\//, '').replace(/^\.\//, '');
  };

  const slugifySegment = (val) => String(val || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  const trimFileNameExt = (name) => String(name || '').replace(/\.[a-z0-9]+$/i, '');

  const formatBytes = (val) => {
    const bytes = Number(val || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const parseJsonSafe = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const uploadMediaAsset = async ({ file, folder, basename }) => {
    if (LOCAL_MODE) {
      throw new Error('Upload requires deployed /admin route connected to Worker backend.');
    }
    if (!API_BASE) {
      throw new Error('Admin API URL is not configured.');
    }
    if (!isAuthenticated) {
      throw new Error('Sign in before uploading files.');
    }
    if (!(file instanceof File)) {
      throw new Error('No file selected.');
    }
    const mime = String(file.type || '').toLowerCase();
    if (!ALLOWED_UPLOAD_TYPES.has(mime)) {
      throw new Error('Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, or WebM.');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`File too large (${formatBytes(file.size)}). Max ${formatBytes(MAX_UPLOAD_BYTES)}.`);
    }

    const body = new FormData();
    body.append('file', file);
    body.append('folder', String(folder || 'gallery'));
    body.append('basename', String(basename || trimFileNameExt(file.name) || 'media'));

    const response = await fetch(apiUrl('/api/admin/upload'), {
      method: 'POST',
      credentials: 'include',
      headers: { ...authHeaders() },
      body
    });

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error(payload?.error || `Upload failed (${response.status}).`);
    }
    if (!payload?.path) {
      throw new Error('Upload succeeded but did not return a file path.');
    }

    return payload;
  };

  const createUploadWidget = ({ title, hint, folder, basename, onUploaded }) => {
    const wrap = document.createElement('div');
    wrap.className = 'admin-upload-widget';

    const widgetTitle = document.createElement('div');
    widgetTitle.className = 'admin-label';
    widgetTitle.textContent = title;

    const zone = document.createElement('div');
    zone.className = 'admin-upload-dropzone';
    zone.tabIndex = 0;
    zone.setAttribute('role', 'button');
    zone.setAttribute('aria-label', `${title}. Drag & drop an image or video, or click to browse.`);
    zone.textContent = 'Drop image or video here (or click to browse)';

    const helper = document.createElement('p');
    helper.className = 'admin-upload-hint';
    helper.textContent = hint;

    const status = document.createElement('p');
    status.className = 'admin-upload-status';
    status.setAttribute('aria-live', 'polite');

    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = UPLOAD_ACCEPT;
    picker.hidden = true;

    const setStatus = (text, isError = false) => {
      status.textContent = text;
      status.classList.toggle('is-error', isError);
    };

    const openPicker = () => picker.click();

    const handleFile = async (file) => {
      if (!file) return;
      setStatus(`Uploading ${file.name} (${formatBytes(file.size)})...`);
      zone.classList.add('is-busy');
      try {
        const payload = await uploadMediaAsset({ file, folder, basename });
        onUploaded(payload.path, file, payload);
        setStatus(`Uploaded to ${payload.path}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Media upload failed.';
        setStatus(message, true);
      } finally {
        zone.classList.remove('is-busy');
        picker.value = '';
      }
    };

    zone.addEventListener('click', openPicker);
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPicker();
      }
    });

    const preventDef = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    zone.addEventListener('dragenter', (e) => { preventDef(e); zone.classList.add('is-dragover'); });
    zone.addEventListener('dragover', (e) => { preventDef(e); zone.classList.add('is-dragover'); });
    zone.addEventListener('dragleave', (e) => { preventDef(e); zone.classList.remove('is-dragover'); });
    zone.addEventListener('drop', (e) => {
      preventDef(e);
      zone.classList.remove('is-dragover');
      const file = e.dataTransfer?.files?.[0];
      void handleFile(file);
    });

    picker.addEventListener('change', () => {
      const file = picker.files?.[0];
      void handleFile(file);
    });

    wrap.append(widgetTitle, zone, helper, status, picker);
    return wrap;
  };

  const defaultState = () => ({
    projects: deepClone(gallerySeed),
    selectedId: gallerySeed[0]?.id || '',
    search: '',
    mediaFilter: 'all',
    previewHover: true
  });

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return {
        ...defaultState(),
        ...parsed,
        projects: Array.isArray(parsed.projects) && parsed.projects.length ? parsed.projects : deepClone(gallerySeed),
        selectedId: parsed.selectedId || gallerySeed[0]?.id || '',
        search: parsed.search || '',
        mediaFilter: parsed.mediaFilter || 'all',
        previewHover: parsed.previewHover !== false
      };
    } catch {
      return defaultState();
    }
  };

  const fetchCanonicalProjects = async () => {
    try {
      const res = await fetch('../gallery/projects.json?v=' + Date.now());
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        // If localStorage has default seed or fewer items, sync with projects.json
        const localProjects = state.projects || [];
        if (data.length >= localProjects.length) {
          state.projects = data;
          if (!state.selectedId || !state.projects.some((p) => p.id === state.selectedId)) {
            state.selectedId = state.projects[0]?.id || '';
          }
          persistState();
        }
      }
    } catch {
      // Keep local state fallback
    }
  };

  let state = loadState();
  let isAuthenticated = false;


  const configureGateUi = () => {
    if (gateMessage) {
      if (LOCAL_MODE) {
        gateMessage.textContent = 'Local preview mode is using the temporary passcode gate ("atlas"). On deployed /admin, secure worker authentication is active.';
      } else if (!API_BASE) {
        gateMessage.textContent = 'Admin API is not configured. Set admin-api-base or pass ?api=https://... in URL.';
      } else {
        gateMessage.textContent = `Sign in with your ADMIN_PASSWORD. Authenticating via ${API_BASE}.`;
      }
    }
    if (gateInput) {
      gateInput.placeholder = LOCAL_MODE ? 'Enter passcode (e.g. atlas)' : 'Enter admin password';
    }
  };

  const persistState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (draftStatus) draftStatus.textContent = 'Drafts saved locally.';
  };

  const setGate = (open) => {
    if (gate) gate.hidden = open;
    if (app) app.hidden = !open;
    if (logoutBtn) logoutBtn.hidden = !open || LOCAL_MODE;
  };

  const unlock = () => {
    isAuthenticated = true;
    setGate(true);
    renderAll();
  };

  const lock = () => {
    isAuthenticated = false;
    clearSessionToken();
    setGate(false);
  };

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    return { response, payload };
  };

  const checkSession = async () => {
    if (LOCAL_MODE) {
      setGate(false);
      return;
    }
    if (!API_BASE) {
      lock();
      return;
    }
    try {
      const { response, payload } = await requestJson(apiUrl('/api/admin/session'), { method: 'GET' });
      if (response.ok && payload?.authenticated) {
        if (payload?.token) storeSessionToken(payload.token);
        unlock();
        return;
      }
    } catch {
      // Keep gate visible on error
    }
    lock();
  };

  const getCurrentProject = () => {
    return state.projects.find((p) => p.id === state.selectedId) || state.projects[0] || null;
  };

  const createNewProject = () => ({
    id: `project-${Date.now()}`,
    title: '',
    kicker: '',
    description: '',
      link: '',
    mediaType: 'image',
    mediaSrc: 'gallery/new-project/image.jpg',
    posterSrc: '',
    tags: []
  });

  const handleBulkImportFiles = async (files) => {
    if (!files || !files.length) return;
    const newProjects = [];
    if (publishStatus) publishStatus.textContent = `Processing ${files.length} media file(s)...`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nameStem = trimFileNameExt(file.name);
      const folderSlug = slugifySegment(nameStem || `media-${Date.now()}-${i}`) || `media-${Date.now()}-${i}`;
      const isVideo = String(file.type || '').toLowerCase().startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

      let mediaSrcPath = `gallery/${folderSlug}/${file.name}`;

      if (!LOCAL_MODE && API_BASE && isAuthenticated) {
        try {
          const payload = await uploadMediaAsset({
            file,
            folder: `gallery/${folderSlug}`,
            basename: `${folderSlug}-media`
          });
          if (payload?.path) mediaSrcPath = payload.path;
        } catch (err) {
          console.warn('Bulk upload failed for file:', file.name, err);
        }
      }

      newProjects.push({
        id: folderSlug,
        title: '',
        kicker: '',
        description: '',
      link: '',
        mediaType: isVideo ? 'video' : 'image',
        mediaSrc: mediaSrcPath,
        posterSrc: '',
        tags: []
      });
    }

    state.projects = [...newProjects, ...state.projects];
    if (newProjects[0]) state.selectedId = newProjects[0].id;
    persistState();
    renderAll();
    if (publishStatus) publishStatus.textContent = `Created ${newProjects.length} new gallery project(s) with clean image/video output.`;
  };

  const writeCurrentProject = (updater) => {
    const currentId = state.selectedId;
    const current = state.projects.find((p) => p.id === currentId);
    if (!current) return null;

    const updated = updater(deepClone(current));
    state.projects = state.projects.map((p) => (p.id === currentId ? updated : p));
    state.selectedId = updated.id;
    persistState();
    return updated;
  };

  const addProject = (project) => {
    state.projects.unshift(project);
    state.selectedId = project.id;
    persistState();
  };

  const deleteCurrentProject = () => {
    const current = getCurrentProject();
    if (!current) return;
    const label = current.title || current.id;
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return;

    state.projects = state.projects.filter((p) => p.id !== current.id);
    state.selectedId = state.projects[0]?.id || '';
    persistState();
    renderAll();
  };

  const duplicateCurrentProject = () => {
    const current = getCurrentProject();
    if (!current) return;
    const copy = deepClone(current);
    copy.id = `${copy.id}-copy`;
    if (copy.title) copy.title = `${copy.title} (Copy)`;
    state.projects.unshift(copy);
    state.selectedId = copy.id;
    persistState();
    renderAll();
  };

  const field = (label, input) => {
    const wrap = document.createElement('label');
    wrap.className = 'admin-field';
    const caption = document.createElement('span');
    caption.className = 'admin-label';
    caption.textContent = label;
    wrap.append(caption, input);
    return wrap;
  };

  const makeInput = (value = '', type = 'text') => {
    const input = document.createElement('input');
    input.type = type;
    input.value = value ?? '';
    return input;
  };

  const makeTextarea = (value = '') => {
    const textarea = document.createElement('textarea');
    textarea.value = value ?? '';
    return textarea;
  };

  const makeSelect = (options, value) => {
    const select = document.createElement('select');
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value || opt;
      option.textContent = opt.label || opt;
      select.append(option);
    }
    select.value = value;
    return select;
  };

  const renderKindStatus = () => {
    if (kindStatus) kindStatus.textContent = `gallery (${state.projects.length})`;
    document.querySelectorAll('[data-filter-kind]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.filterKind === state.mediaFilter);
    });
  };

  const renderList = () => {
    if (!listRoot) return;
    const query = String(state.search || '').trim().toLowerCase();
    const filter = state.mediaFilter;

    const items = state.projects.filter((item) => {
      const matchesFilter = filter === 'all' || item.mediaType === filter;
      const matchesQuery = !query || JSON.stringify(item).toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'No gallery projects match current filter or search query.';
      listRoot.replaceChildren(empty);
      return;
    }

    const buttons = items.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-item';
      button.classList.toggle('is-active', item.id === state.selectedId);

      const top = document.createElement('div');
      top.className = 'admin-item-top';
      const title = document.createElement('div');
      title.className = 'admin-item-title';
      title.textContent = item.title || item.id;

      const badge = document.createElement('span');
      badge.className = `admin-item-badge ${item.mediaType}`;
      badge.textContent = item.mediaType || 'image';
      top.append(title, badge);

      const kicker = document.createElement('div');
      kicker.className = 'admin-item-meta';
      kicker.textContent = item.kicker || (item.title ? item.id : 'Image-only project');

      const note = document.createElement('div');
      note.className = 'admin-item-note';
      note.textContent = item.description || (item.mediaSrc ? `Src: ${item.mediaSrc}` : 'No description');

      const tags = document.createElement('div');
      tags.className = 'admin-tag-row';
      for (const tag of Array.isArray(item.tags) ? item.tags : normalizeTags(item.tags)) {
        const span = document.createElement('span');
        span.textContent = tag;
        tags.append(span);
      }

      button.append(top, kicker, note, tags);
      button.addEventListener('click', () => {
        state.selectedId = item.id;
        persistState();
        renderAll();
      });
      return button;
    });

    listRoot.replaceChildren(...buttons);
  };

  const renderEditor = () => {
    if (!formRoot || !editorTitle || !editorMeta) return;
    const project = getCurrentProject();
    if (!project) {
      editorTitle.textContent = 'Select a project';
      editorMeta.textContent = '';
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'Click "+ new project" or "+ bulk import media" to create a project.';
      formRoot.replaceChildren(empty);
      return;
    }

    editorTitle.textContent = project.title || project.id;
    editorMeta.textContent = `ID: ${project.id}`;

    const grid = document.createElement('div');
    grid.className = 'admin-grid';

    const idInput = makeInput(project.id);
    const titleInput = makeInput(project.title);
    const kickerInput = makeInput(project.kicker);
    const linkInput = makeInput(project.link || '');
    linkInput.placeholder = 'https://... (opens in new tab on click)';
    const mediaTypeSelect = makeSelect([
      { value: 'image', label: 'Image (JPG, PNG, WebP, GIF)' },
      { value: 'video', label: 'Video (MP4, WebM)' }
    ], project.mediaType || 'image');
    const mediaSrcInput = makeInput(project.mediaSrc);
    const posterSrcInput = makeInput(project.posterSrc || '');
    const tagsInput = makeInput(Array.isArray(project.tags) ? project.tags.join(', ') : project.tags || '');
    const descTextarea = makeTextarea(project.description);

    const fields = [
      field('project id (folder slug)', idInput),
      field('project title (optional)', titleInput),
      field('kicker / organization (optional)', kickerInput),
      field('project link / destination URL (optional, opens in new tab)', linkInput),
      field('media type', mediaTypeSelect),
      field('media source file (image or video)', mediaSrcInput),
      field('poster image source (video fallback - optional)', posterSrcInput),
      field('tags (optional, comma-separated)', tagsInput),
      field('project description (optional)', descTextarea)
    ];

    fields[0].classList.add('full');
    fields[1].classList.add('full');
    fields[2].classList.add('full');
    fields[3].classList.add('full');
    fields[5].classList.add('full');
    fields[6].classList.add('full');
    fields[7].classList.add('full');
    fields[8].classList.add('full');

    const note = document.createElement('div');
    note.className = 'admin-note';
    note.textContent = 'All text fields (Title, Kicker, Description, Tags) are optional. If left blank, the project displays as a clean 1:1 image or video gallery tile on the site.';

    const uploadPanel = document.createElement('div');
    uploadPanel.className = 'admin-section';

    const folderSlug = slugifySegment(project.id || project.title || 'project') || 'project';
    const uploadWidget = createUploadWidget({
      title: 'upload project media',
      hint: 'Drag & drop image (JPG, PNG, WebP, GIF) or video (MP4, WebM). Automatically sets media source.',
      folder: `gallery/${folderSlug}`,
      basename: `${folderSlug}-media`,
      onUploaded: (path, file) => {
        const mime = String(file?.type || '').toLowerCase();
        const isVideo = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(path);
        
        writeCurrentProject((item) => {
          if (isVideo) {
            item.mediaType = 'video';
            item.mediaSrc = path;
          } else {
            if (item.mediaType === 'video' && !item.posterSrc) {
              item.posterSrc = path;
            } else {
              item.mediaType = 'image';
              item.mediaSrc = path;
            }
          }
          return item;
        });

        renderEditor();
        renderPreview();
        renderList();
      }
    });

    uploadPanel.replaceChildren(uploadWidget);

    formRoot.replaceChildren(grid, note, uploadPanel);
    grid.replaceChildren(...fields);

    const commit = () => {
      const updated = writeCurrentProject((item) => {
        item.id = slugifySegment(idInput.value) || item.id;
        item.title = titleInput.value.trim();
        item.kicker = kickerInput.value.trim();
        item.mediaType = mediaTypeSelect.value;
        item.mediaSrc = normalizeAssetPath(mediaSrcInput.value.trim());
        item.posterSrc = normalizeAssetPath(posterSrcInput.value.trim());
        item.link = linkInput.value.trim();
        item.tags = normalizeTags(tagsInput.value);
        item.description = descTextarea.value.trim();
        return item;
      });

      if (!updated) return;
      editorTitle.textContent = updated.title || updated.id;
      editorMeta.textContent = `ID: ${updated.id}`;
      renderList();
      renderPreview();
    };

    [idInput, titleInput, kickerInput, linkInput, mediaTypeSelect, mediaSrcInput, posterSrcInput, tagsInput, descTextarea]
      .forEach((input) => {
        input.addEventListener('input', commit);
        input.addEventListener('change', commit);
      });

    linkInput.addEventListener('blur', () => {
      const sanitized = sanitizeLinkUrl(linkInput.value);
      if (sanitized !== linkInput.value) {
        linkInput.value = sanitized;
        commit();
      }
    });
  };

  const renderPreview = () => {
    if (!previewCard) return;
    const project = getCurrentProject();
    if (!project) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'Preview will appear here.';
      previewCard.replaceChildren(empty);
      return;
    }

    const wrapper = document.createElement('article');
    wrapper.className = `admin-preview-card project-card ${state.previewHover ? 'is-hovered' : ''}`;

    const mediaSrc = previewAssetPath(project.mediaSrc);
    const posterSrc = previewAssetPath(project.posterSrc);
    const isVideo = project.mediaType === 'video' || /\.(mp4|webm|mov)$/i.test(project.mediaSrc);

    if (isVideo) {
      const video = document.createElement('video');
      video.className = 'project-img';
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      if (posterSrc) video.poster = posterSrc;

      const source = document.createElement('source');
      source.src = mediaSrc;
      source.type = mediaSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4';
      video.append(source);

      const fallbackImg = document.createElement('img');
      fallbackImg.src = posterSrc || mediaSrc;
      fallbackImg.alt = project.title || 'Project preview';
      fallbackImg.className = 'project-img';
      video.append(fallbackImg);

      wrapper.append(video);
    } else {
      const img = document.createElement('img');
      img.className = 'project-img';
      img.src = mediaSrc || '';
      img.alt = project.title || 'Project image';
      wrapper.append(img);
    }

    const hasOverlayText = Boolean(
      (project.kicker && project.kicker.trim()) ||
      (project.title && project.title.trim()) ||
      (project.description && project.description.trim())
    );

    if (hasOverlayText) {
      const overlay = document.createElement('div');
      overlay.className = 'project-overlay';

      if (project.kicker && project.kicker.trim()) {
        const kicker = document.createElement('p');
        kicker.className = 'project-kicker';
        kicker.textContent = project.kicker.trim();
        overlay.append(kicker);
      }

      if (project.title && project.title.trim()) {
        const title = document.createElement('h2');
        title.className = 'project-title';
        title.textContent = project.title.trim();
        overlay.append(title);
      }

      if (project.description && project.description.trim()) {
        const desc = document.createElement('p');
        desc.className = 'project-description';
        desc.textContent = project.description.trim();
        overlay.append(desc);
      }

      wrapper.append(overlay);
    }

    wrapper.addEventListener('click', () => {
      state.previewHover = !state.previewHover;
      persistState();
      renderPreview();
    });

    previewCard.replaceChildren(wrapper);

    let testBar = previewCard.parentElement.querySelector('.admin-preview-link-bar');
    if (!testBar) {
      testBar = document.createElement('div');
      testBar.className = 'admin-preview-link-bar';
      previewCard.after(testBar);
    }
    if (project.link && project.link.trim()) {
      testBar.innerHTML = `<a class="admin-btn admin-btn-small admin-btn-link-test" href="${project.link.trim()}" target="_blank" rel="noopener noreferrer">test link: ${project.link.trim()} ↗</a>`;
      testBar.hidden = false;
    } else {
      testBar.innerHTML = '';
      testBar.hidden = true;
    }
  };

  const renderAll = () => {
    renderKindStatus();
    renderList();
    renderEditor();
    renderPreview();
  };

  const exportProjectsJson = () => {
    const payload = JSON.stringify(state.projects, null, 2) + '\n';
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportProjectsHtml = () => {
    const htmlArticles = state.projects.map((p) => {
      const isVideo = p.mediaType === 'video';
      const hasOverlay = Boolean(
        (p.kicker && p.kicker.trim()) ||
        (p.title && p.title.trim()) ||
        (p.description && p.description.trim())
      );
      const hasLink = Boolean(p.link && p.link.trim());
      const tag = hasLink ? 'a' : 'article';
      const linkAttrs = hasLink ? ` href="${p.link.trim()}" target="_blank" rel="noopener noreferrer"` : '';
      const cardClass = hasLink ? 'project-card has-link' : 'project-card is-static';

      let overlayHtml = '';
      if (hasOverlay) {
        const parts = [];
        if (p.kicker && p.kicker.trim()) parts.push(`          <p class="project-kicker">${p.kicker.trim()}</p>`);
        if (p.title && p.title.trim()) parts.push(`          <h2 class="project-title">${p.title.trim()}</h2>`);
        if (p.description && p.description.trim()) parts.push(`          <p class="project-description">${p.description.trim()}</p>`);
        overlayHtml = `\n        <div class="project-overlay">\n${parts.join('\n')}\n        </div>`;
      }

      if (isVideo) {
        return `      <${tag} class="${cardClass}"${linkAttrs}>
        <video class="project-img" autoplay loop muted playsinline${p.posterSrc ? ` poster="${p.posterSrc}"` : ''}>
          <source src="${p.mediaSrc}" type="video/mp4" />
          <img src="${p.posterSrc || p.mediaSrc}" alt="${p.title || 'Project video'}" class="project-img" />
        </video>${overlayHtml}
      </${tag}>`;
      } else {
        return `      <${tag} class="${cardClass}"${linkAttrs}>
        <img src="${p.mediaSrc}" alt="${p.title || 'Project image'}" class="project-img" />${overlayHtml}
      </${tag}>`;
      }
    }).join('\n\n');

    const fullSnippet = `<!-- GALLERY PROJECTS GRID -->\n<div class="projects-grid">\n${htmlArticles}\n</div>`;
    
    const blob = new Blob([fullSnippet], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gallery-grid-snippet.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  const publish = async () => {
    if (LOCAL_MODE) {
      if (publishStatus) publishStatus.textContent = 'Publish endpoint unavailable in file:// preview. Use Export JSON or Export HTML to download updated files.';
      return;
    }

    if (!isAuthenticated) {
      if (publishStatus) publishStatus.textContent = 'Sign in before publishing.';
      return;
    }

    if (publishStatus) publishStatus.textContent = 'Publishing gallery to repository...';

    try {
      const { response, payload: result } = await requestJson(apiUrl('/api/admin/publish'), {
        method: 'POST',
        body: JSON.stringify({
          projects: state.projects,
          gallery: state.projects

        })
      });



      if (!response.ok) {
        let detail = result?.error || result?.message || `Publish failed (${response.status})`;
        if (typeof detail === 'string' && detail.toLowerCase().includes('trips')) {
          detail = 'The Cloudflare Worker backend is running an outdated version. Please run "npx wrangler deploy" to update the live worker.';
        }
        if (publishStatus) publishStatus.textContent = detail;
        return;
      }
      if (publishStatus) publishStatus.textContent = result.message || 'Published projects to gallery/projects.json.';
    } catch {
      if (publishStatus) publishStatus.textContent = 'Network error reaching publish endpoint. Verify worker API URL and CORS configuration.';
    }
  };

  const bulkPicker = document.createElement('input');
  bulkPicker.type = 'file';
  bulkPicker.multiple = true;
  bulkPicker.accept = UPLOAD_ACCEPT;
  bulkPicker.hidden = true;
  document.body.append(bulkPicker);

  bulkImportBtn?.addEventListener('click', () => {
    bulkPicker.click();
  });

  bulkPicker.addEventListener('change', () => {
    const files = Array.from(bulkPicker.files || []);
    void handleBulkImportFiles(files);
    bulkPicker.value = '';
  });

  gateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = String(gateInput?.value || '').trim();

    if (LOCAL_MODE) {
      if (pass === ACCESS_CODE) {
        if (gateStatus) gateStatus.textContent = 'Unlocked.';
        unlock();
      } else if (gateStatus) {
        gateStatus.textContent = 'Wrong passcode. Try "atlas".';
      }
      return;
    }

    if (gateStatus) gateStatus.textContent = 'Signing in...';

    try {
      const { response, payload } = await requestJson(apiUrl('/api/admin/login'), {
        method: 'POST',
        body: JSON.stringify({ password: pass })
      });

      if (!response.ok) {
        if (gateStatus) gateStatus.textContent = payload?.error || 'Login failed.';
        return;
      }

      storeSessionToken(payload?.token);
      if (gateStatus) gateStatus.textContent = 'Signed in.';
      unlock();
    } catch {
      if (gateStatus) gateStatus.textContent = 'Login endpoint unavailable.';
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    if (LOCAL_MODE) return;
    try {
      await requestJson(apiUrl('/api/admin/logout'), { method: 'POST' });
    } catch {
      // Fall through to lock local UI
    }
    lock();
    if (gateStatus) gateStatus.textContent = 'Signed out.';
  });

  document.querySelectorAll('[data-filter-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      state.mediaFilter = button.dataset.filterKind || 'all';
      persistState();
      renderKindStatus();
      renderList();
    });
  });

  searchInput?.addEventListener('input', () => {
    state.search = searchInput.value || '';
    persistState();
    renderList();
  });

  newItemBtn?.addEventListener('click', () => {
    addProject(createNewProject());
    renderAll();
  });

  duplicateBtn?.addEventListener('click', () => {
    duplicateCurrentProject();
  });

  deleteBtn?.addEventListener('click', () => {
    deleteCurrentProject();
  });

  saveBtn?.addEventListener('click', () => {
    persistState();
  });

  exportJsonBtn?.addEventListener('click', exportProjectsJson);
  exportHtmlBtn?.addEventListener('click', exportProjectsHtml);
  publishBtn?.addEventListener('click', publish);

  toggleOverlayBtn?.addEventListener('click', () => {
    state.previewHover = !state.previewHover;
    persistState();
    renderPreview();
  });

  configureGateUi();
  await checkSession();
  await fetchCanonicalProjects();

  if (searchInput) searchInput.value = state.search || '';
  if (isAuthenticated || LOCAL_MODE) renderAll();
})();