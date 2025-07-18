import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, MapPin, Clock, Pill } from 'lucide-react';
import { FilterState } from '../../types';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange }) => {
  const categories = [
    { id: 'food', label: 'Food', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    { id: 'medicine', label: 'Medicine', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  ];

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6 sticky top-24"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Sliders className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>

      {/* Distance Filter */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Distance: {filters.distance}km
          </label>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={filters.distance}
          onChange={(e) => onFiltersChange({ ...filters, distance: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(filters.distance / 50) * 100}%, #e5e7eb ${(filters.distance / 50) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>1km</span>
          <span>50km</span>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Categories
        </label>
        <div className="space-y-2">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleCategory(category.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                filters.categories.includes(category.id)
                  ? category.color
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {category.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Expiry Filter */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Expires in: {filters.hoursToExpiry}h
          </label>
        </div>
        <input
          type="range"
          min="1"
          max="168"
          value={filters.hoursToExpiry}
          onChange={(e) => onFiltersChange({ ...filters, hoursToExpiry: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(filters.hoursToExpiry / 168) * 100}%, #e5e7eb ${(filters.hoursToExpiry / 168) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>1h</span>
          <span>1w</span>
        </div>
      </div>

      {/* Medicine Only Toggle */}
      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.medicineOnly}
            onChange={(e) => onFiltersChange({ ...filters, medicineOnly: e.target.checked })}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <Pill className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Medicine Only
          </span>
        </label>
      </div>

      {/* Clear Filters */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFiltersChange({
          distance: 25,
          categories: [],
          hoursToExpiry: 168,
          medicineOnly: false,
        })}
        className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Clear All Filters
      </motion.button>
    </motion.div>
  );
};

export default FilterPanel;