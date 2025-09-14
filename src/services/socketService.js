// WebSocket Service for Real-time Updates
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

   
    const socketURL = import.meta.env.VITE_NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.isConnected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.emit('connection_error', error);
    });

    // Set up event listeners for real-time updates
    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // New donation available
    this.socket.on('new_donation', (data) => {
      console.log('📦 New donation:', data);
      this.emit('new_donation', data);
    });

    // Donation was claimed
    this.socket.on('donation_claimed', (data) => {
      console.log('🎯 Donation claimed:', data);
      this.emit('donation_claimed', data);
    });

    // Donation status updated
    this.socket.on('donation_status_updated', (data) => {
      console.log('📊 Donation status updated:', data);
      this.emit('donation_status_updated', data);
    });

    // Pickup confirmed
    this.socket.on('pickup_confirmed', (data) => {
      console.log('✅ Pickup confirmed:', data);
      this.emit('pickup_confirmed', data);
    });

    // Donation collected
    this.socket.on('donation_collected', (data) => {
      console.log('📦 Donation collected:', data);
      this.emit('donation_collected', data);
    });

    // Claim cancelled
    this.socket.on('claim_cancelled', (data) => {
      console.log('❌ Claim cancelled:', data);
      this.emit('claim_cancelled', data);
    });

    // Nearby donation (location-based)
    this.socket.on('nearby_donation', (data) => {
      console.log('📍 Nearby donation:', data);
      this.emit('nearby_donation', data);
    });

    // Claim created
    this.socket.on('claim_created', (data) => {
      console.log('🆕 Claim created:', data);
      this.emit('claim_created', data);
    });
  }

  // Custom event emitter for React components
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket event callback:', error);
        }
      });
    }
  }

  // Room management
  joinDonationRoom(donationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_donation_room', donationId);
    }
  }

  leaveDonationRoom(donationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_donation_room', donationId);
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
