import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiKey, FiUpload, FiEdit3, FiSliders, 
  FiPlay, FiDownload, FiX, FiCheck, FiClock
} from 'react-icons/fi';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useResponsive } from '../../hooks/useResponsive';

const SidebarLink = ({ to, icon: Icon, label, step, currentStep, completedSteps, isActive, onClick }) => {
  const isCompleted = completedSteps && completedSteps.includes(step);
  const isCurrent = currentStep === step;
  const isAccessible = step === 0 || step <= currentStep || isCompleted;

  return (
    <Link
      to={isAccessible ? to : '#'}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
        isActive && isAccessible
        ? 'bg-white/5 text-white'
        : isAccessible
        ? 'text-white/80 hover:bg-white/5 hover:text-white'
        : 'text-white/40 cursor-not-allowed'
      }`}
    >
      <div className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-150 ${
        isCompleted
        ? 'bg-green-900/30 text-green-400'
        : isCurrent
        ? 'bg-white/5 text-white'
        : 'text-white/80'
      }`}>
      {isCompleted ? (
        <FiCheck className="w-4 h-4" />
        ) : isCurrent ? (
        <FiClock className="w-4 h-4" />
        ) : (
        <Icon className="w-4 h-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{label}</div>
        {step > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Step {step}
          </div>
          )}
      </div>
    </Link>
    );
};

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { currentStep, completedSteps = [], setStep, disableAutoProgress } = useWorkflow();
  const { isMobile } = useResponsive();

  const navigationItems = [
    { to: '/api-setup', icon: FiKey, label: 'API Setup', step: 1 },
    { to: '/paper-processing', icon: FiUpload, label: 'Paper Upload', step: 2 },
    { to: '/script-generation', icon: FiEdit3, label: 'Script Generation', step: 3 },
    { to: '/slide-creation', icon: FiSliders, label: 'Slide Creation', step: 4 },
    { to: '/media-generation', icon: FiPlay, label: 'Media Generation', step: 5 },
    { to: '/results', icon: FiDownload, label: 'Results', step: 6 },
  ];

  const handleLinkClick = (step) => {
    if (step === 0 || step <= currentStep || completedSteps.includes(step)) {
      setStep(step);
      disableAutoProgress();
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  const progressPercentage = completedSteps.length > 0 ? Math.round((completedSteps.length / 6) * 100) : 0;

  return (
    <aside className="h-full w-full bg-gradient-to-b from-slate-900 via-black to-slate-800 text-white border-r border-transparent flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-800/60 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
          <div>
            <h2 className="font-semibold text-white">
              Saral AI
            </h2>
            <p className="text-xs text-white/70">
              Paper to Video
            </p>
          </div>
        </div>
        
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-150"
          >
            <FiX className="w-5 h-5" />
          </button>
          )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-medium text-white/70 uppercase tracking-wider mb-4 px-3">
          Workflow
        </div>
        
        {navigationItems.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            step={item.step}
            currentStep={currentStep}
            completedSteps={completedSteps}
            isActive={location.pathname === item.to}
            onClick={() => handleLinkClick(item.step)}
            />
            ))}
      </nav>

      {/* Progress */}
      <div className="px-4 py-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="px-3 py-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              Progress
            </span>
            <span className="text-sm text-white/70">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-neutral-900/30 rounded-full h-1.5">
            <motion.div
              className="bg-indigo-600/80 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
          <div className="mt-2 text-xs text-white/70">
            {completedSteps.length > 0 ? `${completedSteps.length} of 6 completed` : 'Get started'}
          </div>
        </div>
      </div>
    </aside>
    );
};

export default Sidebar;
