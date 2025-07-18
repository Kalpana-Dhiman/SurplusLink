import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Package, User, Gift, Search } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const RecentActivity: React.FC = () => {
  const { items, claimItem } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Show recent available items (excluding user's own items)
  const recentItems = items
    .filter(item => item.status === 'available' && item.donor.id !== user?.id)
    .slice(0, 3);

  const handleClaimItem = (itemId: string) => {
    claimItem(itemId);
  };

  if (recentItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Recent Activity</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No items available yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to make a difference! Start by donating surplus items or check back later for new donations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/donate')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Gift className="w-5 h-5" />
                <span>Donate Items</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/discover')}
                className="px-6 py-3 border border-green-500 text-green-600 dark:text-green-400 rounded-lg font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Discover Items</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Recent Activity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="relative">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.name}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
                    <span>Expires {formatDistanceToNow(item.expiryDate, { addSuffix: true })}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>by {item.donor.name}</span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleClaimItem(item.id)}
                  className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Claim Item
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/discover')}
            className="px-8 py-3 border border-green-500 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
          >
            View All Available Items
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default RecentActivity;