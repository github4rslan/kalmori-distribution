import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const role = user?.user_role || user?.role;
  if (!allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;

  return children;
};

export default RoleRoute;
