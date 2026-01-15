# Copilot instructions (portfolio)

## Project snapshot
- Static personal portfolio site: plain HTML + CSS (no build step, no framework).
- Entry point: [index.html](../index.html)
- Blog: [blog.html](../blog.html)
- Styling: [style.css](../style.css)
- Assets: [images/](../images)

## How to run / preview
- Open [index.html](../index.html) in a browser, or use a simple local server.
- PowerShell quick server (optional): `python -m http.server 8000` then visit `http://localhost:8000/`.

## Conventions to follow in this repo
- Keep it dependency-light: prefer HTML/CSS over adding JS; only add JS when it materially improves UX.
- Keep everything in a single page with anchor navigation (`#projects`, `#about`, etc.).
- Prefer semantic structure: `header` + `nav` + `main` + `section` + `footer`.
- Use existing design tokens in CSS (via `:root` custom properties) instead of hard-coded colors.
- Maintain accessibility basics:
  - Use a “skip to content” link.
  - Ensure visible focus styles (`:focus-visible`).
  - Respect `prefers-reduced-motion`.
  - Provide alt text for images.

## Patterns already used
- Hero uses layered gradients + overlay for readability (avoid external background images when possible).
- Reusable layout blocks: `.section`, `.card-grid`/`.card`, `.tags`, and a “trail-style” `.timeline`.
- GitHub section (`#github`) progressively enhances via a small inline script that fetches public repos from the GitHub API.

## Common edits
- Add/modify project tiles in the Projects section in [index.html](../index.html) under `#projects`.
- Change which repos load by updating `data-username` / `data-source` on `#github-repos` in [index.html](../index.html).
- Add blog posts by editing the post cards in [blog.html](../blog.html) under `#posts`.
- Update global theming, spacing, and responsive rules in [style.css](../style.css).
- Use assets from [images/](../images) rather than introducing new external URLs when possible.
- Keep the resume filename stable as `connor-mckelvey-resume.pdf` (linked from nav + contact).
