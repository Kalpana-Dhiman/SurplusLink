import { Item, User, ImpactStats, Notification } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'donor@example.com',
    name: 'Sarah Johnson',
    role: 'donor',
    donationIntegrityScore: 4.8,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    email: 'ngo@example.com',
    name: 'Food Bank Mumbai',
    role: 'ngo',
    donationIntegrityScore: 4.9,
    createdAt: new Date('2024-01-10'),
  },
];

export const mockItems: Item[] = [
  {
    id: '1',
    name: 'Fresh Vegetables',
    category: 'food',
    quantity: 25,
    unit: 'kg',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    description: 'Fresh organic vegetables from our farm surplus',
    images: ['https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Mumbai, Maharashtra, India',
    },
    donor: mockUsers[0],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 8 * 60 * 60 * 1000),
      end: new Date(Date.now() + 20 * 60 * 60 * 1000),
    },
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Paracetamol Tablets',
    category: 'medicine',
    quantity: 100,
    unit: 'tablets',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    description: 'Unopened paracetamol tablets, expiry in 30 days',
    images: ['https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.0896,
      lng: 72.8656,
      address: 'Andheri, Mumbai, Maharashtra, India',
    },
    donor: mockUsers[0],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 4 * 60 * 60 * 1000),
      end: new Date(Date.now() + 16 * 60 * 60 * 1000),
    },
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Bread & Bakery Items',
    category: 'food',
    quantity: 15,
    unit: 'pieces',
    expiryDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
    description: 'Fresh bread and pastries from our bakery',
    images: ['https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.1136,
      lng: 72.8697,
      address: 'Bandra, Mumbai, Maharashtra, India',
    },
    donor: mockUsers[0],
    status: 'claimed',
    claimedBy: mockUsers[1],
    claimedAt: new Date(Date.now() - 30 * 60 * 1000),
    pickupWindow: {
      start: new Date(Date.now() + 2 * 60 * 60 * 1000),
      end: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
    otp: '1234',
    createdAt: new Date(),
  },
];

export const mockImpactStats: ImpactStats = {
  totalItemsSaved: 1247,
  totalValueSaved: 89650,
  co2Prevented: 542,
  mealsProvided: 3741,
  medicinesSaved: 892,
  activeDonors: 156,
  activeNGOs: 43,
};

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'item_claimed',
    title: 'Item Claimed!',
    message: 'Food Bank Mumbai claimed your Fresh Vegetables',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
  },
  {
    id: '2',
    type: 'pickup_due',
    title: 'Pickup Due Soon',
    message: 'Pickup window for Bread & Bakery Items closes in 2 hours',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    type: 'near_expiry',
    title: 'Item Expiring Soon',
    message: 'Your donated bread expires in 12 hours',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
  },
];