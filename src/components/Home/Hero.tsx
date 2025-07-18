import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Heart, Leaf, Gift, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const { user } = useAuth();
  const { items, getUserStats } = useApp();
  const navigate = useNavigate();
  const userStats = getUserStats();

  const totalStats = {
    activeUsers: 1247,
    itemsSaved: items.length + 5834,
    co2Prevented: Math.round(items.reduce((sum, item) => {
      if (item.category === 'food') return sum + (item.quantity * 0.5);
      return sum;
    }, 0) + 2400) / 100,
  };

  const stats = [
    { icon: Users, value: `${totalStats.activeUsers}+`, label: 'Active Users' },
    { icon: Heart, value: `${totalStats.itemsSaved}+`, label: 'Items Saved' },
    { icon: Leaf, value: `${totalStats.co2Prevented}T+`, label: 'CO₂ Prevented' },
  ];

  const handlePrimaryAction = () => {
    if (user?.role === 'donor') {
      navigate('/donate');
    } else {
      navigate('/discover');
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-green-900/20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                {user?.name?.split(' ')[0] || 'Friend'}
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Your contributions are making a real difference. Together, we're reducing waste and feeding communities.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrimaryAction}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {user?.role === 'donor' ? <Gift className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              <span>{user?.role === 'donor' ? 'Donate Items' : 'Find Items'}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/impact')}
              className="px-8 py-3 border border-green-500 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
            >
              View Impact
            </motion.button>
          </motion.div>

          {/* User Personal Stats */}
          {(userStats.itemsDonated > 0 || userStats.itemsClaimed > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl max-w-2xl mx-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Personal Impact</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{userStats.itemsDonated}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Items Donated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{userStats.itemsClaimed}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Items Claimed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">₹{userStats.totalValue}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Value Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{userStats.co2Prevented.toFixed(1)}kg</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CO₂ Prevented</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;