const {
  assertJsonMethod,
  isAuthenticatedRequest,
  json,
  parseJsonBody,
  publishContent
} = require('./_shared/admin');

exports.handler = async (event) => {
  const methodError = assertJsonMethod(event, ['POST']);
  if (methodError) return methodError;

  if (!isAuthenticatedRequest(event)) {
    return json(401, { error: 'Authentication required' });
  }

  try {
    const body = parseJsonBody(event);
    const result = await publishContent({
      blog: body.blog,
      trip: body.trip
    });

    return json(200, result);
  } catch (error) {
    return json(400, { error: error.message || 'Unable to publish content' });
  }
};