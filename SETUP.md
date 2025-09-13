# SurplusLink - Complete Setup Instructions

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory (project root)
npm install

# Install additional dependency for WebSocket
npm install socket.io-client

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔧 Environment Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/surpluslink
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
VITE_NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🌐 Production Deployment

### Backend (Render/Railway)
1. Create a new service on Render or Railway
2. Connect your GitHub repository
3. Set environment variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/surpluslink
   JWT_SECRET=your-production-jwt-secret
   NODE_ENV=production
   CLIENT_URL=https://surplus-link.vercel.app
   ```
4. Deploy with build command: `npm install`
5. Start command: `npm start`

### Frontend (Vercel)
1. Deploy to Vercel as usual
2. Set environment variable:
   ```
   VITE_NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   ```

## ✅ Testing the Integration

1. **Start both servers** (backend on :5000, frontend on :3000)
2. **Sign up** as a Donor
3. **Create a donation** - should appear in real-time
4. **Sign up** as NGO/Volunteer in another browser
5. **Claim the donation** - should update instantly
6. **Verify WebSocket connection** in browser console

## 🔍 Troubleshooting

### WebSocket Connection Issues
- Check CORS configuration in backend
- Verify JWT token is being sent
- Check browser console for connection errors

### API Request Failures
- Verify backend is running on correct port
- Check environment variables
- Verify MongoDB connection

### Real-time Updates Not Working
- Check WebSocket connection status
- Verify event listeners are set up
- Check browser network tab for WebSocket frames

## 📱 Features Working in Real-time

- ✅ User authentication (signup/login)
- ✅ Create donations (appears instantly for all users)
- ✅ Claim donations (updates status in real-time)
- ✅ OTP verification system
- ✅ Status updates (claimed → collected)
- ✅ Real-time notifications
- ✅ WebSocket authentication
- ✅ Cross-user updates

## 🎯 API Endpoints Available

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `POST /api/donations` - Create donation
- `GET /api/donations` - List donations
- `POST /api/claims` - Claim donation
- `POST /api/claims/:id/confirm` - Confirm pickup with OTP
- `POST /api/claims/:id/collect` - Mark as collected

## 🔌 WebSocket Events

- `new_donation` - New donation created
- `donation_claimed` - Donation was claimed
- `donation_status_updated` - Status changed
- `pickup_confirmed` - OTP verified
- `donation_collected` - Item collected

Your SurplusLink platform is now fully integrated with real-time capabilities! 🎉