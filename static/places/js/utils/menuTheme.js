/**
 * Menu theme toggle functionality
 */

const moonToggle = document.getElementById('moonToggle');
const body = document.body;
const html = document.documentElement;
const toDarkPhases = ['🌔', '🌓', '🌒'];
const toLightPhases = ['🌘', '🌗', '🌖'];
let currentIndex = 0;
let isTransitioning = false;
let transitionInterval;

// System dark mode detection
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Function to update theme
export function updateTheme(isDark, skipStorage = false) {
    // If skipping storage and no manual preference, use system preference
    if (skipStorage && localStorage.getItem('darkMode') === null) {
        isDark = darkModeMediaQuery.matches;
    }
    if (isDark) {
        html.classList.add('dark-mode');
        body.classList.add('dark-mode');
        if (!isTransitioning) moonToggle.textContent = '🌑';
    } else {
        html.classList.remove('dark-mode');
        body.classList.remove('dark-mode');
        if (!isTransitioning) moonToggle.textContent = '🌕';
    }
    
    // Store manual preference if not skipping storage
    if (!skipStorage) {
        localStorage.setItem('darkMode', isDark.toString());
    }
}

// Function to handle system preference changes
function handleSystemPreference(e) {
    // Always clear stored preference and follow system
    localStorage.removeItem('darkMode');
    updateTheme(e.matches, true);
}

function animatePhases(phases, isDarkMode) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex = 0;

    // Apply theme change
    updateTheme(isDarkMode);

    function transition() {
        moonToggle.textContent = phases[currentIndex];
        moonToggle.classList.add('transitioning');
        currentIndex++;

        if (currentIndex >= phases.length) {
            clearInterval(transitionInterval);
            isTransitioning = false;
            moonToggle.classList.remove('transitioning');
            moonToggle.textContent = isDarkMode ? '🌑' : '🌕';
        }
    }

    transitionInterval = setInterval(transition, 150);
}

// Initialize theme toggle functionality
export function initMenuTheme() {
    if (!moonToggle) return;

    // Initial theme setup
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference !== null) {
        updateTheme(storedPreference === 'true', true);
    } else {
        updateTheme(darkModeMediaQuery.matches, true);
    }

    // Listen for system theme changes
    darkModeMediaQuery.addEventListener('change', handleSystemPreference);

    // Double click to reset to system preference
    moonToggle.addEventListener('dblclick', (e) => {
        e.preventDefault();
        localStorage.removeItem('darkMode');
        updateTheme(darkModeMediaQuery.matches, true);
    });

    // Single click to toggle theme
    moonToggle.addEventListener('click', () => {
        const toDarkMode = !html.classList.contains('dark-mode');
        animatePhases(toDarkMode ? toDarkPhases : toLightPhases, toDarkMode);
    });
}
