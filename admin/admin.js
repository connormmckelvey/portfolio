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
      id: 'haplink',
      title: 'Haplink™ Communication Protocol',
      kicker: 'Texas Robotics / HERO Lab',
      description: 'Bare-metal C++ firmware library and Python framework implementing low-latency serial data validation. Optimized packet sizes down to 13 bytes at 100Hz.',
      mediaType: 'image',
      mediaSrc: 'gallery/haplink/image.jpg',
      posterSrc: '',
      tags: ['Firmware', 'C++', 'Python', 'Robotics']
    },
    {
      id: 'vibrotactile-band',
      title: 'Vibrotactile Motion Feedback Band',
      kicker: 'Human Enabled Robotics Lab',
      description: 'Modular haptic band system with custom 3cm x 5cm PCB, integrated IMU tracking, directional motor pods, and 1ms low-latency wireless protocol.',
      mediaType: 'image',
      mediaSrc: 'gallery/vibrotactile-band/image.jpg',
      posterSrc: '',
      tags: ['Haptics', 'PCB', 'Firmware', 'C++']
    },
    {
      id: 'drawing-robot',
      title: '2-DoF Drawing Robotic Arm',
      kicker: 'UT Austin AI Perception Research',
      description: 'Custom 2-degree-of-freedom robotic drawing arm with inverse kinematics software pipeline, Douglas-Peucker path optimization, and custom G-code compiler.',
      mediaType: 'video',
      mediaSrc: 'gallery/drawing-robot/video.mp4',
      posterSrc: 'gallery/drawing-robot/image.jpg',
      tags: ['Robotics', 'Kinematics', 'C++', 'Control']
    },
    {
      id: 'skylore',
      title: 'SkyLore AR Celestial App',
      kicker: '1st Place HackTX 2025 Winner',
      description: 'Crowdsourced astronomy platform leveraging user data for light pollution mapping. Built with real-time augmented reality and constellation recognition machine learning model.',
      mediaType: 'image',
      mediaSrc: 'gallery/skylore/image.jpg',
      posterSrc: '',
      tags: ['AR', 'Mobile', 'Machine Learning', 'Hackathon']
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
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('../') || value.startsWith('./')) {
      return value;
    }
    return `../${value}`;
  };

  const normalizeAssetPath = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) {
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
    title: 'New Gallery Project',
    kicker: 'Texas Robotics / HERO Lab',
    description: 'Enter project details, firmware notes, hardware specifications, or research accomplishments here.',
    mediaType: 'image',
    mediaSrc: 'gallery/new-project/image.jpg',
    posterSrc: '',
    tags: ['Embedded', 'Robotics']
  });

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
    if (!confirm(`Are you sure you want to delete "${current.title}" (${current.id})?`)) return;

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
    copy.title = `${copy.title} (Copy)`;
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
      kicker.textContent = item.kicker || item.id;

      const note = document.createElement('div');
      note.className = 'admin-item-note';
      note.textContent = item.description || '';

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
      empty.textContent = 'Click "+ new project" to create a gallery project.';
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
      field('project title', titleInput),
      field('kicker / organization', kickerInput),
      field('media type', mediaTypeSelect),
      field('media source file (image or video)', mediaSrcInput),
      field('poster image source (video fallback image)', posterSrcInput),
      field('tags (comma-separated)', tagsInput),
      field('project description', descTextarea)
    ];

    fields[0].classList.add('full');
    fields[1].classList.add('full');
    fields[2].classList.add('full');
    fields[4].classList.add('full');
    fields[5].classList.add('full');
    fields[6].classList.add('full');
    fields[7].classList.add('full');

    const note = document.createElement('div');
    note.className = 'admin-note';
    note.textContent = 'Upload image or video files directly into gallery/<project-id>/. Videos play automatically on hover/autoplay with video poster fallback.';

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

    [idInput, titleInput, kickerInput, mediaTypeSelect, mediaSrcInput, posterSrcInput, tagsInput, descTextarea]
      .forEach((input) => {
        input.addEventListener('input', commit);
        input.addEventListener('change', commit);
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
      img.src = mediaSrc || '../gallery/haplink/image.jpg';
      img.alt = project.title || 'Project image';
      wrapper.append(img);
    }

    const overlay = document.createElement('div');
    overlay.className = 'project-overlay';

    const kicker = document.createElement('p');
    kicker.className = 'project-kicker';
    kicker.textContent = project.kicker || 'Texas Robotics / HERO Lab';

    const title = document.createElement('h2');
    title.className = 'project-title';
    title.textContent = project.title || 'Untitled Project';

    const desc = document.createElement('p');
    desc.className = 'project-description';
    desc.textContent = project.description || 'Project description...';

    overlay.append(kicker, title, desc);
    wrapper.append(overlay);

    wrapper.addEventListener('click', () => {
      state.previewHover = !state.previewHover;
      persistState();
      renderPreview();
    });

    previewCard.replaceChildren(wrapper);
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
      if (isVideo) {
        return `      <article class="project-card">
        <video class="project-img" autoplay loop muted playsinline${p.posterSrc ? ` poster="${p.posterSrc}"` : ''}>
          <source src="${p.mediaSrc}" type="video/mp4" />
          <img src="${p.posterSrc || p.mediaSrc}" alt="${p.title}" class="project-img" />
        </video>
        <div class="project-overlay">
          <p class="project-kicker">${p.kicker}</p>
          <h2 class="project-title">${p.title}</h2>
          <p class="project-description">${p.description}</p>
        </div>
      </article>`;
      } else {
        return `      <article class="project-card">
        <img src="${p.mediaSrc}" alt="${p.title}" class="project-img" />
        <div class="project-overlay">
          <p class="project-kicker">${p.kicker}</p>
          <h2 class="project-title">${p.title}</h2>
          <p class="project-description">${p.description}</p>
        </div>
      </article>`;
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
        body: JSON.stringify({ projects: state.projects })
      });

      if (!response.ok) {
        const detail = result?.error || result?.message || `Publish failed (${response.status})`;
        if (publishStatus) publishStatus.textContent = detail;
        return;
      }
      if (publishStatus) publishStatus.textContent = result.message || 'Published projects to gallery/projects.json.';
    } catch {
      if (publishStatus) publishStatus.textContent = 'Network error reaching publish endpoint. Verify worker API URL and CORS configuration.';
    }
  };

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

  if (searchInput) searchInput.value = state.search || '';
  if (isAuthenticated || LOCAL_MODE) renderAll();
})();