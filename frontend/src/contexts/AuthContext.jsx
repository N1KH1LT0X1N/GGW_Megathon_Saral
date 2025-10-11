// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  // Set up API interceptor for auth headers
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => api.interceptors.request.eject(interceptor);
  }, [token]);

  // Check authentication status on app load
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify');
      setUser(response.data.user);
    } catch (error) {
      console.warn('Token verification failed, clearing auth:', error.message);
      // Clear invalid token silently
      setToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/google/login', {
        token: googleToken
      });

      const { access_token, user } = response.data;
      
      setToken(access_token);
      setUser(user);
      localStorage.setItem('auth_token', access_token);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value = {
    user,
    token,
    loading,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
    );
};
