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
brew install exiftool  # for removing EXIF location data from photos
This repository includes a pre-commit hook that automatically removes EXIF location data from photos in the `assets/images/photos` directory. To set this up:

1. Install exiftool (required for EXIF data removal):
```bash
brew install exiftool
cp .hooks/pre-commit .git/hooks/ && chmod +x .git/hooks/
```

The pre-commit hook will automatically:
- Check if exiftool is installed
- Remove GPS/location data from any staged photos in `assets/images/photos`
- Fail the commit if exiftool is not installed or if the removal process fails
