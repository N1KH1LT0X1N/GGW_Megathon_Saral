import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useComplexity } from '../../contexts/ComplexityContext';

const ComplexityButton = () => {
  const { complexity, setComplexity, complexityConfig, allLevels } = useComplexity();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (level) => {
    setComplexity(level);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-150"
        title="Content Complexity Level"
      >
        <span className="text-lg">{complexityConfig.icon}</span>
        <span className="hidden sm:inline text-sm font-medium">
          {complexityConfig.label}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"
          >
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                Content Complexity
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Applies to all generated content
              </p>
            </div>

            <div className="p-2">
              {Object.values(allLevels).map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleSelect(level.value)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-150 ${
                    complexity === level.value
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{level.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-sm ${
                          complexity === level.value
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-neutral-900 dark:text-white'
                        }`}>
                          {level.label}
                        </span>
                        {complexity === level.value && (
                          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 This setting affects videos, podcasts, and mind maps
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplexityButton;
