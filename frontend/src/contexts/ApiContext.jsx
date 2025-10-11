import React, { createContext, useContext, useState } from 'react';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const [apiKeys, setApiKeys] = useState({
    gemini: localStorage.getItem('gemini_key') || '',
    sarvam: localStorage.getItem('sarvam_key') || '',
    openai: localStorage.getItem('openai_key') || ''
  });

  const [apiStatus, setApiStatus] = useState({
    gemini: false,
    sarvam: false,
    openai: false
  });

  const updateApiKey = (service, key) => {
    setApiKeys(prev => ({ ...prev, [service]: key }));
    localStorage.setItem(`${service}_key`, key);
  };

  const clearApiKeys = () => {
    setApiKeys({ gemini: '', sarvam: '', openai: '' });
    localStorage.removeItem('gemini_key');
    localStorage.removeItem('sarvam_key');
    localStorage.removeItem('openai_key');
  };

  const value = {
    apiKeys,
    apiStatus,
    setApiStatus,
    updateApiKey,
    clearApiKeys
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
    );
};
