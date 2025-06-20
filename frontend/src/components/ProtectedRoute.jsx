import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />; // Or a specific 'Forbidden' page
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
