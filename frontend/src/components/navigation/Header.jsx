import React from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
// ThemeToggle removed per request
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
      // make header use landing gradient background and white text/icons
      className="sticky top-0 z-30 bg-gradient-to-br from-slate-900 via-black to-slate-800"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-white hover:text-white/90 hover:bg-white/5 transition-colors duration-150"
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
              <div className="w-8 h-8 bg-neutral-800/70 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <div>
                <h1 className="font-semibold text-white">
                  <a href='/' className="text-white">Saral AI</a>
                </h1>
                {currentStepInfo && (
                  <p className="text-sm text-white/70">
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
                      ? 'bg-indigo-500'
                      : 'bg-gray-500'
                    }`}
                    />
                    ))}
              </div>
              <span className="text-sm text-white/70 ml-2">
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
                      ? 'bg-indigo-500'
                      : 'bg-gray-500'
                    }`}
                    />
                    ))}
              </div>
              )}

            {/* ThemeToggle removed per request */}
          </div>
        </div>
      </div>
    </motion.header>
    );
};

export default Header;
