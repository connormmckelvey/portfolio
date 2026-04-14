(async () => {
  const ACCESS_CODE = 'atlas';
  const STORAGE_KEY = 'cm-admin-state-v1';
  const LOCAL_MODE = location.protocol === 'file:';

  const gate = document.querySelector('[data-admin-gate]');
  const app = document.querySelector('[data-admin-app]');
  const gateForm = document.querySelector('[data-gate-form]');
  const gateInput = document.querySelector('[data-gate-input]');
  const gateStatus = document.querySelector('[data-gate-status]');
  const gateMessage = document.querySelector('[data-gate-message]');
  const kindStatus = document.querySelector('[data-kind-status]');
  const draftStatus = document.querySelector('[data-draft-status]');
  const logoutBtn = document.querySelector('[data-logout]');

  const newPostBtn = document.querySelector('[data-new-post]');
  const newTripBtn = document.querySelector('[data-new-trip]');
  const duplicateBtn = document.querySelector('[data-duplicate-item]');
  const deleteBtn = document.querySelector('[data-delete-item]');
  const saveBtn = document.querySelector('[data-save-draft]');
  const exportCurrentBtn = document.querySelector('[data-export-current]');
  const exportAllBtn = document.querySelector('[data-export-all]');
  const publishBtn = document.querySelector('[data-publish]');

  const searchInput = document.querySelector('[data-search]');
  const listRoot = document.querySelector('[data-content-list]');
  const formRoot = document.querySelector('[data-editor-form]');
  const previewCard = document.querySelector('[data-preview-card]');
  const publishStatus = document.querySelector('[data-publish-status]');
  const editorTitle = document.querySelector('[data-editor-title]');
  const editorMeta = document.querySelector('[data-editor-meta]');

  const blogSeed = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS.map((post) => ({ ...post })) : [];
  const tripSeed = [
    {
      id: 'austin-weekends',
      title: 'Austin Walks',
      place: 'Austin, Texas',
      region: 'Texas, USA',
      year: '2025',
      sortDate: '2025-03-01',
      dateLabel: 'Spring 2025',
      coords: [30.2672, -97.7431],
      note: 'The city I keep returning to between deadlines, classes, and projects. Most of the best memories here are long walks, late coffees, and quiet resets.',
      tags: ['home', 'walks', 'coffee'],
      photos: [{ src: '../images/about/weekend-reset.jpg', alt: 'A weekend walk in Austin', caption: 'Weekend reset' }]
    },
    {
      id: 'houston-leadership',
      title: 'Houston Leadership Week',
      place: 'Houston, Texas',
      region: 'Texas, USA',
      year: '2024',
      sortDate: '2024-07-08',
      dateLabel: 'Summer 2024',
      coords: [29.7604, -95.3698],
      note: 'A week that still shapes how I think about teamwork, planning, and leading under pressure.',
      tags: ['leadership', 'scouting'],
      photos: [{ src: '../images/about/coffee-portrait.jpg', alt: 'A casual portrait from a trip day', caption: 'Ready for the road' }]
    },
    {
      id: 'chicago-conference',
      title: 'Chicago Conference Stop',
      place: 'Chicago, Illinois',
      region: 'Illinois, USA',
      year: '2025',
      sortDate: '2025-10-12',
      dateLabel: 'Fall 2025',
      coords: [41.8781, -87.6298],
      note: 'A dense city visit that is mostly about people, transit, and how much a single day can hold.',
      tags: ['city', 'school'],
      photos: [{ src: '../images/about/curiosity-sky.png', alt: 'A moody sky photo used as a trip placeholder', caption: 'Evening sky' }]
    },
    {
      id: 'new-york-notes',
      title: 'New York City Sprint',
      place: 'New York City, New York',
      region: 'New York, USA',
      year: '2025',
      sortDate: '2025-11-18',
      dateLabel: 'Late 2025',
      coords: [40.7128, -74.006],
      note: 'Fast, loud, and impossible to ignore. A good reminder that scale changes the way you look at everything.',
      tags: ['city', 'travel'],
      photos: [{ src: '../images/about/weekend-reset.jpg', alt: 'A walking scene used for the New York trip card', caption: 'Walking pace' }]
    },
    {
      id: 'london-archive',
      title: 'London Archive Day',
      place: 'London, England',
      region: 'United Kingdom',
      year: '2026',
      sortDate: '2026-02-09',
      dateLabel: 'Early 2026',
      coords: [51.5074, -0.1278],
      note: 'A place for museums, long walks, and notes that turn into better questions later.',
      tags: ['international', 'museums'],
      photos: [{ src: '../images/about/coffee-portrait.jpg', alt: 'A portrait-style image used for the London trip card', caption: 'Quiet reset' }]
    },
    {
      id: 'san-francisco-build',
      title: 'San Francisco Build Trip',
      place: 'San Francisco, California',
      region: 'California, USA',
      year: '2026',
      sortDate: '2026-03-22',
      dateLabel: 'Spring 2026',
      coords: [37.7749, -122.4194],
      note: 'A trip that felt like it should end with a notebook full of ideas and a longer to-do list.',
      tags: ['travel', 'build'],
      photos: [{ src: '../images/about/curiosity-sky.png', alt: 'A sky-inspired photo used for the San Francisco trip card', caption: 'Looking outward' }]
    }
  ];

  const deepClone = (value) => JSON.parse(JSON.stringify(value));
  const normalizeTags = (value) => String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  const previewBlogAssetPath = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('../') || value.startsWith('./')) {
      return value;
    }
    return `../${value}`;
  };

  const previewTripAssetPath = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('../') || value.startsWith('./')) {
      return value;
    }
    return `../${value}`;
  };

  const normalizeBlogAssetPath = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) {
      return value;
    }
    return value.replace(/^\.\.\//, '').replace(/^\.\//, '');
  };

  const normalizeTripAssetPath = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('../') || value.startsWith('./') || value.startsWith('/')) {
      return value;
    }
    return `../${value}`;
  };

  const defaultState = () => ({
    items: {
      blog: deepClone(blogSeed),
      trip: deepClone(tripSeed)
    },
    selectedId: {
      blog: blogSeed[0]?.id || '',
      trip: tripSeed[0]?.id || ''
    },
    search: '',
    activeKind: 'blog',
    libraryFilter: 'blog'
  });

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return {
        ...defaultState(),
        ...parsed,
        items: {
          blog: Array.isArray(parsed.items?.blog) ? parsed.items.blog : deepClone(blogSeed),
          trip: Array.isArray(parsed.items?.trip) ? parsed.items.trip : deepClone(tripSeed)
        },
        selectedId: {
          blog: parsed.selectedId?.blog || blogSeed[0]?.id || '',
          trip: parsed.selectedId?.trip || tripSeed[0]?.id || ''
        },
        search: parsed.search || '',
        activeKind: parsed.activeKind === 'trip' ? 'trip' : 'blog',
        libraryFilter: parsed.libraryFilter || 'blog'
      };
    } catch {
      return defaultState();
    }
  };

  let state = loadState();
  let libraryFilter = state.libraryFilter;
  let editorKind = state.activeKind;
  let isAuthenticated = false;

  const configureGateUi = () => {
    if (gateMessage) {
      gateMessage.textContent = LOCAL_MODE
        ? 'Local preview mode is using the temporary passcode gate. Your deployed /admin route uses secure serverless login.'
        : 'Sign in with your ADMIN_PASSWORD. Authentication is handled by serverless endpoints and an HttpOnly session cookie.';
    }

    if (gateInput) {
      gateInput.placeholder = LOCAL_MODE ? 'Enter local preview passcode' : 'Enter admin password';
    }
  };

  const persistState = () => {
    state.activeKind = editorKind;
    state.libraryFilter = libraryFilter;
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
    setGate(false);
  };

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return { response, payload };
  };

  const checkSession = async () => {
    if (LOCAL_MODE) {
      setGate(false);
      return;
    }

    try {
      const { response, payload } = await requestJson('/api/admin/session', { method: 'GET' });
      if (response.ok && payload?.authenticated) {
        unlock();
        return;
      }
    } catch {
      // Leave the gate visible on network errors.
    }

    lock();
  };

  const getList = (kind) => state.items[kind] || [];
  const getCurrentItem = () => {
    const list = getList(editorKind);
    const id = state.selectedId[editorKind];
    return list.find((item) => item.id === id) || list[0] || null;
  };

  const createBlogItem = () => ({
    id: `post-${Date.now()}`,
    title: 'Untitled post',
    date: new Date().toISOString().slice(0, 10),
    readTime: '3 min read',
    tags: ['meta'],
    excerpt: '',
    coverImage: 'images/about/weekend-reset.jpg',
    coverAlt: '',
    content: [{ type: 'paragraph', text: 'Write the first paragraph here.' }]
  });

  const createTripItem = () => ({
    id: `trip-${Date.now()}`,
    title: 'Untitled trip',
    place: '',
    region: '',
    year: String(new Date().getFullYear()),
    sortDate: new Date().toISOString().slice(0, 10),
    dateLabel: '',
    coords: [30, -97],
    note: '',
    tags: ['travel'],
    photos: [{ src: '../images/about/weekend-reset.jpg', alt: '', caption: '' }]
  });

  const sanitizeBlog = (item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : normalizeTags(item.tags),
    content: Array.isArray(item.content) ? item.content : []
  });

  const sanitizeTrip = (item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : normalizeTags(item.tags),
    coords: Array.isArray(item.coords) && item.coords.length === 2 ? item.coords : [30, -97],
    photos: Array.isArray(item.photos) ? item.photos : []
  });

  const currentItem = () => {
    const item = getCurrentItem();
    if (!item) return null;
    return editorKind === 'blog' ? sanitizeBlog(item) : sanitizeTrip(item);
  };

  const writeCurrentItem = (updater) => {
    const kind = editorKind;
    const previousId = state.selectedId[kind];
    const current = state.items[kind].find((item) => item.id === previousId);
    if (!current) return null;

    const updated = updater(deepClone(current));
    state.items[kind] = state.items[kind].map((item) => (item.id === previousId ? updated : item));
    state.selectedId[kind] = updated.id;
    persistState();
    return updated;
  };

  const setCurrentItem = (updatedItem) => {
    const kind = editorKind;
    const items = state.items[kind].map((item) => (item.id === state.selectedId[kind] ? updatedItem : item));
    state.items[kind] = items;
    state.selectedId[kind] = updatedItem.id;
    persistState();
  };

  const addItem = (kind, item) => {
    state.items[kind].unshift(item);
    state.selectedId[kind] = item.id;
    editorKind = kind;
    libraryFilter = kind;
    persistState();
  };

  const removeCurrentItem = () => {
    const kind = editorKind;
    const id = state.selectedId[kind];
    state.items[kind] = state.items[kind].filter((item) => item.id !== id);
    state.selectedId[kind] = state.items[kind][0]?.id || '';
    persistState();
  };

  const duplicateCurrentItem = () => {
    const item = currentItem();
    if (!item) return;
    const copy = deepClone(item);
    copy.id = `${copy.id}-copy`;
    copy.title = `${copy.title} copy`;
    state.items[editorKind].unshift(copy);
    state.selectedId[editorKind] = copy.id;
    persistState();
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
    for (const optionValue of options) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.append(option);
    }
    select.value = value;
    return select;
  };

  const createCardShell = (titleText, onRemove) => {
    const card = document.createElement('div');
    card.className = 'admin-block-card';

    const head = document.createElement('div');
    head.className = 'admin-block-card-head';

    const title = document.createElement('div');
    title.className = 'admin-block-card-title';
    title.textContent = titleText;

    const actions = document.createElement('div');
    actions.className = 'admin-mini-actions';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'admin-btn admin-btn-small';
    removeButton.textContent = 'remove';
    removeButton.addEventListener('click', onRemove);
    actions.append(removeButton);

    head.append(title, actions);
    card.append(head);
    return card;
  };

  const renderBlogBlocksEditor = (container, blocks = []) => {
    const root = document.createElement('div');
    root.className = 'admin-block-list';

    const addBlockRow = document.createElement('div');
    addBlockRow.className = 'admin-mini-actions';

    const addParagraph = document.createElement('button');
    addParagraph.type = 'button';
    addParagraph.className = 'admin-btn admin-btn-small';
    addParagraph.textContent = 'add paragraph';
    addParagraph.addEventListener('click', () => {
      writeCurrentItem((item) => {
        item.content = Array.isArray(item.content) ? item.content : [];
        item.content.push({ type: 'paragraph', text: 'New paragraph.' });
        return item;
      });
      renderEditor();
      renderPreview();
    });

    const addHeading = document.createElement('button');
    addHeading.type = 'button';
    addHeading.className = 'admin-btn admin-btn-small';
    addHeading.textContent = 'add heading';
    addHeading.addEventListener('click', () => {
      writeCurrentItem((item) => {
        item.content = Array.isArray(item.content) ? item.content : [];
        item.content.push({ type: 'heading', text: 'New heading' });
        return item;
      });
      renderEditor();
      renderPreview();
    });

    const addList = document.createElement('button');
    addList.type = 'button';
    addList.className = 'admin-btn admin-btn-small';
    addList.textContent = 'add list';
    addList.addEventListener('click', () => {
      writeCurrentItem((item) => {
        item.content = Array.isArray(item.content) ? item.content : [];
        item.content.push({ type: 'list', items: ['List item'] });
        return item;
      });
      renderEditor();
      renderPreview();
    });

    addBlockRow.append(addParagraph, addHeading, addList);
    root.append(addBlockRow);

    if (!blocks.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'No content blocks yet. Add a paragraph, heading, or list to start.';
      root.append(empty);
      container.replaceChildren(root);
      return;
    }

    blocks.forEach((block, index) => {
      const card = createCardShell(`Block ${index + 1}`, () => {
        writeCurrentItem((item) => {
          item.content = (Array.isArray(item.content) ? item.content : []).filter((_, currentIndex) => currentIndex !== index);
          return item;
        });
        renderEditor();
        renderPreview();
      });

      const typeSelect = makeSelect(['paragraph', 'heading', 'list'], block.type || 'paragraph');
      const typeField = field('type', typeSelect);
      typeField.classList.add('full');
      card.append(typeField);

      const blockBody = document.createElement('div');
      blockBody.className = 'admin-grid';

      const updateBlock = (updater) => {
        writeCurrentItem((item) => {
          item.content = Array.isArray(item.content) ? [...item.content] : [];
          item.content[index] = updater({ ...(item.content[index] || { type: 'paragraph', text: '' }) });
          return item;
        });
        renderPreview();
      };

      typeSelect.addEventListener('change', () => {
        updateBlock((currentBlock) => {
          const nextType = typeSelect.value;
          if (nextType === 'list') {
            return {
              type: 'list',
              items: currentBlock.type === 'list'
                ? currentBlock.items || []
                : [currentBlock.text || 'List item']
            };
          }

          return {
            type: nextType,
            text: currentBlock.type === 'list'
              ? (Array.isArray(currentBlock.items) ? currentBlock.items.join(' ') : '')
              : (currentBlock.text || '')
          };
        });
        renderEditor();
      });

      if (block.type === 'list') {
        const itemsInput = makeTextarea(Array.isArray(block.items) ? block.items.join('\n') : '');
        const itemsField = field('items, one per line', itemsInput);
        itemsField.classList.add('full');
        blockBody.append(itemsField);

        itemsInput.addEventListener('input', () => {
          updateBlock(() => ({
            type: 'list',
            items: itemsInput.value.split('\n').map((line) => line.trim()).filter(Boolean)
          }));
        });
      } else {
        const textInput = makeTextarea(block.text || '');
        const textLabel = block.type === 'heading' ? 'heading text' : 'paragraph text';
        const textField = field(textLabel, textInput);
        textField.classList.add('full');
        blockBody.append(textField);

        textInput.addEventListener('input', () => {
          updateBlock((currentBlock) => ({
            type: typeSelect.value,
            text: textInput.value
          }));
        });
      }

      card.append(blockBody);
      root.append(card);
    });

    container.replaceChildren(root);
  };

  const renderTripPhotosEditor = (container, photos = []) => {
    const root = document.createElement('div');
    root.className = 'admin-block-list';

    const addPhotoRow = document.createElement('div');
    addPhotoRow.className = 'admin-mini-actions';

    const addPhoto = document.createElement('button');
    addPhoto.type = 'button';
    addPhoto.className = 'admin-btn admin-btn-small';
    addPhoto.textContent = 'add photo';
    addPhoto.addEventListener('click', () => {
      writeCurrentItem((item) => {
        item.photos = Array.isArray(item.photos) ? item.photos : [];
        item.photos.push({ src: '../images/about/weekend-reset.jpg', alt: 'New photo', caption: '' });
        return item;
      });
      renderEditor();
      renderPreview();
    });
    addPhotoRow.append(addPhoto);
    root.append(addPhotoRow);

    if (!photos.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'No photos yet. Add one to build out the trip card.';
      root.append(empty);
      container.replaceChildren(root);
      return;
    }

    photos.forEach((photo, index) => {
      const card = createCardShell(`Photo ${index + 1}`, () => {
        writeCurrentItem((item) => {
          item.photos = (Array.isArray(item.photos) ? item.photos : []).filter((_, currentIndex) => currentIndex !== index);
          return item;
        });
        renderEditor();
        renderPreview();
      });

      const srcInput = makeInput(photo.src || '');
      const altInput = makeInput(photo.alt || '');
      const captionInput = makeInput(photo.caption || '');

      const srcField = field('src', srcInput);
      const altField = field('alt', altInput);
      const captionField = field('caption', captionInput);
      srcField.classList.add('full');
      altField.classList.add('full');
      captionField.classList.add('full');

      const updatePhoto = () => {
        writeCurrentItem((item) => {
          item.photos = Array.isArray(item.photos) ? [...item.photos] : [];
          item.photos[index] = {
            src: normalizeTripAssetPath(srcInput.value.trim()),
            alt: altInput.value.trim(),
            caption: captionInput.value.trim()
          };
          return item;
        });
        renderPreview();
      };

      srcInput.addEventListener('input', updatePhoto);
      altInput.addEventListener('input', updatePhoto);
      captionInput.addEventListener('input', updatePhoto);

      card.append(srcField, altField, captionField);
      root.append(card);
    });

    container.replaceChildren(root);
  };

  const renderKindStatus = () => {
    if (kindStatus) kindStatus.textContent = editorKind;
    document.querySelectorAll('[data-filter-kind]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.filterKind === libraryFilter);
    });
  };

  const renderList = () => {
    if (!listRoot) return;
    const query = String(state.search || '').trim().toLowerCase();
    const collection = libraryFilter === 'all'
      ? [
          ...state.items.blog.map((item) => ({ ...item, __kind: 'blog' })),
          ...state.items.trip.map((item) => ({ ...item, __kind: 'trip' }))
        ]
      : state.items[libraryFilter].map((item) => ({ ...item, __kind: libraryFilter }));

    const items = collection.filter((item) => {
      const searchMatch = !query || JSON.stringify(item).toLowerCase().includes(query);
      return searchMatch;
    });

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'No items match the current filters.';
      listRoot.replaceChildren(empty);
      return;
    }

    const buttons = items.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-item';
      button.classList.toggle('is-active', item.__kind === editorKind && item.id === state.selectedId[editorKind]);

      const top = document.createElement('div');
      top.className = 'admin-item-top';
      const title = document.createElement('div');
      title.className = 'admin-item-title';
      title.textContent = item.title || item.id;
      const meta = document.createElement('div');
      meta.className = 'admin-item-meta';
      meta.textContent = item.__kind === 'blog' ? item.date || '' : `${item.year || ''} · ${item.place || ''}`;
      top.append(title, meta);

      const kind = document.createElement('div');
      kind.className = 'admin-item-kind';
      kind.textContent = item.__kind;

      const note = document.createElement('div');
      note.className = 'admin-item-note';
      note.textContent = item.__kind === 'blog' ? item.excerpt || '' : item.note || '';

      const tags = document.createElement('div');
      tags.className = 'admin-tag-row';
      for (const tag of Array.isArray(item.tags) ? item.tags : []) {
        const span = document.createElement('span');
        span.textContent = tag;
        tags.append(span);
      }

      button.append(top, kind, note, tags);
      button.addEventListener('click', () => {
        editorKind = item.__kind;
        state.selectedId[item.__kind] = item.id;
        persistState();
        renderAll();
      });
      return button;
    });

    listRoot.replaceChildren(...buttons);
  };

  const renderEditor = () => {
    if (!formRoot || !editorTitle || !editorMeta) return;
    const item = currentItem();
    if (!item) {
      editorTitle.textContent = 'Select an item';
      editorMeta.textContent = '';
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'Create a new item to begin editing.';
      formRoot.replaceChildren(empty);
      return;
    }

    editorTitle.textContent = item.title || item.id;
    editorMeta.textContent = item.id;

    const useBlog = editorKind === 'blog';
    const grid = document.createElement('div');
    grid.className = 'admin-grid';

    const idInput = makeInput(item.id);
    const titleInput = makeInput(item.title);
    const primaryOne = makeInput(useBlog ? item.date : item.place);
    const primaryTwo = makeInput(useBlog ? item.readTime : item.year);
    const secondaryOne = makeInput(useBlog ? item.coverImage || '' : item.sortDate || '');
    const secondaryTwo = makeInput(useBlog ? item.coverAlt || '' : item.dateLabel || '');
    const tagsInput = makeInput(Array.isArray(item.tags) ? item.tags.join(', ') : '');
    const excerptInput = useBlog ? makeTextarea(item.excerpt || '') : null;
    const noteInput = useBlog ? null : makeTextarea(item.note || '');

    const bodyLabel = useBlog ? 'excerpt' : 'note';

    const fields = [
      field('id', idInput),
      field('title', titleInput),
      field(useBlog ? 'date' : 'place', primaryOne),
      field(useBlog ? 'read time' : 'year', primaryTwo),
      field(useBlog ? 'cover image' : 'sort date', secondaryOne),
      field(useBlog ? 'cover alt' : 'date label', secondaryTwo),
      field('tags', tagsInput),
      field(bodyLabel, useBlog ? excerptInput : noteInput)
    ];

    fields[0].classList.add('full');
    fields[1].classList.add('full');
    fields[6].classList.add('full');
    fields[7].classList.add('full');

    const note = document.createElement('div');
    note.className = 'admin-note';
    note.textContent = useBlog
      ? 'Blog content blocks are now editable as structured paragraphs, headings, and lists. Use the buttons below to add blocks.'
      : 'Trip photos are now editable as structured image fields. Add one row per image and keep the trip card preview in sync.';

    const structuredPanel = document.createElement('div');
    structuredPanel.className = 'admin-section';

    const structuredHead = document.createElement('div');
    structuredHead.className = 'admin-section-head';
    const structuredTitle = document.createElement('div');
    structuredTitle.className = 'admin-panel-label';
    structuredTitle.textContent = useBlog ? 'content blocks' : 'photos';
    structuredHead.append(structuredTitle);
    structuredPanel.append(structuredHead);

    formRoot.replaceChildren(grid, note, structuredPanel);
    grid.replaceChildren(...fields);

    if (useBlog) {
      renderBlogBlocksEditor(structuredPanel, Array.isArray(item.content) ? item.content : []);
    } else {
      const photoLabel = document.createElement('div');
      photoLabel.className = 'admin-muted';
      photoLabel.textContent = 'Add images for the trip preview below.';
      structuredPanel.append(photoLabel);
      renderTripPhotosEditor(structuredPanel, Array.isArray(item.photos) ? item.photos : []);
    }

    const commit = () => {
      const updated = writeCurrentItem((itemData) => {
        itemData.id = idInput.value.trim() || itemData.id;
        itemData.title = titleInput.value.trim();

        if (useBlog) {
          itemData.date = primaryOne.value.trim();
          itemData.readTime = primaryTwo.value.trim();
          itemData.coverImage = normalizeBlogAssetPath(secondaryOne.value.trim());
          itemData.coverAlt = secondaryTwo.value.trim();
          itemData.excerpt = excerptInput?.value.trim() || '';
          itemData.tags = normalizeTags(tagsInput.value);
        } else {
          itemData.place = primaryOne.value.trim();
          itemData.year = primaryTwo.value.trim();
          itemData.sortDate = secondaryOne.value.trim();
          itemData.dateLabel = secondaryTwo.value.trim();
          itemData.note = noteInput?.value.trim() || '';
          itemData.tags = normalizeTags(tagsInput.value);
        }

        return itemData;
      });

      if (!updated) return;

      editorTitle.textContent = updated.title || updated.id;
      editorMeta.textContent = updated.id;
      renderList();
      renderPreview();
    };

    [idInput, titleInput, primaryOne, primaryTwo, secondaryOne, secondaryTwo, tagsInput, excerptInput, noteInput]
      .filter(Boolean)
      .forEach((input) => {
      input.addEventListener('input', commit);
    });
  };

  const renderPreview = () => {
    if (!previewCard) return;
    const item = currentItem();
    if (!item) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      empty.textContent = 'Preview will appear here.';
      previewCard.replaceChildren(empty);
      return;
    }

    const useBlog = editorKind === 'blog';
    const wrapper = document.createElement('article');
    wrapper.className = 'admin-preview-card';

    const media = document.createElement('div');
    media.className = 'admin-preview-media';
    const img = document.createElement('img');
    img.src = useBlog
      ? previewBlogAssetPath(item.coverImage || 'images/about/weekend-reset.jpg')
      : previewTripAssetPath(item.photos?.[0]?.src || '../images/about/weekend-reset.jpg');
    img.alt = useBlog ? item.coverAlt || item.title : item.photos?.[0]?.alt || item.title;
    media.append(img);
    wrapper.append(media);

    const title = document.createElement('h3');
    title.className = 'admin-preview-title';
    title.textContent = item.title || 'Untitled';

    const meta = document.createElement('p');
    meta.className = 'admin-preview-meta';
    meta.textContent = useBlog ? `${item.date || ''} · ${item.readTime || ''}` : `${item.place || ''} · ${item.year || ''}`;

    const tags = document.createElement('div');
    tags.className = 'tags';
    for (const tag of Array.isArray(item.tags) ? item.tags : []) {
      const span = document.createElement('span');
      span.textContent = tag;
      tags.append(span);
    }

    const body = document.createElement('div');
    body.className = 'admin-preview-body';

    if (useBlog) {
      const blocks = Array.isArray(item.content) ? item.content : [];
      if (!blocks.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No content blocks yet.';
        body.append(empty);
      }

      for (const block of blocks) {
        if (block.type === 'paragraph') {
          const p = document.createElement('p');
          p.textContent = block.text || '';
          body.append(p);
        } else if (block.type === 'heading') {
          const h = document.createElement('h4');
          h.textContent = block.text || '';
          body.append(h);
        } else if (block.type === 'list') {
          const ul = document.createElement('ul');
          for (const entry of Array.isArray(block.items) ? block.items : []) {
            const li = document.createElement('li');
            li.textContent = entry;
            ul.append(li);
          }
          body.append(ul);
        }
      }
    } else {
      const note = document.createElement('p');
      note.textContent = item.note || '';
      body.append(note);
    }

    wrapper.append(title, meta, tags, body);
    previewCard.replaceChildren(wrapper);
  };

  const renderAll = () => {
    renderKindStatus();
    renderList();
    renderEditor();
    renderPreview();
  };

  const exportContent = (kind) => {
    const payload = kind === 'blog'
      ? `window.BLOG_POSTS = ${JSON.stringify(state.items.blog, null, 2)};\n`
      : `${JSON.stringify(state.items.trip, null, 2)}\n`;
    const blob = new Blob([payload], { type: kind === 'blog' ? 'application/javascript' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = kind === 'blog' ? 'posts.js' : 'trips.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const publish = async () => {
    if (location.protocol === 'file:') {
      if (publishStatus) publishStatus.textContent = 'Publish endpoint unavailable in local file preview. Use export to download the updated files.';
      return;
    }

    if (!isAuthenticated) {
      if (publishStatus) publishStatus.textContent = 'Sign in before publishing.';
      return;
    }

    if (publishStatus) publishStatus.textContent = 'Publishing...';
    const payload = {
      blog: state.items.blog,
      trip: state.items.trip
    };

    try {
      const { response, payload: result } = await requestJson('/api/admin/publish', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Publish failed (${response.status})`);
      if (publishStatus) publishStatus.textContent = result.message || 'Published successfully.';
    } catch {
      if (publishStatus) publishStatus.textContent = 'Publish endpoint unavailable. Use export to download the updated files.';
    }
  };

  gateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const pass = String(gateInput?.value || '').trim();

    if (LOCAL_MODE) {
      if (pass === ACCESS_CODE) {
        if (gateStatus) gateStatus.textContent = 'Unlocked.';
        unlock();
      } else if (gateStatus) {
        gateStatus.textContent = 'Wrong passcode.';
      }
      return;
    }

    if (gateStatus) gateStatus.textContent = 'Signing in...';

    try {
      const { response, payload } = await requestJson('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: pass })
      });

      if (!response.ok) {
        if (gateStatus) gateStatus.textContent = payload?.error || 'Login failed.';
        return;
      }

      if (gateStatus) gateStatus.textContent = 'Signed in.';
      unlock();
    } catch {
      if (gateStatus) gateStatus.textContent = 'Login endpoint unavailable.';
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    if (LOCAL_MODE) return;
    try {
      await requestJson('/api/admin/logout', { method: 'POST' });
    } catch {
      // Fall through and lock the UI locally.
    }
    lock();
    if (gateStatus) gateStatus.textContent = 'Signed out.';
  });

  document.querySelectorAll('[data-filter-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      libraryFilter = button.dataset.filterKind || 'blog';
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

  newPostBtn?.addEventListener('click', () => {
    addItem('blog', createBlogItem());
    renderAll();
  });

  newTripBtn?.addEventListener('click', () => {
    addItem('trip', createTripItem());
    renderAll();
  });

  duplicateBtn?.addEventListener('click', () => {
    duplicateCurrentItem();
    renderAll();
  });

  deleteBtn?.addEventListener('click', () => {
    removeCurrentItem();
    renderAll();
  });

  saveBtn?.addEventListener('click', () => {
    persistState();
  });

  exportCurrentBtn?.addEventListener('click', () => exportContent(editorKind));
  exportAllBtn?.addEventListener('click', () => {
    exportContent('blog');
    exportContent('trip');
  });
  publishBtn?.addEventListener('click', publish);

  configureGateUi();
  await checkSession();

  if (searchInput) searchInput.value = state.search || '';
  if (isAuthenticated || LOCAL_MODE) renderAll();
})();