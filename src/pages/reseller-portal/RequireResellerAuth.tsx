import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isResellerPortalAuthenticated } from '../../services/resellerPortalAuth';

const RequireResellerAuth: React.FC = () => {
  if (!isResellerPortalAuthenticated()) {
    return <Navigate to="/partner/login" replace />;
  }
  return <Outlet />;
};

export default RequireResellerAuth;
