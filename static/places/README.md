# Places

Interactive map feature for the Hugo site.

## Structure

- `node_modules/leaflet/`: Leaflet dependencies (managed by npm)
- `css/places.css`: Custom styling for places feature
- `js/places.js`: Custom JavaScript for places feature
- `images/`: Map markers and control icons

## Updating Leaflet

Leaflet files are managed locally in this directory. To update:

1. Run `cd static/places && npm update` to update the local node_modules
