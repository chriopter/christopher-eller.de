# christopher-eller.de
My Site in Hugo.

## Content Features

- **Photo:** Upload jpg to `import/` with a descriptive filename (e.g., "Sunset in Spain.jpeg"). Workflow will automatically Strip EXIF, Convert Filename, Create Post with Formatted Title.

- **Links:** Create new link posts with `hugo new content/links/title-with-spaces.md`

- **Places:** Create location markers with `hugo new content/places/location-name.md`. View map at `/places/`.

- **Bits:** Interactive web experiments at `/bits/`. NPM dependencies use latest versions (*) and are installed locally during build - no CDN required.

- **OpenGraph:** Automatically generates PNG preview images for social media sharing using Hugo's built-in image processing.

## Technical

- **Auto-Update:** Uses https://github.com/chriopter/hugo-autopilot

- **Pre-Commit:** The pre-commit hook Removes GPS EXIF from import, photos and places fodlers & compare local Hugo version to pinned in .hugoversion
```bash
git config --local include.path ../.gitconfig && brew install exiftool
```

- **Local Development:** Use `./serve.sh` to install npm dependencies and start Hugo server. Dependencies are gitignored and always use latest versions. 
