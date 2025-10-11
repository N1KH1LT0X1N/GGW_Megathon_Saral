import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiImage, FiCheck, FiLoader } from 'react-icons/fi';
import { apiService } from '../../services/api';
import Pagination from '../common/Pagination';

const ImageThumbnail = ({ imageName, imageUrl, isSelected, onSelect, loading }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(imageName)}
    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 ${
      isSelected
      ? 'border-gray-700 ring-2 ring-gray-200 dark:ring-gray-800'
      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    }`}
  >
    {loading ? (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
      ) : imageUrl ? (
      <img
        src={imageUrl}
        alt={imageName}
        className="w-full h-full object-cover"
        loading="lazy"
        />
        ) : (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FiImage className="w-8 h-8 text-gray-400" />
        </div>
        )}
        
    {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center shadow-lg"
          >
            <FiCheck className="w-4 h-4 text-white" />
          </motion.div>
          )}
        
    {/* Image name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 truncate">
          {imageName}
        </div>
      </motion.button>
      );

const NoImageOption = ({ isSelected, onSelect }) => (
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => onSelect(null)}
    className={`w-full p-6 border-2 border-dashed rounded-lg transition-all duration-150 ${
      isSelected
      ? 'border-gray-700 bg-gray-50 dark:bg-gray-900/20'
      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
    }`}
  >
    <div className="flex items-center justify-center gap-3">
      <FiImage className="w-6 h-6 text-gray-400" />
      <span className="font-medium text-gray-600 dark:text-gray-300">
        No Image (Text Only Slide)
      </span>
      {isSelected && (
        <FiCheck className="w-5 h-5 text-gray-700" />
        )}
    </div>
  </motion.button>
  );

const ImageSelector = ({ paperId, images, selectedImage, onSelect, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingImages, setLoadingImages] = useState(new Set());
  
  const imagesPerPage = 12;
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const startIndex = (currentPage - 1) * imagesPerPage;
  const currentImages = images.slice(startIndex, startIndex + imagesPerPage);

  // Load image URLs for current page
  useEffect(() => {
    const loadImageUrls = async () => {
      if (!paperId || !currentImages.length) return;
      
      setLoadingImages(new Set(currentImages));
      
      for (const imageName of currentImages) {
        if (!imageUrls[imageName]) {
          try {
            const imageUrl = apiService.getImageUrl(paperId, imageName);
            setImageUrls(prev => ({ ...prev, [imageName]: imageUrl }));
          } catch (error) {
            console.error(`Failed to load image ${imageName}:`, error);
          }
        }
        
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageName);
          return newSet;
        });
      }
    };

    loadImageUrls();
  }, [paperId, currentImages, imageUrls]);

  const handleImageSelect = (image) => {
    onSelect(image);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-xs"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white dark:bg-gray-900/20 rounded-md p-6 m-4 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Slide Image
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* No Image Option */}
        <div className="mb-6">
          <NoImageOption 
            isSelected={selectedImage === null} 
            onSelect={handleImageSelect} 
          />
        </div>

        {/* Images Grid */}
        <div className="mb-6">
          {images.length === 0 ? (
            <div className="text-center py-12">
              <FiImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Images Available
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                No images were found in your paper. You can continue with text-only slides.
              </p>
            </div>
            ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                {currentImages.map((imageName) => (
                  <ImageThumbnail
                    key={imageName}
                    imageName={imageName}
                    imageUrl={imageUrls[imageName]}
                    isSelected={selectedImage === imageName}
                    onSelect={handleImageSelect}
                    loading={loadingImages.has(imageName)}
                    />
                    ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={images.length}
                    itemsPerPage={imagesPerPage}
                  />
                </div>
                )}
            </div>
            )}
          </div>

        {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {images.length} image{images.length !== 1 ? 's' : ''} available
            </div>
            
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={() => onSelect(selectedImage)} 
                className="btn-primary"
              >
                {selectedImage ? 'Use Selected Image' : 'Use No Image'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      );
};

export default ImageSelector;
