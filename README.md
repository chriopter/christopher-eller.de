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

### Photo Upload
You can upload photos directly through GitHub's web interface:

1. Navigate to the `import/` directory in the repository
2. Push photo with a descriptive filename (e.g., "Sunset in Spain.jpeg")
3. The photo will be automatically:
   - Stripped of EXIF GPS data
   - Converted to proper filename format (e.g., "sunset-in-spain.jpeg")
   - Placed in the correct Hugo structure
   - Given a properly formatted title ("Sunset in Spain")

The GitHub Action will process the photo and commit the changes automatically.

### Create Link
1. hugo new content/links/title-with-spaces.md

### CI/CD and GitHub Actions

#### Pushing Changes
- GitHub Actions builds and deploys the site when changes are pushed to main
- Uses peaceiris/actions-hugo@v3 for Hugo setup 

#### Dependabot & Auto-Merge
- `.hugoversion`: Contains the Hugo version used by GitHub Actions
- Dependabot: Automatically updates GitHub Actions but not Hugo version
- Custom Action: Checks weekly for new Hugo versions and creates PRs
- Repo Auto-Merges PRs

#### Photo Processing
- Photo processing: Upload to import/ directory and workflow handles the rest
- Automatically processes photos and triggers a site rebuild
