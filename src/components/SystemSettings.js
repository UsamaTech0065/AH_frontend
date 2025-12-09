import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { useSettings } from '../context/SettingsContext';
import '../styles/SystemSettings.css';

const SystemSettings = () => {
  const { settings: contextSettings, updateSettings, refreshSettings } = useSettings();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Upload states
  const [activeSubTab, setActiveSubTab] = useState('waiting');
  const [logoUploading, setLogoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);

  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    }
  }, [contextSettings]);

  useEffect(() => {
    if (!settings && contextSettings) {
      setSettings(contextSettings);
    }
  }, [settings, contextSettings]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      setMessage('');
      
      const updatedSettings = await updateSettings(settings);
      setSettings(updatedSettings);
      setHasUnsavedChanges(false);
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleThemeChange = (themeKey, value) => {
    setSettings(prev => ({
      ...prev,
      themes: {
        ...prev.themes,
        [themeKey]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Handle display settings changes
  const handleDisplaySettingChange = (screenType, field, value) => {
    setSettings(prev => ({
      ...prev,
      [screenType]: {
        ...prev[screenType],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleAdvertisementChange = (index, field, value) => {
    const updatedAds = [...settings.advertisements];
    updatedAds[index] = {
      ...updatedAds[index],
      [field]: value
    };
    
    setSettings(prev => ({
      ...prev,
      advertisements: updatedAds
    }));
    setHasUnsavedChanges(true);
  };

  const addAdvertisement = () => {
    if (settings.advertisements.length >= 10) {
      setMessage('Maximum 10 advertisements allowed');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSettings(prev => ({
      ...prev,
      advertisements: [
        ...prev.advertisements,
        {
          text: 'New Advertisement - Edit this text',
          duration: 30,
          active: true,
          type: 'text'
        }
      ]
    }));
    setHasUnsavedChanges(true);
  };

  const removeAdvertisement = (index) => {
    if (settings.advertisements.length <= 1) {
      setMessage('You must have at least one advertisement');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const updatedAds = settings.advertisements.filter((_, i) => i !== index);
    setSettings(prev => ({
      ...prev,
      advertisements: updatedAds
    }));
    setHasUnsavedChanges(true);
  };

  // File upload functions
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setLogoUploading(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('logo', file);

      const result = await settingsService.uploadLogo(formData);
      
      setSettings(prev => ({
        ...prev,
        hospitalLogo: result.logoUrl
      }));
      
      setHasUnsavedChanges(true);
      setMessage('Logo uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage('Error uploading logo: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleVideoUpload = async (event, adIndex) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMessage('Please select a valid video file');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setVideoUploading(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('video', file);

      const result = await settingsService.uploadVideo(formData);
      
      const updatedAds = [...settings.advertisements];
      updatedAds[adIndex] = {
        ...updatedAds[adIndex],
        video: result.videoUrl,
        type: 'video'
      };
      
      setSettings(prev => ({
        ...prev,
        advertisements: updatedAds
      }));
      
      setHasUnsavedChanges(true);
      setMessage('Video uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading video:', error);
      setMessage('Error uploading video: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setVideoUploading(false);
    }
  };

  const handleBackgroundUpload = async (screenType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setBackgroundUploading(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('logo', file); // Reuse logo upload endpoint

      const result = await settingsService.uploadLogo(formData);
      
      if (screenType === 'waitingScreen') {
        setSettings(prev => ({
          ...prev,
          waitingScreen: {
            ...prev.waitingScreen,
            backgroundImage: result.logoUrl
          }
        }));
      } else if (screenType === 'dispenserSettings') {
        setSettings(prev => ({
          ...prev,
          dispenserSettings: {
            ...prev.dispenserSettings,
            backgroundImage: result.logoUrl
          }
        }));
      }
      
      setHasUnsavedChanges(true);
      setMessage('Background image uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading background image:', error);
      setMessage('Error uploading background image: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setBackgroundUploading(false);
    }
  };

  const removeBackgroundImage = (screenType) => {
    if (screenType === 'waitingScreen') {
      setSettings(prev => ({
        ...prev,
        waitingScreen: {
          ...prev.waitingScreen,
          backgroundImage: ''
        }
      }));
    } else if (screenType === 'dispenserSettings') {
      setSettings(prev => ({
        ...prev,
        dispenserSettings: {
          ...prev.dispenserSettings,
          backgroundImage: ''
        }
      }));
    }
    setHasUnsavedChanges(true);
    setMessage('Background image removed');
    setTimeout(() => setMessage(''), 3000);
  };

  const resetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        setSaving(true);
        const defaultSettings = {
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

        const updatedSettings = await updateSettings(defaultSettings);
        setSettings(updatedSettings);
        setHasUnsavedChanges(false);
        setMessage('Settings reset to defaults successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Error resetting settings:', error);
        setMessage('Error resetting settings: ' + (error.message || 'Unknown error'));
      } finally {
        setSaving(false);
      }
    }
  };

  const deleteAllData = async () => {
    if (deleteConfirmText !== 'DELETE ALL DATA') {
      setMessage('Please type "DELETE ALL DATA" to confirm');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setSaving(true);
      
      await settingsService.deleteAllData();
      
      setMessage('All data deleted successfully! System will reload...');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting data:', error);
      setMessage('Error deleting data: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const exportSettings = () => {
    if (!settings) return;
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospital-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setMessage('Settings exported successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        
        if (!importedSettings.hospitalName || !importedSettings.language) {
          throw new Error('Invalid settings file format');
        }

        setSaving(true);
        const updatedSettings = await updateSettings(importedSettings);
        setSettings(updatedSettings);
        setHasUnsavedChanges(false);
        setMessage('Settings imported successfully!');
        setTimeout(() => setMessage(''), 3000);
        
        event.target.value = '';
      } catch (error) {
        console.error('Error importing settings:', error);
        setMessage('Error importing settings: Invalid file format');
        setTimeout(() => setMessage(''), 3000);
      } finally {
        setSaving(false);
      }
    };
    reader.onerror = () => {
      setMessage('Error reading file');
      setTimeout(() => setMessage(''), 3000);
    };
    reader.readAsText(file);
  };

  const handleRefreshSettings = async () => {
    try {
      await refreshSettings();
      setHasUnsavedChanges(false);
      setMessage('Settings refreshed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error refreshing settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!settings) {
    return (
      <div className="system-settings loading">
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <div className="loading-text">Loading Settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="system-settings">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content danger-modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="title-icon danger">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                  <h3>Delete All Data</h3>
                  <p>This action cannot be undone</p>
                </div>
              </div>
              <button className="close-btn" onClick={closeDeleteConfirm}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="warning-section">
                <div className="warning-content">
                  <h4>This will permanently delete:</h4>
                  <div className="warning-list">
                    <div className="warning-item">
                      <i className="fas fa-users"></i>
                      <span>All patient tickets and queue data</span>
                    </div>
                    <div className="warning-item">
                      <i className="fas fa-desktop"></i>
                      <span>All counter assignments and history</span>
                    </div>
                    <div className="warning-item">
                      <i className="fas fa-building"></i>
                      <span>All department queues and statistics</span>
                    </div>
                    <div className="warning-item">
                      <i className="fas fa-chart-bar"></i>
                      <span>All activity logs and reports</span>
                    </div>
                    <div className="warning-item">
                      <i className="fas fa-palette"></i>
                      <span>All display settings and customizations</span>
                    </div>
                  </div>
                  <div className="warning-note">
                    <i className="fas fa-info-circle"></i>
                    Only system settings will be preserved
                  </div>
                </div>
              </div>
              
              <div className="confirmation-section">
                <label className="confirmation-label">
                  Type <strong>DELETE ALL DATA</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE ALL DATA"
                  className="confirmation-input"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-danger" 
                onClick={deleteAllData}
                disabled={deleteConfirmText !== 'DELETE ALL DATA' || saving}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i> Delete All Data
                  </>
                )}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={closeDeleteConfirm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="settings-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">System Settings</h1>
            <p className="page-subtitle">Configure and customize your hospital management system</p>
          </div>
          <div className="header-info">
            <div className="status-indicator">
              <span className={`status-dot ${hasUnsavedChanges ? 'unsaved' : 'saved'}`}></span>
              {hasUnsavedChanges ? 'Unsaved Changes' : 'All Changes Saved'}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleRefreshSettings}>
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          <i className={`fas ${message.includes('Error') ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
          <span>{message}</span>
        </div>
      )}

      {/* Settings Navigation */}
      <div className="settings-navigation">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <div className="tab-icon">
              <i className="fas fa-cog"></i>
            </div>
            <div className="tab-content">
              <div className="tab-title">General</div>
              <div className="tab-subtitle">Basic system configuration</div>
            </div>
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <div className="tab-icon">
              <i className="fas fa-list-ol"></i>
            </div>
            <div className="tab-content">
              <div className="tab-title">Queue Settings</div>
              <div className="tab-subtitle">Patient flow management</div>
            </div>
          </button>
          
          
          
          <button 
            className={`nav-tab ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <div className="tab-icon">
              <i className="fas fa-palette"></i>
            </div>
            <div className="tab-content">
              <div className="tab-title">Theme Settings</div>
              <div className="tab-subtitle">Visual customization</div>
            </div>
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'ads' ? 'active' : ''}`}
            onClick={() => setActiveTab('ads')}
          >
            <div className="tab-icon">
              <i className="fas fa-ad"></i>
            </div>
            <div className="tab-content">
              <div className="tab-title">Advertisements</div>
              <div className="tab-subtitle">Display messages</div>
            </div>
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <div className="tab-icon">
              <i className="fas fa-tools"></i>
            </div>
            <div className="tab-content">
              <div className="tab-title">Maintenance</div>
              <div className="tab-subtitle">System management</div>
            </div>
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>General Settings</h2>
              <p>Basic configuration for your hospital management system</p>
            </div>
            
            <div className="settings-grid">
              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-hospital"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Hospital Name</label>
                  <input
                    type="text"
                    className="setting-input"
                    value={settings.hospitalName}
                    onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                    placeholder="Enter hospital name"
                    required
                  />
                  <div className="setting-description">
                    This name will be displayed throughout the system
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-language"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Default Language</label>
                  <select
                    className="setting-select"
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic (العربية)</option>
                    <option value="ur">Urdu (اردو)</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                  </select>
                  <div className="setting-description">
                    System language for all interfaces
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Maximum Wait Time</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      className="setting-input"
                      value={settings.maxWaitTime}
                      onChange={(e) => handleInputChange('maxWaitTime', parseInt(e.target.value) || 30)}
                      min="5"
                      max="120"
                      required
                    />
                    <span className="input-unit">minutes</span>
                  </div>
                  <div className="setting-description">
                    Maximum estimated wait time shown to patients
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-image"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Hospital Logo</label>
                  <div className="logo-upload-section">
                    {settings.hospitalLogo && (
                      <div className="logo-preview">
                        <img src={settings.hospitalLogo} alt="Hospital Logo" />
                      </div>
                    )}
                    <label className="btn btn-outline">
                      <i className="fas fa-upload"></i> {settings.hospitalLogo ? 'Change Logo' : 'Upload Logo'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                        disabled={logoUploading}
                      />
                    </label>
                    {logoUploading && (
                      <div className="upload-status">
                        <i className="fas fa-spinner fa-spin"></i> Uploading...
                      </div>
                    )}
                  </div>
                  <div className="setting-description">
                    Upload hospital logo for branding
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Queue Settings</h2>
              <p>Configure patient flow and notification preferences</p>
            </div>
            
            <div className="settings-grid">
              <div className="setting-card toggle-card">
                <div className="setting-icon">
                  <i className="fas fa-phone"></i>
                </div>
                <div className="setting-content">
                  <div className="toggle-header">
                    <label className="setting-label">Auto-Call Next Patient</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.autoCall}
                        onChange={(e) => handleInputChange('autoCall', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-description">
                    Automatically call next patient when current is completed
                  </div>
                </div>
              </div>

              <div className="setting-card toggle-card">
                <div className="setting-icon">
                  <i className="fas fa-volume-up"></i>
                </div>
                <div className="setting-content">
                  <div className="toggle-header">
                    <label className="setting-label">Sound Notifications</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.soundNotifications}
                        onChange={(e) => handleInputChange('soundNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-description">
                    Play sound when calling patients
                  </div>
                </div>
              </div>

              <div className="setting-card toggle-card">
                <div className="setting-icon">
                  <i className="fas fa-bullhorn"></i>
                </div>
                <div className="setting-content">
                  <div className="toggle-header">
                    <label className="setting-label">Display Announcements</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.displayAnnouncements}
                        onChange={(e) => handleInputChange('displayAnnouncements', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-description">
                    Display announcements on waiting area screens
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-sort-amount-down"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Priority Rules Order</label>
                  <select
                    className="setting-select"
                    value={settings.priorityRules}
                    onChange={(e) => handleInputChange('priorityRules', e.target.value)}
                  >
                    <option value="emergency,priority,senior,child,normal">Emergency → Priority → Senior → Child → Normal</option>
                    <option value="priority,emergency,senior,child,normal">Priority → Emergency → Senior → Child → Normal</option>
                    <option value="senior,emergency,priority,child,normal">Senior → Emergency → Priority → Child → Normal</option>
                    <option value="child,senior,emergency,priority,normal">Child → Senior → Emergency → Priority → Normal</option>
                  </select>
                  <div className="setting-description">
                    Define the order in which patients are called based on priority
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        

        {activeTab === 'theme' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Theme Settings</h2>
              <p>Customize the visual appearance of your system</p>
            </div>
            
            <div className="settings-grid">
              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-paint-brush"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Primary Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="color-picker"
                      value={settings.themes?.primaryColor || '#2980b9'}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="color-input"
                      value={settings.themes?.primaryColor || '#2980b9'}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                      placeholder="#2980b9"
                    />
                  </div>
                  <div className="setting-description">
                    Main brand color for buttons and headers
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-fill-drip"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Secondary Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="color-picker"
                      value={settings.themes?.secondaryColor || '#2c3e50'}
                      onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="color-input"
                      value={settings.themes?.secondaryColor || '#2c3e50'}
                      onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                      placeholder="#2c3e50"
                    />
                  </div>
                  <div className="setting-description">
                    Secondary color for backgrounds and borders
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-square"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Background Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="color-picker"
                      value={settings.themes?.backgroundColor || '#ecf0f1'}
                      onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="color-input"
                      value={settings.themes?.backgroundColor || '#ecf0f1'}
                      onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                      placeholder="#ecf0f1"
                    />
                  </div>
                  <div className="setting-description">
                    Background color for screens and panels
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">
                  <i className="fas fa-font"></i>
                </div>
                <div className="setting-content">
                  <label className="setting-label">Font Family</label>
                  <select
                    className="setting-select"
                    value={settings.themes?.fontFamily || 'Segoe UI'}
                    onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                  >
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                  <div className="setting-description">
                    Font family for all text in the system
                  </div>
                </div>
              </div>

              <div className="setting-card full-width">
                <div className="setting-content">
                  <label className="setting-label">Theme Preview</label>
                  <div className="theme-preview">
                    <div 
                      className="preview-container"
                      style={{
                        backgroundColor: settings.themes?.backgroundColor,
                        color: settings.themes?.secondaryColor,
                        fontFamily: settings.themes?.fontFamily
                      }}
                    >
                      <div 
                        className="preview-header"
                        style={{ backgroundColor: settings.themes?.primaryColor }}
                      >
                        <h3>{settings.hospitalName}</h3>
                        <div className="preview-nav">
                          <span>Dashboard</span>
                          <span>Queue</span>
                          <span>Reports</span>
                        </div>
                      </div>
                      <div className="preview-body">
                        <div className="preview-card">
                          <div 
                            className="preview-button"
                            style={{ 
                              backgroundColor: settings.themes?.primaryColor,
                              color: '#ffffff'
                            }}
                          >
                            Action Button
                          </div>
                          <div className="preview-content">
                            <p>This is a preview of how your theme will appear throughout the application.</p>
                            <div className="preview-stats">
                              <div className="stat-item">
                                <span className="stat-value">42</span>
                                <span className="stat-label">Patients Today</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-value">15</span>
                                <span className="stat-label">In Queue</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="settings-section">
            <div className="section-header">
              <div className="header-content">
                <h2>Advertisement Management</h2>
                <p>Manage messages displayed on waiting area screens</p>
              </div>
              <div className="header-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={addAdvertisement}
                  disabled={settings.advertisements.length >= 10}
                >
                  <i className="fas fa-plus"></i> Add Advertisement
                </button>
              </div>
            </div>
            
            <div className="advertisements-grid">
              {settings.advertisements.map((ad, index) => (
                <div key={index} className="advertisement-card">
                  <div className="card-header">
                    <div className="card-title">
                      <span className="ad-number">Advertisement {index + 1}</span>
                      <span className={`status-badge ${ad.active ? 'active' : 'inactive'}`}>
                        {ad.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => removeAdvertisement(index)}
                      disabled={settings.advertisements.length === 1}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  
                  <div className="card-content">
                    <div className="form-group">
                      <label>Advertisement Text</label>
                      <textarea
                        className="form-textarea"
                        value={ad.text}
                        onChange={(e) => handleAdvertisementChange(index, 'text', e.target.value)}
                        placeholder="Enter advertisement text"
                        rows="3"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Display Duration</label>
                        <div className="input-with-unit">
                          <input
                            type="number"
                            className="form-input"
                            value={ad.duration}
                            onChange={(e) => handleAdvertisementChange(index, 'duration', parseInt(e.target.value) || 30)}
                            min="10"
                            max="120"
                          />
                          <span className="input-unit">seconds</span>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="toggle-label">
                          <span>Active</span>
                          <label className="toggle-switch small">
                            <input
                              type="checkbox"
                              checked={ad.active}
                              onChange={(e) => handleAdvertisementChange(index, 'active', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Video Advertisement</label>
                      <div className="video-upload-section">
                        {ad.video && (
                          <div className="video-preview">
                            <video controls>
                              <source src={ad.video} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        <label className="btn btn-outline btn-sm">
                          <i className="fas fa-upload"></i> Upload Video
                          <input 
                            type="file" 
                            accept="video/*" 
                            onChange={(e) => handleVideoUpload(e, index)}
                            style={{ display: 'none' }}
                            disabled={videoUploading}
                          />
                        </label>
                        {videoUploading && (
                          <div className="upload-status">
                            <i className="fas fa-spinner fa-spin"></i> Uploading...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {settings.advertisements.length >= 10 && (
              <div className="limit-message">
                <i className="fas fa-info-circle"></i>
                Maximum of 10 advertisements reached
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>System Maintenance</h2>
              <p>Manage system data and perform maintenance operations</p>
            </div>
            
            <div className="maintenance-grid">
              <div className="maintenance-card">
                <div className="card-icon primary">
                  <i className="fas fa-download"></i>
                </div>
                <div className="card-content">
                  <h3>Backup & Restore</h3>
                  <p>Export and import system settings</p>
                  <div className="card-actions">
                    <button className="btn btn-primary" onClick={exportSettings} disabled={saving}>
                      <i className="fas fa-file-export"></i> Export Settings
                    </button>
                    <label className="btn btn-outline">
                      <i className="fas fa-file-import"></i> Import Settings
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={importSettings}
                        style={{ display: 'none' }}
                        disabled={saving}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="maintenance-card">
                <div className="card-icon warning">
                  <i className="fas fa-undo"></i>
                </div>
                <div className="card-content">
                  <h3>System Reset</h3>
                  <p>Restore all settings to factory defaults</p>
                  <div className="card-actions">
                    <button 
                      className="btn btn-warning" 
                      onClick={resetToDefaults}
                      disabled={saving}
                    >
                      <i className="fas fa-undo"></i> Reset to Defaults
                    </button>
                  </div>
                </div>
              </div>

              <div className="maintenance-card danger">
                <div className="card-icon danger">
                  <i className="fas fa-trash"></i>
                </div>
                <div className="card-content">
                  <h3>Danger Zone</h3>
                  <p>Permanently delete all system data</p>
                  <div className="card-actions">
                    <button 
                      className="btn btn-danger" 
                      onClick={openDeleteConfirm}
                      disabled={saving}
                    >
                      <i className="fas fa-trash"></i> Delete All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="system-info-section">
              <h3>System Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Version</span>
                  <span className="info-value">1.0.0</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Backup</span>
                  <span className="info-value">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Settings Updated</span>
                  <span className="info-value">{new Date(settings.updatedAt || new Date()).toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Advertisements</span>
                  <span className="info-value">{settings.advertisements.length}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Current Language</span>
                  <span className="info-value">
                    {settings.language === 'en' && 'English'}
                    {settings.language === 'ar' && 'Arabic'}
                    {settings.language === 'ur' && 'Urdu'}
                    {settings.language === 'fr' && 'French'}
                    {settings.language === 'es' && 'Spanish'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Hospital Name</span>
                  <span className="info-value">{settings.hospitalName}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="settings-footer">
        <div className="footer-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleSaveSettings}
            disabled={saving || !settings || !hasUnsavedChanges}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving Changes...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Save Changes
              </>
            )}
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => {
              handleRefreshSettings();
              setHasUnsavedChanges(false);
            }}
            disabled={saving}
          >
            <i className="fas fa-times"></i> Discard Changes
          </button>
        </div>
        
        {hasUnsavedChanges && (
          <div className="footer-note">
            <i className="fas fa-exclamation-circle"></i>
            You have unsaved changes
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;