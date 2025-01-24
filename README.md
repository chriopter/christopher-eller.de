# christopher-eller.de
My Site in Hugo

- brew install hugo
- hugo server

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