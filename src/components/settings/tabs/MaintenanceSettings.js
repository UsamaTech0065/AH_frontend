import React, { useState } from 'react';
import { settingsService } from '../../../services/settingsService';

const MaintenanceSettings = ({ settings, onSettingsChange, setMessage, onShowDeleteConfirm }) => {
  const [saving, setSaving] = useState(false);

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

        const updatedSettings = await settingsService.updateSettings(defaultSettings);
        onSettingsChange(updatedSettings);
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
        const updatedSettings = await settingsService.updateSettings(importedSettings);
        onSettingsChange(updatedSettings);
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

  return (
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
                onClick={onShowDeleteConfirm}
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
  );
};

export default MaintenanceSettings;