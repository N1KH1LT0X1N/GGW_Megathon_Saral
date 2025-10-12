import React from 'react';
import { motion } from 'framer-motion';
import { useComplexity } from '../../contexts/ComplexityContext';

const ComplexitySelector = ({ className = '' }) => {
  const { complexity, setComplexity, allLevels } = useComplexity();

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Content Complexity Level
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.values(allLevels).map((level) => (
          <motion.button
            key={level.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setComplexity(level.value)}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${complexity === level.value 
                ? `${level.color} border-opacity-100 shadow-md` 
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }
            `}
          >
            {/* Selected indicator */}
            {complexity === level.value && (
              <motion.div
                layoutId="complexity-indicator"
                className="absolute top-2 right-2"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="w-5 h-5 bg-primary-600 dark:bg-primary-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </motion.div>
            )}

            <div className="flex items-start gap-3 text-left">
              <span className="text-2xl flex-shrink-0">{level.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold mb-1 ${
                  complexity === level.value 
                    ? 'text-neutral-900 dark:text-white' 
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}>
                  {level.label}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {level.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
        💡 This setting applies to all generated content: videos, podcasts, and mind maps
      </p>
    </div>
  );
};

export default ComplexitySelector;
