(() => {
  const posts = Array.isArray(window.BLOG_POSTS) ? [...window.BLOG_POSTS] : [];
  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const grid = document.querySelector('[data-post-grid]');
  const filtersRoot = document.querySelector('[data-post-filters]');
  const statusEl = document.getElementById('posts-status');

  const modal = document.getElementById('post-modal');
  const modalTitle = document.getElementById('post-modal-title');
  const modalMeta = document.getElementById('post-modal-meta');
  const modalTags = document.getElementById('post-modal-tags');
  const modalBody = document.getElementById('post-modal-body');
  const modalStatus = document.getElementById('post-modal-status');

  const copyBtn = document.querySelector('[data-copy-link]');

  let activeFilter = 'all';
  let lastFocus = null;
  let closeTimer = null;

  const byId = new Map(posts.map((p) => [p.id, p]));

  const prettyDate = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const cardTags = (post) => (Array.isArray(post.tags) ? post.tags : []).map((t) => String(t).trim()).filter(Boolean);

  const matchesFilter = (post) => {
    if (activeFilter === 'all') return true;
    return cardTags(post).includes(activeFilter);
  };

  const buildFilters = () => {
    if (!filtersRoot) return;

    const tagCounts = new Map();
    for (const post of posts) {
      for (const tag of cardTags(post)) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const tags = [...tagCounts.keys()].sort((a, b) => a.localeCompare(b));
    const allButtons = ['all', ...tags];

    filtersRoot.replaceChildren(
      ...allButtons.map((tag) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'blog-filter';
        button.dataset.filter = tag;
        button.setAttribute('aria-pressed', String(tag === activeFilter));
        button.textContent = tag === 'all' ? `all (${posts.length})` : `${tag} (${tagCounts.get(tag) || 0})`;

        button.addEventListener('click', () => {
          activeFilter = tag;
          renderCards();
          updateFilterState();
        });

        return button;
      })
    );

    updateFilterState();
  };

  const updateFilterState = () => {
    const buttons = [...document.querySelectorAll('.blog-filter')];
    for (const button of buttons) {
      const isOn = button.dataset.filter === activeFilter;
      button.classList.toggle('is-active', isOn);
      button.setAttribute('aria-pressed', String(isOn));
    }
  };

  const openPost = (id) => {
    const post = byId.get(id);
    if (!post || !modal) return;

    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.classList.remove('is-open');
    window.requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.classList.add('modal-open');

    if (modalTitle) modalTitle.textContent = post.title;
    if (modalMeta) modalMeta.textContent = `${prettyDate(post.date)} · ${post.readTime}`;

    if (modalTags) {
      modalTags.replaceChildren(
        ...cardTags(post).map((tag) => {
          const chip = document.createElement('span');
          chip.textContent = tag;
          return chip;
        })
      );
    }

    if (modalBody) {
      modalBody.replaceChildren();
      const blocks = Array.isArray(post.content) ? post.content : [];
      for (const block of blocks) {
        if (!block || typeof block !== 'object') continue;
        if (block.type === 'paragraph') {
          const p = document.createElement('p');
          p.textContent = block.text || '';
          modalBody.append(p);
        } else if (block.type === 'heading') {
          const h = document.createElement('h4');
          h.textContent = block.text || '';
          modalBody.append(h);
        } else if (block.type === 'list') {
          const ul = document.createElement('ul');
          for (const item of Array.isArray(block.items) ? block.items : []) {
            const li = document.createElement('li');
            li.textContent = item;
            ul.append(li);
          }
          modalBody.append(ul);
        }
      }
    }

    if (modalStatus) modalStatus.textContent = '';
    history.replaceState(null, '', `#post-${id}`);

    const closeBtn = modal.querySelector('[data-close]');
    closeBtn?.focus?.();
  };

  const closePost = () => {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
      closeTimer = null;
    }, 180);
    document.body.classList.remove('modal-open');
    if (location.hash.startsWith('#post-')) history.replaceState(null, '', '#posts');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  const renderCards = () => {
    if (!grid) return;

    const visiblePosts = posts.filter(matchesFilter);

    grid.replaceChildren(
      ...visiblePosts.map((post, index) => {
        const article = document.createElement('article');
        article.className = 'blog-card is-entering';
        article.style.setProperty('--stagger', `${index * 55}ms`);

        const imgWrap = document.createElement('button');
        imgWrap.type = 'button';
        imgWrap.className = 'blog-card-image-wrap';
        imgWrap.setAttribute('aria-label', `Read ${post.title}`);
        imgWrap.addEventListener('click', () => openPost(post.id));

        const img = document.createElement('img');
        img.className = 'blog-card-image';
        img.src = post.coverImage || 'images/about/weekend-reset.jpg';
        img.alt = post.coverAlt || post.title;
        img.loading = 'lazy';
        imgWrap.append(img);

        const body = document.createElement('div');
        body.className = 'blog-card-body';

        const h3 = document.createElement('h3');
        h3.textContent = post.title;

        const meta = document.createElement('p');
        meta.className = 'blog-card-meta';
        meta.textContent = `${prettyDate(post.date)} · ${post.readTime}`;

        const excerpt = document.createElement('p');
        excerpt.className = 'blog-card-excerpt';
        excerpt.textContent = post.excerpt || '';

        const tags = document.createElement('div');
        tags.className = 'tags';
        for (const tag of cardTags(post)) {
          const span = document.createElement('span');
          span.textContent = tag;
          tags.append(span);
        }

        const actions = document.createElement('div');
        actions.className = 'blog-card-actions';

        const read = document.createElement('button');
        read.type = 'button';
        read.className = 'blog-read-btn';
        read.textContent = 'read post';
        read.addEventListener('click', () => openPost(post.id));

        actions.append(read);
        body.append(h3, meta, excerpt, tags, actions);
        article.append(imgWrap, body);
        return article;
      })
    );

    if (statusEl) {
      statusEl.textContent = activeFilter === 'all'
        ? `${visiblePosts.length} post${visiblePosts.length === 1 ? '' : 's'} available.`
        : `${visiblePosts.length} post${visiblePosts.length === 1 ? '' : 's'} in ${activeFilter}.`;
    }
  };

  document.addEventListener('click', (event) => {
    const closeTarget = event.target.closest?.('[data-close]');
    if (closeTarget) closePost();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePost();
  });

  copyBtn?.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}${location.hash}`;
    try {
      await navigator.clipboard.writeText(url);
      if (modalStatus) modalStatus.textContent = 'Link copied.';
    } catch {
      if (modalStatus) modalStatus.textContent = 'Copy failed. Copy from the address bar.';
    }
  });

  const init = () => {
    buildFilters();
    renderCards();

    if (location.hash.startsWith('#post-')) {
      const id = location.hash.replace('#post-', '');
      if (byId.has(id)) openPost(id);
    }
  };

  init();
})();
