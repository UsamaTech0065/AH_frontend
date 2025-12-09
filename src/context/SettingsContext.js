import React, { createContext, useState, useContext, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default settings structure
  const defaultSettings = {
    hospitalName: 'Razi Hospital',
    hospitalLogo: '',
    hospitalContact: '',
    language: 'en',
    maxWaitTime: 30,
    soundNotifications: true,
    themes: {
      primaryColor: '#2980b9',
      secondaryColor: '#2c3e50',
      backgroundColor: '#ecf0f1',
      accentColor: '#e74c3c',
      fontFamily: 'Segoe UI',
      fontSize: 'medium',
      borderRadius: 'medium',
      shadowIntensity: 'medium'
    },
    waitingScreen: {
      backgroundColor: '#1a5276',
      textColor: '#ffffff',
      backgroundImage: '',
      showAds: true,
      soundNotifications: true,
      customMessage: '',
      language: 'en',
      ads: [
        { 
          id: 1, 
          type: 'text', 
          content: 'Quality Healthcare Services Available 24/7',
          active: true 
        },
        { 
          id: 2, 
          type: 'text', 
          content: 'Expert Medical Professionals at Your Service',
          active: true 
        },
        { 
          id: 3, 
          type: 'text', 
          content: '24/7 Emergency Services Available',
          active: true 
        }
      ]
    },
    dispenserSettings: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      backgroundImage: '',
      welcomeMessage: 'Welcome to Razi Hospital',
      autoPrint: true,
      ticketLayout: 'standard'
    },
    counterScreen: {
      backgroundColor: '#f8f9fa',
      textColor: '#333333',
      soundAlerts: true,
      showActivityLog: true,
      queueLimit: 8
    },
    individualWaiting: {
      backgroundColor: '#1a5276',
      textColor: '#ffffff',
      backgroundImage: '',
      queueSize: 8,
      showTime: true
    },
    advertisements: []
  };

  // Apply theme to document
  const applyThemeToDocument = (themes) => {
    if (!themes) return;
    
    const root = document.documentElement;
    
    // Set CSS custom properties
    root.style.setProperty('--primary-color', themes.primaryColor);
    root.style.setProperty('--secondary-color', themes.secondaryColor);
    root.style.setProperty('--background-color', themes.backgroundColor);
    root.style.setProperty('--accent-color', themes.accentColor);
    root.style.setProperty('--font-family', themes.fontFamily);
    
    // Set font size
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    root.style.setProperty('--base-font-size', fontSizes[themes.fontSize] || '16px');
    
    // Set border radius
    const borderRadii = {
      none: '0',
      small: '4px',
      medium: '8px',
      large: '12px',
      full: '50px'
    };
    root.style.setProperty('--border-radius', borderRadii[themes.borderRadius] || '8px');
    
    // Set shadow intensity
    const shadows = {
      none: 'none',
      subtle: '0 1px 3px rgba(0,0,0,0.1)',
      medium: '0 2px 8px rgba(0,0,0,0.15)',
      strong: '0 4px 12px rgba(0,0,0,0.2)'
    };
    root.style.setProperty('--box-shadow', shadows[themes.shadowIntensity] || '0 2px 8px rgba(0,0,0,0.15)');
    
    // Apply font family to body
    document.body.style.fontFamily = themes.fontFamily;
  };

  // Deep merge function for settings
  const deepMergeSettings = (existing, updates) => {
    const result = { ...existing };
    
    for (const key in updates) {
      if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        result[key] = deepMergeSettings(existing[key] || {}, updates[key]);
      } else {
        result[key] = updates[key];
      }
    }
    
    return result;
  };

  // Load settings on app start and set up storage listener
  useEffect(() => {
    loadSettings();
    
    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'hospitalSettings' || e.key === 'app_settings') {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings);
          if (newSettings.themes) {
            applyThemeToDocument(newSettings.themes);
          }
        } catch (error) {
          console.error('Error parsing settings from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Try to load from localStorage first for immediate access
      const localSettings = localStorage.getItem('hospitalSettings');
      let settingsData = localSettings ? JSON.parse(localSettings) : null;
      
      // Then try to load from API/service
      try {
        const apiSettings = await settingsService.getSettings();
        if (apiSettings) {
          settingsData = apiSettings;
        }
      } catch (apiError) {
        console.warn('Failed to load settings from API, using local storage:', apiError);
      }
      
      // Ensure all required fields exist with defaults
      const completeSettings = deepMergeSettings(defaultSettings, settingsData || {});
      
      setSettings(completeSettings);
      
      // Save to localStorage for immediate access
      localStorage.setItem('hospitalSettings', JSON.stringify(completeSettings));
      
      // Apply theme
      applyThemeToDocument(completeSettings.themes);
      
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default settings if everything fails
      setSettings(defaultSettings);
      localStorage.setItem('hospitalSettings', JSON.stringify(defaultSettings));
      applyThemeToDocument(defaultSettings.themes);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = typeof newSettings === 'function' 
        ? newSettings(settings) 
        : newSettings;

      // Merge with existing settings
      const mergedSettings = deepMergeSettings(settings, updatedSettings);
      
      // Try to save to API/service
      try {
        await settingsService.updateSettings(mergedSettings);
      } catch (apiError) {
        console.warn('Failed to update settings via API, saving locally:', apiError);
      }
      
      setSettings(mergedSettings);
      
      // Save to localStorage for immediate access
      localStorage.setItem('hospitalSettings', JSON.stringify(mergedSettings));
      
      // Apply theme if themes were updated
      if (updatedSettings.themes) {
        applyThemeToDocument(mergedSettings.themes);
      }
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      return mergedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    
    // Save to localStorage
    localStorage.setItem('hospitalSettings', JSON.stringify(defaultSettings));
    
    // Try to reset via API
    try {
      settingsService.updateSettings(defaultSettings);
    } catch (apiError) {
      console.warn('Failed to reset settings via API:', apiError);
    }
    
    // Apply default theme
    applyThemeToDocument(defaultSettings.themes);
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
  };

  // NEW: Delete all data function
  const deleteAllData = async () => {
    try {
      console.log('🗑️ Starting deletion of all system data...');
      
      // Clear all localStorage data related to the application
      const keysToRemove = [
        'hospitalSettings',
        'app_settings',
        'counterData',
        'queueData',
        'tokenData',
        'patientData',
        'departmentData',
        'userPreferences',
        'activityLogs',
        'reportsData'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear any indexedDB databases if used
      if (window.indexedDB) {
        try {
          const databases = await window.indexedDB.databases();
          databases.forEach(db => {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        } catch (indexedDBError) {
          console.warn('Could not clear indexedDB:', indexedDBError);
        }
      }
      
      // Call API service to delete server data
      try {
        await settingsService.deleteAllData();
        console.log('✅ Server data deletion completed');
      } catch (apiError) {
        console.warn('⚠️ Server data deletion failed, but local data cleared:', apiError);
      }
      
      // Reset to default settings
      setSettings(defaultSettings);
      localStorage.setItem('hospitalSettings', JSON.stringify(defaultSettings));
      
      // Apply default theme
      applyThemeToDocument(defaultSettings.themes);
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      console.log('✅ All system data deleted successfully');
      
      return { success: true, message: 'All system data has been deleted successfully' };
      
    } catch (error) {
      console.error('❌ Error deleting all data:', error);
      throw new Error(`Failed to delete all data: ${error.message}`);
    }
  };

  const refreshSettings = () => {
    loadSettings();
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    deleteAllData, // NEW: Added deleteAllData function
    refreshSettings,
    loading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};