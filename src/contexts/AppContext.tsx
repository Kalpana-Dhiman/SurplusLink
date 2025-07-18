import React, { createContext, useContext, useEffect, useState } from 'react';
import { Item, Claim, Notification } from '../types';
import { useAuth } from './AuthContext';
import { sampleItems } from '../data/sampleItems';
import toast from 'react-hot-toast';

interface AppContextType {
  items: Item[];
  claims: Claim[];
  notifications: Notification[];
  addItem: (item: Omit<Item, 'id' | 'donor' | 'createdAt' | 'status'>) => void;
  claimItem: (itemId: string) => void;
  confirmPickup: (itemId: string, otp: string) => void;
  markAsCollected: (itemId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getUserStats: () => {
    itemsDonated: number;
    itemsClaimed: number;
    totalValue: number;
    co2Prevented: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const ITEMS_KEY = 'surpluslink_items';
const CLAIMS_KEY = 'surpluslink_claims';
const NOTIFICATIONS_KEY = 'surpluslink_notifications';
const SAMPLE_ITEMS_LOADED_KEY = 'surpluslink_sample_items_loaded';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load data from localStorage and add sample items if needed
  useEffect(() => {
    const storedItems = localStorage.getItem(ITEMS_KEY);
    const storedClaims = localStorage.getItem(CLAIMS_KEY);
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    const sampleItemsLoaded = localStorage.getItem(SAMPLE_ITEMS_LOADED_KEY);

    let parsedItems: Item[] = [];

    if (storedItems) {
      parsedItems = JSON.parse(storedItems).map((item: any) => ({
        ...item,
        expiryDate: new Date(item.expiryDate),
        createdAt: new Date(item.createdAt),
        pickupWindow: {
          start: new Date(item.pickupWindow.start),
          end: new Date(item.pickupWindow.end),
        },
        claimedAt: item.claimedAt ? new Date(item.claimedAt) : undefined,
      }));
    }

    // Add sample items if they haven't been loaded before
    if (!sampleItemsLoaded) {
      parsedItems = [...parsedItems, ...sampleItems];
      localStorage.setItem(SAMPLE_ITEMS_LOADED_KEY, 'true');
    }

    setItems(parsedItems);

    if (storedClaims) {
      const parsedClaims = JSON.parse(storedClaims).map((claim: any) => ({
        ...claim,
        claimedAt: new Date(claim.claimedAt),
        expiresAt: new Date(claim.expiresAt),
      }));
      setClaims(parsedClaims);
    }

    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications).map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp),
      }));
      setNotifications(parsedNotifications);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
  }, [claims]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addItem = (itemData: Omit<Item, 'id' | 'donor' | 'createdAt' | 'status'>) => {
    if (!user) return;

    const newItem: Item = {
      ...itemData,
      id: Date.now().toString(),
      donor: user,
      status: 'available',
      createdAt: new Date(),
    };

    setItems(prev => [newItem, ...prev]);
    
    // Add notification for successful donation
    addNotification({
      type: 'new_item',
      title: 'Item Donated Successfully!',
      message: `Your ${newItem.name} is now available for claiming`,
      read: false,
    });

    toast.success('Item donated successfully! It\'s now available for others to claim.');
  };

  const claimItem = (itemId: string) => {
    if (!user) return;

    const item = items.find(i => i.id === itemId);
    if (!item || item.status !== 'available') {
      toast.error('This item is no longer available');
      return;
    }

    if (item.donor.id === user.id) {
      toast.error('You cannot claim your own donation');
      return;
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const claimExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const newClaim: Claim = {
      id: Date.now().toString(),
      item,
      claimant: user,
      claimedAt: new Date(),
      expiresAt: claimExpiresAt,
      status: 'pending',
      otp,
    };

    setClaims(prev => [newClaim, ...prev]);

    // Update item status
    setItems(prev => prev.map(i => 
      i.id === itemId 
        ? { ...i, status: 'claimed', claimedBy: user, claimedAt: new Date(), otp }
        : i
    ));

    // Add notifications
    addNotification({
      type: 'item_claimed',
      title: 'Item Claimed Successfully!',
      message: `You claimed ${item.name}. OTP: ${otp}. You have 15 minutes to confirm pickup.`,
      read: false,
      data: { itemId, otp },
    });

    toast.success(`Item claimed! Your OTP is: ${otp}. You have 15 minutes to confirm pickup.`);

    // Simulate donor notification
    setTimeout(() => {
      toast(`📱 ${item.donor.name} has been notified about your claim`, {
        icon: '🔔',
        duration: 3000,
      });
    }, 1000);
  };

  const confirmPickup = (itemId: string, enteredOtp: string) => {
    const claim = claims.find(c => c.item.id === itemId && c.status === 'pending');
    
    if (!claim) {
      toast.error('No pending claim found for this item');
      return;
    }

    if (claim.otp !== enteredOtp) {
      // Easter egg for wrong OTP
      toast.error('🚨 Imposter Detected! Wrong OTP entered', {
        duration: 5000,
        style: {
          background: '#ff4444',
          color: 'white',
        },
      });
      
      // Play a sound effect (if browser supports it)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play().catch(() => {}); // Ignore errors if audio fails
      } catch (e) {}
      
      return;
    }

    // Update claim status
    setClaims(prev => prev.map(c => 
      c.id === claim.id 
        ? { ...c, status: 'confirmed' }
        : c
    ));

    addNotification({
      type: 'pickup_confirmed',
      title: 'Pickup Confirmed!',
      message: `Pickup confirmed for ${claim.item.name}. Please proceed to collect the item.`,
      read: false,
    });

    toast.success('Pickup confirmed! Please proceed to collect the item.');
  };

  const markAsCollected = (itemId: string) => {
    // Update item status
    setItems(prev => prev.map(i => 
      i.id === itemId 
        ? { ...i, status: 'collected' }
        : i
    ));

    // Update claim status
    setClaims(prev => prev.map(c => 
      c.item.id === itemId 
        ? { ...c, status: 'collected' }
        : c
    ));

    const item = items.find(i => i.id === itemId);
    if (item) {
      addNotification({
        type: 'pickup_due',
        title: 'Item Collected!',
        message: `${item.name} has been successfully collected. Thank you for making a difference!`,
        read: false,
      });

      toast.success('Item marked as collected! Thank you for making a difference!');
    }
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId 
        ? { ...n, read: true }
        : n
    ));
  };

  const getUserStats = () => {
    if (!user) return { itemsDonated: 0, itemsClaimed: 0, totalValue: 0, co2Prevented: 0 };

    const userItems = items.filter(item => item.donor.id === user.id);
    const userClaims = claims.filter(claim => claim.claimant.id === user.id);
    
    const itemsDonated = userItems.length;
    const itemsClaimed = userClaims.length;
    
    // Calculate estimated value (₹50 per kg for food, ₹100 per unit for medicine)
    const totalValue = userItems.reduce((sum, item) => {
      const baseValue = item.category === 'medicine' ? 100 : 50;
      return sum + (item.quantity * baseValue);
    }, 0);
    
    // Calculate CO2 prevented (0.5kg CO2 per kg of food saved)
    const co2Prevented = userItems.reduce((sum, item) => {
      if (item.category === 'food') {
        return sum + (item.quantity * 0.5);
      }
      return sum;
    }, 0);

    return { itemsDonated, itemsClaimed, totalValue, co2Prevented };
  };

  return (
    <AppContext.Provider value={{
      items,
      claims,
      notifications,
      addItem,
      claimItem,
      confirmPickup,
      markAsCollected,
      addNotification,
      markNotificationAsRead,
      getUserStats,
    }}>
      {children}
    </AppContext.Provider>
  );
};