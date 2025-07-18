import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Calendar, Package, Save } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DonateFormData {
  name: string;
  category: 'food' | 'medicine' | 'other';
  quantity: number;
  unit: string;
  expiryDate: string;
  description: string;
  pickupStart: string;
  pickupEnd: string;
  location: string;
  images: File[];
}

const DonateForm: React.FC = () => {
  const { addItem } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<DonateFormData>({
    name: '',
    category: 'food',
    quantity: 1,
    unit: 'kg',
    expiryDate: '',
    description: '',
    pickupStart: '',
    pickupEnd: '',
    location: '',
    images: [],
  });

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);

    // Simulate OCR processing
    if (files.length > 0 && !formData.name) {
      toast.loading('Processing image with OCR...', { duration: 2000 });
      setTimeout(() => {
        // Mock OCR results based on category
        const mockNames = {
          food: ['Fresh Vegetables', 'Bread & Bakery Items', 'Dairy Products', 'Fruits'],
          medicine: ['Paracetamol Tablets', 'Cough Syrup', 'Vitamin Supplements', 'First Aid Kit'],
          other: ['Clothing Items', 'Books', 'Electronics', 'Household Items']
        };
        const randomName = mockNames[formData.category][Math.floor(Math.random() * mockNames[formData.category].length)];
        setFormData(prev => ({ ...prev, name: randomName }));
        toast.success('OCR detected item details!');
      }, 2000);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.expiryDate || !formData.pickupStart || !formData.pickupEnd || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    const expiryDate = new Date(formData.expiryDate);
    const pickupStart = new Date(formData.pickupStart);
    const pickupEnd = new Date(formData.pickupEnd);
    const now = new Date();

    if (expiryDate <= now) {
      toast.error('Expiry date must be in the future');
      return;
    }

    if (pickupStart <= now) {
      toast.error('Pickup start time must be in the future');
      return;
    }

    if (pickupEnd <= pickupStart) {
      toast.error('Pickup end time must be after start time');
      return;
    }

    setLoading(true);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Convert File objects to URLs (in real app, upload to server)
      const imageUrls = formData.images.map((_, index) => 
        previewUrls[index] || `https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=500`
      );
      
      addItem({
        name: formData.name,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        expiryDate,
        description: formData.description,
        images: imageUrls,
        location: {
          lat: 19.0760 + (Math.random() - 0.5) * 0.1,
          lng: 72.8777 + (Math.random() - 0.5) * 0.1,
          address: formData.location,
        },
        pickupWindow: {
          start: pickupStart,
          end: pickupEnd,
        },
      });
      
      // Reset form
      setFormData({
        name: '',
        category: 'food',
        quantity: 1,
        unit: 'kg',
        expiryDate: '',
        description: '',
        pickupStart: '',
        pickupEnd: '',
        location: '',
        images: [],
      });
      setPreviewUrls([]);
      
      // Navigate to home or discover page
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error) {
      toast.error('Failed to donate item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Donate Surplus Items
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Item Photos (Max 3) *
            </label>
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={previewUrls.length >= 3}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer flex flex-col items-center space-y-2 ${
                  previewUrls.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Camera className="w-12 h-12 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {previewUrls.length >= 3 ? 'Maximum images reached' : 'Click to upload or drag photos here'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  OCR will automatically detect item details
                </span>
              </label>
            </div>
          </div>

          {/* Item Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Fresh Vegetables"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="food">Food</option>
                <option value="medicine">Medicine</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity *
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg, pieces, etc."
                  className="w-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Pickup Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Pickup Window *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                <input
                  type="datetime-local"
                  value={formData.pickupStart}
                  onChange={(e) => setFormData({ ...formData, pickupStart: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                <input
                  type="datetime-local"
                  value={formData.pickupEnd}
                  onChange={(e) => setFormData({ ...formData, pickupEnd: e.target.value })}
                  required
                  min={formData.pickupStart || new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pickup Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter pickup address"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Add any additional details about the item..."
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Donate Item</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default DonateForm;