const encodeContentPath = (path) => encodeURIComponent(path).replace(/%2F/g, '/');

const textToBase64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
    const detail = payload?.message || response.statusText || 'Unknown GitHub API error';
    throw new Error(`Unable to read ${path}: ${response.status} ${detail}`);
  }

  return payload.sha || null;
};

const putContent = async (env, path, content, message) => {
  const { owner, repo, branch } = repoConfig(env);
  const encodedPath = encodeContentPath(path);
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

  if (!response.ok) {
    const detail = payload?.message || 'Unknown GitHub API error';
    throw new Error(`Failed to update ${path}: ${detail}`);
  }

  return payload;
};

export {
  putContent
};
