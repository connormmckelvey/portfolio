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
  putContent
} from './lib/github.js';

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
