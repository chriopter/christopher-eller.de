# christopher-eller.de
My Site in Jekyll

## Setup
```bash
bundle install
```

## Updating
To keep Jekyll and all dependencies up to date, run:
```bash
bundle update
```

## Testing
```bash
bundle exec jekyll serve
```
or
```bash
jekyll build
```

## Git Hooks

### Setup
After cloning the repository, run this command to configure Git to use the hooks:
```bash
git config --local include.path ../.gitconfig && brew install imagemagick && brew install exiftool
```

### EXIF Location Data Removal
The pre-commit hook automatically removes EXIF location data from photos in the `assets/images/photos` directory.

When committing, the hook will:
- Check if exiftool is installed
- Remove GPS/location data from any staged photos in `assets/images/photos`
- Re-stage the modified photos
- Fail the commit if exiftool is not installed or if the removal process fails

### Thumbnail Generation
The pre-commit hook also handles automatic thumbnail generation for photos in the `assets/images/photos` directory.

When committing, the hook will:
- Check if ImageMagick is installed
- Process any staged photos that don't have thumbnails
- Generate 1024px wide thumbnail versions
- Handle JPG, JPEG, and HEIC formats (converts HEIC to JPEG)
- Name thumbnails with _thumbnail suffix (e.g. photo.jpg -> photo_thumbnail.jpg)
- Stage any generated thumbnails and converted images