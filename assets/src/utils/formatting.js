// Formatting utilities

/**
 * Format a timestamp to a readable date
 * @param {number} timestamp - Unix timestamp (milliseconds)
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format a relative time (e.g., "2 minutes ago")
 * @param {number} timestamp - Unix timestamp (milliseconds)
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60 * 1000) {
        return 'just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Default to full date
    return formatDate(timestamp);
}

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength) + '...';
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - The HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Format a number with comma separators
 * @param {number} number - The number to format
 * @returns {string} Formatted number
 */
export function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}
