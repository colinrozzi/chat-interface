// This is a simple bundle that loads the main app.js
document.addEventListener('DOMContentLoaded', () => {
    // Load the main app.js
    const appScript = document.createElement('script');
    appScript.src = 'app.js';
    document.body.appendChild(appScript);
    
    // Add the DOMPurify script for better security when rendering messages
    const purifyScript = document.createElement('script');
    purifyScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.1/purify.min.js';
    document.head.appendChild(purifyScript);
});
