# christopher-eller.de
My Site in Hugo

- **Photo:** Upload jpg to `import/` with a descriptive filename (e.g., "Sunset in Spain.jpeg"). Workflow will automatically Strip EXIF, Convert Filename, Create Post with Formatted Title.

- **Links:**  hugo new content/links/title-with-spaces.md

- **Auto-Update:** Uses https://github.com/chriopter/hugo-autopilot

- **Pre-Commit:** The pre-commit hook Removes GPS EXIF & compare local Hugo version to pinned in .hugoversion
```bash
git config --local include.path ../.gitconfig && brew install exiftool
```
