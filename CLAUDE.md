# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website built with Hugo static site generator (v0.146.6). The site features blog posts, photos, links, and an interactive places map.

## Common Commands

```bash
# Local development
hugo serve

# Build static site
hugo

# Install git hooks (run once after cloning)
git config core.hooksPath .hooks
```

## Architecture

### Content Structure
- `content/posts/` - Blog posts in Markdown
- `content/photos/` - Photo posts (auto-generated from imports)
- `content/links/` - External links/bookmarks
- `content/places/` - Map locations with metadata

### Photo Import Workflow
1. Drop images into `import/` directory
2. GitHub Action automatically:
   - Converts filenames to URL-friendly format
   - Creates photo posts with front matter
   - Strips EXIF data (GPS removed locally via pre-commit hook)
   - Commits and pushes changes

### Interactive Features
- `/places/` - Leaflet.js interactive map (`static/places/`)
- `/bits/` - Collection of web experiments (`static/bits/`)

### Pre-commit Hook
The repository uses a custom pre-commit hook (`.hooks/pre-commit`) that:
- Removes GPS EXIF data from images
- Validates Hugo version matches `.hugoversion`

Required tools: `exiftool`, `convert` (ImageMagick), `jq`

### Deployment
- GitHub Pages via Hugo Autopilot
- Automated builds triggered on push to main branch
- Dependabot manages dependency updates