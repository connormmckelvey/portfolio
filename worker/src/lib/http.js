const parseAllowedOrigins = (value) => String(value || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const corsForRequest = (request, env) => {
  const origin = request.headers.get('Origin');
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);

  if (!origin) {
    return {
      allowed: true,
      headers: {}
    };
  }

  if (!allowedOrigins.includes(origin)) {
    return {
      allowed: false,
      headers: {}
    };
  }

  return {
    allowed: true,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      Vary: 'Origin'
    }
  };
};

const json = (body, status = 200, headers = {}) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
};

const handlePreflight = (request, env) => {
  const cors = corsForRequest(request, env);
  if (!cors.allowed) {
    return json({ error: 'Origin not allowed' }, 403);
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...cors.headers,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
};

const readJson = async (request) => {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON body');
  }
};

export {
  corsForRequest,
  handlePreflight,
  json,
  readJson
};
