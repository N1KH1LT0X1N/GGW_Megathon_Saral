import React from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import ThemeToggle from '../common/ThemeToggle';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick, sidebarOpen }) => {
  const { currentStep } = useWorkflow();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const steps = [
    { id: 1, name: 'API Setup' },
    { id: 2, name: 'Paper Upload' },
    { id: 3, name: 'Script Generation' },
    { id: 4, name: 'Slide Creation' },
    { id: 5, name: 'Media Generation' }
  ];

  const currentStepInfo = steps.find(step => step.id === currentStep);

  return (
    <motion.header
      initial={{ y: -6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-30"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              {sidebarOpen ? (
                <FiX className="w-5 h-5" />
                ) : (
                <FiMenu className="w-5 h-5" />
                )}
              </button>
              
              <div className={`flex items-center gap-3 transition-opacity duration-150 ${
                !isMobile && sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}>
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-gray-900 font-bold text-sm">SA</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  <a href='/'>Saral AI</a>
                </h1>
                {currentStepInfo && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentStepInfo.name}
                  </p>
                  )}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          {currentStep > 1 && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-colors duration-150 ${
                      step.id < currentStep
                      ? 'bg-green-500'
                      : step.id === currentStep
                      ? 'bg-gray-700'
                      : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    />
                    ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {currentStep - 1} of {steps.length}
              </span>
            </div>
            )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <div className="lg:hidden flex gap-1">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                      step.id < currentStep
                      ? 'bg-green-500'
                      : step.id === currentStep
                      ? 'bg-gray-700'
                      : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    />
                    ))}
              </div>
              )}

            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.header>
    );
};

export default Header;
