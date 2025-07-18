import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import FilterPanel from '../components/Discover/FilterPanel';
import ItemCard from '../components/Discover/ItemCard';
import { FilterState } from '../types';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const Discover: React.FC = () => {
  const { items } = useApp();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    distance: 25,
    categories: [],
    hoursToExpiry: 168,
    medicineOnly: false,
  });

  const filteredItems = items.filter(item => {
    // Don't show user's own items
    if (item.donor.id === user?.id) return false;
    
    // Only show available items
    if (item.status !== 'available') return false;
    
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false;
    }
    if (filters.medicineOnly && item.category !== 'medicine') {
      return false;
    }
    const hoursToExpiry = (item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursToExpiry > filters.hoursToExpiry) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Surplus Items
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Find food, medicine, and other surplus items near you
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
          
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Found {filteredItems.length} items within {filters.distance}km
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No items found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">
                  {items.filter(item => item.donor.id !== user?.id && item.status === 'available').length === 0 
                    ? "No items are currently available. Be the first to donate!"
                    : "No items found matching your filters. Try adjusting your search criteria."
                  }
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilters({
                    distance: 25,
                    categories: [],
                    hoursToExpiry: 168,
                    medicineOnly: false,
                  })}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;