import React, { useState, useCallback } from 'react';
import { settingsService } from '../../../services/settingsService';
import DisplayPreview from '../previews/DisplayPreview';


const DisplaySettings = ({ settings, onSettingsChange, setHasUnsavedChanges, setMessage }) => {
  const [activeSubTab, setActiveSubTab] = useState('waiting');
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [backgroundDeleting, setBackgroundDeleting] = useState(false);
  const [previewSettings, setPreviewSettings] = useState(null);

  const handleDisplaySettingChange = useCallback((screenType, field, value) => {
    console.log(`Updating ${screenType}.${field} to:`, value);
    onSettingsChange(prev => ({
      ...prev,
      [screenType]: {
        ...prev[screenType],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, [onSettingsChange, setHasUnsavedChanges]);

  const handleBackgroundUpload = async (screenType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Uploading file:', file.name, 'for screen:', screenType);

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'Image size must be less than 5MB'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setBackgroundUploading(true);
      setMessage({
        type: 'info',
        text: 'Uploading background image...'
      });
      
      const formData = new FormData();
      formData.append('background', file);
      formData.append('screenType', screenType);

      console.log('Sending upload request...');
      const result = await settingsService.uploadBackground(formData, screenType);
      
      console.log('Upload successful:', result);
      
      // Update the settings with the new image URL
      handleDisplaySettingChange(screenType, 'backgroundImage', result.imageUrl);
      
      setMessage({
        type: 'success',
        text: 'Background image uploaded successfully!'
      });
      setTimeout(() => setMessage(null), 3000);
      
      // Update preview
      setPreviewSettings({
        type: screenType,
        settings: {
          ...settings[screenType],
          backgroundImage: result.imageUrl
        }
      });
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading background image:', error);
      setMessage({
        type: 'error',
        text: `Error uploading background image: ${error.message || 'Please try again'}`
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setBackgroundUploading(false);
    }
  };

  const handleDeleteBackground = async (screenType) => {
    const screenName = getScreenName(screenType);
    
    if (!window.confirm(`Are you sure you want to delete the background image for ${screenName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setBackgroundDeleting(true);
      setMessage({
        type: 'info',
        text: `Deleting background image for ${screenName}...`
      });
      
      await settingsService.deleteBackground(screenType);
      
      // Update the settings to remove the background image
      handleDisplaySettingChange(screenType, 'backgroundImage', '');
      
      setMessage({
        type: 'success',
        text: `Background image for ${screenName} deleted successfully!`
      });
      setTimeout(() => setMessage(null), 3000);
      
      // Update preview
      setPreviewSettings({
        type: screenType,
        settings: {
          ...settings[screenType],
          backgroundImage: ''
        }
      });
      
    } catch (error) {
      console.error('Error deleting background image:', error);
      setMessage({
        type: 'error',
        text: `Error deleting background image: ${error.message || 'Please try again'}`
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setBackgroundDeleting(false);
    }
  };

  const getScreenName = (screenType) => {
    const names = {
      waitingScreen: 'Waiting Screen',
      dispenserSettings: 'Ticket Dispenser',
      counterScreen: 'Counter Screen',
      individualWaiting: 'Individual Waiting Screen'
    };
    return names[screenType] || screenType;
  };

  const getCurrentBackground = (screenType) => {
    const bg = settings?.[screenType]?.backgroundImage;
    console.log(`Current background for ${screenType}:`, bg);
    return bg;
  };

  const updatePreview = (screenType) => {
    setPreviewSettings({
      type: screenType,
      settings: settings[screenType]
    });
  };

  // Background Image Upload Component
  const BackgroundImageUpload = ({ screenType, screenName }) => {
    const currentBackground = getCurrentBackground(screenType);
    
    return (
      <div className="setting-card">
        <div className="setting-icon">
          <i className="fas fa-image"></i>
        </div>
        <div className="setting-content">
          <label className="setting-label">Background Image - {screenName}</label>
          <div className="image-upload-section">
            {currentBackground ? (
              <div className="image-preview-container">
                <div className="image-preview">
                  <img 
                    src={currentBackground} 
                    alt={`${screenName} Background`} 
                    className="preview-image"
                    onError={(e) => {
                      console.error('Image failed to load:', currentBackground);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    onLoad={() => console.log('Image loaded successfully:', currentBackground)}
                  />
                  <div className="image-error" style={{ display: 'none' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Image failed to load</span>
                  </div>
                  <button 
                    className="remove-image-btn"
                    onClick={() => handleDeleteBackground(screenType)}
                    type="button"
                    disabled={backgroundDeleting}
                    title="Remove background image"
                  >
                    {backgroundDeleting ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-times"></i>
                    )}
                  </button>
                </div>
                <div className="image-actions">
                  <label className="btn btn-outline btn-sm">
                    <i className="fas fa-sync"></i> Change Image
                    <input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                      onChange={(e) => handleBackgroundUpload(screenType, e)}
                      style={{ display: 'none' }}
                      disabled={backgroundUploading || backgroundDeleting}
                    />
                  </label>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteBackground(screenType)}
                    disabled={backgroundUploading || backgroundDeleting}
                  >
                    {backgroundDeleting ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                    Delete Background
                  </button>
                </div>
              </div>
            ) : (
              <label className="upload-area">
                <div className="upload-placeholder">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <div>Click to upload background image</div>
                  <div className="upload-hint">
                    Recommended: 1920x1080px JPG, PNG or WebP (max 5MB)
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                  onChange={(e) => handleBackgroundUpload(screenType, e)}
                  style={{ display: 'none' }}
                  disabled={backgroundUploading}
                />
              </label>
            )}
            {(backgroundUploading) && (
              <div className="upload-status">
                <i className="fas fa-spinner fa-spin"></i> Uploading background image...
              </div>
            )}
            {(backgroundDeleting) && (
              <div className="upload-status">
                <i className="fas fa-spinner fa-spin"></i> Deleting background image...
              </div>
            )}
          </div>
          <div className="setting-description">
            Custom background image for {screenName.toLowerCase()}. Optimal size: 1920x1080px
          </div>
        </div>
      </div>
    );
  };

  // Color Input Component
  const ColorInput = ({ screenType, field, label, description, defaultValue }) => (
    <div className="setting-card">
      <div className="setting-icon">
        <i className="fas fa-palette"></i>
      </div>
      <div className="setting-content">
        <label className="setting-label">{label}</label>
        <div className="color-input-group">
          <input
            type="color"
            className="color-picker"
            value={settings?.[screenType]?.[field] || defaultValue}
            onChange={(e) => handleDisplaySettingChange(screenType, field, e.target.value)}
            onBlur={() => updatePreview(screenType)}
          />
          <input
            type="text"
            className="color-input"
            value={settings?.[screenType]?.[field] || defaultValue}
            onChange={(e) => handleDisplaySettingChange(screenType, field, e.target.value)}
            onBlur={() => updatePreview(screenType)}
            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
            placeholder="#000000"
          />
        </div>
        <div className="setting-description">
          {description}
        </div>
      </div>
    </div>
  );

  // Toggle Switch Component
  const ToggleSwitch = ({ screenType, field, label, description, defaultValue = true }) => (
    <div className="setting-card">
      <div className="setting-icon">
        <i className="fas fa-toggle-on"></i>
      </div>
      <div className="setting-content">
        <div className="toggle-header">
          <label className="setting-label">{label}</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings?.[screenType]?.[field] !== undefined ? settings[screenType][field] : defaultValue}
              onChange={(e) => {
                handleDisplaySettingChange(screenType, field, e.target.checked);
                updatePreview(screenType);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="setting-description">
          {description}
        </div>
      </div>
    </div>
  );

  // Text Input Component
  const TextInput = ({ screenType, field, label, description, placeholder, type = 'text' }) => (
    <div className="setting-card">
      <div className="setting-icon">
        <i className="fas fa-font"></i>
      </div>
      <div className="setting-content">
        <label className="setting-label">{label}</label>
        {type === 'textarea' ? (
          <textarea
            className="setting-textarea"
            value={settings?.[screenType]?.[field] || ''}
            onChange={(e) => handleDisplaySettingChange(screenType, field, e.target.value)}
            onBlur={() => updatePreview(screenType)}
            placeholder={placeholder}
            rows="3"
          />
        ) : (
          <input
            type={type}
            className="setting-input"
            value={settings?.[screenType]?.[field] || ''}
            onChange={(e) => handleDisplaySettingChange(screenType, field, e.target.value)}
            onBlur={() => updatePreview(screenType)}
            placeholder={placeholder}
          />
        )}
        <div className="setting-description">
          {description}
        </div>
      </div>
    </div>
  );

  // Select Input Component
  const SelectInput = ({ screenType, field, label, description, options, defaultValue }) => (
    <div className="setting-card">
      <div className="setting-icon">
        <i className="fas fa-list"></i>
      </div>
      <div className="setting-content">
        <label className="setting-label">{label}</label>
        <select
          className="setting-select"
          value={settings?.[screenType]?.[field] || defaultValue}
          onChange={(e) => {
            handleDisplaySettingChange(screenType, field, e.target.value);
            updatePreview(screenType);
          }}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="setting-description">
          {description}
        </div>
      </div>
    </div>
  );

  // Individual Screen Settings Components
  const WaitingScreenSettings = () => (
    <div className="settings-grid">
      <BackgroundImageUpload screenType="waitingScreen" screenName="Waiting Screen" />
      
      <ColorInput
        screenType="waitingScreen"
        field="backgroundColor"
        label="Background Color"
        description="Background color for waiting area displays"
        defaultValue="#1a5276"
      />

      <ColorInput
        screenType="waitingScreen"
        field="textColor"
        label="Text Color"
        description="Text color for waiting area displays"
        defaultValue="#ffffff"
      />

      <ToggleSwitch
        screenType="waitingScreen"
        field="showAds"
        label="Show Advertisements"
        description="Display advertisements on waiting screens"
        defaultValue={true}
      />

      <ToggleSwitch
        screenType="waitingScreen"
        field="soundNotifications"
        label="Sound Notifications"
        description="Enable audio announcements for called tickets"
        defaultValue={true}
      />

      <ToggleSwitch
        screenType="waitingScreen"
        field="showDepartmentAnalysis"
        label="Show Department Analysis"
        description="Display department statistics and wait times"
        defaultValue={true}
      />

      <SelectInput
        screenType="waitingScreen"
        field="language"
        label="Announcement Language"
        description="Language for voice announcements"
        defaultValue="en"
        options={[
          { value: 'en', label: 'English' },
          { value: 'ur', label: 'Urdu' },
          { value: 'both', label: 'Both (English & Urdu)' }
        ]}
      />

      <TextInput
        screenType="waitingScreen"
        field="customMessage"
        label="Custom Message"
        description="Custom message to display on waiting screens"
        placeholder="Enter custom message for waiting screen..."
        type="textarea"
      />

      <div className="preview-section">
        <DisplayPreview 
          type="waiting"
          settings={settings}
          screenSettings={previewSettings?.type === 'waitingScreen' ? previewSettings.settings : settings?.waitingScreen}
        />
      </div>
    </div>
  );

  const DispenserScreenSettings = () => (
    <div className="settings-grid">
      <BackgroundImageUpload screenType="dispenserSettings" screenName="Ticket Dispenser" />

      <ColorInput
        screenType="dispenserSettings"
        field="backgroundColor"
        label="Background Color"
        description="Background color for dispenser screens"
        defaultValue="#ffffff"
      />

      <ColorInput
        screenType="dispenserSettings"
        field="textColor"
        label="Text Color"
        description="Text color for dispenser screens"
        defaultValue="#000000"
      />

      <ToggleSwitch
        screenType="dispenserSettings"
        field="autoPrint"
        label="Auto Print Tickets"
        description="Automatically print tickets after generation"
        defaultValue={true}
      />

      <SelectInput
        screenType="dispenserSettings"
        field="ticketLayout"
        label="Ticket Layout"
        description="Layout style for printed tickets"
        defaultValue="standard"
        options={[
          { value: 'standard', label: 'Standard' },
          { value: 'compact', label: 'Compact' },
          { value: 'detailed', label: 'Detailed' }
        ]}
      />

      <TextInput
        screenType="dispenserSettings"
        field="welcomeMessage"
        label="Welcome Message"
        description="Welcome message displayed on dispenser screen"
        placeholder="Welcome to Razi Hospital"
      />

      <div className="preview-section">
        <DisplayPreview 
          type="dispenser"
          settings={settings}
          screenSettings={previewSettings?.type === 'dispenserSettings' ? previewSettings.settings : settings?.dispenserSettings}
        />
      </div>
    </div>
  );

  const CounterScreenSettings = () => (
    <div className="settings-grid">
      <BackgroundImageUpload screenType="counterScreen" screenName="Counter Screen" />

      <ColorInput
        screenType="counterScreen"
        field="backgroundColor"
        label="Background Color"
        description="Background color for counter operator screens"
        defaultValue="#f8f9fa"
      />

      <ColorInput
        screenType="counterScreen"
        field="textColor"
        label="Text Color"
        description="Text color for counter operator screens"
        defaultValue="#333333"
      />

      <ToggleSwitch
        screenType="counterScreen"
        field="soundAlerts"
        label="Sound Alerts"
        description="Enable sound alerts for new tickets and notifications"
        defaultValue={true}
      />

      <ToggleSwitch
        screenType="counterScreen"
        field="showActivityLog"
        label="Show Activity Log"
        description="Display activity log on counter interface"
        defaultValue={true}
      />

      <ToggleSwitch
        screenType="counterScreen"
        field="announceCompletions"
        label="Announce Completions"
        description="Enable voice announcements for completed services"
        defaultValue={true}
      />

      <TextInput
        screenType="counterScreen"
        field="queueLimit"
        label="Queue Display Limit"
        description="Maximum number of queue items to display"
        placeholder="8"
        type="number"
      />

      <div className="preview-section">
        <DisplayPreview 
          type="counter"
          settings={settings}
          screenSettings={previewSettings?.type === 'counterScreen' ? previewSettings.settings : settings?.counterScreen}
        />
      </div>
    </div>
  );

  const IndividualWaitingScreenSettings = () => (
    <div className="settings-grid">
      <BackgroundImageUpload screenType="individualWaiting" screenName="Individual Waiting Screen" />

      <SelectInput
        screenType="individualWaiting"
        field="screenType"
        label="Screen Type"
        description="Type of individual waiting screen display"
        defaultValue="counter"
        options={[
          { value: 'counter', label: 'Counter Specific' },
          { value: 'department', label: 'Department Wide' }
        ]}
      />

      <ColorInput
        screenType="individualWaiting"
        field="backgroundColor"
        label="Background Color"
        description="Background color for individual waiting screens"
        defaultValue="#1a5276"
      />

      <ColorInput
        screenType="individualWaiting"
        field="textColor"
        label="Text Color"
        description="Text color for individual waiting screens"
        defaultValue="#ffffff"
      />

      <TextInput
        screenType="individualWaiting"
        field="queueSize"
        label="Queue Display Size"
        description="Number of queue items to display"
        placeholder="8"
        type="number"
      />

      <ToggleSwitch
        screenType="individualWaiting"
        field="showTime"
        label="Show Current Time"
        description="Display current time on individual waiting screens"
        defaultValue={true}
      />

      <ToggleSwitch
        screenType="individualWaiting"
        field="showHospitalInfo"
        label="Show Hospital Info"
        description="Display hospital name and contact information"
        defaultValue={true}
      />

      <div className="preview-section">
        <DisplayPreview 
          type="individual"
          settings={settings}
          screenSettings={previewSettings?.type === 'individualWaiting' ? previewSettings.settings : settings?.individualWaiting}
        />
      </div>
    </div>
  );

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>Display Customization</h2>
        <p>Customize appearance and behavior of different display screens</p>
      </div>
      
      <div className="display-subtabs">
        <button 
          className={`subtab ${activeSubTab === 'waiting' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('waiting');
            updatePreview('waitingScreen');
          }}
        >
          <i className="fas fa-tv"></i> Waiting Screen
        </button>
        <button 
          className={`subtab ${activeSubTab === 'dispenser' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('dispenser');
            updatePreview('dispenserSettings');
          }}
        >
          <i className="fas fa-ticket-alt"></i> Ticket Dispenser
        </button>
        <button 
          className={`subtab ${activeSubTab === 'counter' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('counter');
            updatePreview('counterScreen');
          }}
        >
          <i className="fas fa-desktop"></i> Counter Screens
        </button>
        <button 
          className={`subtab ${activeSubTab === 'individual' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('individual');
            updatePreview('individualWaiting');
          }}
        >
          <i className="fas fa-user-md"></i> Individual Waiting
        </button>
      </div>

      <div className="settings-content">
        {activeSubTab === 'waiting' && <WaitingScreenSettings />}
        {activeSubTab === 'dispenser' && <DispenserScreenSettings />}
        {activeSubTab === 'counter' && <CounterScreenSettings />}
        {activeSubTab === 'individual' && <IndividualWaitingScreenSettings />}
      </div>
    </div>
  );
};

export default DisplaySettings;