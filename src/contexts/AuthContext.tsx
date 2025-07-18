import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: User['role']) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock database for users
const USERS_KEY = 'surpluslink_users';
const CURRENT_USER_KEY = 'surpluslink_current_user';

const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const findUserByEmail = (email: string): User | null => {
  const users = getStoredUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored current user
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Verify user still exists in users database
        const existingUser = findUserByEmail(userData.email);
        if (existingUser) {
          setUser(existingUser);
        } else {
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      } catch (error) {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const existingUser = findUserByEmail(email);
      
      if (!existingUser) {
        throw new Error('No account found with this email. Please sign up first.');
      }
      
      // In a real app, you'd verify the password hash
      // For demo purposes, we'll accept any password for existing users
      
      setUser(existingUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: User['role']) => {
    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const existingUser = findUserByEmail(email);
      
      if (existingUser) {
        throw new Error('An account with this email already exists. Please login instead.');
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        name,
        role,
        donationIntegrityScore: 5.0,
        createdAt: new Date(),
      };
      
      const users = getStoredUsers();
      users.push(newUser);
      saveUsers(users);
      
      setUser(newUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    
    // Update in users database
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      saveUsers(users);
    }
    
    // Update current user
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};