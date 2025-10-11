import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiKey, FiCheck, FiAlertCircle, FiEye, FiEyeOff, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../components/common/Layout';
import { GlowCard } from '../components/ui/spotlight-card';
import StarBorder from '../components/ui/star-border';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiService } from '../services/api';
import { useWorkflow } from '../contexts/WorkflowContext';

const ApiKeyInput = ({ label, name, value, onChange, required, description, showPassword, onTogglePassword, status, link }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/80">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {status && (
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
          status === 'valid' 
          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
        {status === 'valid' ? (
          <FiCheck className="w-3 h-3" />
          ) : (
          <FiAlertCircle className="w-3 h-3" />
          )}
          {status === 'valid' ? 'Valid' : 'Invalid'}
        </div>
        )}
    </div>
    
      <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-3 rounded-md bg-neutral-700/20
                   border border-neutral-700 text-white placeholder-white/60
                   focus:outline-none focus:ring-2 focus:ring-indigo-600 pr-12 shadow-sm"
        placeholder={`Enter your ${label.toLowerCase()}`}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 
                   text-white/60 hover:text-white rounded transition-colors duration-150"
      >
        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
      </button>
    </div>
    <div className="flex flex-row justify-between">
    {description && (
      <span className="text-sm text-white/70">{description}</span>
      )}
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors duration-150"
    >
      Get API Key
      <FiExternalLink className="w-3 h-3" />
    </a>
  </div>
  </div>
  );

const ApiSetupForm = () => {
  const { progressToNextStep } = useWorkflow();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [apiKeys, setApiKeys] = useState({
    gemini_key: '',
    sarvam_key: '',
    openai_key: ''
  });

  useEffect(() => {
    checkApiKeysStatus();
  }, []);

  const checkApiKeysStatus = async () => {
    try {
      const response = await apiService.getApiKeysStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Error checking API keys status:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.setupApiKeys(apiKeys);
      toast.success('API keys configured successfully!');
      await checkApiKeysStatus();
      progressToNextStep();
    } catch (error) {
      console.error('API setup error:', error);
      toast.error('Failed to configure API keys');
    } finally {
      setLoading(false);
    }
  };

  const apiKeyConfigs = [
    {
      name: 'gemini_key',
      label: 'Gemini API Key',
      required: false,
      description: 'Used for script generation and content analysis.',
      link: 'https://makersuite.google.com/app/apikey'
    },
    {
      name: 'sarvam_key', 
      label: 'Sarvam API Key',
      required: false,
      description: 'Optional: Used for Hindi text-to-speech generation.',
      link: 'https://sarvam.ai'
    },
    {
      name: 'openai_key',
      label: 'OpenAI API Key', 
      required: false,
      description: 'Optional: Alternative for script generation.',
      link: 'https://platform.openai.com/api-keys'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Configure API Keys
        </h2>
        <p className="text-white/80">
          Set up your API keys to enable AI-powered features. All keys are optional and stored securely.
        </p>
      </div>

      {/* form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <GlowCard className="p-6 bg-white/5 text-white rounded-xl border border-neutral-700 space-y-6">
        {/* loading indicator */}
        {loading && (
          <div className="h-1 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
            <div className="h-full w-full animate-pulse bg-gray-700 dark:bg-gray-400" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {apiKeyConfigs.map((config) => (
            <div key={config.name} className="space-y-2">
              <ApiKeyInput
                label={config.label}
                name={config.name}
                value={apiKeys[config.name]}
                onChange={handleInputChange}
                required={config.required}
                description={config.description}
                showPassword={showPasswords[config.name]}
                onTogglePassword={() => togglePasswordVisibility(config.name)}
                status={status[config.name]}
                link={config.link}
              />
              
              
            </div>
            ))}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <StarBorder as="button" type="submit" disabled={loading} className="sm:flex-1">
              <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent text-white font-medium text-sm w-full transition-colors duration-150 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Configuring...
                  </>
                ) : (
                  <>
                    <FiKey className="w-5 h-5" />
                    Save Configuration
                  </>
                )}
              </div>
            </StarBorder>
            <button
              type="button"
              onClick={progressToNextStep}
              className="sm:flex-1 flex items-center justify-center gap-2 px-4 py-2
                         rounded-md border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800
                         text-gray-900 dark:text-gray-100 font-medium text-sm w-full
                         transition-colors duration-150"
            >
              Skip for Now
            </button>
          </div>
          </form>

          {/* security notice */}
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-white/80 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-white/80">
                <p className="font-medium mb-1">API Key Security</p>
                <p>Your API keys are encrypted and stored securely. You can update or remove them at any time.</p>
              </div>
            </div>
          </div>
        </GlowCard>
      </motion.div>
      </div>
      );
};

export default ApiSetupForm;