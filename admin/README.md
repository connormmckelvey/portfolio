# Admin Deployment (GitHub Pages + Cloudflare Worker)

This admin UI stays hosted with the static site. Private auth and publishing run through a Cloudflare Worker.

## 1) Configure admin API URL

Set the Worker base URL in admin/index.html:

- Update the meta tag: `<meta name="admin-api-base" content="https://your-worker.your-account.workers.dev">`
- Do not include a trailing slash.
- Optional quick setup: open `/admin/?api=https://your-worker.your-account.workers.dev` once. The admin page stores this URL in localStorage.

## 2) Configure Worker secrets

1. Copy `.dev.vars.example` to `.dev.vars` for local development.
2. In production, set secrets with Wrangler:

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_SESSION_SECRET
wrangler secret put GITHUB_TOKEN
wrangler secret put GITHUB_OWNER
wrangler secret put GITHUB_REPO
wrangler secret put GITHUB_BRANCH
```

## 3) Local test

```bash
wrangler dev
```

Then serve the site locally, for example:

```bash
python -m http.server 8000
```

Use admin at `/admin/` and verify login/session/logout/publish.

## 3.1 Image uploads in admin

- Admin now supports authenticated image uploads via `POST /api/admin/upload`.
- Supported file types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Default max size is 6 MB per file.
- Uploaded files are committed directly into the repo under `images/...`.
- Optional Worker setting: `MAX_UPLOAD_BYTES` (environment variable) to override max size.

If upload fails with 413, reduce file size or increase `MAX_UPLOAD_BYTES` in Worker env/vars.

## 4) Deploy Worker

```bash
wrangler deploy
```

After deploy, keep the same Worker URL in `admin/index.html` and commit your site changes.

## 5) Push-ready automatic deploy (GitHub Actions)

This repo includes `.github/workflows/deploy-worker.yml` to deploy Worker changes on push to `main`.

Add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `GH_PUBLISH_TOKEN` (GitHub PAT used by Worker to commit content)

Add these GitHub repository variables:

- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH` (usually `main`)

Then push your branch and confirm the workflow run succeeds.

## 6) Go-live checklist

1. Deploy Worker and confirm its URL responds for `/api/admin/session`.
2. Set admin API base using meta tag or `/admin/?api=...`.
3. Log in at `/admin` and publish a small content edit.
4. Verify `blog/posts.js` and `map/trips.json` receive commits.
5. Rotate any previously exposed tokens/secrets.

## Security notes

- Never commit `.dev.vars` or `.env` files.
- Rotate `GITHUB_TOKEN` and `ADMIN_SESSION_SECRET` if they are ever exposed.
- Keep `ALLOWED_ORIGINS` in wrangler.toml restricted to your domains.
