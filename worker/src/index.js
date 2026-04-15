import {
  clearSessionCookieHeader,
  createSessionToken,
  getEnvOrThrow,
  getSessionCookieHeader,
  getSessionTokenFromRequest,
  isSecureRequest,
  verifySessionToken
} from './lib/auth.js';
import {
  normalizeBlogPosts,
  normalizeTrips,
  serializeBlogPosts,
  serializeTrips
} from './lib/content.js';
import {
  corsForRequest,
  handlePreflight,
  json,
  readJson
} from './lib/http.js';
import {
  putBinaryContent,
  putContent
} from './lib/github.js';

const ALLOWED_UPLOAD_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

const sanitizeSegment = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9-_]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48);

const sanitizeFileStem = (value) => {
  const stem = sanitizeSegment(value);
  return stem || 'image';
};

const normalizeImageFolder = (value) => {
  const raw = String(value || 'uploads').replace(/\\/g, '/').trim();
  const cleaned = raw.startsWith('images/') ? raw.slice(7) : raw;
  const pieces = cleaned.split('/').map(sanitizeSegment).filter(Boolean);
  const folder = pieces.length ? pieces.join('/') : 'uploads';
  return `images/${folder}`;
};

const extFromName = (name) => {
  const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
};

const buildUploadPath = ({ folder, originalName, mimeType, requestedBase }) => {
  const normalizedFolder = normalizeImageFolder(folder);
  const safeBase = sanitizeFileStem(requestedBase || originalName || 'image');
  const mimeExt = ALLOWED_UPLOAD_TYPES[mimeType] || '';
  const nameExt = extFromName(originalName);
  const extension = mimeExt || nameExt || 'jpg';
  return `${normalizedFolder}/${safeBase}-${Date.now()}.${extension}`;
};

const withCors = (request, env, response) => {
  const cors = corsForRequest(request, env);
  const headers = new Headers(response.headers);
  Object.entries(cors.headers).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

const assertMethod = (request, methods) => {
  if (methods.includes(request.method)) return null;
  return json({ error: 'Method not allowed' }, 405, {
    Allow: methods.join(', ')
  });
};

const isAuthenticatedRequest = async (request, env) => {
  const token = getSessionTokenFromRequest(request);
  if (!token) return false;
  const secret = getEnvOrThrow(env, 'ADMIN_SESSION_SECRET');
  return verifySessionToken(secret, token);
};

const login = async (request, env) => {
  const methodError = assertMethod(request, ['POST']);
  if (methodError) return methodError;

  const body = await readJson(request);
  const password = String(body.password || '').trim();
  const adminPassword = getEnvOrThrow(env, 'ADMIN_PASSWORD');

  if (!password || password !== adminPassword) {
    return json({ error: 'Invalid password' }, 401);
  }

  const token = await createSessionToken(getEnvOrThrow(env, 'ADMIN_SESSION_SECRET'));
  const secure = isSecureRequest(request);
  return json(
    { authenticated: true, token },
    200,
    { 'Set-Cookie': getSessionCookieHeader(token, secure) }
  );
};

const session = async (request, env) => {
  const methodError = assertMethod(request, ['GET']);
  if (methodError) return methodError;

  const token = getSessionTokenFromRequest(request);
  if (!token) return json({ authenticated: false }, 200);

  const authenticated = await verifySessionToken(getEnvOrThrow(env, 'ADMIN_SESSION_SECRET'), token);
  return json(authenticated ? { authenticated: true, token } : { authenticated: false }, 200);
};

const logout = async (request, env) => {
  const methodError = assertMethod(request, ['POST']);
  if (methodError) return methodError;

  return json(
    { authenticated: false, message: 'Signed out' },
    200,
    { 'Set-Cookie': clearSessionCookieHeader(isSecureRequest(request)) }
  );
};

const publish = async (request, env) => {
  const methodError = assertMethod(request, ['POST']);
  if (methodError) return methodError;

  if (!await isAuthenticatedRequest(request, env)) {
    return json({ error: 'Authentication required' }, 401);
  }

  const body = await readJson(request);
  const normalizedBlog = normalizeBlogPosts(body.blog);
  const normalizedTrips = normalizeTrips(body.trip);

  await putContent(env, 'blog/posts.js', serializeBlogPosts(normalizedBlog), 'Update blog posts from /admin');
  await putContent(env, 'map/trips.json', serializeTrips(normalizedTrips), 'Update trip map from /admin');

  return json({ message: 'Published changes to blog/posts.js and map/trips.json.' }, 200);
};

const upload = async (request, env) => {
  const methodError = assertMethod(request, ['POST']);
  if (methodError) return methodError;

  if (!await isAuthenticatedRequest(request, env)) {
    return json({ error: 'Authentication required' }, 401);
  }

  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return json({ error: 'Missing file upload' }, 400);
  }

  const mimeType = String(file.type || '').toLowerCase();
  if (!ALLOWED_UPLOAD_TYPES[mimeType]) {
    return json({ error: 'Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.' }, 415);
  }

  const maxBytes = Number(env.MAX_UPLOAD_BYTES || MAX_UPLOAD_BYTES) || MAX_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    return json({ error: `File too large. Max ${Math.floor(maxBytes / (1024 * 1024))} MB.` }, 413);
  }

  const folder = String(form.get('folder') || 'uploads');
  const basename = String(form.get('basename') || 'image');
  const path = buildUploadPath({
    folder,
    originalName: file.name,
    mimeType,
    requestedBase: basename
  });

  const bytes = new Uint8Array(await file.arrayBuffer());
  await putBinaryContent(env, path, bytes, `Upload image asset ${path} from /admin`);

  return json({
    message: 'Uploaded image asset.',
    path,
    mimeType,
    size: file.size
  }, 200);
};

const route = async (request, env) => {
  const path = new URL(request.url).pathname;

  if (request.method === 'OPTIONS') {
    return handlePreflight(request, env);
  }

  const cors = corsForRequest(request, env);
  if (!cors.allowed) {
    return json({ error: 'Origin not allowed' }, 403);
  }

  if (path === '/api/admin/login') return withCors(request, env, await login(request, env));
  if (path === '/api/admin/session') return withCors(request, env, await session(request, env));
  if (path === '/api/admin/logout') return withCors(request, env, await logout(request, env));
  if (path === '/api/admin/publish') return withCors(request, env, await publish(request, env));
  if (path === '/api/admin/upload') return withCors(request, env, await upload(request, env));

  return withCors(request, env, json({ error: 'Not found' }, 404));
};

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error';
      return withCors(request, env, json({ error: message }, 400));
    }
  }
};
