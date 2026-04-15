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

const normalizeTripAssetPath = (path) => {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//.test(value) || value.startsWith('../') || value.startsWith('./') || value.startsWith('/')) {
    return value;
  }
  return `../${value}`;
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

const normalizeTrips = (trips) => {
  if (!Array.isArray(trips)) throw new Error('Trips must be an array');

  return trips.map((trip) => {
    if (!trip || typeof trip !== 'object') throw new Error('Each trip must be an object');
    if (!String(trip.id || '').trim()) throw new Error('Each trip needs an id');

    const coords = Array.isArray(trip.coords) && trip.coords.length === 2 ? trip.coords : [30, -97];

    return {
      id: String(trip.id).trim(),
      title: String(trip.title || '').trim(),
      place: String(trip.place || '').trim(),
      region: String(trip.region || '').trim(),
      year: String(trip.year || '').trim(),
      sortDate: String(trip.sortDate || '').trim(),
      dateLabel: String(trip.dateLabel || '').trim(),
      coords: [Number(coords[0]), Number(coords[1])],
      note: String(trip.note || '').trim(),
      tags: Array.isArray(trip.tags)
        ? trip.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : normalizeTags(trip.tags),
      photos: Array.isArray(trip.photos)
        ? trip.photos.map((photo) => ({
            src: normalizeTripAssetPath(photo?.src),
            alt: String(photo?.alt || '').trim(),
            caption: String(photo?.caption || '').trim()
          }))
        : []
    };
  });
};

const serializeBlogPosts = (posts) => `window.BLOG_POSTS = ${JSON.stringify(posts, null, 2)};\n`;

const serializeTrips = (trips) => `${JSON.stringify(trips, null, 2)}\n`;

export {
  normalizeBlogPosts,
  normalizeTrips,
  serializeBlogPosts,
  serializeTrips
};
