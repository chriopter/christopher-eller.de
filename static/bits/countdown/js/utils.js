/**
 * Utility functions for the countdown timer
 */

// Format milliseconds to a human-readable string
function formatTimeHumanReadable(diffMs) {
    if (diffMs <= 0) return 'Countdown complete';
    
    // Calculate all time units
    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor((diffMs / (1000 * 60 * 60 * 24)) % 30.4375); // Average days per month
    const months = Math.floor((diffMs / (1000 * 60 * 60 * 24 * 30.4375)) % 12);
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)); // Account for leap years
    
    // Build human-readable string, only including non-zero units
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    
    if (years === 0 && months === 0) {
        if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        if (days === 0) {
            if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
            if (hours === 0) {
                if (seconds > 0) parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
            }
        }
    }
    
    // Format as a readable sentence
    if (parts.length === 0) return 'Just a moment';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    
    const lastPart = parts.pop();
    return `${parts.join(', ')}, and ${lastPart}`;
}

// Get tomorrow's date
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
}

// Format a date for the date input field
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Format time for the time input field
function formatTimeForInput(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Parse URL parameters
function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
        date: urlParams.get('date'),
        time: urlParams.get('time'),
        label: urlParams.get('label'),
        emoji: urlParams.get('emoji') ? decodeURIComponent(urlParams.get('emoji')) : null,
        bgColor: urlParams.get('bgColor') ? decodeURIComponent(urlParams.get('bgColor')) : '#e6f7ff',
        density: urlParams.get('density') || 'medium'
    };
}

// Debug function to log URL parameters
function logUrlParams() {
    const params = parseUrlParams();
    console.log('URL Parameters:', params);
    return params;
}

// Initialize theme based on user preferences
function initTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('darkMode');
    const shouldBeDark = storedTheme === 'true' || (storedTheme === null && prefersDark);
    
    if (shouldBeDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
    }
}
