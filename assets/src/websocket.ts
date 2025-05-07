/**
 * WebSocket Manager
 * Handles WebSocket communication with the chat-interface backend
 */

import { WebSocketMessage, ServerMessage } from './types';

export class WebSocketManager {
    private socket: WebSocket | null;
    private connected: boolean;
    private reconnectAttempts: number;
    private maxReconnectAttempts: number;
    private reconnectTimeout: number | null;
    
    // Event callbacks
    onOpen: ((event: Event) => void) | null;
    onMessage: ((message: ServerMessage) => void) | null;
    onClose: ((event: CloseEvent) => void) | null;
    onError: ((error: Event) => void) | null;
    
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        
        // Event callbacks
        this.onOpen = null;
        this.onMessage = null;
        this.onClose = null;
        this.onError = null;
    }
    
    /**
     * Connect to the WebSocket server
     */
    connect(): void {
        if (this.socket) {
            this.disconnect();
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log(`Connecting to WebSocket: ${wsUrl}`);
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = (event: Event) => {
            console.log('WebSocket connection established');
            this.connected = true;
            this.reconnectAttempts = 0;
            
            if (this.onOpen) {
                this.onOpen(event);
            }
        };
        
        this.socket.onmessage = (event: MessageEvent) => {
            let message: ServerMessage;
            try {
                message = JSON.parse(event.data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                return;
            }
            
            if (this.onMessage) {
                this.onMessage(message);
            }
        };
        
        this.socket.onclose = (event: CloseEvent) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            this.connected = false;
            
            if (this.onClose) {
                this.onClose(event);
            }
            
            // Attempt to reconnect unless this was a clean close
            if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        };
        
        this.socket.onerror = (error: Event) => {
            console.error('WebSocket error:', error);
            
            if (this.onError) {
                this.onError(error);
            }
        };
    }
    
    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.connected = false;
        
        // Clear any pending reconnect
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
    
    /**
     * Schedule a reconnection attempt
     */
    scheduleReconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        
        const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000);
        console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        
        this.reconnectTimeout = window.setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }
    
    /**
     * Send a message to the server
     * @param {Object} data - The message to send
     * @returns {boolean} - Whether the message was sent successfully
     */
    sendMessage(data: WebSocketMessage): boolean {
        if (!this.connected || !this.socket) {
            console.error('Cannot send message: WebSocket not connected');
            return false;
        }
        
        try {
            const message = JSON.stringify(data);
            this.socket.send(message);
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
        }
    }
}
