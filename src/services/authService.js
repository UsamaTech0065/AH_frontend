const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.isBrowserClosing = false;
    this.initializeSessionHandlers();
  }

  async login(username, password, component) {
    console.log(`🔐 Attempting login for: ${username}, component: ${component}`);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, component }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Login failed:', data.message);
      throw new Error(data.message || 'Login failed');
    }

    console.log('✅ Login successful');

    // Store authentication data in sessionStorage for browser session persistence
    const userData = {
      ...data.user,
      component: component
    };

    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);
    sessionStorage.setItem('component', component);
    sessionStorage.setItem('loginTime', new Date().toISOString());

    return { user: userData, tokens: data };
  }

  async logout(refreshToken = null) {
    try {
      const token = this.getToken();
      if (token || refreshToken) {
        const response = await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
          console.warn('Logout API call failed, but clearing local storage anyway');
        }
      }
    } catch (error) {
      console.error('Error calling logout API:', error);
    } finally {
      // Always clear storage
      this.clearSession();
    }
  }

  async refreshToken(refreshToken) {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    // Update stored tokens in sessionStorage for session persistence
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);

    return data;
  }

  async validateToken(token) {
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  clearLocalStorage() {
    // Keep only non-auth related items if needed
    const keysToKeep = ['settings', 'language', 'theme']; // Example: keep app preferences
    
    // Create backup of items to keep
    const backup = {};
    keysToKeep.forEach(key => {
      if (localStorage.getItem(key)) {
        backup[key] = localStorage.getItem(key);
      }
    });
    
    // Clear all localStorage
    localStorage.clear();
    
    // Restore items to keep
    Object.keys(backup).forEach(key => {
      localStorage.setItem(key, backup[key]);
    });
  }

  clearSessionStorage() {
    sessionStorage.clear();
  }

  clearSession() {
    this.clearSessionStorage();
    this.clearLocalStorage();
  }

  // ✅ MODIFIED: Token persists until browser is closed
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    if (!token || !user) {
      return false;
    }

    // ✅ REMOVED: All time-based expiration checks
    // Session will now persist until browser is completely closed
    // or user explicitly logs out

    console.log('🔐 User authenticated, session valid until browser close');
    return true;
  }

  getCurrentUser() {
    try {
      const user = sessionStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  getToken() {
    return sessionStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return sessionStorage.getItem('refreshToken');
  }

  getCurrentComponent() {
    return sessionStorage.getItem('component');
  }

  hasPermission(permission) {
    const user = this.getCurrentUser();
    return user?.permissions?.[permission] || user?.role === 'admin';
  }

  // Enhanced component access validation - ALLOW ADMIN TO ACCESS ALL COMPONENTS
  validateComponentAccess(component) {
    const currentComponent = this.getCurrentComponent();
    const user = this.getCurrentUser();
    
    if (!this.isAuthenticated()) {
      console.log('❌ Not authenticated, redirecting to login');
      return { valid: false, redirect: `/login?component=${component}` };
    }

    // ADMIN CAN ACCESS ALL COMPONENTS WITHOUT RESTRICTION
    if (user?.role === 'admin') {
      console.log('✅ Admin access granted to all components');
      return { valid: true };
    }

    // For non-admin users, check component-specific access
    if (currentComponent !== component) {
      console.log(`❌ Component mismatch: current=${currentComponent}, requested=${component}`);
      return { valid: false, redirect: `/login?component=${component}` };
    }

    // Component-specific access checks for non-admin users
    const hasAccess = (() => {
      switch (component) {
        case 'admin':
          return user?.role === 'admin';
        case 'counter':
          return ['admin', 'operator', 'counter'].includes(user?.role);
        case 'dispenser':
          return ['admin', 'dispenser'].includes(user?.role) || 
                 user?.permissions?.canGenerateTickets;
        case 'waiting':
        case 'display':
          return ['admin', 'display'].includes(user?.role);
        default:
          return true;
      }
    })();

    if (!hasAccess) {
      console.log(`❌ Access denied for component: ${component}, role: ${user?.role}`);
      return { 
        valid: false, 
        redirect: '/login',
        message: 'Access denied for this component' 
      };
    }

    console.log(`✅ Access granted to component: ${component}`);
    return { valid: true };
  }

  // Check if user can access component (without redirect)
  canAccessComponent(component) {
    const user = this.getCurrentUser();
    
    if (!user) return false;

    // Admin can access everything
    if (user.role === 'admin') return true;

    // Component-specific access for non-admin users
    switch (component) {
      case 'admin':
        return user.role === 'admin';
      case 'counter':
        return ['admin', 'operator', 'counter'].includes(user.role);
      case 'dispenser':
        return ['admin', 'dispenser'].includes(user.role) || 
               user.permissions?.canGenerateTickets;
      case 'waiting':
      case 'display':
        return ['admin', 'display'].includes(user.role);
      default:
        return true;
    }
  }

  // Generate temporary access for components
  generateComponentAccess(component) {
    const user = this.getCurrentUser();
    
    if (!user) {
      return null;
    }

    // Admin can generate access to any component
    if (user.role === 'admin') {
      const tempAccess = {
        user: {
          ...user,
          component: component,
          temporary: true
        },
        accessToken: this.getToken(),
        component: component,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
      };
      
      return tempAccess;
    }

    return null;
  }

  // Session persistence methods
  initializeSessionHandlers() {
    // Set up beforeunload to detect browser close
    window.addEventListener('beforeunload', (event) => {
      // This will trigger when the browser/tab is being closed
      this.isBrowserClosing = true;
    });

    // Set up pagehide for mobile browsers
    window.addEventListener('pagehide', (event) => {
      this.isBrowserClosing = true;
    });

    // Set up visibility change to detect tab switches
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Tab switched or minimized, but not necessarily closing
        console.log('🔄 Tab hidden, session maintained');
      }
    });

    // Check if we're returning to a page (not a fresh load)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('🔄 Page restored from bfcache, session maintained');
      }
    });

    console.log('🔄 Session handlers initialized - session will persist until browser close');
  }

  // Check if session needs refresh
  async checkAndRefreshToken() {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (!token && refreshToken) {
      try {
        console.log('🔄 Token expired, attempting refresh...');
        const newTokens = await this.refreshToken(refreshToken);
        console.log('✅ Token refreshed successfully');
        return newTokens;
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        this.clearSession();
        throw new Error('Session expired. Please login again.');
      }
    }
    
    return null;
  }

  // ========== USER MANAGEMENT METHODS ==========

  /**
   * Get all users with optional filtering
   * @param {string} role - Filter by role (admin, operator, dispenser, display)
   * @param {string} counterId - Filter by counter ID
   * @returns {Promise<Array>} List of users
   */
  async getUsers(role = null, counterId = null) {
    const token = this.getToken();
    let url = `${API_URL}/auth/users`;
    
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (counterId) params.append('counterId', counterId);
    
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch users');
    }

    return data;
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user');
    }

    return data;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create user');
    }

    return data;
  }

  /**
   * Update user by ID
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user');
    }

    return data;
  }

  /**
   * Delete user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteUser(userId) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete user');
    }

    return data;
  }

  /**
   * Create a counter-specific user
   * @param {string} counterId - Counter ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createCounterUser(counterId, userData) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/counters/${counterId}/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create counter user');
    }

    return data;
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {Object} passwordData - Password data { currentPassword, newPassword }
   * @returns {Promise<Object>} Update result
   */
  async updateUserPassword(userId, passwordData) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(passwordData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update password');
    }

    return data;
  }

  /**
   * Reset user password (admin only)
   * @param {string} userId - User ID
   * @param {Object} resetData - Reset data { newPassword }
   * @returns {Promise<Object>} Reset result
   */
  async resetUserPassword(userId, resetData) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(resetData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return data;
  }

  /**
   * Toggle user active status
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} Updated user
   */
  async toggleUserStatus(userId, isActive) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user status');
    }

    return data;
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user statistics');
    }

    return data;
  }

  /**
   * Get user activity logs
   * @param {string} userId - User ID (optional)
   * @param {number} limit - Number of logs to fetch (optional)
   * @returns {Promise<Array>} Activity logs
   */
  async getUserActivityLogs(userId = null, limit = 50) {
    const token = this.getToken();
    let url = `${API_URL}/auth/users/activity-logs?limit=${limit}`;
    
    if (userId) url += `&userId=${userId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch activity logs');
    }

    return data;
  }

  /**
   * Bulk update users
   * @param {Array} users - Array of user updates
   * @returns {Promise<Object>} Bulk update result
   */
  async bulkUpdateUsers(users) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/users/bulk-update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ users }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to bulk update users');
    }

    return data;
  }
}

export const authService = new AuthService();

// API interceptor for automatic token attachment
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [url, options = {}] = args;
  
  // Add authorization header for API calls
  if (url.includes('/api/') && !url.includes('/auth/login') && !url.includes('/auth/refresh-token') && !url.includes('/auth/logout')) {
    const token = authService.getToken();
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  let response = await originalFetch(url, options);
  
  // Handle token expiration
  if (response.status === 401 && !url.includes('/auth/login')) {
    const refreshToken = authService.getRefreshToken();
    
    if (refreshToken) {
      try {
        const newTokens = await authService.refreshToken(refreshToken);
        
        // Retry original request with new token
        if (options.headers) {
          options.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        }
        
        response = await originalFetch(url, options);
      } catch (error) {
        // Refresh failed, logout user
        authService.logout();
        throw new Error('Session expired. Please login again.');
      }
    } else {
      authService.logout();
      throw new Error('Session expired. Please login again.');
    }
  }
  
  return response;
};