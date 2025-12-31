import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Register all event listeners
    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected manually');
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Schedule events
    this.socket.on('schedule:created', (data) => this.emit('schedule:created', data));
    this.socket.on('schedule:updated', (data) => this.emit('schedule:updated', data));
    this.socket.on('schedule:deleted', (data) => this.emit('schedule:deleted', data));

    // User events
    this.socket.on('user:created', (data) => this.emit('user:created', data));
    this.socket.on('user:updated', (data) => this.emit('user:updated', data));
    this.socket.on('user:deleted', (data) => this.emit('user:deleted', data));

    // Project events
    this.socket.on('project:created', (data) => this.emit('project:created', data));
    this.socket.on('project:updated', (data) => this.emit('project:updated', data));
    this.socket.on('project:deleted', (data) => this.emit('project:deleted', data));

    // Location events
    this.socket.on('location:created', (data) => this.emit('location:created', data));
    this.socket.on('location:updated', (data) => this.emit('location:updated', data));
    this.socket.on('location:deleted', (data) => this.emit('location:deleted', data));
    this.socket.on('location:reordered', (data) => this.emit('location:reordered', data));
  }

  // Subscribe to events
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // Unsubscribe from events
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Emit events to local listeners
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  // Send events to server
  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Cannot send event:', event);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
