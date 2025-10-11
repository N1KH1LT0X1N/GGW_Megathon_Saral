import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

const ContinueButton = ({ 
  onClick, 
  disabled = false, 
  loading = false, 
  children, 
  className = '',
  variant = 'primary'
}) => {
  const baseClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${className}`}
    >
      {loading ? (
        <>
        <LoadingSpinner size="sm" className="mr-2" />
        Processing...
        </>
        ) : (
        <>
        {children}
        <FiArrowRight className="w-4 h-4 ml-2" />
        </>
        )}
      </motion.button>
      );
};

export default ContinueButton;
