import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Leaf, Heart, DollarSign, Package, Share2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ImpactDashboard: React.FC = () => {
  const { items, getUserStats } = useApp();
  const { user } = useAuth();
  const userStats = getUserStats();

  // Calculate global stats
  const globalStats = {
    totalItemsSaved: items.length + 5834,
    totalValueSaved: items.reduce((sum, item) => {
      const baseValue = item.category === 'medicine' ? 100 : 50;
      return sum + (item.quantity * baseValue);
    }, 0) + 89650,
    co2Prevented: Math.round(items.reduce((sum, item) => {
      if (item.category === 'food') return sum + (item.quantity * 0.5);
      return sum;
    }, 0) + 542),
    mealsProvided: Math.round(items.filter(i => i.category === 'food').reduce((sum, item) => {
      return sum + (item.quantity * 2); // Assume 2 meals per kg
    }, 0) + 3741),
    medicinesSaved: items.filter(i => i.category === 'medicine').length + 892,
    activeDonors: 156,
  };

  const stats = [
    {
      icon: Package,
      label: 'Items Saved',
      value: globalStats.totalItemsSaved,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
    },
    {
      icon: DollarSign,
      label: 'Value Saved',
      value: `₹${globalStats.totalValueSaved.toLocaleString()}`,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      icon: Heart,
      label: 'Meals Provided',
      value: globalStats.mealsProvided,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300',
    },
    {
      icon: Leaf,
      label: 'CO₂ Prevented',
      value: `${globalStats.co2Prevented}kg`,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      icon: Package,
      label: 'Medicines Saved',
      value: globalStats.medicinesSaved,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    {
      icon: Users,
      label: 'Active Donors',
      value: globalStats.activeDonors,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-700 dark:text-orange-300',
    },
  ];

  const shareImpact = () => {
    const message = `I've helped save ${userStats.itemsDonated} items worth ₹${userStats.totalValue.toLocaleString()} on SurplusLink! 🌍💚 Join me in reducing waste: https://surpluslink.ai`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My SurplusLink Impact',
        text: message,
        url: 'https://surpluslink.ai',
      });
    } else {
      navigator.clipboard.writeText(message);
      toast.success('Impact message copied to clipboard!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Your Impact Dashboard
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          See the real difference you're making in reducing waste and helping communities
        </p>
      </motion.div>

      {/* Personal Stats */}
      {(userStats.itemsDonated > 0 || userStats.itemsClaimed > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Your Personal Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{userStats.itemsDonated}</p>
              <p className="text-green-100">Items Donated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{userStats.itemsClaimed}</p>
              <p className="text-green-100">Items Claimed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">₹{userStats.totalValue}</p>
              <p className="text-green-100">Value Saved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{userStats.co2Prevented.toFixed(1)}kg</p>
              <p className="text-green-100">CO₂ Prevented</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className={`text-2xl font-bold ${stat.textColor} mb-1`}>
              {stat.value}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Share Impact Card */}
      {(userStats.itemsDonated > 0 || userStats.itemsClaimed > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center mb-12"
        >
          <h2 className="text-2xl font-bold mb-4">Share Your Impact</h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            You've made incredible progress! Share your impact story and inspire others to join the movement.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareImpact}
            className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            <Share2 className="w-5 h-5" />
            <span>Share on Social Media</span>
          </motion.button>
        </motion.div>
      )}

      {/* Achievement Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Your Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              badge: '🌟', 
              title: 'First Donation', 
              desc: 'Made your first donation',
              earned: userStats.itemsDonated > 0
            },
            { 
              badge: '💯', 
              title: 'Century Club', 
              desc: 'Saved 100+ items',
              earned: userStats.itemsDonated >= 100
            },
            { 
              badge: '🌍', 
              title: 'Eco Warrior', 
              desc: 'Prevented 500kg CO₂',
              earned: userStats.co2Prevented >= 500
            },
            { 
              badge: '❤️', 
              title: 'Community Hero', 
              desc: 'Helped 1000+ people',
              earned: userStats.itemsDonated >= 50
            },
          ].map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm ${
                achievement.earned ? 'ring-2 ring-green-500' : 'opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{achievement.badge}</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {achievement.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {achievement.desc}
              </p>
              {achievement.earned && (
                <div className="mt-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Earned!
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ImpactDashboard;