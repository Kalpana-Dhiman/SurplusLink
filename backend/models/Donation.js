const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donor is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: ['food', 'medicine', 'other'],
    required: [true, 'Category is required'],
    default: 'food'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [50, 'Unit cannot exceed 50 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v) || /^data:image\/.+;base64,/.test(v);
      },
      message: 'Invalid image URL or base64 format'
    }
  }],
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  pickupWindow: {
    start: {
      type: Date,
      required: [true, 'Pickup start time is required']
    },
    end: {
      type: Date,
      required: [true, 'Pickup end time is required']
    }
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'collected', 'expired', 'cancelled'],
    default: 'available'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  collectedAt: {
    type: Date,
    default: null
  },
  otp: {
    type: String,
    default: null
  },
  // Estimated value for impact calculation
  estimatedValue: {
    type: Number,
    default: 0
  },
  // Priority level (1-5, 5 being highest)
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  // Tags for better searchability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
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
    images: [{
      type: String
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
donationSchema.index({ 'location.coordinates': '2dsphere' });
donationSchema.index({ status: 1, expiryDate: 1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ category: 1, status: 1 });
donationSchema.index({ claimedBy: 1, status: 1 });

// Virtual for time until expiry
donationSchema.virtual('hoursToExpiry').get(function() {
  return Math.max(0, Math.floor((this.expiryDate - new Date()) / (1000 * 60 * 60)));
});

// Virtual for pickup window status
donationSchema.virtual('pickupStatus').get(function() {
  const now = new Date();
  if (now < this.pickupWindow.start) return 'upcoming';
  if (now > this.pickupWindow.end) return 'expired';
  return 'active';
});

// Pre-save middleware to calculate estimated value
donationSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('quantity') || this.isModified('category')) {
    const baseValues = {
      food: 50, // ₹50 per kg/unit
      medicine: 100, // ₹100 per unit
      other: 25 // ₹25 per unit
    };
    this.estimatedValue = this.quantity * (baseValues[this.category] || 25);
  }
  next();
});

// Method to generate OTP
donationSchema.methods.generateOTP = function() {
  this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  return this.otp;
};

// Method to check if donation is expired
donationSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to check if pickup window is active
donationSchema.methods.isPickupActive = function() {
  const now = new Date();
  return now >= this.pickupWindow.start && now <= this.pickupWindow.end;
};

// Static method to find nearby donations
donationSchema.statics.findNearby = function(lat, lng, maxDistance = 25000) {
  return this.find({
    status: 'available',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  }).populate('donor', 'name donationIntegrityScore avatar');
};

module.exports = mongoose.model('Donation', donationSchema);