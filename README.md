# christopher-eller.de

## Setup
```bash
bundle install
```

## Updating
To keep Jekyll and all dependencies up to date, run:
```bash
bundle update
```

This will update all gems, including Jekyll, to their latest versions. If you specifically want to update only Jekyll, you can run:
```bash
bundle update jekyll
```

## Development
```bash
bundle exec jekyll serve
```
or
```bash
jekyll build


### EXIF Location Data Removal
This repository includes a pre-commit hook that automatically removes EXIF location data from photos in the `assets/images/photos` directory.

Setup:
1. After cloning the repository, run this command to configure Git to use the hooks:
```bash
git config --local include.path ../.gitconfig
```

Requirements:
1. Install exiftool (required for EXIF data removal):
```bash
# macOS
brew install exiftool
``` 

The pre-commit hook will automatically:
- Check if exiftool is installed
- Remove GPS/location data from any staged photos in `assets/images/photos`
- Fail the commit if exiftool is not installed or if the removal process fails
