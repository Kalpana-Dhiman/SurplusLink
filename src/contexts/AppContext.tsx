import React, { createContext, useContext, useEffect, useState } from 'react';
import { Item, Claim, Notification } from '../types';
import { useAuth } from './AuthContext';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
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

const NOTIFICATIONS_KEY = 'surpluslink_notifications';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load data from backend and localStorage
  useEffect(() => {
    // Load notifications from localStorage
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications).map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp),
      }));
      setNotifications(parsedNotifications);
    }

    // Load data from backend if user is authenticated
    if (user) {
      loadDonations();
      loadClaims();
    }
  }, [user]);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!user) return;

    // Set up real-time event listeners
    const unsubscribeFunctions = [
      socketService.on('new_donation', handleNewDonation),
      socketService.on('donation_claimed', handleDonationClaimed),
      socketService.on('donation_status_updated', handleDonationStatusUpdated),
      socketService.on('pickup_confirmed', handlePickupConfirmed),
      socketService.on('donation_collected', handleDonationCollected),
      socketService.on('claim_cancelled', handleClaimCancelled),
      socketService.on('claim_created', handleClaimCreated),
    ];

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  // Load donations from backend
  const loadDonations = async () => {
    try {
      const data = await apiService.getDonations({
        status: 'available',
        limit: 50
      });
      setItems(data.donations || []);
    } catch (error) {
      console.error('Failed to load donations:', error);
    }
  };

  // Load claims from backend
  const loadClaims = async () => {
    try {
      const data = await apiService.getMyClaims();
      setClaims(data.claims || []);
    } catch (error) {
      console.error('Failed to load claims:', error);
    }
  };

  // WebSocket event handlers
  const handleNewDonation = (data: any) => {
    const newItem = transformBackendDonation(data.donation);
    setItems(prev => [newItem, ...prev]);
    addNotification({
      type: 'new_item',
      title: 'New Donation Available!',
      message: `${data.donation.name} is now available for claiming`,
      read: false,
    });
  };

  const handleDonationClaimed = (data: any) => {
    const updatedItem = transformBackendDonation(data.donation);
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handleDonationStatusUpdated = (data: any) => {
    const updatedItem = transformBackendDonation(data.donation);
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handlePickupConfirmed = (data: any) => {
    addNotification({
      type: 'pickup_confirmed',
      title: 'Pickup Confirmed!',
      message: data.message,
      read: false,
    });
  };

  const handleDonationCollected = (data: any) => {
    const updatedItem = transformBackendDonation(data.donation);
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    addNotification({
      type: 'pickup_due',
      title: 'Item Collected!',
      message: data.message,
      read: false,
    });
  };

  const handleClaimCancelled = (data: any) => {
    const updatedItem = transformBackendDonation(data.donation);
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handleClaimCreated = (data: any) => {
    const newClaim = transformBackendClaim(data.claim);
    setClaims(prev => [newClaim, ...prev]);
    addNotification({
      type: 'item_claimed',
      title: 'Item Claimed Successfully!',
      message: `You claimed ${data.claim.donation.name}. OTP: ${data.otp}`,
      read: false,
      data: { itemId: data.claim.donation._id, otp: data.otp },
    });
  };

  // Transform backend donation to frontend format
  const transformBackendDonation = (backendDonation: any): Item => {
    return {
      id: backendDonation._id,
      name: backendDonation.name,
      category: backendDonation.category,
      quantity: backendDonation.quantity,
      unit: backendDonation.unit,
      expiryDate: new Date(backendDonation.expiryDate),
      description: backendDonation.description || '',
      images: backendDonation.images || [],
      location: {
        lat: backendDonation.location.coordinates.lat,
        lng: backendDonation.location.coordinates.lng,
        address: backendDonation.location.address,
      },
      donor: {
        id: backendDonation.donor._id,
        name: backendDonation.donor.name,
        email: backendDonation.donor.email,
        role: backendDonation.donor.role,
        donationIntegrityScore: backendDonation.donor.donationIntegrityScore,
        createdAt: new Date(backendDonation.donor.createdAt),
      },
      status: backendDonation.status,
      claimedBy: backendDonation.claimedBy ? {
        id: backendDonation.claimedBy._id,
        name: backendDonation.claimedBy.name,
        email: backendDonation.claimedBy.email,
        role: backendDonation.claimedBy.role,
        donationIntegrityScore: backendDonation.claimedBy.donationIntegrityScore,
        createdAt: new Date(backendDonation.claimedBy.createdAt),
      } : undefined,
      claimedAt: backendDonation.claimedAt ? new Date(backendDonation.claimedAt) : undefined,
      pickupWindow: {
        start: new Date(backendDonation.pickupWindow.start),
        end: new Date(backendDonation.pickupWindow.end),
      },
      otp: backendDonation.otp,
      createdAt: new Date(backendDonation.createdAt),
    };
  };

  // Transform backend claim to frontend format
  const transformBackendClaim = (backendClaim: any): Claim => {
    return {
      id: backendClaim._id,
      item: transformBackendDonation(backendClaim.donation),
      claimant: {
        id: backendClaim.claimant._id,
        name: backendClaim.claimant.name,
        email: backendClaim.claimant.email,
        role: backendClaim.claimant.role,
        donationIntegrityScore: backendClaim.claimant.donationIntegrityScore,
        createdAt: new Date(backendClaim.claimant.createdAt),
      },
      claimedAt: new Date(backendClaim.claimedAt),
      expiresAt: new Date(backendClaim.expiresAt),
      status: backendClaim.status,
      otp: backendClaim.otp,
      rating: backendClaim.feedback?.rating,
      feedback: backendClaim.feedback?.comment,
      proofImage: backendClaim.proofImages?.[0],
    };
  };

  // Save notifications to localStorage whenever they change

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addItem = async (itemData: Omit<Item, 'id' | 'donor' | 'createdAt' | 'status'>) => {
    if (!user) return;

    try {
      // Transform frontend data to backend format
      const backendData = {
        name: itemData.name,
        category: itemData.category,
        quantity: itemData.quantity,
        unit: itemData.unit,
        expiryDate: itemData.expiryDate.toISOString(),
        description: itemData.description,
        images: itemData.images,
        location: {
          address: itemData.location.address,
          coordinates: {
            lat: itemData.location.lat,
            lng: itemData.location.lng,
          },
        },
        pickupWindow: {
          start: itemData.pickupWindow.start.toISOString(),
          end: itemData.pickupWindow.end.toISOString(),
        },
      };

      const data = await apiService.createDonation(backendData);
      const newItem = transformBackendDonation(data.donation);
      
      setItems(prev => [newItem, ...prev]);
      
      addNotification({
        type: 'new_item',
        title: 'Item Donated Successfully!',
        message: `Your ${newItem.name} is now available for claiming`,
        read: false,
      });

      toast.success('Item donated successfully! It\'s now available for others to claim.');
    } catch (error: any) {
      console.error('Failed to create donation:', error);
      toast.error(error.message || 'Failed to donate item. Please try again.');
    }
  };

  const claimItem = async (itemId: string) => {
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

    try {
      const data = await apiService.claimDonation(itemId, {
        reason: 'Needed for community support'
      });
      
      // Update local state
      const updatedItem = { ...item, status: 'claimed' as const, claimedBy: user, claimedAt: new Date(), otp: data.otp };
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      
      const newClaim = transformBackendClaim(data.claim);
      setClaims(prev => [newClaim, ...prev]);

      toast.success(`Item claimed! Your OTP is: ${data.otp}. You have 15 minutes to confirm pickup.`);
    } catch (error: any) {
      console.error('Failed to claim item:', error);
      toast.error(error.message || 'Failed to claim item. Please try again.');
    }
  };

  const confirmPickup = async (itemId: string, enteredOtp: string) => {
    const claim = claims.find(c => c.item.id === itemId && c.status === 'pending');
    
    if (!claim) {
      toast.error('No pending claim found for this item');
      return;
    }

    try {
      await apiService.confirmPickup(claim.id, enteredOtp);
      
      // Update local state
      setClaims(prev => prev.map(c => 
        c.id === claim.id ? { ...c, status: 'confirmed' } : c
      ));

      addNotification({
        type: 'pickup_confirmed',
        title: 'Pickup Confirmed!',
        message: `Pickup confirmed for ${claim.item.name}. Please proceed to collect the item.`,
        read: false,
      });

      toast.success('Pickup confirmed! Please proceed to collect the item.');
    } catch (error: any) {
      console.error('Failed to confirm pickup:', error);
      if (error.message.includes('Invalid OTP')) {
        toast.error('🚨 Imposter Detected! Wrong OTP entered', {
          duration: 5000,
          style: {
            background: '#ff4444',
            color: 'white',
          },
        });
      } else {
        toast.error(error.message || 'Failed to confirm pickup');
      }
    }
  };

  const markAsCollected = async (itemId: string) => {
    const claim = claims.find(c => c.item.id === itemId);
    
    if (!claim) {
      toast.error('No claim found for this item');
      return;
    }

    try {
      await apiService.markAsCollected(claim.id, {
        rating: 5,
        comment: 'Great donation, thank you!'
      });
      
      // Update local state
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, status: 'collected' } : i
      ));
      
      setClaims(prev => prev.map(c => 
        c.id === claim.id ? { ...c, status: 'collected' } : c
      ));

      addNotification({
        type: 'pickup_due',
        title: 'Item Collected!',
        message: `${claim.item.name} has been successfully collected. Thank you for making a difference!`,
        read: false,
      });

      toast.success('Item marked as collected! Thank you for making a difference!');
    } catch (error: any) {
      console.error('Failed to mark as collected:', error);
      toast.error(error.message || 'Failed to mark as collected');
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