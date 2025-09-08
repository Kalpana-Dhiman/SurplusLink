import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and validate with backend
    const initAuth = async () => {
      const token = localStorage.getItem('surpluslink_token');
      if (token) {
        try {
          apiService.setToken(token);
          const userData = await apiService.getCurrentUser();
          setUser(userData.user);
          
          // Connect to WebSocket
          socketService.connect(token);
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Token is invalid, clear it
          apiService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const data = await apiService.login(email, password);
      setUser(data.user);
      
      // Connect to WebSocket
      socketService.connect(data.token);
      
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: User['role']) => {
    setLoading(true);
    
    try {
      const data = await apiService.signup({
        name,
        email,
        password,
        role
      });
      setUser(data.user);
      
      // Connect to WebSocket
      socketService.connect(data.token);
      
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const data = await apiService.updateProfile(updates);
      setUser(data.user);
    } catch (error: any) {
      try {
        // Fallback to local update if backend fails
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
      }
    }
  };

  const logout = () => {
    // Disconnect WebSocket
    socketService.disconnect();
    
    // Clear API token
    apiService.logout();
    
    // Clear user state
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};