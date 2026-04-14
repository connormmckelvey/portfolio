const {
  adminPassword,
  assertJsonMethod,
  getSessionCookieHeader,
  json,
  parseJsonBody,
  isSecureRequest,
  signSession
} = require('./_shared/admin');

exports.handler = async (event) => {
  const methodError = assertJsonMethod(event, ['POST']);
  if (methodError) return methodError;

  try {
    const body = parseJsonBody(event);
    const password = String(body.password || '').trim();

    if (!password || password !== adminPassword()) {
      return json(401, { error: 'Invalid password' });
    }

    const token = signSession();
    return json(200, { authenticated: true }, {
      'Set-Cookie': getSessionCookieHeader(token, isSecureRequest(event))
    });
  } catch (error) {
    return json(400, { error: error.message || 'Unable to log in' });
  }
};