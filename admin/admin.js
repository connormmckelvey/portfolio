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
  const UPLOAD_ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.heic,.heif';
  const ALLOWED_UPLOAD_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/webm', 'video/quicktime'
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
  const moveUpBtn = document.querySelector('[data-move-up]');
  const moveDownBtn = document.querySelector('[data-move-down]');
  const openReorderBtns = document.querySelectorAll('[data-open-reorder]');
  const closeReorderBtns = document.querySelectorAll('[data-close-reorder]');
  const reorderModal = document.querySelector('[data-reorder-modal]');
  const reorderGrid = document.querySelector('[data-reorder-grid]');
  const reorderCount = document.querySelector('[data-reorder-count]');
  const reorderSearch = document.querySelector('[data-reorder-search]');
  const reorderReverseBtn = document.querySelector('[data-reorder-reverse]');
  const reorderSortTitleBtn = document.querySelector('[data-reorder-sort-title]');
  const reorderSortIdBtn = document.querySelector('[data-reorder-sort-id]');
  let activeReorderDragId = null;
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

  // Progress Banner & Mobile Navigation elements
  const progressBanner = document.querySelector('[data-upload-progress]');
  const progressTitle = document.querySelector('[data-progress-title]');
  const progressSpinner = document.querySelector('[data-progress-spinner]');
  const progressBar = document.querySelector('[data-progress-bar]');
  const progressDetail = document.querySelector('[data-progress-detail]');
  const progressActions = document.querySelector('[data-progress-actions]');
  const progressPublishBtn = document.querySelector('[data-progress-publish]');
  const progressDismissBtn = document.querySelector('[data-progress-dismiss]');
  const mobileCount = document.querySelector('[data-mobile-count]');
  const boardSection = document.querySelector('.admin-board');
  const mobileTabs = document.querySelectorAll('[data-mobile-view]');
  const syncBanner = document.querySelector('[data-sync-banner]');
  const syncConfirmBtn = document.querySelector('[data-sync-confirm]');
  const syncDismissBtn = document.querySelector('[data-sync-dismiss]');
  const syncLiveBtns = document.querySelectorAll('[data-sync-live]');
  let latestLiveData = null;

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
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('../') || value.startsWith('./') || value.startsWith('blob:') || value.startsWith('data:')) {
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
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('blob:') || value.startsWith('data:')) {
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
  const extFromName = (name) => {
    const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match?.[1] || '';
  };

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

  // Client-side image downscaling/compression to prevent 413s & mobile upload timeouts
  const optimizeImageFile = async (file, maxDim = 2400, quality = 0.88) => {
    const mime = String(file.type || '').toLowerCase();
    const name = file.name.toLowerCase();
    const isImage = (mime.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(name)) &&
                    !mime.includes('gif') && !mime.includes('svg');

    if (!isImage) return file;
    // If already under 1.8MB, pass through untouched
    if (file.size <= 1.8 * 1024 * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (!width || !height) {
          resolve(file);
          return;
        }

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            const cleanName = trimFileNameExt(file.name) + '.jpg';
            const optimized = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(optimized);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  };

  let hasUnsaved = false;
  const markUnsaved = () => {
    hasUnsaved = true;
    if (publishBtn) {
      publishBtn.classList.add('admin-btn-publish-alert');
      publishBtn.textContent = 'publish gallery *';
    }
    if (draftStatus) draftStatus.textContent = 'Unsaved changes (ready to publish)';
  };

  const markSaved = () => {
    hasUnsaved = false;
    if (publishBtn) {
      publishBtn.classList.remove('admin-btn-publish-alert');
      publishBtn.textContent = 'publish gallery';
    }
    if (draftStatus) draftStatus.textContent = 'All changes published live';
  };

  const showProgressBanner = ({ title, progress = 0, detail = '', isBusy = true, isSuccess = false, isError = false, showPublish = false }) => {
    if (!progressBanner) return;
    progressBanner.hidden = false;
    progressBanner.classList.toggle('is-success', isSuccess);
    progressBanner.classList.toggle('is-error', isError);
    if (progressTitle) progressTitle.textContent = title;
    if (progressSpinner) progressSpinner.classList.toggle('is-hidden', !isBusy);
    if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    if (progressDetail) progressDetail.textContent = detail;
    if (progressActions) progressActions.hidden = !showPublish;
    if (progressDismissBtn) progressDismissBtn.hidden = isBusy;
  };

  const hideProgressBanner = () => {
    if (progressBanner) progressBanner.hidden = true;
  };

  progressDismissBtn?.addEventListener('click', hideProgressBanner);
  progressPublishBtn?.addEventListener('click', () => {
    void publish();
  });

  const uploadMediaAsset = async ({ file, folder, basename, onProgress }) => {
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

    let fileToUpload = file;
    try {
      if (onProgress) onProgress({ status: 'optimizing', file });
      fileToUpload = await optimizeImageFile(file);
    } catch {
      fileToUpload = file;
    }

    const mime = String(fileToUpload.type || '').toLowerCase();
    const ext = extFromName(fileToUpload.name);
    const isAllowed = ALLOWED_UPLOAD_TYPES.has(mime) || /^(jpe?g|png|webp|gif|mp4|webm|mov|heic|heif)$/i.test(ext);
    if (!isAllowed) {
      throw new Error('Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.');
    }
    if (fileToUpload.size > MAX_UPLOAD_BYTES) {
      throw new Error(`File too large (${formatBytes(fileToUpload.size)}). Max ${formatBytes(MAX_UPLOAD_BYTES)}.`);
    }

    if (onProgress) onProgress({ status: 'uploading', file: fileToUpload });

    const body = new FormData();
    body.append('file', fileToUpload);
    body.append('folder', String(folder || 'gallery'));
    body.append('basename', String(basename || trimFileNameExt(fileToUpload.name) || 'media'));

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

    markUnsaved();
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
    zone.setAttribute('aria-label', `${title}. Tap to select photo or video, or drag and drop.`);
    
    zone.innerHTML = `
      <div class="admin-upload-icon" aria-hidden="true">📸</div>
      <div class="admin-upload-primary-text">Tap to select photo or video</div>
      <div class="admin-upload-subtext">or drag & drop here (auto-optimized for mobile)</div>
    `;

    const helper = document.createElement('p');
    helper.className = 'admin-upload-hint';
    helper.textContent = hint;

    const status = document.createElement('p');
    status.className = 'admin-upload-status';
    status.setAttribute('aria-live', 'polite');

    const previewWrap = document.createElement('div');
    previewWrap.className = 'admin-upload-preview-wrap';
    previewWrap.hidden = true;

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
      setStatus(`Optimizing & uploading ${file.name} (${formatBytes(file.size)})...`);
      zone.classList.add('is-busy');

      try {
        const payload = await uploadMediaAsset({
          file,
          folder,
          basename,
          onProgress: ({ status: s }) => {
            setStatus(s === 'optimizing' ? `Compressing ${file.name} for speed...` : `Uploading ${file.name}...`);
          }
        });

        onUploaded(payload.path, file, payload);
        setStatus(`✓ Uploaded to ${payload.path}`);

        const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(payload.path);
        previewWrap.hidden = false;
        previewWrap.innerHTML = `
          ${isVideo 
            ? `<div class="admin-upload-thumb" style="display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;">🎬</div>`
            : `<img class="admin-upload-preview-thumb" src="${URL.createObjectURL(file)}" alt="Uploaded thumbnail" />`
          }
          <div class="admin-upload-preview-info">
            <span class="admin-upload-preview-name">${file.name}</span>
            <span class="admin-upload-preview-meta">${payload.path} • ${formatBytes(file.size)}</span>
          </div>
        `;
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

    wrap.append(widgetTitle, zone, helper, status, previewWrap, picker);
    return wrap;
  };

  const defaultState = () => ({
    projects: deepClone(gallerySeed),
    selectedId: gallerySeed[0]?.id || '',
    search: '',
    mediaFilter: 'all',
    previewHover: true,
    mobileView: 'library'
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
        previewHover: parsed.previewHover !== false,
        mobileView: parsed.mobileView || 'library'
      };
    } catch {
      return defaultState();
    }
  };

  const isSeedState = (projects) => {
    if (!Array.isArray(projects) || !projects.length) return true;
    if (projects.length === gallerySeed.length) {
      const matchCount = gallerySeed.filter((s, i) => projects[i]?.id === s.id).length;
      if (matchCount >= 6) return true;
    }
    return false;
  };

  const showSyncBanner = (liveData) => {
    latestLiveData = liveData;
    if (!syncBanner) return;
    syncBanner.hidden = false;
    const titleEl = syncBanner.querySelector('[data-sync-banner-title]');
    const descEl = syncBanner.querySelector('[data-sync-banner-desc]');
    if (titleEl) {
      titleEl.textContent = `Live site has updated projects (Live: ${liveData.length}, Local draft: ${state.projects.length})`;
    }
    if (descEl) {
      descEl.textContent = 'Your browser currently has a local draft saved. Click "Load live site changes" to view and edit the live content.';
    }
  };

  const hideSyncBanner = () => {
    if (syncBanner) syncBanner.hidden = true;
  };

  const syncWithLiveSite = async (askConfirm = true) => {
    if (askConfirm) {
      const ok = confirm('Discard local browser draft and load the latest projects live from your site? Any unsaved edits will be replaced with live site content.');
      if (!ok) return;
    }

    try {
      let data = latestLiveData;
      if (!data) {
        const res = await fetch('../gallery/projects.json?v=' + Date.now());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }
      if (!Array.isArray(data) || !data.length) {
        alert('Live projects file was empty or invalid.');
        return;
      }

      latestLiveData = data;
      state.projects = deepClone(data);
      state.selectedId = data[0]?.id || '';
      persistState();
      markSaved();
      hideSyncBanner();
      renderAll();

      if (publishStatus) publishStatus.textContent = `✓ Synced with live site (${data.length} projects loaded).`;
      showProgressBanner({
        title: '✓ Synced with Live Site',
        progress: 100,
        detail: `Successfully loaded all ${data.length} projects currently live on your site!`,
        isBusy: false,
        isSuccess: true
      });
    } catch (err) {
      alert('Error fetching live projects: ' + (err.message || err));
    }
  };

  const fetchCanonicalProjects = async () => {
    try {
      const res = await fetch('../gallery/projects.json?v=' + Date.now());
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return;

      latestLiveData = data;
      const canonicalStr = JSON.stringify(data);
      const localStr = JSON.stringify(state.projects);

      // If local state is still the default seed or empty, automatically sync to live!
      if (isSeedState(state.projects)) {
        state.projects = deepClone(data);
        state.selectedId = data[0]?.id || '';
        persistState();
        markSaved();
        renderAll();
        return;
      }

      // If local draft matches live site, update status to Synced
      if (canonicalStr === localStr) {
        markSaved();
        if (draftStatus) draftStatus.textContent = 'Synced with live site';
        hideSyncBanner();
        return;
      }

      // Local draft differs from live site! Show notification banner
      showSyncBanner(data);
    } catch {
      // Keep local state fallback
    }
  };

  let state = loadState();
  let isAuthenticated = false;

  const setMobileView = (viewName) => {
    state.mobileView = viewName;
    if (boardSection) {
      boardSection.setAttribute('data-active-view', viewName);
    }
    mobileTabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.mobileView === viewName);
    });
    if (window.innerWidth <= 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  mobileTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.mobileView;
      if (target) setMobileView(target);
    });
  });

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
    const total = files.length;
    if (bulkImportBtn) bulkImportBtn.disabled = true;

    showProgressBanner({
      title: `Starting batch import of ${total} file(s)...`,
      progress: 5,
      detail: 'Preparing media files...',
      isBusy: true
    });

    const newProjects = [];
    const failures = [];

    for (let i = 0; i < total; i++) {
      const file = files[i];
      const currentNum = i + 1;
      const pct = Math.round((i / total) * 90) + 5;
      const nameStem = trimFileNameExt(file.name);
      const folderSlug = slugifySegment(nameStem || `media-${Date.now()}-${i}`) || `media-${Date.now()}-${i}`;
      const isVideo = String(file.type || '').toLowerCase().startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

      let mediaSrcPath = `gallery/${folderSlug}/${file.name}`;

      showProgressBanner({
        title: `Uploading ${currentNum} of ${total}: ${file.name}`,
        progress: pct,
        detail: `File size: ${formatBytes(file.size)} • Processing...`,
        isBusy: true
      });

      if (!LOCAL_MODE && API_BASE && isAuthenticated) {
        try {
          const payload = await uploadMediaAsset({
            file,
            folder: `gallery/${folderSlug}`,
            basename: `${folderSlug}-media`,
            onProgress: ({ status, file: f }) => {
              showProgressBanner({
                title: `${status === 'optimizing' ? 'Compressing' : 'Uploading'} ${currentNum} of ${total}: ${f.name}`,
                progress: pct,
                detail: `${status === 'optimizing' ? 'Optimizing photo for mobile speed...' : 'Uploading to GitHub...'}`
              });
            }
          });
          if (payload?.path) mediaSrcPath = payload.path;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          failures.push({ name: file.name, error: msg });
          console.warn('Upload failed for file:', file.name, err);
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

      // Small pause between sequential commits to allow GitHub branch ref to settle
      if (i < total - 1 && !LOCAL_MODE && API_BASE) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (bulkImportBtn) bulkImportBtn.disabled = false;

    // Add newly created projects to state
    state.projects = [...newProjects, ...state.projects];
    if (newProjects[0]) state.selectedId = newProjects[0].id;
    persistState();
    markUnsaved();
    renderAll();

    // On mobile, automatically show the editor for the first new item
    if (window.innerWidth <= 1024) {
      setMobileView('editor');
    }

    const successCount = total - failures.length;
    if (failures.length === 0) {
      showProgressBanner({
        title: `✓ Bulk import complete! (${successCount}/${total} files)`,
        progress: 100,
        detail: `Added ${successCount} new project cards. Click "Publish to Portfolio" to push changes live!`,
        isBusy: false,
        isSuccess: true,
        showPublish: true
      });
    } else {
      const failSummary = failures.map(f => `${f.name}: ${f.error}`).join('; ');
      showProgressBanner({
        title: `Import completed with warnings (${successCount}/${total} uploaded)`,
        progress: 100,
        detail: `${failures.length} file(s) failed: ${failSummary}. Other ${successCount} projects added.`,
        isBusy: false,
        isError: true,
        showPublish: successCount > 0
      });
    }
  };

  const writeCurrentProject = (updater) => {
    const currentId = state.selectedId;
    const current = state.projects.find((p) => p.id === currentId);
    if (!current) return null;

    const updated = updater(deepClone(current));
    state.projects = state.projects.map((p) => (p.id === currentId ? updated : p));
    state.selectedId = updated.id;
    persistState();
    markUnsaved();
    return updated;
  };

  const addProject = (project) => {
    state.projects.unshift(project);
    state.selectedId = project.id;
    persistState();
    markUnsaved();
    if (window.innerWidth <= 1024) {
      setMobileView('editor');
    }
  };

  const deleteCurrentProject = () => {
    const current = getCurrentProject();
    if (!current) return;
    const label = current.title || current.id;
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return;

    state.projects = state.projects.filter((p) => p.id !== current.id);
    state.selectedId = state.projects[0]?.id || '';
    persistState();
    markUnsaved();
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
    markUnsaved();
    renderAll();
    if (window.innerWidth <= 1024) {
      setMobileView('editor');
    }
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
    if (mobileCount) mobileCount.textContent = `${state.projects.length}`;
    document.querySelectorAll('[data-filter-kind]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.filterKind === state.mediaFilter);
    });
  };

  const moveProjectIndex = (fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= state.projects.length) return;
    if (toIndex < 0 || toIndex >= state.projects.length) return;
    if (fromIndex === toIndex) return;

    const [moved] = state.projects.splice(fromIndex, 1);
    state.projects.splice(toIndex, 0, moved);
    persistState();
    markUnsaved();
    renderAll();
    if (reorderModal && !reorderModal.hidden) {
      renderReorderGrid();
    }
  };

  const moveProjectById = (id, delta) => {
    const idx = state.projects.findIndex((p) => p.id === id);
    if (idx === -1) return;
    moveProjectIndex(idx, idx + delta);
  };

  const moveProjectToEdge = (id, edge) => {
    const idx = state.projects.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const targetIdx = edge === 'top' ? 0 : state.projects.length - 1;
    moveProjectIndex(idx, targetIdx);
  };

  const moveProjectRelativeTo = (draggedId, targetId, insertAfter = false) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const fromIdx = state.projects.findIndex((p) => p.id === draggedId);
    const toTargetIdx = state.projects.findIndex((p) => p.id === targetId);
    if (fromIdx === -1 || toTargetIdx === -1) return;

    const [moved] = state.projects.splice(fromIdx, 1);
    let finalTargetIdx = state.projects.findIndex((p) => p.id === targetId);
    if (insertAfter) {
      finalTargetIdx += 1;
    }
    state.projects.splice(finalTargetIdx, 0, moved);
    persistState();
    markUnsaved();
    renderAll();
    if (reorderModal && !reorderModal.hidden) {
      renderReorderGrid();
    }
  };

  const reverseAllProjects = () => {
    if (state.projects.length <= 1) return;
    state.projects.reverse();
    persistState();
    markUnsaved();
    renderAll();
    if (reorderModal && !reorderModal.hidden) {
      renderReorderGrid();
    }
  };

  const sortProjectsAlphabetical = (byTitle = true) => {
    if (state.projects.length <= 1) return;
    state.projects.sort((a, b) => {
      const strA = (byTitle ? (a.title || a.id) : a.id).toLowerCase();
      const strB = (byTitle ? (b.title || b.id) : b.id).toLowerCase();
      return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
    });
    persistState();
    markUnsaved();
    renderAll();
    if (reorderModal && !reorderModal.hidden) {
      renderReorderGrid();
    }
  };

  const openReorderModal = () => {
    if (!reorderModal) return;
    reorderModal.hidden = false;
    reorderModal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    renderReorderGrid();
  };

  const closeReorderModal = () => {
    if (!reorderModal) return;
    reorderModal.hidden = true;
    reorderModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const renderReorderGrid = () => {
    if (!reorderGrid) return;
    const total = state.projects.length;
    if (reorderCount) {
      reorderCount.textContent = `${total} ${total === 1 ? 'project' : 'projects'}`;
    }

    const query = String(reorderSearch?.value || '').trim().toLowerCase();
    const visibleProjects = state.projects
      .map((p, idx) => ({ project: p, globalIdx: idx }))
      .filter(({ project }) => {
        if (!query) return true;
        const haystack = `${project.title || ''} ${project.id || ''} ${project.kicker || ''} ${project.description || ''}`.toLowerCase();
        return haystack.includes(query);
      });

    if (!visibleProjects.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = query
        ? 'No projects match your filter query in the reorganizer.'
        : 'No projects in gallery. Create projects to organize them.';
      reorderGrid.replaceChildren(empty);
      return;
    }

    const cards = visibleProjects.map(({ project, globalIdx }) => {
      const card = document.createElement('article');
      card.className = 'admin-reorder-card';
      card.draggable = true;
      card.setAttribute('data-id', project.id);
      if (project.id === state.selectedId) {
        card.classList.add('is-active-project');
      }

      // Media thumbnail (Image or Video)
      const isVideo = project.mediaType === 'video' || /.(mp4|webm|mov)$/i.test(project.mediaSrc || '');
      const assetSrc = previewAssetPath(project.posterSrc || project.mediaSrc);
      if (assetSrc) {
        if (isVideo && !project.posterSrc) {
          const video = document.createElement('video');
          video.className = 'admin-reorder-media';
          video.muted = true;
          video.playsInline = true;
          video.preload = 'metadata';
          const srcEl = document.createElement('source');
          srcEl.src = assetSrc;
          video.append(srcEl);
          card.append(video);
        } else {
          const img = document.createElement('img');
          img.className = 'admin-reorder-media';
          img.src = assetSrc;
          img.alt = project.title || project.id;
          img.loading = 'lazy';
          card.append(img);
        }
      }

      // Top bar (Position badge + Drag grip)
      const topBar = document.createElement('div');
      topBar.className = 'admin-reorder-top';

      const posBadge = document.createElement('span');
      posBadge.className = 'admin-reorder-pos';
      posBadge.textContent = `#${globalIdx + 1}`;

      const grip = document.createElement('span');
      grip.className = 'admin-reorder-grip';
      grip.setAttribute('aria-hidden', 'true');
      grip.textContent = '⋮⋮';
      grip.title = 'Drag to reorder in gallery';

      topBar.append(posBadge, grip);

      // Bottom bar (Title + Arrow Action Buttons)
      const bottomBar = document.createElement('div');
      bottomBar.className = 'admin-reorder-bottom';

      const titleEl = document.createElement('div');
      titleEl.className = 'admin-reorder-title';
      titleEl.textContent = project.title || project.id;
      titleEl.title = project.title ? `${project.title} (${project.id})` : project.id;

      const actions = document.createElement('div');
      actions.className = 'admin-reorder-actions';

      const firstBtn = document.createElement('button');
      firstBtn.type = 'button';
      firstBtn.className = 'admin-reorder-btn';
      firstBtn.textContent = '⤒';
      firstBtn.title = 'Move to top (#1)';
      firstBtn.disabled = globalIdx === 0;
      firstBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveProjectToEdge(project.id, 'top');
      });

      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'admin-reorder-btn';
      prevBtn.textContent = '◄';
      prevBtn.title = 'Move earlier (left)';
      prevBtn.disabled = globalIdx === 0;
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveProjectById(project.id, -1);
      });

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'admin-reorder-btn';
      nextBtn.textContent = '►';
      nextBtn.title = 'Move later (right)';
      nextBtn.disabled = globalIdx === total - 1;
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveProjectById(project.id, 1);
      });

      const lastBtn = document.createElement('button');
      lastBtn.type = 'button';
      lastBtn.className = 'admin-reorder-btn';
      lastBtn.textContent = '⤓';
      lastBtn.title = 'Move to end';
      lastBtn.disabled = globalIdx === total - 1;
      lastBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveProjectToEdge(project.id, 'bottom');
      });

      actions.append(firstBtn, prevBtn, nextBtn, lastBtn);
      bottomBar.append(titleEl, actions);

      card.append(topBar, bottomBar);

      // Click card to select & return to editor
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        state.selectedId = project.id;
        persistState();
        renderAll();
        closeReorderModal();
      });

      // Drag and drop events
      card.addEventListener('dragstart', (e) => {
        activeReorderDragId = project.id;
        e.dataTransfer.setData('text/plain', project.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('is-dragging');
      });

      card.addEventListener('dragend', () => {
        activeReorderDragId = null;
        card.classList.remove('is-dragging');
        reorderGrid.querySelectorAll('.admin-reorder-card').forEach((c) => {
          c.classList.remove('is-drag-target');
        });
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (activeReorderDragId && activeReorderDragId !== project.id) {
          card.classList.add('is-drag-target');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('is-drag-target');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('is-drag-target');
        const draggedId = e.dataTransfer.getData('text/plain') || activeReorderDragId;
        if (!draggedId || draggedId === project.id) return;
        const rect = card.getBoundingClientRect();
        const insertAfter = e.clientX >= (rect.left + rect.width / 2);
        moveProjectRelativeTo(draggedId, project.id, insertAfter);
      });

      return card;
    });

    reorderGrid.replaceChildren(...cards);
  };

  const renderList = () => {
    if (!listRoot) return;
    const query = String(state.search || '').trim().toLowerCase();
    const filter = state.mediaFilter;
    const totalProjects = state.projects.length;

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

    const cards = items.map((item) => {
      const globalIdx = state.projects.findIndex((p) => p.id === item.id);
      const row = document.createElement('div');
      row.className = 'admin-item';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('data-id', item.id);
      row.draggable = true;
      if (item.id === state.selectedId) {
        row.classList.add('is-active');
      }

      // Drag handle
      const handle = document.createElement('span');
      handle.className = 'admin-item-handle';
      handle.setAttribute('aria-hidden', 'true');
      handle.textContent = '⋮⋮';
      handle.title = 'Drag to reorder in gallery sequence';

      // Thumbnail preview
      const thumb = document.createElement('div');
      thumb.className = 'admin-item-thumb';
      const assetSrc = previewAssetPath(item.posterSrc || item.mediaSrc);
      if (assetSrc) {
        const img = document.createElement('img');
        img.src = assetSrc;
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = () => {
          thumb.innerHTML = '<span class="admin-item-thumb-placeholder">' + (item.mediaType === 'video' ? 'VID' : 'IMG') + '</span>';
        };
        thumb.append(img);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'admin-item-thumb-placeholder';
        placeholder.textContent = item.mediaType === 'video' ? 'VID' : 'IMG';
        thumb.append(placeholder);
      }

      // Main content
      const main = document.createElement('div');
      main.className = 'admin-item-main';

      const top = document.createElement('div');
      top.className = 'admin-item-top';

      const pos = document.createElement('span');
      pos.className = 'admin-item-pos';
      pos.textContent = `#${globalIdx + 1}`;

      const title = document.createElement('div');
      title.className = 'admin-item-title';
      title.textContent = item.title || item.id;

      const badge = document.createElement('span');
      badge.className = `admin-item-badge ${item.mediaType || 'image'}`;
      badge.textContent = item.mediaType || 'image';

      top.append(pos, title, badge);

      const kicker = document.createElement('div');
      kicker.className = 'admin-item-meta';
      kicker.textContent = item.kicker || (item.title ? item.id : 'Image-only project');

      const note = document.createElement('div');
      note.className = 'admin-item-note';
      const shortSrc = item.mediaSrc ? (item.mediaSrc.split('/').pop() || item.mediaSrc) : '';
      note.textContent = item.description || (shortSrc ? `File: ${shortSrc}` : 'No description');
      note.title = item.description || item.mediaSrc || '';

      const tags = document.createElement('div');
      tags.className = 'admin-tag-row';
      for (const tag of Array.isArray(item.tags) ? item.tags : normalizeTags(item.tags)) {
        const span = document.createElement('span');
        span.textContent = tag;
        tags.append(span);
      }

      main.append(top, kicker, note, tags);

      // Reorder buttons column (Up / Down)
      const tools = document.createElement('div');
      tools.className = 'admin-item-reorder-tools';

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'admin-item-arrow';
      upBtn.textContent = '▲';
      upBtn.title = 'Move up in gallery sequence';
      upBtn.disabled = globalIdx === 0;
      upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveProjectIndex(globalIdx, globalIdx - 1);
      });

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'admin-item-arrow';
      downBtn.textContent = '▼';
      downBtn.title = 'Move down in gallery sequence';
      downBtn.disabled = globalIdx === totalProjects - 1;
      downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveProjectIndex(globalIdx, globalIdx + 1);
      });

      tools.append(upBtn, downBtn);

      row.append(handle, thumb, main, tools);

      // Click / Keydown to select
      const selectItem = () => {
        state.selectedId = item.id;
        persistState();
        renderAll();
        if (window.innerWidth <= 1024) {
          setMobileView('editor');
        }
      };

      row.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        selectItem();
      });

      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('button')) return;
          e.preventDefault();
          selectItem();
        }
      });

      // Drag and drop events on sidebar item
      row.addEventListener('dragstart', (e) => {
        activeReorderDragId = item.id;
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('is-dragging');
      });

      row.addEventListener('dragend', () => {
        activeReorderDragId = null;
        row.classList.remove('is-dragging');
        listRoot.querySelectorAll('.admin-item').forEach((el) => {
          el.classList.remove('is-drop-above', 'is-drop-below');
        });
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          row.classList.add('is-drop-above');
          row.classList.remove('is-drop-below');
        } else {
          row.classList.add('is-drop-below');
          row.classList.remove('is-drop-above');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('is-drop-above', 'is-drop-below');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('is-drop-above', 'is-drop-below');
        const draggedId = e.dataTransfer.getData('text/plain') || activeReorderDragId;
        if (!draggedId || draggedId === item.id) return;
        const rect = row.getBoundingClientRect();
        const insertAfter = e.clientY >= (rect.top + rect.height / 2);
        moveProjectRelativeTo(draggedId, item.id, insertAfter);
      });

      return row;
    });

    listRoot.replaceChildren(...cards);
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
      { value: 'video', label: 'Video (MP4, WebM, QuickTime)' }
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
    note.textContent = 'All text fields (Title, Kicker, Description, Tags, Link) are optional. If left blank, the project displays as a clean 1:1 image or video gallery tile on the site.';

    const uploadPanel = document.createElement('div');
    uploadPanel.className = 'admin-section';

    const folderSlug = slugifySegment(project.id || project.title || 'project') || 'project';
    const uploadWidget = createUploadWidget({
      title: 'upload project media',
      hint: 'Tap or drop image (JPG, PNG, WebP, GIF) or video (MP4, WebM, MOV). Auto-optimized for web.',
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

    // Editor sequence control bar
    const currentIndex = state.projects.findIndex((p) => p.id === project.id);
    const totalCount = state.projects.length;

    const orderBar = document.createElement('div');
    orderBar.className = 'admin-order-bar';

    const orderSummary = document.createElement('div');
    orderSummary.className = 'admin-order-summary';

    const orderBadge = document.createElement('span');
    orderBadge.className = 'admin-order-badge';
    orderBadge.textContent = `Position #${currentIndex + 1} of ${totalCount}`;

    const orderHelp = document.createElement('span');
    orderHelp.className = 'admin-order-help';
    orderHelp.textContent = 'in portfolio sequence';

    orderSummary.append(orderBadge, orderHelp);

    const orderControls = document.createElement('div');
    orderControls.className = 'admin-order-controls';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'admin-btn admin-btn-small';
    upBtn.textContent = '↑ up';
    upBtn.title = 'Move up 1 position in gallery';
    upBtn.disabled = currentIndex <= 0;
    upBtn.addEventListener('click', () => moveProjectIndex(currentIndex, currentIndex - 1));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'admin-btn admin-btn-small';
    downBtn.textContent = '↓ down';
    downBtn.title = 'Move down 1 position in gallery';
    downBtn.disabled = currentIndex === -1 || currentIndex >= totalCount - 1;
    downBtn.addEventListener('click', () => moveProjectIndex(currentIndex, currentIndex + 1));

    const jumpWrap = document.createElement('label');
    jumpWrap.className = 'admin-order-jump-wrap';
    const jumpLabel = document.createElement('span');
    jumpLabel.textContent = 'jump:';
    const jumpSelect = document.createElement('select');
    jumpSelect.className = 'admin-order-select';
    jumpSelect.title = 'Jump this project to any position';
    for (let i = 1; i <= totalCount; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `#${i}`;
      if (i === currentIndex + 1) opt.selected = true;
      jumpSelect.append(opt);
    }
    jumpSelect.addEventListener('change', (e) => {
      const targetPos = parseInt(e.target.value, 10);
      if (Number.isFinite(targetPos) && targetPos >= 1 && targetPos <= totalCount) {
        moveProjectIndex(currentIndex, targetPos - 1);
      }
    });
    jumpWrap.append(jumpLabel, jumpSelect);

    const visualBtn = document.createElement('button');
    visualBtn.type = 'button';
    visualBtn.className = 'admin-btn admin-btn-small admin-btn-reorder';
    visualBtn.textContent = '⇄ visual grid';
    visualBtn.title = 'Open full visual gallery reorganizer';
    visualBtn.addEventListener('click', openReorderModal);

    orderControls.append(upBtn, downBtn, jumpWrap, visualBtn);
    orderBar.append(orderSummary, orderControls);

    uploadPanel.replaceChildren(uploadWidget);
    formRoot.replaceChildren(orderBar, grid, note, uploadPanel);
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
    if (moveUpBtn && moveDownBtn) {
      const currIdx = state.projects.findIndex((p) => p.id === state.selectedId);
      if (currIdx === -1 || state.projects.length <= 1) {
        moveUpBtn.disabled = true;
        moveDownBtn.disabled = true;
      } else {
        moveUpBtn.disabled = currIdx <= 0;
        moveDownBtn.disabled = currIdx >= state.projects.length - 1;
      }
    }
    if (boardSection) {
      boardSection.setAttribute('data-active-view', state.mobileView || 'library');
    }
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
    showProgressBanner({
      title: 'Publishing Gallery...',
      progress: 50,
      detail: 'Committing projects.json to GitHub repository...',
      isBusy: true
    });

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
        showProgressBanner({
          title: 'Publish Failed',
          progress: 100,
          detail,
          isBusy: false,
          isError: true
        });
        return;
      }

      markSaved();
      latestLiveData = deepClone(state.projects);
      hideSyncBanner();
      const successMsg = result.message || 'Published projects to gallery/projects.json.';
      if (publishStatus) publishStatus.textContent = successMsg;
      showProgressBanner({
        title: '✓ Gallery Published Live!',
        progress: 100,
        detail: `${successMsg} Changes will be visible on your live site within ~30-60 seconds.`,
        isBusy: false,
        isSuccess: true
      });
    } catch {
      const netMsg = 'Network error reaching publish endpoint. Verify worker API URL and CORS configuration.';
      if (publishStatus) publishStatus.textContent = netMsg;
      showProgressBanner({
        title: 'Network Error',
        progress: 100,
        detail: netMsg,
        isBusy: false,
        isError: true
      });
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

  moveUpBtn?.addEventListener('click', () => {
    moveProjectById(state.selectedId, -1);
  });

  moveDownBtn?.addEventListener('click', () => {
    moveProjectById(state.selectedId, 1);
  });

  openReorderBtns.forEach((btn) => {
    btn.addEventListener('click', openReorderModal);
  });

  closeReorderBtns.forEach((btn) => {
    btn.addEventListener('click', closeReorderModal);
  });

  reorderReverseBtn?.addEventListener('click', reverseAllProjects);
  reorderSortTitleBtn?.addEventListener('click', () => sortProjectsAlphabetical(true));
  reorderSortIdBtn?.addEventListener('click', () => sortProjectsAlphabetical(false));
  reorderSearch?.addEventListener('input', renderReorderGrid);

  // Close modal when clicking backdrop or pressing Esc
  reorderModal?.addEventListener('click', (e) => {
    if (e.target === reorderModal) {
      closeReorderModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reorderModal && !reorderModal.hidden) {
      closeReorderModal();
    }
  });

  saveBtn?.addEventListener('click', () => {
    persistState();
    markSaved();
    if (publishStatus) publishStatus.textContent = 'Draft saved to browser storage.';
  });

  exportJsonBtn?.addEventListener('click', exportProjectsJson);
  exportHtmlBtn?.addEventListener('click', exportProjectsHtml);
  publishBtn?.addEventListener('click', publish);

  toggleOverlayBtn?.addEventListener('click', () => {
    state.previewHover = !state.previewHover;
    persistState();
    renderPreview();
  });

  syncDismissBtn?.addEventListener('click', hideSyncBanner);
  syncConfirmBtn?.addEventListener('click', () => {
    void syncWithLiveSite(false);
  });
  syncLiveBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      void syncWithLiveSite(true);
    });
  });

  configureGateUi();
  await checkSession();
  await fetchCanonicalProjects();

  if (searchInput) searchInput.value = state.search || '';
  if (isAuthenticated || LOCAL_MODE) {
    renderAll();
    setMobileView(state.mobileView || 'library');
  }
})();
