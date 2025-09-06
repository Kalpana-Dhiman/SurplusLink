const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/donations
// @desc    Create a new donation
// @access  Private (Donors only)
router.post('/', authenticate, authorize('donor'), [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Item name must be between 2 and 200 characters'),
  body('category').isIn(['food', 'medicine', 'other']).withMessage('Invalid category'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('unit').trim().isLength({ min: 1, max: 50 }).withMessage('Unit is required and must be less than 50 characters'),
  body('expiryDate').isISO8601().withMessage('Invalid expiry date format'),
  body('location.address').trim().isLength({ min: 5 }).withMessage('Address is required'),
  body('location.coordinates.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.coordinates.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('pickupWindow.start').isISO8601().withMessage('Invalid pickup start time'),
  body('pickupWindow.end').isISO8601().withMessage('Invalid pickup end time')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const donationData = {
      ...req.body,
      donor: req.user._id
    };

    // Validate dates
    const expiryDate = new Date(req.body.expiryDate);
    const pickupStart = new Date(req.body.pickupWindow.start);
    const pickupEnd = new Date(req.body.pickupWindow.end);
    const now = new Date();

    if (expiryDate <= now) {
      return res.status(400).json({ message: 'Expiry date must be in the future' });
    }

    if (pickupStart <= now) {
      return res.status(400).json({ message: 'Pickup start time must be in the future' });
    }

    if (pickupEnd <= pickupStart) {
      return res.status(400).json({ message: 'Pickup end time must be after start time' });
    }

    const donation = new Donation(donationData);
    await donation.save();
    await donation.populate('donor', 'name donationIntegrityScore avatar');

    // Update donor stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 
        'stats.itemsDonated': 1,
        'stats.totalValueSaved': donation.estimatedValue
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('new_donation', {
      donation: donation.toObject(),
      message: `New ${donation.category} donation available: ${donation.name}`
    });

    // Emit to location-based room
    if (donation.location.city) {
      io.to(`location_${donation.location.city}`).emit('nearby_donation', {
        donation: donation.toObject(),
        message: `New donation available nearby: ${donation.name}`
      });
    }

    res.status(201).json({
      message: 'Donation created successfully',
      donation
    });

  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ message: 'Server error during donation creation' });
  }
});

// @route   GET /api/donations
// @desc    Get all donations with filters
// @access  Public (with optional auth for personalization)
router.get('/', optionalAuth, [
  query('status').optional().isIn(['available', 'claimed', 'collected', 'expired']).withMessage('Invalid status'),
  query('category').optional().isIn(['food', 'medicine', 'other']).withMessage('Invalid category'),
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius').optional().isInt({ min: 1, max: 100 }).withMessage('Radius must be between 1 and 100 km'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      status = 'available',
      category,
      lat,
      lng,
      radius = 25,
      limit = 20,
      page = 1,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { status };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Exclude user's own donations if authenticated
    if (req.user) {
      query.donor = { $ne: req.user._id };
    }

    let donations;

    // Location-based query
    if (lat && lng) {
      const radiusInMeters = radius * 1000;
      donations = await Donation.find({
        ...query,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: radiusInMeters
          }
        }
      })
      .populate('donor', 'name donationIntegrityScore avatar')
      .populate('claimedBy', 'name avatar')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
    } else {
      donations = await Donation.find(query)
        .populate('donor', 'name donationIntegrityScore avatar')
        .populate('claimedBy', 'name avatar')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
    }

    // Get total count for pagination
    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ message: 'Server error while fetching donations' });
  }
});

// @route   GET /api/donations/:id
// @desc    Get single donation by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name donationIntegrityScore avatar phone location')
      .populate('claimedBy', 'name avatar phone');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json({ donation });

  } catch (error) {
    console.error('Get donation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid donation ID' });
    }
    res.status(500).json({ message: 'Server error while fetching donation' });
  }
});

// @route   PATCH /api/donations/:id
// @desc    Update donation status
// @access  Private (Donor or Admin)
router.patch('/:id', authenticate, [
  body('status').optional().isIn(['available', 'claimed', 'collected', 'expired', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if user is the donor
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update your own donations.' });
    }

    const allowedUpdates = ['status', 'description', 'pickupWindow'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle status-specific updates
    if (req.body.status === 'collected') {
      updates.collectedAt = new Date();
    }

    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('donor', 'name donationIntegrityScore avatar')
     .populate('claimedBy', 'name avatar');

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('donation_status_updated', {
      donation: updatedDonation.toObject(),
      message: `Donation status updated: ${updatedDonation.name} is now ${updatedDonation.status}`
    });

    // Notify claimant if donation is collected
    if (req.body.status === 'collected' && updatedDonation.claimedBy) {
      io.to(`user_${updatedDonation.claimedBy._id}`).emit('donation_collected', {
        donation: updatedDonation.toObject(),
        message: `Donation collected: ${updatedDonation.name}`
      });
    }

    res.json({
      message: 'Donation updated successfully',
      donation: updatedDonation
    });

  } catch (error) {
    console.error('Update donation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid donation ID' });
    }
    res.status(500).json({ message: 'Server error during donation update' });
  }
});

// @route   DELETE /api/donations/:id
// @desc    Delete donation
// @access  Private (Donor only)
router.delete('/:id', authenticate, authorize('donor'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if user is the donor
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own donations.' });
    }

    // Don't allow deletion if already claimed
    if (donation.status === 'claimed') {
      return res.status(400).json({ message: 'Cannot delete claimed donation' });
    }

    await Donation.findByIdAndDelete(req.params.id);

    // Update donor stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 
        'stats.itemsDonated': -1,
        'stats.totalValueSaved': -donation.estimatedValue
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('donation_deleted', {
      donationId: req.params.id,
      message: `Donation removed: ${donation.name}`
    });

    res.json({ message: 'Donation deleted successfully' });

  } catch (error) {
    console.error('Delete donation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid donation ID' });
    }
    res.status(500).json({ message: 'Server error during donation deletion' });
  }
});

// @route   GET /api/donations/user/my-donations
// @desc    Get current user's donations
// @access  Private
router.get('/user/my-donations', authenticate, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query = { donor: req.user._id };
    if (status) {
      query.status = status;
    }

    const donations = await Donation.find(query)
      .populate('claimedBy', 'name avatar phone')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ message: 'Server error while fetching your donations' });
  }
});

module.exports = router;