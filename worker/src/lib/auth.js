const COOKIE_NAME = 'cm_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const base64UrlEncode = (inputBytes) => {
  let binary = '';
  for (let i = 0; i < inputBytes.length; i += 1) {
    binary += String.fromCharCode(inputBytes[i]);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlDecodeToBytes = (input) => {
  const normalized = String(input).replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

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

const importHmacKey = async (secret) => {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
};

const signHmac = async (secret, value) => {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
};

const createSessionToken = async (secret) => {
  const payload = {
    issuedAt: Date.now(),
    expiresAt: Date.now() + (SESSION_TTL_SECONDS * 1000)
  };

  const payloadJson = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(encoder.encode(payloadJson));
  const signature = await signHmac(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifySessionToken = async (secret, token) => {
  if (!secret || !token || typeof token !== 'string') return false;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = await signHmac(secret, encodedPayload);
  if (!timingSafeEqual(signature, expectedSignature)) return false;

  try {
    const payloadJson = decoder.decode(base64UrlDecodeToBytes(encodedPayload));
    const payload = JSON.parse(payloadJson);
    return typeof payload.expiresAt === 'number' && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
};

const getSessionCookieHeader = (token, secure) => {
  const sameSite = secure ? 'None' : 'Lax';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=${sameSite}; Max-Age=${SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`;
};

const clearSessionCookieHeader = (secure) => {
  const sameSite = secure ? 'None' : 'Lax';
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=${sameSite}; Max-Age=0${secure ? '; Secure' : ''}`;
};

const isSecureRequest = (request) => {
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
};

const getSessionTokenFromRequest = (request) => {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookies(request.headers.get('Cookie') || '');
  return cookies[COOKIE_NAME] || '';
};

const getEnvOrThrow = (env, key) => {
  const value = String(env[key] || '').trim();
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
};

export {
  clearSessionCookieHeader,
  createSessionToken,
  getEnvOrThrow,
  getSessionCookieHeader,
  getSessionTokenFromRequest,
  isSecureRequest,
  verifySessionToken
};
