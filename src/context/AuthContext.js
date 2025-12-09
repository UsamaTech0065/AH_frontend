import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enhanced token validation with session storage fallback
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Simple token validation (you can add API call for proper validation)
          const isTokenValid = await checkTokenValidity(token);
          
          if (isTokenValid) {
            setUser(parsedUser);
          } else {
            // Token is invalid, clear storage
            clearAuthStorage();
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          clearAuthStorage();
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const checkTokenValidity = async (token) => {
    // Add your token validation logic here
    // For now, we'll assume token is valid if it exists
    return !!token;
  };

  const clearAuthStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const login = (userData, rememberMe = true) => {
    setUser(userData);
    
    if (rememberMe) {
      // Store in localStorage for persistence across browser restarts
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      // Store in sessionStorage for tab session only
      sessionStorage.setItem('token', userData.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    clearAuthStorage();
    // Redirect to login page
    window.location.href = '/login';
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};