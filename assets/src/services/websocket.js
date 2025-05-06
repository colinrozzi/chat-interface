// WebSocket service for handling real-time communication with the server

let socket = null;
let messageHandlers = [];

/**
 * Connect to the WebSocket server
 * @returns {Promise} Resolves when the connection is established
 */
export function connectWebSocket() {
    return new Promise((resolve, reject) => {
        // Get the current hostname and port
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('WebSocket connection established');
            resolve(socket);
        };
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };
        
        socket.onclose = () => {
            console.log('WebSocket connection closed');
            // Try to reconnect after a delay
            setTimeout(() => connectWebSocket().catch(console.error), 3000);
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            reject(error);
        };
    });
}

/**
 * Send an action to the server via WebSocket
 * @param {string} action - The action to perform
 * @param {Object} additionalData - Any additional data to send
 * @returns {boolean} True if the message was sent successfully
 */
export function sendAction(action, additionalData = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('Connection to server lost. Trying to reconnect...');
        return false;
    }
    
    const data = {
        action: action,
        ...additionalData
    };
    
    socket.send(JSON.stringify(data));
    return true;
}

/**
 * Register a message handler function
 * @param {string} messageType - The type of message to handle
 * @param {Function} handler - The handler function
 */
export function registerMessageHandler(messageType, handler) {
    messageHandlers.push({ type: messageType, handler });
}

/**
 * Handle incoming server messages and route to registered handlers
 * @param {Object} message - The message from the server
 */
function handleServerMessage(message) {
    console.log('Received message:', message);
    
    // Route message to registered handlers
    messageHandlers
        .filter(h => h.type === message.type)
        .forEach(h => h.handler(message));
    
    // Also route to handlers that registered for 'all' message types
    messageHandlers
        .filter(h => h.type === 'all')
        .forEach(h => h.handler(message));
}

/**
 * Check if the WebSocket is connected
 * @returns {boolean} True if connected
 */
export function isConnected() {
    return socket && socket.readyState === WebSocket.OPEN;
}

/**
 * Remove a message handler
 * @param {string} messageType - The type of message to stop handling
 * @param {Function} handler - The handler function to remove (optional)
 */
export function removeMessageHandler(messageType, handler) {
    if (handler) {
        // Remove specific handler
        messageHandlers = messageHandlers.filter(
            h => !(h.type === messageType && h.handler === handler)
        );
    } else {
        // Remove all handlers for this message type
        messageHandlers = messageHandlers.filter(h => h.type !== messageType);
    }
}
