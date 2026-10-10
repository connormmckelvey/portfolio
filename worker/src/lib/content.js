const normalizeTags = (value) => String(value || '')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);

const normalizeBlogAssetPath = (path) => {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) {
    return value;
  }
  return value.replace(/^\.\.\//, '').replace(/^\.\//, '');
};

const normalizeBlogPosts = (posts) => {
  if (!Array.isArray(posts)) throw new Error('Blog posts must be an array');

  return posts.map((post) => {
    if (!post || typeof post !== 'object') throw new Error('Each blog post must be an object');
    if (!String(post.id || '').trim()) throw new Error('Each blog post needs an id');

    const content = Array.isArray(post.content) ? post.content : [];

    return {
      id: String(post.id).trim(),
      title: String(post.title || '').trim(),
      date: String(post.date || '').trim(),
      readTime: String(post.readTime || '').trim(),
      tags: Array.isArray(post.tags)
        ? post.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : normalizeTags(post.tags),
      excerpt: String(post.excerpt || '').trim(),
      coverImage: normalizeBlogAssetPath(post.coverImage),
      coverAlt: String(post.coverAlt || '').trim(),
      content: content.map((block) => {
        if (!block || typeof block !== 'object') return { type: 'paragraph', text: '' };
        if (block.type === 'heading') {
          return { type: 'heading', text: String(block.text || '').trim() };
        }
        if (block.type === 'list') {
          return {
            type: 'list',
            items: Array.isArray(block.items)
              ? block.items.map((item) => String(item).trim()).filter(Boolean)
              : []
          };
        }
        return { type: 'paragraph', text: String(block.text || '').trim() };
      })
    };
  });
};

const serializeBlogPosts = (posts) => `window.BLOG_POSTS = ${JSON.stringify(posts, null, 2)};\n`;

const normalizeProjects = (projects) => {
  if (!Array.isArray(projects)) throw new Error('Gallery projects must be an array');

  return projects.map((project) => {
    if (!project || typeof project !== 'object') throw new Error('Each gallery project must be an object');
    if (!String(project.id || '').trim()) throw new Error('Each project needs an id');

    return {
      id: String(project.id).trim(),
      title: String(project.title || '').trim(),
      kicker: String(project.kicker || '').trim(),
      description: String(project.description || '').trim(),
      mediaType: String(project.mediaType || 'image').toLowerCase() === 'video' ? 'video' : 'image',
      mediaSrc: String(project.mediaSrc || '').trim(),
      posterSrc: String(project.posterSrc || '').trim(),
      tags: Array.isArray(project.tags)
        ? project.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : normalizeTags(project.tags)
    };
  });
};

const serializeProjects = (projects) => `${JSON.stringify(projects, null, 2)}\n`;

export {
  normalizeBlogPosts,
  normalizeProjects,
  serializeBlogPosts,
  serializeProjects
};
