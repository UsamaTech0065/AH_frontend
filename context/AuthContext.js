import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

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
  const [token, setToken] = useState(null);

  // Enhanced token validation with session storage fallback
  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (accessToken && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Validate token with backend
          const isValid = await authService.validateToken(accessToken);
          
          if (isValid) {
            setUser(parsedUser);
            setToken(accessToken);
          } else if (refreshToken) {
            // Try to refresh token
            try {
              const newTokens = await authService.refreshToken(refreshToken);
              if (newTokens) {
                setToken(newTokens.accessToken);
                setUser(parsedUser);
                
                // Store new tokens
                const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage;
                storage.setItem('accessToken', newTokens.accessToken);
                storage.setItem('refreshToken', newTokens.refreshToken);
              } else {
                clearAuthStorage();
              }
            } catch (error) {
              console.error('Token refresh failed:', error);
              clearAuthStorage();
            }
          } else {
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

  const clearAuthStorage = () => {
    // Get tokens before clearing
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('component');
    localStorage.removeItem('loginTime');
    
    // Clear session storage
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('component');
    sessionStorage.removeItem('loginTime');
    
    setUser(null);
    setToken(null);

    // Call logout API to invalidate tokens on server
    if (accessToken || refreshToken) {
      authService.logout(refreshToken).catch(error => {
        console.error('Logout API call failed:', error);
      });
    }
  };

  const login = (userData, tokens, rememberMe = true) => {
    setUser(userData);
    setToken(tokens.accessToken);
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', tokens.accessToken);
    storage.setItem('refreshToken', tokens.refreshToken);
    storage.setItem('user', JSON.stringify(userData));
    storage.setItem('component', userData.component || '');
    storage.setItem('loginTime', new Date().toISOString());
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    
    try {
      await authService.logout(refreshToken);
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthStorage();
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const updateToken = (newToken) => {
    setToken(newToken);
    const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage;
    storage.setItem('accessToken', newToken);
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    updateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};