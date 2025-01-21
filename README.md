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
git config --local include.path ../.gitconfig && brew install exiftool
```

### Pre-commit Hook Functions
The pre-commit hook:
- Removes GPS/location data from photos for privacy
- Extract EXIF data for usage in posts
