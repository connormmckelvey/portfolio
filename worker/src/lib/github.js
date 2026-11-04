const encodeContentPath = (path) => encodeURIComponent(path).replace(/%2F/g, '/');

const bytesToBase64 = (bytes) => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
};

const textToBase64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  return bytesToBase64(bytes);
};

const repoConfig = (env) => {
  const owner = String(env.GITHUB_OWNER || '').trim();
  const repo = String(env.GITHUB_REPO || '').trim();
  const token = String(env.GITHUB_TOKEN || '').trim();
  const branch = String(env.GITHUB_BRANCH || 'main').trim() || 'main';

  if (!owner || !repo || !token) {
    throw new Error('Missing GitHub repository configuration');
  }

  return { owner, repo, token, branch };
};

const githubRequest = async (env, path, options = {}) => {
  const { token } = repoConfig(env);
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-admin-api',
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return { response, payload };
};

const getContentSha = async (env, path) => {
  const { owner, repo, branch } = repoConfig(env);
  const encodedPath = encodeContentPath(path);
  const { response, payload } = await githubRequest(
    env,
    `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
    { method: 'GET' }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const payloadMessage = typeof payload === 'string'
      ? payload.trim()
      : payload?.message;
    const detail = payloadMessage || response.statusText || 'Unknown GitHub API error';
    throw new Error(`Unable to read ${path}: ${response.status} ${detail}`);
  }

  return payload.sha || null;
};

const putContent = async (env, path, content, message, retries = 2) => {
  const { owner, repo, branch } = repoConfig(env);
  const encodedPath = encodeContentPath(path);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const sha = await getContentSha(env, path);

    const body = {
      message,
      content: textToBase64(content),
      branch
    };

    if (sha) body.sha = sha;

    const { response, payload } = await githubRequest(env, `/repos/${owner}/${repo}/contents/${encodedPath}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (response.ok) return payload;

    if (response.status === 409 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      continue;
    }

    const detail = payload?.message || 'Unknown GitHub API error';
    throw new Error(`Failed to update ${path}: ${detail}`);
  }
};

const putBinaryContent = async (env, path, bytes, message, retries = 2) => {
  const { owner, repo, branch } = repoConfig(env);
  const encodedPath = encodeContentPath(path);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const sha = await getContentSha(env, path);

    const body = {
      message,
      content: bytesToBase64(bytes),
      branch
    };

    if (sha) body.sha = sha;

    const { response, payload } = await githubRequest(env, `/repos/${owner}/${repo}/contents/${encodedPath}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (response.ok) return payload;

    if (response.status === 409 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      continue;
    }

    const detail = payload?.message || 'Unknown GitHub API error';
    throw new Error(`Failed to update ${path}: ${detail}`);
  }
};

export {
  putBinaryContent,
  putContent
};
