const {
  buildAuthResponse,
  isAuthenticatedRequest,
  assertJsonMethod
} = require('./_shared/admin');

exports.handler = async (event) => {
  const methodError = assertJsonMethod(event, ['GET']);
  if (methodError) return methodError;

  return buildAuthResponse(isAuthenticatedRequest(event));
};