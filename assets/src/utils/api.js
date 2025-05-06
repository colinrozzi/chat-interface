// HTTP API utilities

/**
 * Fetch data from an API endpoint
 * @param {string} url - The API URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The JSON response
 */
export async function fetchApi(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}

/**
 * GET request to an API endpoint
 * @param {string} url - The API URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The JSON response
 */
export function get(url, options = {}) {
    return fetchApi(url, {
        method: 'GET',
        ...options
    });
}

/**
 * POST request to an API endpoint
 * @param {string} url - The API URL
 * @param {Object} data - The data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The JSON response
 */
export function post(url, data, options = {}) {
    return fetchApi(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
    });
}

/**
 * PUT request to an API endpoint
 * @param {string} url - The API URL
 * @param {Object} data - The data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The JSON response
 */
export function put(url, data, options = {}) {
    return fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
    });
}

/**
 * DELETE request to an API endpoint
 * @param {string} url - The API URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The JSON response
 */
export function del(url, options = {}) {
    return fetchApi(url, {
        method: 'DELETE',
        ...options
    });
}

/**
 * Fetch conversations from the API
 * @returns {Promise<Object[]>} Array of conversation objects
 */
export async function fetchConversations() {
    return get('/api/conversations');
}

/**
 * Fetch health status from the API
 * @returns {Promise<Object>} Health status object
 */
export async function fetchHealthStatus() {
    return get('/api/health');
}
