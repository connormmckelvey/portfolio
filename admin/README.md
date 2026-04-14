# Admin

Private content editor for the portfolio.

## How it works

- The page at `/admin/` is the editing surface.
- In local file preview, it still supports the temporary passcode `atlas` so the UI can be tested offline.
- In a deployed Netlify build, the page logs in through `/api/admin/login`, checks the session with `/api/admin/session`, logs out with `/api/admin/logout`, and publishes with `/api/admin/publish`.
- Publishing commits the current blog and trip data back to GitHub using the Contents API.

## Environment variables

Set these in the deployment host:

- `ADMIN_PASSWORD` - the private admin password
- `ADMIN_SESSION_SECRET` - secret used to sign the session cookie
- `GITHUB_TOKEN` - token with repo contents write access
- `GITHUB_OWNER` - GitHub owner or organization name
- `GITHUB_REPO` - repository name
- `GITHUB_BRANCH` - branch to commit to, usually `main`

## Files updated by publish

- `blog/posts.js`
- `map/trips.json`

## Notes

- The current editor stores drafts in localStorage before publishing.
- Blog posts are edited as structured blocks: paragraphs, headings, and lists.
- Trips are edited as structured fields plus one photo row per image.
