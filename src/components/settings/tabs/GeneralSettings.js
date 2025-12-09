import React, { useState } from 'react';
import { settingsService } from '../../../services/settingsService';

const GeneralSettings = ({ settings, onInputChange, setHasUnsavedChanges, setMessage }) => {
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file (JPEG, PNG, GIF, etc.)');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setLogoUploading(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('logo', file);

      const result = await settingsService.uploadLogo(formData);
      
      onInputChange('hospitalLogo', result.logoUrl);
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

  const handleDeleteLogo = async () => {
    if (!settings.hospitalLogo) {
      setMessage('No logo to delete');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!window.confirm('Are you sure you want to delete the logo?')) {
      return;
    }

    try {
      setLogoDeleting(true);
      setMessage('');
      
      await settingsService.deleteLogo();
      
      onInputChange('hospitalLogo', '');
      setHasUnsavedChanges(true);
      setMessage('Logo deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting logo:', error);
      setMessage('Error deleting logo: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLogoDeleting(false);
    }
  };

  return (
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
              onChange={(e) => onInputChange('hospitalName', e.target.value)}
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
              onChange={(e) => onInputChange('language', e.target.value)}
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
                onChange={(e) => onInputChange('maxWaitTime', parseInt(e.target.value) || 30)}
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
              {settings.hospitalLogo ? (
                <div className="logo-preview-with-actions">
                  <div className="logo-preview">
                    <img src={settings.hospitalLogo} alt="Hospital Logo" />
                  </div>
                  <div className="logo-actions">
                    <label className="btn btn-outline btn-sm">
                      <i className="fas fa-sync"></i> Change Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                        disabled={logoUploading || logoDeleting}
                      />
                    </label>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={handleDeleteLogo}
                      disabled={logoUploading || logoDeleting}
                    >
                      {logoDeleting ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                      Delete Logo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="logo-upload-area">
                  <label className="upload-area">
                    <div className="upload-placeholder">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <div>Click to upload hospital logo</div>
                      <div className="upload-hint">Recommended: 300x100px PNG or SVG</div>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                      disabled={logoUploading}
                    />
                  </label>
                </div>
              )}
              {logoUploading && (
                <div className="upload-status">
                  <i className="fas fa-spinner fa-spin"></i> Uploading logo...
                </div>
              )}
              {logoDeleting && (
                <div className="upload-status">
                  <i className="fas fa-spinner fa-spin"></i> Deleting logo...
                </div>
              )}
            </div>
            <div className="setting-description">
              Upload your hospital logo for branding. Supported formats: JPG, PNG, GIF, SVG
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;