import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Package, User, Star, Key, CheckCircle } from 'lucide-react';
import { Item } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const { claimItem, confirmPickup, markAsCollected } = useApp();
  const { user } = useAuth();
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const getExpiryColor = (expiryDate: Date) => {
    const hoursToExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursToExpiry < 24) return 'text-red-600';
    if (hoursToExpiry < 48) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'claimed': return 'bg-yellow-100 text-yellow-800';
      case 'collected': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClaim = () => {
    if (item.status !== 'available') {
      toast.error('This item is no longer available');
      return;
    }
    if (item.donor.id === user?.id) {
      toast.error('You cannot claim your own donation');
      return;
    }
    claimItem(item.id);
  };

  const handleOtpSubmit = () => {
    if (!otpInput) {
      toast.error('Please enter the OTP');
      return;
    }
    confirmPickup(item.id, otpInput);
    setShowOtpInput(false);
    setOtpInput('');
  };

  const handleMarkCollected = () => {
    markAsCollected(item.id);
  };

  const isUserClaim = item.claimedBy?.id === user?.id;
  const isUserDonation = item.donor.id === user?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="relative">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/90 ${
            item.category === 'food' ? 'text-green-700' :
            item.category === 'medicine' ? 'text-blue-700' :
            'text-gray-700'
          }`}>
            {item.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {item.name}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>{item.quantity} {item.unit}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{item.location.address}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span className={getExpiryColor(item.expiryDate)}>
              Expires {formatDistanceToNow(item.expiryDate, { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>by {item.donor.name}</span>
            <div className="flex items-center space-x-1 ml-2">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs">{item.donor.donationIntegrityScore}</span>
            </div>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {item.description}
          </p>
        )}

        {/* OTP Display for claimed items */}
        {item.status === 'claimed' && isUserClaim && item.otp && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Key className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Your OTP: {item.otp}
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Share this OTP with the donor during pickup
            </p>
          </div>
        )}

        {/* OTP Input for donors */}
        {showOtpInput && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Enter OTP from claimant:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOtpSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Verify
              </motion.button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          {/* Available item - can be claimed */}
          {item.status === 'available' && !isUserDonation && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClaim}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
            >
              Claim Now
            </motion.button>
          )}

          {/* User's own donation */}
          {isUserDonation && item.status === 'available' && (
            <div className="flex-1 text-center text-sm text-gray-600 dark:text-gray-400">
              Your donation - waiting for claims
            </div>
          )}

          {/* Claimed by user - show pickup info */}
          {item.status === 'claimed' && isUserClaim && (
            <div className="flex-1 text-center">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                Item claimed! Proceed to pickup location.
              </p>
            </div>
          )}

          {/* Claimed by someone else */}
          {item.status === 'claimed' && !isUserClaim && !isUserDonation && (
            <div className="flex-1 text-center text-sm text-gray-600 dark:text-gray-400">
              Claimed by {item.claimedBy?.name}
            </div>
          )}

          {/* Donor's view of claimed item */}
          {item.status === 'claimed' && isUserDonation && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowOtpInput(!showOtpInput)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Verify Pickup</span>
            </motion.button>
          )}

          {/* Collected status */}
          {item.status === 'collected' && (
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Successfully Collected</span>
              </div>
            </div>
          )}

          {/* Mark as collected button for confirmed pickups */}
          {item.status === 'claimed' && isUserClaim && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMarkCollected}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Collected</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ItemCard;