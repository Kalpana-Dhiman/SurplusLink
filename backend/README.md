# SurplusLink Backend API

A Node.js + Express backend with real-time WebSocket support for the SurplusLink food and medicine surplus redistribution platform.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Real-time Updates** - WebSocket integration using Socket.IO
- **RESTful API** - Complete CRUD operations for donations and claims
- **Database Integration** - MongoDB with Mongoose ODM
- **Security** - Helmet, CORS, rate limiting, input validation
- **Geolocation** - Location-based donation discovery
- **File Upload Support** - Base64 image handling
- **Automated Cleanup** - Scheduled cleanup of expired items

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🛠️ Installation

1. **Clone and setup**
```bash
cd backend
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/surpluslink
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=https://surplus-link.vercel.app
```

3. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Donations
- `POST /api/donations` - Create donation (Donors only)
- `GET /api/donations` - List donations with filters
- `GET /api/donations/:id` - Get single donation
- `PATCH /api/donations/:id` - Update donation status
- `DELETE /api/donations/:id` - Delete donation
- `GET /api/donations/user/my-donations` - Get user's donations

### Claims
- `POST /api/claims` - Claim a donation (NGO/Volunteer only)
- `POST /api/claims/:id/confirm` - Confirm pickup with OTP
- `POST /api/claims/:id/collect` - Mark as collected
- `GET /api/claims/user/my-claims` - Get user's claims
- `DELETE /api/claims/:id` - Cancel claim

### Users
- `GET /api/users/stats` - Platform statistics
- `GET /api/users/leaderboard` - Top donors and NGOs
- `GET /api/users/profile/:id` - Public user profile
- `GET /api/users/nearby` - Find nearby users
- `GET /api/users/dashboard` - User dashboard data

## 🔌 WebSocket Events

### Client → Server
- `join_donation_room` - Join donation-specific room
- `leave_donation_room` - Leave donation-specific room

### Server → Client
- `new_donation` - New donation created
- `donation_claimed` - Donation was claimed
- `donation_status_updated` - Donation status changed
- `pickup_confirmed` - Pickup confirmed with OTP
- `donation_collected` - Item successfully collected
- `claim_cancelled` - Claim was cancelled

## 🌐 Frontend Integration

### API Client Setup
```javascript
// API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Set auth token
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};
```

### WebSocket Client Setup
```javascript
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    this.socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen to real-time events
    this.socket.on('new_donation', (data) => {
      console.log('New donation:', data);
      // Update UI with new donation
    });

    this.socket.on('donation_claimed', (data) => {
      console.log('Donation claimed:', data);
      // Update UI - remove from available list
    });

    this.socket.on('donation_status_updated', (data) => {
      console.log('Status updated:', data);
      // Update donation status in UI
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinDonationRoom(donationId) {
    if (this.socket) {
      this.socket.emit('join_donation_room', donationId);
    }
  }
}

export default new SocketService();
```

### Usage Examples

#### Fetch Donations
```javascript
const fetchDonations = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const data = await apiRequest(`/donations?${queryParams}`);
    return data.donations;
  } catch (error) {
    console.error('Error fetching donations:', error);
    throw error;
  }
};

// Usage
const donations = await fetchDonations({
  status: 'available',
  category: 'food',
  lat: 19.0760,
  lng: 72.8777,
  radius: 25
});
```

#### Create Donation
```javascript
const createDonation = async (donationData) => {
  try {
    const data = await apiRequest('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData)
    });
    return data.donation;
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};
```

#### Claim Donation
```javascript
const claimDonation = async (donationId, claimData) => {
  try {
    const data = await apiRequest('/claims', {
      method: 'POST',
      body: JSON.stringify({
        donationId,
        ...claimData
      })
    });
    return data.claim;
  } catch (error) {
    console.error('Error claiming donation:', error);
    throw error;
  }
};
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Different permissions for donors, NGOs, volunteers
- **Input Validation** - Express-validator for request validation
- **Rate Limiting** - Prevent API abuse
- **CORS Configuration** - Secure cross-origin requests
- **Helmet Security** - Security headers
- **Password Hashing** - bcryptjs for secure password storage

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['donor', 'ngo', 'volunteer'],
  phone: String,
  location: {
    address: String,
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  avatar: String,
  donationIntegrityScore: Number,
  stats: {
    itemsDonated: Number,
    itemsClaimed: Number,
    totalValueSaved: Number
  }
}
```

### Donation Model
```javascript
{
  donor: ObjectId (ref: User),
  name: String,
  category: ['food', 'medicine', 'other'],
  quantity: Number,
  unit: String,
  location: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  expiryDate: Date,
  pickupWindow: { start: Date, end: Date },
  status: ['available', 'claimed', 'collected', 'expired'],
  claimedBy: ObjectId (ref: User),
  otp: String,
  estimatedValue: Number
}
```

### Claim Model
```javascript
{
  donation: ObjectId (ref: Donation),
  claimant: ObjectId (ref: User),
  status: ['pending', 'confirmed', 'collected', 'expired'],
  otp: String,
  expiresAt: Date,
  feedback: {
    rating: Number,
    comment: String
  }
}
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/surpluslink
JWT_SECRET=your-production-jwt-secret
PORT=5000
FRONTEND_URL=https://surplus-link.vercel.app
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Monitoring & Logging

The API includes:
- Health check endpoint (`/health`)
- Error handling middleware
- Request logging
- Performance monitoring ready

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.