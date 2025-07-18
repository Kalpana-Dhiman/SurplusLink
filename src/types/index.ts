export interface User {
  id: string;
  email: string;
  name: string;
  role: 'donor' | 'ngo' | 'individual';
  phone?: string;
  address?: string;
  donationIntegrityScore: number;
  avatar?: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  name: string;
  category: 'food' | 'medicine' | 'other';
  quantity: number;
  unit: string;
  expiryDate: Date;
  description?: string;
  images: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  donor: User;
  status: 'available' | 'claimed' | 'collected' | 'expired';
  claimedBy?: User;
  claimedAt?: Date;
  pickupWindow: {
    start: Date;
    end: Date;
  };
  otp?: string;
  createdAt: Date;
}

export interface Claim {
  id: string;
  item: Item;
  claimant: User;
  claimedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'confirmed' | 'collected' | 'expired';
  otp: string;
  rating?: number;
  feedback?: string;
  proofImage?: string;
}

export interface ImpactStats {
  totalItemsSaved: number;
  totalValueSaved: number;
  co2Prevented: number;
  mealsProvided: number;
  medicinesSaved: number;
  activeDonors: number;
  activeNGOs: number;
}

export interface Notification {
  id: string;
  type: 'item_claimed' | 'pickup_due' | 'near_expiry' | 'new_item' | 'pickup_confirmed';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export interface FilterState {
  distance: number;
  categories: string[];
  hoursToExpiry: number;
  medicineOnly: boolean;
}