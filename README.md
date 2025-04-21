# christopher-eller.de
My Site in Hugo

## Content Features

- **Photo:** Upload jpg to `import/` with a descriptive filename (e.g., "Sunset in Spain.jpeg"). Workflow will automatically Strip EXIF, Convert Filename, Create Post with Formatted Title.

- **Links:** Create new link posts with `hugo new content/links/title-with-spaces.md`

- **Places:** Create location markers with `hugo new content/places/location-name.md`. View map at `/places/`.

## Technical

- **Auto-Update:** Uses https://github.com/chriopter/hugo-autopilot

- **Pre-Commit:** The pre-commit hook Removes GPS EXIF from import, photos and places fodlers & compare local Hugo version to pinned in .hugoversion
```bash
git config --local include.path ../.gitconfig && brew install exiftool
```

- **Update Dependencies:** Refresh all npm modules with:
```bash
find . -name "package.json" -not -path "*/node_modules/*" -execdir sh -c 'echo "Updating in $(pwd)" && npm update' \;
```