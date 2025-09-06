// Frontend Integration Example for SurplusLink
// This file shows how to integrate the backend API with your React frontend

import io from 'socket.io-client';

// =============================================================================
// API SERVICE
// =============================================================================

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.token = localStorage.getItem('surpluslink_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('surpluslink_token', token);
    } else {
      localStorage.removeItem('surpluslink_token');
    }
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async signup(userData) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(updates) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Donation methods
  async createDonation(donationData) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  }

  async getDonations(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/donations?${queryParams}`);
  }

  async getDonation(id) {
    return this.request(`/donations/${id}`);
  }

  async updateDonation(id, updates) {
    return this.request(`/donations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteDonation(id) {
    return this.request(`/donations/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyDonations(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/donations/user/my-donations?${queryParams}`);
  }

  // Claim methods
  async claimDonation(donationId, claimData = {}) {
    return this.request('/claims', {
      method: 'POST',
      body: JSON.stringify({ donationId, ...claimData }),
    });
  }

  async confirmPickup(claimId, otp) {
    return this.request(`/claims/${claimId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async markAsCollected(claimId, feedback = {}) {
    return this.request(`/claims/${claimId}/collect`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async getMyClaims(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/claims/user/my-claims?${queryParams}`);
  }

  async cancelClaim(claimId) {
    return this.request(`/claims/${claimId}`, {
      method: 'DELETE',
    });
  }

  // User methods
  async getStats() {
    return this.request('/users/stats');
  }

  async getLeaderboard(type = 'all', limit = 10) {
    return this.request(`/users/leaderboard?type=${type}&limit=${limit}`);
  }

  async getUserProfile(userId) {
    return this.request(`/users/profile/${userId}`);
  }

  async getNearbyUsers(lat, lng, radius = 25, role = null) {
    const params = new URLSearchParams({ lat, lng, radius });
    if (role) params.append('role', role);
    return this.request(`/users/nearby?${params}`);
  }

  async getDashboard() {
    return this.request('/users/dashboard');
  }

  logout() {
    this.setToken(null);
  }
}

// =============================================================================
// WEBSOCKET SERVICE
// =============================================================================

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupEventListeners() {
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
  }

  // Custom event emitter for React components
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
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
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Room management
  joinDonationRoom(donationId) {
    if (this.socket) {
      this.socket.emit('join_donation_room', donationId);
    }
  }

  leaveDonationRoom(donationId) {
    if (this.socket) {
      this.socket.emit('leave_donation_room', donationId);
    }
  }
}

// =============================================================================
// REACT HOOKS
// =============================================================================

import { useState, useEffect, useContext, createContext } from 'react';

// Create services
const apiService = new ApiService();
const socketService = new SocketService();

// Context for services
const ServicesContext = createContext();

export const ServicesProvider = ({ children }) => {
  return (
    <ServicesContext.Provider value={{ apiService, socketService }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return context;
};

// Custom hooks for common operations
export const useAuth = () => {
  const { apiService, socketService } = useServices();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('surpluslink_token');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData.user);
          socketService.connect(token);
        } catch (error) {
          console.error('Auth initialization error:', error);
          apiService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await apiService.login(email, password);
    setUser(data.user);
    socketService.connect(data.token);
    return data;
  };

  const signup = async (userData) => {
    const data = await apiService.signup(userData);
    setUser(data.user);
    socketService.connect(data.token);
    return data;
  };

  const logout = () => {
    apiService.logout();
    socketService.disconnect();
    setUser(null);
  };

  const updateUser = async (updates) => {
    const data = await apiService.updateProfile(updates);
    setUser(data.user);
    return data;
  };

  return { user, loading, login, signup, logout, updateUser };
};

export const useDonations = (filters = {}) => {
  const { apiService } = useServices();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDonations(filters);
      setDonations(data.donations);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [JSON.stringify(filters)]);

  const createDonation = async (donationData) => {
    const data = await apiService.createDonation(donationData);
    setDonations(prev => [data.donation, ...prev]);
    return data;
  };

  const claimDonation = async (donationId, claimData) => {
    const data = await apiService.claimDonation(donationId, claimData);
    // Update local state
    setDonations(prev => 
      prev.map(donation => 
        donation._id === donationId 
          ? { ...donation, status: 'claimed', claimedBy: data.claim.claimant }
          : donation
      )
    );
    return data;
  };

  return {
    donations,
    loading,
    error,
    refetch: fetchDonations,
    createDonation,
    claimDonation
  };
};

export const useRealTimeUpdates = () => {
  const { socketService } = useServices();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNewDonation = (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'new_donation',
        message: data.message,
        data: data.donation,
        timestamp: new Date()
      }]);
    };

    const handleDonationClaimed = (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'donation_claimed',
        message: data.message,
        data: data.donation,
        timestamp: new Date()
      }]);
    };

    const handleStatusUpdate = (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'status_update',
        message: data.message,
        data: data.donation,
        timestamp: new Date()
      }]);
    };

    socketService.on('new_donation', handleNewDonation);
    socketService.on('donation_claimed', handleDonationClaimed);
    socketService.on('donation_status_updated', handleStatusUpdate);

    return () => {
      socketService.off('new_donation', handleNewDonation);
      socketService.off('donation_claimed', handleDonationClaimed);
      socketService.off('donation_status_updated', handleStatusUpdate);
    };
  }, [socketService]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return { notifications, clearNotifications };
};

// =============================================================================
// USAGE EXAMPLES IN REACT COMPONENTS
// =============================================================================

// Example: Donations List Component
export const DonationsList = () => {
  const { donations, loading, claimDonation } = useDonations({
    status: 'available',
    category: 'food',
    limit: 20
  });
  const { notifications } = useRealTimeUpdates();

  const handleClaim = async (donationId) => {
    try {
      await claimDonation(donationId, {
        reason: 'Needed for community kitchen'
      });
      alert('Donation claimed successfully!');
    } catch (error) {
      alert('Error claiming donation: ' + error.message);
    }
  };

  if (loading) return <div>Loading donations...</div>;

  return (
    <div>
      <h2>Available Donations</h2>
      
      {/* Real-time notifications */}
      {notifications.map(notification => (
        <div key={notification.id} className="notification">
          {notification.message}
        </div>
      ))}

      {/* Donations list */}
      {donations.map(donation => (
        <div key={donation._id} className="donation-card">
          <h3>{donation.name}</h3>
          <p>Quantity: {donation.quantity} {donation.unit}</p>
          <p>Location: {donation.location.address}</p>
          <p>Expires: {new Date(donation.expiryDate).toLocaleDateString()}</p>
          
          <button onClick={() => handleClaim(donation._id)}>
            Claim Donation
          </button>
        </div>
      ))}
    </div>
  );
};

// Example: Create Donation Component
export const CreateDonation = () => {
  const { apiService } = useServices();
  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    quantity: 1,
    unit: 'kg',
    expiryDate: '',
    location: {
      address: '',
      coordinates: { lat: 0, lng: 0 }
    },
    pickupWindow: {
      start: '',
      end: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createDonation(formData);
      alert('Donation created successfully!');
      // Reset form or redirect
    } catch (error) {
      alert('Error creating donation: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Item name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <select
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
      >
        <option value="food">Food</option>
        <option value="medicine">Medicine</option>
        <option value="other">Other</option>
      </select>

      <input
        type="number"
        placeholder="Quantity"
        value={formData.quantity}
        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
        required
      />

      <input
        type="text"
        placeholder="Unit (kg, pieces, etc.)"
        value={formData.unit}
        onChange={(e) => setFormData({...formData, unit: e.target.value})}
        required
      />

      <input
        type="date"
        value={formData.expiryDate}
        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
        required
      />

      <textarea
        placeholder="Pickup address"
        value={formData.location.address}
        onChange={(e) => setFormData({
          ...formData, 
          location: {...formData.location, address: e.target.value}
        })}
        required
      />

      <button type="submit">Create Donation</button>
    </form>
  );
};

export { apiService, socketService };