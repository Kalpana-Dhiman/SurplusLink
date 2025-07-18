import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, HelpCircle, Edit, History, Star, Mail, Smartphone, Lock, Eye, EyeOff, Trash2, Languages, Type, MessageCircle, Phone, Bug, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, textSize, toggleTheme, setTextSize } = useTheme();
  const { getUserStats } = useApp();
  const userStats = getUserStats();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    locationSharing: true,
    twoFactorAuth: false,
  });
  const [appearance, setAppearance] = useState({
    language: 'English',
    textSize: textSize,
  });

  const handleSaveProfile = () => {
    updateUser({
      name: editProfile.name,
      phone: editProfile.phone,
      address: editProfile.address,
    });
    toast.success('Profile updated successfully!');
    setActiveModal(null);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        updateUser({ avatar: avatarUrl });
        toast.success('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationToggle = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${notifications[type] ? 'disabled' : 'enabled'}`);
  };

  const handlePrivacyToggle = (type: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    toast.success(`${type.replace(/([A-Z])/g, ' $1').toLowerCase()} ${privacy[type] ? 'disabled' : 'enabled'}`);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion initiated. You will be logged out.');
      setTimeout(() => {
        logout();
      }, 2000);
    }
  };

  const handleLanguageChange = (language: string) => {
    setAppearance(prev => ({ ...prev, language }));
    toast.success(`Language changed to ${language}`);
    setActiveModal(null);
  };

  const handleTextSizeChange = (size: string) => {
    const sizeMap = {
      'Small': 'small' as const,
      'Medium': 'medium' as const,
      'Large': 'large' as const,
      'Extra Large': 'extra-large' as const,
    };
    
    const mappedSize = sizeMap[size as keyof typeof sizeMap];
    if (mappedSize) {
      setTextSize(mappedSize);
      setAppearance(prev => ({ ...prev, textSize: mappedSize }));
    }
    toast.success(`Text size changed to ${size}`);
    setActiveModal(null);
  };

  const Modal: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={() => setActiveModal(null)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );

  const settingSections = [
    {
      title: 'Profile',
      icon: User,
      items: [
        { 
          label: 'Profile Picture', 
          description: 'Update your profile photo',
          icon: Camera,
          type: 'file-upload',
          fileAccept: 'image/*',
          onChange: handleAvatarUpload
        },
        { 
          label: 'Edit Profile', 
          description: 'Update your personal information',
          icon: Edit,
          type: 'modal',
          modalId: 'editProfile'
        },
        { 
          label: 'Donation History', 
          description: `${userStats.itemsDonated} items donated, ${userStats.itemsClaimed} claimed`,
          icon: History,
          type: 'info',
          action: () => toast.info('Donation history feature coming soon!')
        },
        { 
          label: 'Integrity Score', 
          description: `Current score: ${user?.donationIntegrityScore}/5.0`,
          icon: Star,
          type: 'info',
          action: () => toast.info('Your integrity score is based on successful donations and pickups')
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { 
          label: 'Push Notifications', 
          description: 'Get notified about claims and pickups',
          icon: Bell,
          type: 'toggle',
          value: notifications.push,
          action: () => handleNotificationToggle('push')
        },
        { 
          label: 'Email Notifications', 
          description: 'Receive updates via email',
          icon: Mail,
          type: 'toggle',
          value: notifications.email,
          action: () => handleNotificationToggle('email')
        },
        { 
          label: 'SMS Alerts', 
          description: 'Get SMS for urgent notifications',
          icon: Smartphone,
          type: 'toggle',
          value: notifications.sms,
          action: () => handleNotificationToggle('sms')
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { 
          label: 'Profile Visibility', 
          description: 'Control who can see your profile',
          icon: Eye,
          type: 'toggle',
          value: privacy.profileVisible,
          action: () => handlePrivacyToggle('profileVisible')
        },
        { 
          label: 'Location Sharing', 
          description: 'Share location for better matching',
          icon: Globe,
          type: 'toggle',
          value: privacy.locationSharing,
          action: () => handlePrivacyToggle('locationSharing')
        },
        { 
          label: 'Two-Factor Auth', 
          description: 'Enable 2FA for account security',
          icon: Lock,
          type: 'toggle',
          value: privacy.twoFactorAuth,
          action: () => handlePrivacyToggle('twoFactorAuth')
        },
        { 
          label: 'Delete Account', 
          description: 'Permanently delete your account',
          icon: Trash2,
          type: 'danger',
          action: handleDeleteAccount
        },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        { 
          label: 'Theme', 
          description: `Currently using ${theme} mode`,
          icon: theme === 'light' ? Eye : EyeOff,
          type: 'action',
          action: toggleTheme,
          actionLabel: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`
        },
        { 
          label: 'Language', 
          description: `Current: ${appearance.language}`,
          icon: Languages,
          type: 'modal',
          modalId: 'language'
        },
        { 
          label: 'Text Size', 
          description: `Current: ${textSize.charAt(0).toUpperCase() + textSize.slice(1).replace('-', ' ')}`,
          icon: Type,
          type: 'modal',
          modalId: 'textSize'
        },
      ],
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        { 
          label: 'Help Center', 
          description: 'Find answers to common questions',
          icon: HelpCircle,
          type: 'info',
          action: () => toast.info('Opening help center...')
        },
        { 
          label: 'Contact Support', 
          description: 'Get help from our support team',
          icon: MessageCircle,
          type: 'info',
          action: () => toast.info('Support chat will open soon!')
        },
        { 
          label: 'Report Issue', 
          description: 'Report bugs or technical issues',
          icon: Bug,
          type: 'info',
          action: () => toast.info('Issue reporting form will open')
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'toggle':
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={item.action}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              item.value ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                item.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </motion.button>
        );
      
      case 'file-upload':
        return (
          <div>
            <input
              type="file"
              accept={item.fileAccept}
              onChange={item.onChange}
              className="hidden"
              id={`file-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
            />
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              htmlFor={`file-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 cursor-pointer"
            >
              <Camera className="w-4 h-4 mr-2" />
              Upload
            </motion.label>
          </div>
        );
      
      case 'modal':
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal(item.modalId)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
          >
            Edit
          </motion.button>
        );
      
      case 'action':
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={item.action}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
          >
            {item.actionLabel || 'Toggle'}
          </motion.button>
        );
      
      case 'danger':
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={item.action}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
          >
            Delete
          </motion.button>
        );
      
      case 'info':
      default:
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={item.action}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View
          </motion.button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Settings
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Customize your SurplusLink experience
          </p>
        </motion.div>

        <div className="space-y-8">
          {settingSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <h3 className={`font-medium ${item.type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                          {item.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {renderSettingItem(item)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modals */}
        {activeModal === 'editProfile' && (
          <Modal title="Edit Profile">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editProfile.name}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={editProfile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editProfile.phone}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={editProfile.address}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Enter your address"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'language' && (
          <Modal title="Select Language">
            <div className="space-y-2">
              {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    appearance.language === lang
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </Modal>
        )}

        {activeModal === 'textSize' && (
          <Modal title="Text Size">
            <div className="space-y-2">
              {['Small', 'Medium', 'Large', 'Extra Large'].map((size) => (
                <button
                  key={size}
                  onClick={() => handleTextSizeChange(size)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    textSize === size.toLowerCase().replace(' ', '-')
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <span className={`${
                    size === 'Small' ? 'text-sm' :
                    size === 'Medium' ? 'text-base' :
                    size === 'Large' ? 'text-lg' :
                    'text-xl'
                  }`}>
                    {size}
                  </span>
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Settings;