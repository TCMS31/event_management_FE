import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEvent } from '../context/EventContext';

/**
 * Gates a route on an authenticated session.
 *
 * This replaces a `useEffect` in `App` that called `navigate('/login')` after
 * the protected screen had already mounted and fired its API requests. Routing
 * the decision through the router means the guarded component never renders,
 * and the attempted path is preserved so sign-in can return the user to it.
 */
const ProtectedRoute = ({ children }) => {
  const {
    state: { isAuthenticated },
  } = useEvent();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
