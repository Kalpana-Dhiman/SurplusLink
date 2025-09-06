const cron = require('node-cron');
const Donation = require('../models/Donation');
const Claim = require('../models/Claim');

// Cleanup expired donations and claims
const cleanupExpiredItems = async () => {
  try {
    console.log('🧹 Running cleanup for expired items...');

    // Mark expired donations
    const expiredDonations = await Donation.updateMany(
      {
        status: 'available',
        expiryDate: { $lt: new Date() }
      },
      { status: 'expired' }
    );

    // Cleanup expired claims
    const expiredClaimsCount = await Claim.cleanupExpired();

    console.log(`✅ Cleanup completed: ${expiredDonations.modifiedCount} donations expired, ${expiredClaimsCount} claims expired`);

  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};

// Run cleanup every hour
const startCleanupScheduler = () => {
  cron.schedule('0 * * * *', cleanupExpiredItems);
  console.log('⏰ Cleanup scheduler started (runs every hour)');
};

module.exports = {
  cleanupExpiredItems,
  startCleanupScheduler
};