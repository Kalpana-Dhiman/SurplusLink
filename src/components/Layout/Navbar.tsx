import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Gift, Search, TrendingUp, Settings, Bell, User, Sun, Moon, Edit, LogOut, UserCircle, Star, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { notifications, getUserStats } = useApp();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userStats = getUserStats();

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/donate', icon: Gift, label: 'Donate' },
    { path: '/discover', icon: Search, label: 'Discover' },
    { path: '/impact', icon: TrendingUp, label: 'Impact' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleProfileMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleEditProfile = () => {
    setShowProfileMenu(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        updateUser({ avatar: avatarUrl });
        toast.success('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              SurplusLink
            </span>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </motion.button>

            {/* User Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleProfileMenuToggle}
                  className="relative p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Profile Menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {showProfileMenu && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </motion.button>
              </div>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                              <UserCircle className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleAvatarClick}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                            title="Change profile picture"
                          >
                            <Camera className="w-3 h-3" />
                          </motion.button>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {user?.donationIntegrityScore}/5.0 Score
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-600">{userStats.itemsDonated}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Donated</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-600">{userStats.itemsClaimed}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Claimed</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                        onClick={handleEditProfile}
                        className="w-full px-4 py-3 text-left flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Edit Profile</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Update your information</p>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Sign Out</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Log out of your account</p>
                        </div>
                      </motion.button>
                    </div>

                    {/* Role Badge */}
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.role === 'donor' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        user?.role === 'ngo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {user?.role === 'donor' ? '🎁 Donor' :
                         user?.role === 'ngo' ? '🏢 NGO' :
                         '👤 Individual'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden file input for avatar upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `p-3 rounded-lg flex flex-col items-center space-y-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;