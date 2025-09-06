const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Claim = require('../models/Claim');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/stats
// @desc    Get platform statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonations,
      totalClaims,
      activeDonors,
      activeNGOs,
      totalValueSaved,
      itemsSaved
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Donation.countDocuments(),
      Claim.countDocuments({ status: 'collected' }),
      User.countDocuments({ role: 'donor', isActive: true }),
      User.countDocuments({ role: 'ngo', isActive: true }),
      Donation.aggregate([
        { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
      ]),
      Donation.countDocuments({ status: { $in: ['claimed', 'collected'] } })
    ]);

    // Calculate CO2 prevented (0.5kg per food item)
    const foodDonations = await Donation.find({ 
      category: 'food', 
      status: { $in: ['claimed', 'collected'] } 
    });
    
    const co2Prevented = foodDonations.reduce((sum, donation) => {
      return sum + (donation.quantity * 0.5);
    }, 0);

    // Calculate meals provided (2 meals per kg of food)
    const mealsProvided = foodDonations.reduce((sum, donation) => {
      return sum + (donation.quantity * 2);
    }, 0);

    const stats = {
      totalUsers,
      totalDonations,
      totalClaims,
      activeDonors,
      activeNGOs,
      totalValueSaved: totalValueSaved[0]?.total || 0,
      itemsSaved,
      co2Prevented: Math.round(co2Prevented),
      mealsProvided: Math.round(mealsProvided),
      medicinesSaved: await Donation.countDocuments({ 
        category: 'medicine', 
        status: { $in: ['claimed', 'collected'] } 
      })
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get top donors and NGOs
// @access  Public
router.get('/leaderboard', [
  query('type').optional().isIn(['donors', 'ngos', 'all']).withMessage('Invalid leaderboard type'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type = 'all', limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    let topDonors = [];
    let topNGOs = [];

    if (type === 'donors' || type === 'all') {
      topDonors = await User.find({ 
        role: 'donor', 
        isActive: true,
        'stats.itemsDonated': { $gt: 0 }
      })
      .select('name avatar donationIntegrityScore stats.itemsDonated stats.totalValueSaved')
      .sort({ 'stats.itemsDonated': -1, 'stats.totalValueSaved': -1 })
      .limit(limitNum);
    }

    if (type === 'ngos' || type === 'all') {
      topNGOs = await User.find({ 
        role: 'ngo', 
        isActive: true,
        'stats.itemsClaimed': { $gt: 0 }
      })
      .select('name organizationName avatar stats.itemsClaimed')
      .sort({ 'stats.itemsClaimed': -1 })
      .limit(limitNum);
    }

    res.json({
      leaderboard: {
        topDonors,
        topNGOs
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error while fetching leaderboard' });
  }
});

// @route   GET /api/users/profile/:id
// @desc    Get user public profile
// @access  Public
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name organizationName avatar donationIntegrityScore role stats createdAt location.city');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(404).json({ message: 'User profile not available' });
    }

    // Get recent donations if donor
    let recentDonations = [];
    if (user.role === 'donor') {
      recentDonations = await Donation.find({ 
        donor: user._id,
        status: { $in: ['available', 'claimed', 'collected'] }
      })
      .select('name category quantity unit status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    }

    // Get recent claims if NGO/volunteer
    let recentClaims = [];
    if (user.role === 'ngo' || user.role === 'volunteer') {
      recentClaims = await Claim.find({ 
        claimant: user._id,
        status: { $in: ['confirmed', 'collected'] }
      })
      .populate('donation', 'name category quantity unit')
      .select('donation status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    }

    res.json({
      user: user.getPublicProfile(),
      recentDonations,
      recentClaims
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

// @route   GET /api/users/nearby
// @desc    Get nearby users (for networking)
// @access  Private
router.get('/nearby', authenticate, [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius').optional().isInt({ min: 1, max: 100 }).withMessage('Radius must be between 1 and 100 km'),
  query('role').optional().isIn(['donor', 'ngo', 'volunteer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { lat, lng, radius = 25, role } = req.query;
    const radiusInMeters = radius * 1000;

    let query = {
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      }
    };

    if (role) {
      query.role = role;
    }

    const nearbyUsers = await User.find(query)
      .select('name organizationName avatar role donationIntegrityScore stats location.city')
      .limit(20);

    res.json({ users: nearbyUsers });

  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ message: 'Server error while fetching nearby users' });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Common data for all users
    const [userStats, recentNotifications] = await Promise.all([
      User.findById(userId).select('stats'),
      // You can implement notifications model later
      Promise.resolve([])
    ]);

    let dashboardData = {
      user: req.user.getPublicProfile(),
      stats: userStats.stats,
      notifications: recentNotifications
    };

    // Role-specific data
    if (userRole === 'donor') {
      const [recentDonations, activeDonations, totalImpact] = await Promise.all([
        Donation.find({ donor: userId })
          .populate('claimedBy', 'name organizationName avatar')
          .sort({ createdAt: -1 })
          .limit(5),
        Donation.countDocuments({ donor: userId, status: 'available' }),
        Donation.aggregate([
          { $match: { donor: userId } },
          { $group: { _id: null, totalValue: { $sum: '$estimatedValue' } } }
        ])
      ]);

      dashboardData.donorData = {
        recentDonations,
        activeDonations,
        totalImpact: totalImpact[0]?.totalValue || 0
      };
    }

    if (userRole === 'ngo' || userRole === 'volunteer') {
      const [recentClaims, activeClaims, nearbyDonations] = await Promise.all([
        Claim.find({ claimant: userId })
          .populate('donation', 'name category quantity unit location')
          .sort({ createdAt: -1 })
          .limit(5),
        Claim.countDocuments({ claimant: userId, status: { $in: ['pending', 'confirmed'] } }),
        req.user.location?.coordinates ? 
          Donation.findNearby(
            req.user.location.coordinates.lat, 
            req.user.location.coordinates.lng, 
            25000
          ).limit(5) : 
          []
      ]);

      dashboardData.claimantData = {
        recentClaims,
        activeClaims,
        nearbyDonations
      };
    }

    res.json(dashboardData);

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

module.exports = router;