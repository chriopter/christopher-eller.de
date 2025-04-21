/**
 * Map and control configuration settings
 */

// Map configuration settings
export const mapConfig = {
    defaultView: [20, 0],
    defaultZoom: 2,
    tileLayer: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
};

// Control settings
export const controlConfig = {
    zoomPosition: 'topright',
    viewportFilterPosition: 'topright'
};

// Panel configuration
export const panelConfig = {
    defaultVisible: true,
    mobileBreakpoint: 768,
    sidebarWidth: 350
};

// Gallery configuration
export const galleryConfig = {
    maxVisibleImages: 3,
    popupMaxWidth: 500,
    popupMinWidth: 320
};
