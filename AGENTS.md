# Repository Guidelines

## Project Overview
Hugo-powered personal site with posts, photos, links, and an interactive places map. Theme is a submodule (`themes/ananke`). Privacy-first image handling via pre-commit and an import workflow.

## Project Structure & Module Organization
- `content/` — Markdown: `posts/`, `photos/`, `links/`, `places/`.
- `layouts/` — Hugo templates/partials.  `assets/` — SCSS/JS pipeline.
- `static/` — Files served as-is (e.g., `static/places/`, `static/bits/`).
- `archetypes/` — Blueprints for `hugo new`.  `import/` — drop new photos.
- `themes/` — Submodule. Init with `git submodule update --init --recursive`.
- `public/` — Build output (generated). Avoid manual edits.
- `hugo.toml` and `.hugoversion` — Config and pinned Hugo version.

## Build, Test, and Development Commands
- Optional tool install: `mise install` (uses `mise.toml`).
- Init and hooks: `git submodule update --init --recursive && git config --local include.path ../.gitconfig`.
- Dev server: `./serve.sh` - installs npm dependencies and starts Hugo at `http://localhost:1313`.
- Build: `hugo --gc --minify`. Strict mode: `hugo --panicOnWarning`.
- Content helpers: `hugo new content/links/your-title.md`, `hugo new content/places/location-name.md`.
- NPM packages: All use latest versions (*) and are installed automatically via serve.sh. Dependencies are gitignored.

## JavaScript Dependencies & Package Management
- **NEVER use CDN links** for JavaScript libraries in HTML files.
- **ALWAYS use package.json** to manage dependencies for interactive bits/projects.
- **ALWAYS use `"*"` for package versions** - never pin to specific versions.
- For projects in `static/bits/`:
  - Create a `package.json` with all required dependencies.
  - **MUST use `"*"` for all version numbers** to ensure latest versions.
  - Import modules locally from `node_modules/` after installing.
  - Example structure (see `static/bits/world-conquest/package.json`):
    ```json
    {
      "name": "project-name",
      "version": "1.0.0",
      "dependencies": {
        "library-name": "*",
        "another-lib": "*"
      },
      "devDependencies": {
        "dev-tool": "*"
      }
    }
    ```
- Run `npm install` in the project directory to install dependencies.
- Reference installed packages via local paths or ES6 imports, not external CDNs.
- **NO version pinning** - all packages should use `"*"` to stay on latest.

## Coding Style & Naming Conventions
- Content front matter: `title`, `date`, `tags`; prefer descriptive filenames, kebab-case slugs.
- Templates: Go templates, 2-space indent; keep partials small and reusable.
- Images: add to `import/` or `content/...`; GPS EXIF is stripped automatically.
- Do not commit generated `public/`, `resources/`, `thumbnails/`, or `.../exif/`.

## Testing Guidelines
- Use the pinned Hugo: `hugo version` must match `.hugoversion` (pre-commit enforces).
- Validate locally with `hugo server -D`; check pages, links, and OpenGraph images.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject; context in body; reference issues.
- Examples: `Update Hugo: 0.149.0 → 0.149.1`, `Update packages for bits`.
- PRs: include summary, rationale, test steps, and screenshots for visual changes.

## Automation & Deployment
- Pre-commit (`.hooks/pre-commit`) removes GPS EXIF, verifies Hugo version. Requires `exiftool`, ImageMagick (`magick`/`convert`), and `jq`.
- Photo import workflow: add images to `import/`; actions/scripts normalize names, generate posts, and strip EXIF.
- Deployed via Hugo Autopilot/GitHub Pages; builds run on push to `main`. Dependabot keeps dependencies updated.
