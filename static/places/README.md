# Places

Interactive map feature for the Hugo site.

## Structure

- `leaflet.css` and `leaflet.js`: Core Leaflet files (imported from node_modules)
- `css/places.css`: Custom styling for places feature
- `js/places.js`: Custom JavaScript for places feature
- `images/`: Map markers and control icons

## Updating Leaflet

Leaflet files are managed at the project root. To update:

1. Run `npm update` to update the node_modules
2. Run `./update-leaflet.sh` to copy the updated files to this directory
