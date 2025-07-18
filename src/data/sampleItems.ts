import { Item, User } from '../types';

// Sample users for demo purposes
const sampleUsers: User[] = [
  {
    id: 'sample-1',
    email: 'restaurant@example.com',
    name: 'Green Garden Restaurant',
    role: 'donor',
    donationIntegrityScore: 4.8,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'sample-2',
    email: 'pharmacy@example.com',
    name: 'City Medical Store',
    role: 'donor',
    donationIntegrityScore: 4.9,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'sample-3',
    email: 'bakery@example.com',
    name: 'Fresh Bread Bakery',
    role: 'donor',
    donationIntegrityScore: 4.7,
    createdAt: new Date('2024-01-20'),
  },
];

// Sample items to populate the discover page
export const sampleItems: Item[] = [
  {
    id: 'sample-item-1',
    name: 'Fresh Vegetables Mix',
    category: 'food',
    quantity: 15,
    unit: 'kg',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    description: 'Fresh organic vegetables including tomatoes, onions, and leafy greens from our restaurant surplus',
    images: ['https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Bandra West, Mumbai, Maharashtra, India',
    },
    donor: sampleUsers[0],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      end: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: 'sample-item-2',
    name: 'Paracetamol Tablets',
    category: 'medicine',
    quantity: 50,
    unit: 'tablets',
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    description: 'Unopened pack of paracetamol 500mg tablets. Perfect condition, just overstocked.',
    images: ['https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.0896,
      lng: 72.8656,
      address: 'Andheri East, Mumbai, Maharashtra, India',
    },
    donor: sampleUsers[1],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      end: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: 'sample-item-3',
    name: 'Fresh Bread & Pastries',
    category: 'food',
    quantity: 20,
    unit: 'pieces',
    expiryDate: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
    description: 'Assorted fresh bread, croissants, and pastries from today\'s batch. Still warm and delicious!',
    images: ['https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.1136,
      lng: 72.8697,
      address: 'Bandra West, Mumbai, Maharashtra, India',
    },
    donor: sampleUsers[2],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      end: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    id: 'sample-item-4',
    name: 'Dairy Products',
    category: 'food',
    quantity: 8,
    unit: 'liters',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    description: 'Fresh milk and yogurt from our restaurant. Refrigerated and in perfect condition.',
    images: ['https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.0544,
      lng: 72.8322,
      address: 'Colaba, Mumbai, Maharashtra, India',
    },
    donor: sampleUsers[0],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      end: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
    },
    createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: 'sample-item-5',
    name: 'Vitamin Supplements',
    category: 'medicine',
    quantity: 30,
    unit: 'capsules',
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    description: 'Multivitamin capsules, unopened bottle. Great for boosting immunity.',
    images: ['https://images.pexels.com/photos/208518/pexels-photo-208518.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.1197,
      lng: 72.9073,
      address: 'Powai, Mumbai, Maharashtra, India',
    },
    donor: sampleUsers[1],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      end: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'sample-item-6',
    name: 'Cooked Rice & Curry',
    category: 'food',
    quantity: 25,
    unit: 'servings',
    expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    description: 'Freshly cooked rice with vegetable curry. Perfect for immediate consumption.',
    images: ['https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500'],
    location: {
      lat: 19.0330,
      lng: 72.8570,
      address: 'Worli, Mumbai, Maharashtra, India',
    },
    donor: sampleUsers[0],
    status: 'available',
    pickupWindow: {
      start: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      end: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    },
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  },
];