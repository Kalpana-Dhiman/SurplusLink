// API Service for SurplusLink Backend Integration
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    this.token = null;
    
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('surpluslink_token');
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('surpluslink_token', token);
      } else {
        localStorage.removeItem('surpluslink_token');
      }
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

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
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
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.request(`/donations${queryString ? `?${queryString}` : ''}`);
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
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.request(`/donations/user/my-donations${queryString ? `?${queryString}` : ''}`);
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
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.request(`/claims/user/my-claims${queryString ? `?${queryString}` : ''}`);
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

// Create singleton instance
const apiService = new ApiService();
export default apiService;
