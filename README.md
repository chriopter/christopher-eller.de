# christopher-eller.de
My Site in Hugo

### Setup
After cloning the repository, run this command to configure Git to use the hooks:
```bash
git config --local include.path ../.gitconfig && brew install exiftool
```

### Pre-commit Hook Functions
The pre-commit hook performs three main functions:
- Removes GPS/location data from photos for privacy
- Extract EXIF
- Check local HUGO Version & compare to pinned in .hugoversion

### Photo Upload
You can upload photos directly through GitHub's web interface.

- Upload jpg to `import/` with a descriptive filename (e.g., "Sunset in Spain.jpeg")
- Workflow will automatically Strip EXIF, Convert Filename, Create Post with Formatted Title

### Create Link Post Type
1. hugo new content/links/title-with-spaces.md

### CI/CD and GitHub Actions

- Uses https://github.com/chriopter/hugo-autopilot