# christopher-eller.de
My Site in Hugo

## Repo

- **Pre-Commit:** After cloning the repository, run this command to configure Git to use the hooks:
```bash
git config --local include.path ../.gitconfig && brew install exiftool
```
The pre-commit hook Removes GPS EXIF & compare local Hugo version to pinned in .hugoversion


### Pre-commit Hook Functions
The pre-commit hook Removes GPS EXIF & compare local Hugo version to pinned in .hugoversion

### Photo Upload
Upload jpg to `import/` with a descriptive filename (e.g., "Sunset in Spain.jpeg"). Workflow will automatically Strip EXIF, Convert Filename, Create Post with Formatted Title.

### Create Link Post Type
1. hugo new content/links/title-with-spaces.md

### CI/CD and GitHub Actions

- Uses https://github.com/chriopter/hugo-autopilot