import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children, component }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const currentComponent = authService.getCurrentComponent();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={`/login/${component}`} state={{ from: location }} replace />;
  }

  // Check if user has access to this component
  if (currentComponent !== component) {
    // User logged in for different component, redirect to appropriate login
    authService.logout();
    return <Navigate to={`/login/${component}`} state={{ from: location }} replace />;
  }

  // Component-specific access checks
  const hasAccess = (() => {
    switch (component) {
      case 'admin':
        return currentUser?.role === 'admin';
      case 'counter':
        return ['admin', 'operator', 'counter'].includes(currentUser?.role);
      case 'dispenser':
        return ['admin', 'dispenser'].includes(currentUser?.role) || 
               currentUser?.permissions?.canGenerateTickets;
      case 'waiting':
      case 'display':
        return ['admin', 'display'].includes(currentUser?.role);
      default:
        return true;
    }
  })();

  if (!hasAccess) {
    return (
      <div className="access-denied">
        <div className="denied-content">
          <i className="fas fa-ban"></i>
          <h2>Access Denied</h2>
          <p>You don't have permission to access the {component} component.</p>
          <p>Your role: {currentUser?.role}</p>
          <button onClick={() => authService.logout()} className="btn btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;