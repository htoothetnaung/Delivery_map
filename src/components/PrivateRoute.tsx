/* eslint-disable @typescript-eslint/no-unused-vars */
import { Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import { ReactElement } from 'react';
import Authenticate from './Authenticate';

const PrivateRoute = ({ element, requiredRole, ...rest }: { element: ReactElement; requiredRole: string }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('authToken')); // Example using localStorage
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole')); // Example user role from localStorage

  // If the user is not authenticated or doesn't have the required role, show a message
  if (!isAuthenticated) {
    return (
      <div>
        <h2>You need to be authenticated to access this page.</h2>
        <p>Please log in to continue.</p>
       
      </div>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    return (
      <div>
        <h2>Access Denied!</h2>
        <p>You need to have an admin role to access this page.</p>
      </div>
    );
  }

  return <Route {...rest} element={element} />;
};

export default PrivateRoute;