const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: [true, 'Donation is required']
  },
  claimant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Claimant is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'collected', 'expired', 'cancelled'],
    default: 'pending'
  },
  otp: {
    type: String,
    required: true
  },
  claimedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  collectedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    }
  },
  // Reason for claiming (optional)
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  // Contact information for coordination
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    alternateContact: {
      type: String,
      trim: true
    }
  },
  // Feedback after collection
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Feedback comment cannot exceed 500 characters']
    },
    wouldRecommend: {
      type: Boolean,
      default: true
    }
  },
  // Proof of collection (images)
  proofImages: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v) || /^data:image\/.+;base64,/.test(v);
      },
      message: 'Invalid image URL or base64 format'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
claimSchema.index({ donation: 1, claimant: 1 }, { unique: true });
claimSchema.index({ claimant: 1, createdAt: -1 });
claimSchema.index({ status: 1, expiresAt: 1 });

// Virtual for time remaining
claimSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return Math.max(0, Math.floor(remaining / (1000 * 60))); // minutes remaining
});

// Virtual for claim duration
claimSchema.virtual('claimDuration').get(function() {
  if (!this.collectedAt) return null;
  return Math.floor((this.collectedAt - this.claimedAt) / (1000 * 60)); // minutes
});

// Method to check if claim is expired
claimSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt && this.status === 'pending';
};

// Method to extend expiry time
claimSchema.methods.extendExpiry = function(minutes = 15) {
  this.expiresAt = new Date(this.expiresAt.getTime() + minutes * 60 * 1000);
  return this.save();
};

// Pre-save middleware to auto-expire claims
claimSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

// Static method to cleanup expired claims
claimSchema.statics.cleanupExpired = async function() {
  const expiredClaims = await this.find({
    status: 'pending',
    expiresAt: { $lt: new Date() }
  });

  for (const claim of expiredClaims) {
    claim.status = 'expired';
    await claim.save();
    
    // Update donation status back to available
    const Donation = mongoose.model('Donation');
    await Donation.findByIdAndUpdate(claim.donation, {
      status: 'available',
      claimedBy: null,
      claimedAt: null,
      otp: null
    });
  }

  return expiredClaims.length;
};

module.exports = mongoose.model('Claim', claimSchema);