import { apiService } from './apiService';

export const settingsService = {
  // ==================== BASIC SETTINGS OPERATIONS ====================
  async getSettings() {
    try {
      const response = await apiService.get('/settings');
      return response;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw new Error('Failed to load system settings');
    }
  },

  async updateSettings(settings) {
    try {
      const response = await apiService.put('/settings', settings);
      return response;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update system settings');
    }
  },

  // ==================== LOGO OPERATIONS ====================
  async uploadLogo(formData) {
    try {
      const response = await apiService.upload('/settings/upload-logo', formData);
      return response;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error(error.message || 'Failed to upload logo');
    }
  },

  async deleteLogo() {
    try {
      const response = await apiService.delete('/settings/logo');
      return response;
    } catch (error) {
      console.error('Error deleting logo:', error);
      throw new Error(error.message || 'Failed to delete logo');
    }
  },

  // ==================== BACKGROUND IMAGE OPERATIONS ====================
  async uploadBackground(formData) {
    try {
      const response = await apiService.upload('/settings/upload-background', formData);
      return response;
    } catch (error) {
      console.error('Error uploading background:', error);
      throw new Error(error.message || 'Failed to upload background image');
    }
  },

  async deleteBackground(screenType) {
    try {
      const response = await apiService.delete(`/settings/background/${screenType}`);
      return response;
    } catch (error) {
      console.error('Error deleting background:', error);
      throw new Error(error.message || 'Failed to delete background image');
    }
  },

  // ==================== VIDEO OPERATIONS ====================
  async uploadVideo(formData) {
    try {
      const response = await apiService.upload('/settings/upload-video', formData);
      return response;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error(error.message || 'Failed to upload video');
    }
  },

  // ==================== ADVERTISEMENT OPERATIONS ====================
  async updateAdvertisements(advertisements) {
    try {
      const response = await apiService.put('/settings/advertisements', { advertisements });
      return response;
    } catch (error) {
      console.error('Error updating advertisements:', error);
      throw new Error('Failed to update advertisements');
    }
  },

  // ==================== SYSTEM MAINTENANCE OPERATIONS ====================
  async deleteAllData() {
    try {
      console.log('🚨 Starting delete all data process...');
      const response = await apiService.delete('/settings/delete-all-data');
      console.log('✅ Delete all data response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error deleting all data:', error);
      throw new Error(error.message || 'Failed to delete system data');
    }
  },

  async resetSystem() {
    try {
      const response = await apiService.post('/settings/reset');
      return response;
    } catch (error) {
      console.error('Error resetting system:', error);
      throw new Error('Failed to reset system');
    }
  },

  // ==================== BACKUP & RESTORE OPERATIONS ====================
  async exportSettings() {
    try {
      const response = await apiService.get('/settings/export');
      return response;
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  },

  async importSettings(settingsData) {
    try {
      const response = await apiService.post('/settings/import', settingsData);
      return response;
    } catch (error) {
      console.error('Error importing settings:', error);
      throw new Error('Failed to import settings');
    }
  },

  // ==================== UTILITY METHODS ====================
  async validateSettings(settings) {
    try {
      const requiredFields = ['hospitalName', 'language', 'maxWaitTime'];
      const missingFields = requiredFields.filter(field => !settings[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error validating settings:', error);
      throw error;
    }
  },

  async getDefaultSettings() {
    return {
      hospitalName: 'Razi Hospital',
      hospitalLogo: '',
      language: 'en',
      autoCall: true,
      soundNotifications: true,
      displayAnnouncements: true,
      maxWaitTime: 30,
      priorityRules: 'emergency,priority,senior,child,normal',
      themes: {
        primaryColor: '#2980b9',
        secondaryColor: '#2c3e50',
        backgroundColor: '#ecf0f1',
        fontFamily: 'Segoe UI'
      },
      advertisements: [
        {
          text: 'Quality Healthcare Services - Welcome to Razi Hospital',
          duration: 30,
          active: true,
          type: 'text'
        }
      ],
      waitingScreen: {
        backgroundColor: '#1a5276',
        textColor: '#ffffff',
        showAds: true,
        customMessage: '',
        backgroundImage: ''
      },
      dispenserSettings: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        autoPrint: true,
        welcomeMessage: 'Welcome to Razi Hospital',
        backgroundImage: ''
      },
      counterScreen: {
        backgroundColor: '#f8f9fa',
        textColor: '#333333'
      }
    };
  },

  // ==================== CACHE MANAGEMENT ====================
  async clearSettingsCache() {
    try {
      // Clear any cached settings
      if (typeof window !== 'undefined') {
        localStorage.removeItem('system-settings');
        sessionStorage.removeItem('system-settings');
      }
      return { success: true, message: 'Settings cache cleared' };
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new Error('Failed to clear settings cache');
    }
  },

  // ==================== VALIDATION HELPERS ====================
  validateLogoFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB (matches backend)

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or SVG images.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    return true;
  },

  validateBackgroundFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB (matches backend)

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, or GIF images.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    return true;
  },

  validateVideoFile(file) {
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    const maxSize = 50 * 1024 * 1024; // 50MB (matches backend)

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload MP4, AVI, MOV, or WMV videos.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 50MB.');
    }

    return true;
  },

  // ==================== SETTINGS TRANSFORMATION ====================
  transformSettingsForExport(settings) {
    return {
      ...settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      exportType: 'system-settings'
    };
  },

  transformSettingsForImport(importedSettings) {
    // Remove export metadata and validate structure
    const { exportDate, version, exportType, ...cleanSettings } = importedSettings;
    
    // Ensure required fields exist
    const defaultSettings = this.getDefaultSettings();
    return {
      ...defaultSettings,
      ...cleanSettings,
      // Ensure nested objects are properly merged
      themes: {
        ...defaultSettings.themes,
        ...cleanSettings.themes
      },
      waitingScreen: {
        ...defaultSettings.waitingScreen,
        ...cleanSettings.waitingScreen
      },
      dispenserSettings: {
        ...defaultSettings.dispenserSettings,
        ...cleanSettings.dispenserSettings
      },
      counterScreen: {
        ...defaultSettings.counterScreen,
        ...cleanSettings.counterScreen
      },
      advertisements: cleanSettings.advertisements || defaultSettings.advertisements
    };
  }
};

export default settingsService;