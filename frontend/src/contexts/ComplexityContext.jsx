import React, { createContext, useContext, useState, useEffect } from 'react';

const ComplexityContext = createContext();

export const COMPLEXITY_LEVELS = {
  EASY: {
    value: 'easy',
    label: 'Beginner Friendly',
    description: 'Simple explanations with minimal jargon. Perfect for general audiences or students.',
    icon: '📚',
    color: 'bg-green-100 dark:bg-green-900/20 border-green-500',
    promptModifier: 'Explain in simple terms suitable for beginners. Avoid technical jargon. Use everyday language and analogies.'
  },
  MEDIUM: {
    value: 'medium',
    label: 'Intermediate',
    description: 'Balanced technical depth with clear explanations. Good for educated audiences.',
    icon: '🎓',
    color: 'bg-blue-100 dark:bg-blue-900/20 border-blue-500',
    promptModifier: 'Use moderate technical terminology with explanations. Balance accessibility and depth.'
  },
  ADVANCED: {
    value: 'advanced',
    label: 'Expert Level',
    description: 'Full technical detail and academic terminology. For researchers and experts.',
    icon: '🔬',
    color: 'bg-purple-100 dark:bg-purple-900/20 border-purple-500',
    promptModifier: 'Use full academic and technical terminology. Provide in-depth analysis suitable for domain experts.'
  }
};

export const ComplexityProvider = ({ children }) => {
  // Load from localStorage or default to MEDIUM
  const [complexity, setComplexity] = useState(() => {
    const saved = localStorage.getItem('complexityLevel');
    return saved || COMPLEXITY_LEVELS.MEDIUM.value;
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('complexityLevel', complexity);
  }, [complexity]);

  const getComplexityConfig = () => {
    return Object.values(COMPLEXITY_LEVELS).find(level => level.value === complexity) || COMPLEXITY_LEVELS.MEDIUM;
  };

  const value = {
    complexity,
    setComplexity,
    complexityConfig: getComplexityConfig(),
    allLevels: COMPLEXITY_LEVELS
  };

  return (
    <ComplexityContext.Provider value={value}>
      {children}
    </ComplexityContext.Provider>
  );
};

export const useComplexity = () => {
  const context = useContext(ComplexityContext);
  if (!context) {
    throw new Error('useComplexity must be used within ComplexityProvider');
  }
  return context;
};

export default ComplexityContext;
