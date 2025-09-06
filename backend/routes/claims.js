const express = require('express');
const { body, validationResult } = require('express-validator');
const Claim = require('../models/Claim');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/claims
// @desc    Claim a donation
// @access  Private (NGO and Volunteer only)
router.post('/', authenticate, authorize('ngo', 'volunteer'), [
  body('donationId').isMongoId().withMessage('Invalid donation ID'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long'),
  body('contactInfo.phone').optional().isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { donationId, reason, contactInfo } = req.body;

    // Check if donation exists and is available
    const donation = await Donation.findById(donationId).populate('donor', 'name avatar');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Donation is not available for claiming' });
    }

    // Check if donation is expired
    if (donation.isExpired()) {
      await Donation.findByIdAndUpdate(donationId, { status: 'expired' });
      return res.status(400).json({ message: 'Donation has expired' });
    }

    // Check if user already claimed this donation
    const existingClaim = await Claim.findOne({ 
      donation: donationId, 
      claimant: req.user._id 
    });

    if (existingClaim) {
      return res.status(400).json({ message: 'You have already claimed this donation' });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create claim
    const claim = new Claim({
      donation: donationId,
      claimant: req.user._id,
      otp,
      reason,
      contactInfo
    });

    await claim.save();
    await claim.populate('claimant', 'name avatar phone organizationName');

    // Update donation status
    await Donation.findByIdAndUpdate(donationId, {
      status: 'claimed',
      claimedBy: req.user._id,
      claimedAt: new Date(),
      otp
    });

    // Update claimant stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.itemsClaimed': 1 }
    });

    // Emit real-time events
    const io = req.app.get('io');
    
    // Notify donor
    io.to(`user_${donation.donor._id}`).emit('donation_claimed', {
      donation: donation.toObject(),
      claim: claim.toObject(),
      message: `Your donation "${donation.name}" has been claimed by ${req.user.organizationName || req.user.name}`
    });

    // Notify claimant
    io.to(`user_${req.user._id}`).emit('claim_created', {
      claim: claim.toObject(),
      otp,
      message: `You have successfully claimed "${donation.name}". Your OTP is: ${otp}`
    });

    // Broadcast to all users
    io.emit('donation_status_updated', {
      donation: { ...donation.toObject(), status: 'claimed', claimedBy: req.user },
      message: `Donation claimed: ${donation.name}`
    });

    res.status(201).json({
      message: 'Donation claimed successfully',
      claim,
      otp,
      expiresIn: '15 minutes'
    });

  } catch (error) {
    console.error('Claim donation error:', error);
    res.status(500).json({ message: 'Server error during claim creation' });
  }
});

// @route   POST /api/claims/:id/confirm
// @desc    Confirm pickup with OTP
// @access  Private (Donor only)
router.post('/:id/confirm', authenticate, [
  body('otp').isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { otp } = req.body;

    const claim = await Claim.findById(req.params.id)
      .populate('donation')
      .populate('claimant', 'name avatar organizationName');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Check if user is the donor
    if (claim.donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only the donor can confirm pickup.' });
    }

    // Check if claim is still pending
    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'Claim is not in pending status' });
    }

    // Check if claim is expired
    if (claim.isExpired()) {
      claim.status = 'expired';
      await claim.save();
      
      // Reset donation status
      await Donation.findByIdAndUpdate(claim.donation._id, {
        status: 'available',
        claimedBy: null,
        claimedAt: null,
        otp: null
      });

      return res.status(400).json({ message: 'Claim has expired' });
    }

    // Verify OTP
    if (claim.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Confirm claim
    claim.status = 'confirmed';
    claim.confirmedAt = new Date();
    await claim.save();

    // Emit real-time events
    const io = req.app.get('io');
    
    // Notify claimant
    io.to(`user_${claim.claimant._id}`).emit('pickup_confirmed', {
      claim: claim.toObject(),
      message: `Pickup confirmed for "${claim.donation.name}". Please proceed to collect the item.`
    });

    // Notify donor
    io.to(`user_${req.user._id}`).emit('pickup_confirmed', {
      claim: claim.toObject(),
      message: `Pickup confirmed for "${claim.donation.name}"`
    });

    res.json({
      message: 'Pickup confirmed successfully',
      claim
    });

  } catch (error) {
    console.error('Confirm pickup error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }
    res.status(500).json({ message: 'Server error during pickup confirmation' });
  }
});

// @route   POST /api/claims/:id/collect
// @desc    Mark item as collected
// @access  Private (Claimant only)
router.post('/:id/collect', authenticate, [
  body('feedback.rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback.comment').optional().trim().isLength({ max: 500 }).withMessage('Comment too long'),
  body('proofImages').optional().isArray().withMessage('Proof images must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { feedback, proofImages } = req.body;

    const claim = await Claim.findById(req.params.id)
      .populate('donation')
      .populate('claimant', 'name avatar');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Check if user is the claimant
    if (claim.claimant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only the claimant can mark as collected.' });
    }

    // Check if claim is confirmed
    if (claim.status !== 'confirmed') {
      return res.status(400).json({ message: 'Claim must be confirmed before collection' });
    }

    // Update claim
    claim.status = 'collected';
    claim.collectedAt = new Date();
    if (feedback) claim.feedback = feedback;
    if (proofImages) claim.proofImages = proofImages;
    await claim.save();

    // Update donation status
    await Donation.findByIdAndUpdate(claim.donation._id, {
      status: 'collected',
      collectedAt: new Date()
    });

    // Update donor's integrity score based on feedback
    if (feedback && feedback.rating) {
      const donor = await User.findById(claim.donation.donor);
      const newScore = ((donor.donationIntegrityScore * 10) + feedback.rating) / 11;
      donor.donationIntegrityScore = Math.round(newScore * 10) / 10;
      await donor.save();
    }

    // Emit real-time events
    const io = req.app.get('io');
    
    // Notify donor
    io.to(`user_${claim.donation.donor}`).emit('donation_collected', {
      claim: claim.toObject(),
      message: `Your donation "${claim.donation.name}" has been successfully collected!`
    });

    // Broadcast completion
    io.emit('donation_status_updated', {
      donation: { ...claim.donation.toObject(), status: 'collected' },
      message: `Donation completed: ${claim.donation.name}`
    });

    res.json({
      message: 'Item marked as collected successfully',
      claim
    });

  } catch (error) {
    console.error('Collect item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }
    res.status(500).json({ message: 'Server error during collection' });
  }
});

// @route   GET /api/claims/user/my-claims
// @desc    Get current user's claims
// @access  Private
router.get('/user/my-claims', authenticate, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query = { claimant: req.user._id };
    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate('donation', 'name category quantity unit location images expiryDate')
      .populate('donation.donor', 'name avatar donationIntegrityScore')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Claim.countDocuments(query);

    res.json({
      claims,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user claims error:', error);
    res.status(500).json({ message: 'Server error while fetching your claims' });
  }
});

// @route   DELETE /api/claims/:id
// @desc    Cancel a claim
// @access  Private (Claimant only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('donation');
    
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Check if user is the claimant
    if (claim.claimant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only cancel your own claims.' });
    }

    // Don't allow cancellation if already collected
    if (claim.status === 'collected') {
      return res.status(400).json({ message: 'Cannot cancel collected claim' });
    }

    // Update claim status
    claim.status = 'cancelled';
    await claim.save();

    // Reset donation status to available
    await Donation.findByIdAndUpdate(claim.donation._id, {
      status: 'available',
      claimedBy: null,
      claimedAt: null,
      otp: null
    });

    // Update claimant stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.itemsClaimed': -1 }
    });

    // Emit real-time events
    const io = req.app.get('io');
    
    // Notify donor
    io.to(`user_${claim.donation.donor}`).emit('claim_cancelled', {
      donation: claim.donation.toObject(),
      message: `Claim cancelled for "${claim.donation.name}". Item is now available again.`
    });

    // Broadcast availability
    io.emit('donation_status_updated', {
      donation: { ...claim.donation.toObject(), status: 'available', claimedBy: null },
      message: `Donation available again: ${claim.donation.name}`
    });

    res.json({ message: 'Claim cancelled successfully' });

  } catch (error) {
    console.error('Cancel claim error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid claim ID' });
    }
    res.status(500).json({ message: 'Server error during claim cancellation' });
  }
});

module.exports = router;