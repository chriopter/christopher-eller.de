/**
 * Theme initialization for places section
 */

// Function to toggle theme
function toggleTheme() {
    console.log('Toggle theme called');
    const placesSection = document.getElementById('places-section');
    const isDark = placesSection.classList.contains('dark-mode');
    console.log('Current dark mode state:', isDark);
    
    if (isDark) {
        console.log('Switching to light mode');
        placesSection.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    } else {
        console.log('Switching to dark mode');
        placesSection.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    }
}

// Function to initialize theme
export function initTheme() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeHandler);
    } else {
        initThemeHandler();
    }
}

function initThemeHandler() {
    // Get theme preferences
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('darkMode');
    const shouldBeDark = storedTheme === 'true' || (storedTheme === null && prefersDark);
    
    // Apply theme to places section
    const placesSection = document.getElementById('places-section');
    if (shouldBeDark && placesSection) {
        placesSection.classList.add('dark-mode');
    }

    // Listen for theme changes from main site
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && placesSection) {
                const isDark = document.documentElement.classList.contains('dark-mode');
                if (isDark) {
                    placesSection.classList.add('dark-mode');
                } else {
                    placesSection.classList.remove('dark-mode');
                }
            }
        });
    });

    // Start observing theme changes
    observer.observe(document.documentElement, { attributes: true });

    // Initialize moon toggle click handler
    const moonToggle = document.getElementById('moonToggle');
    console.log('Moon toggle element:', moonToggle);
    if (moonToggle) {
        console.log('Adding event listeners to moon toggle');
        moonToggle.style.cursor = 'pointer';
        
        // Create bound function for the event listener
        const boundToggleTheme = toggleTheme.bind(null);
        
        // Remove any existing listeners and add new ones
        moonToggle.removeEventListener('click', boundToggleTheme);
        moonToggle.addEventListener('click', boundToggleTheme);
        
        moonToggle.addEventListener('dblclick', (e) => {
            localStorage.removeItem('darkMode');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.classList.add('dark-mode');
                placesSection.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
                placesSection.classList.remove('dark-mode');
            }
        });
    }
}
