import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Login from '../../pages/Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your session...</p>
        </div>
      </div>
      );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute;
