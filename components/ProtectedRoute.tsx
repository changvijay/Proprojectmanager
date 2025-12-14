import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // Note: using HashRouter in App, but imports are from react-router-dom
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface Props {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
      <p className="text-gray-600">You do not have permission to view this page.</p>
    </div>;
  }

  return <Outlet />;
};