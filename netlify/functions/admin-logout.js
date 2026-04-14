const {
  assertJsonMethod,
  clearSessionCookieHeader,
  isSecureRequest,
  json
} = require('./_shared/admin');

exports.handler = async (event) => {
  const methodError = assertJsonMethod(event, ['POST']);
  if (methodError) return methodError;

  return json(200, { authenticated: false, message: 'Signed out' }, {
    'Set-Cookie': clearSessionCookieHeader(isSecureRequest(event))
  });
};