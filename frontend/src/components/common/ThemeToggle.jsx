import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative flex items-center w-12 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full p-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${className}`}
      whileTap={{ scale: 0.98 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.div
        className="flex items-center justify-center w-5 h-5 bg-white dark:bg-neutral-800 rounded-full shadow-sm"
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={{ 
          type: 'tween',
          duration: 0.15,
          ease: 'easeInOut'
        }}
      >
        <motion.div
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="absolute"
        >
          <FiMoon className="w-3 h-3 text-neutral-600" />
        </motion.div>
        
        <motion.div
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="absolute"
        >
          <FiSun className="w-3 h-3 text-yellow-500" />
        </motion.div>
      </motion.div>
    </motion.button>
    );
};

export default ThemeToggle;
