const crypto = require('crypto');

const COOKIE_NAME = 'cm_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders
  },
  body: JSON.stringify(body)
});

const emptyJson = (statusCode, extraHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders
  },
  body: ''
});

const parseCookies = (headerValue = '') => {
  return String(headerValue)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf('=');
      if (index === -1) return cookies;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
};

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');

const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const encodeContentPath = (path) => encodeURIComponent(path).replace(/%2F/g, '/');

const getEnv = (name, fallback = '') => {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : fallback;
};

const sessionSecret = () => {
  const value = getEnv('ADMIN_SESSION_SECRET');
  if (!value) throw new Error('Missing ADMIN_SESSION_SECRET');
  return value;
};

const adminPassword = () => {
  const value = getEnv('ADMIN_PASSWORD');
  if (!value) throw new Error('Missing ADMIN_PASSWORD');
  return value;
};

const repoConfig = () => {
  const owner = getEnv('GITHUB_OWNER');
  const repo = getEnv('GITHUB_REPO');
  const token = getEnv('GITHUB_TOKEN');
  const branch = getEnv('GITHUB_BRANCH', 'main');

  if (!owner || !repo || !token) {
    throw new Error('Missing GitHub repo configuration');
  }

  return { owner, repo, token, branch };
};

const isSecureRequest = (event) => {
  const proto = String(event.headers?.['x-forwarded-proto'] || event.headers?.['X-Forwarded-Proto'] || '').toLowerCase();
  return proto === 'https';
};

const signSession = () => {
  const payload = {
    issuedAt: Date.now(),
    expiresAt: Date.now() + (SESSION_TTL_SECONDS * 1000)
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', sessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
};

const verifySession = (token) => {
  if (!token || typeof token !== 'string') return false;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', sessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return typeof payload.expiresAt === 'number' && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
};

const getSessionCookieHeader = (token, secure = true) => {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`;
};

const clearSessionCookieHeader = (secure = true) => {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
};

const getSessionTokenFromEvent = (event) => {
  const cookies = parseCookies(event.headers?.cookie || event.headers?.Cookie || '');
  return cookies[COOKIE_NAME] || '';
};

const isAuthenticatedRequest = (event) => {
  try {
    return verifySession(getSessionTokenFromEvent(event));
  } catch {
    return false;
  }
};

const buildAuthResponse = (authenticated) => json(200, { authenticated });

const assertJsonMethod = (event, allowedMethods) => {
  const method = String(event.httpMethod || '').toUpperCase();
  if (!allowedMethods.includes(method)) {
    return json(405, { error: 'Method not allowed' }, { Allow: allowedMethods.join(', ') });
  }
  return null;
};

const parseJsonBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error('Invalid JSON body');
  }
};

const normalizeTags = (value) => String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean);

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
      tags: Array.isArray(post.tags) ? post.tags.map((tag) => String(tag).trim()).filter(Boolean) : normalizeTags(post.tags),
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
      tags: Array.isArray(trip.tags) ? trip.tags.map((tag) => String(tag).trim()).filter(Boolean) : normalizeTags(trip.tags),
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

const serializeBlogPosts = (posts) => {
  return `window.BLOG_POSTS = ${JSON.stringify(posts, null, 2)};\n`;
};

const serializeTrips = (trips) => {
  return `${JSON.stringify(trips, null, 2)}\n`;
};

const githubRequest = async (path, options = {}) => {
  const { token } = repoConfig();
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  return { response, payload };
};

const getContentSha = async (path) => {
  const { owner, repo, branch } = repoConfig();
  const encodedPath = encodeContentPath(path);
  const { response, payload } = await githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`, {
    method: 'GET'
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Unable to read ${path}`);
  }

  return payload.sha || null;
};

const putContent = async (path, content, message) => {
  const { owner, repo, branch } = repoConfig();
  const sha = await getContentSha(path);
  const encodedPath = encodeContentPath(path);
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch
  };

  if (sha) body.sha = sha;

  const { response, payload } = await githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = payload?.message || 'Unknown GitHub API error';
    throw new Error(`Failed to update ${path}: ${detail}`);
  }

  return payload;
};

const publishContent = async ({ blog, trip }) => {
  const normalizedBlog = normalizeBlogPosts(blog);
  const normalizedTrips = normalizeTrips(trip);

  await putContent('blog/posts.js', serializeBlogPosts(normalizedBlog), 'Update blog posts from /admin');
  await putContent('map/trips.json', serializeTrips(normalizedTrips), 'Update trip map from /admin');

  return {
    message: 'Published changes to blog/posts.js and map/trips.json.'
  };
};

module.exports = {
  adminPassword,
  assertJsonMethod,
  buildAuthResponse,
  clearSessionCookieHeader,
  getSessionTokenFromEvent,
  getSessionCookieHeader,
  isAuthenticatedRequest,
  isSecureRequest,
  json,
  parseJsonBody,
  publishContent,
  repoConfig,
  signSession,
  verifySession,
  emptyJson
};