import React, { useState, useEffect } from 'react';
import { displayService } from '../services/displayService';
import { settingsService } from '../services/settingsService';
import './DisplayManager.css';

const DisplayManager = () => {
  const [displays, setDisplays] = useState([]);
  const [selectedDisplay, setSelectedDisplay] = useState(null);
  const [customization, setCustomization] = useState({
    showLogo: true,
    showAds: true,
    theme: 'default',
    customMessage: '',
    adInterval: 30
  });

  useEffect(() => {
    loadDisplays();
  }, []);

  const loadDisplays = async () => {
    try {
      const displaysData = await displayService.getAllDisplays();
      setDisplays(displaysData);
      if (displaysData.length > 0) {
        setSelectedDisplay(displaysData[0]);
        loadDisplaySettings(displaysData[0]._id);
      }
    } catch (error) {
      console.error('Error loading displays:', error);
    }
  };

  const loadDisplaySettings = async (displayId) => {
    try {
      const display = await displayService.getDisplay(displayId);
      if (display.settings) {
        setCustomization(display.settings);
      }
    } catch (error) {
      console.error('Error loading display settings:', error);
    }
  };

  const saveCustomization = async () => {
    if (!selectedDisplay) return;
    
    try {
      await displayService.updateDisplay(selectedDisplay._id, {
        settings: customization
      });
      alert('Display settings saved successfully!');
    } catch (error) {
      console.error('Error saving display settings:', error);
      alert('Error saving settings!');
    }
  };

  const openDisplay = (display) => {
    const url = `/display/${display.displayId}`;
    window.open(url, `Display_${display.displayId}`, 'width=1024,height=768,menubar=no,toolbar=no');
  };

  return (
    <div className="display-manager">
      <div className="manager-header">
        <h3>Display Management</h3>
        <p>Manage and customize all display screens in the hospital</p>
      </div>

      <div className="display-content">
        <div className="displays-list">
          <h4>Available Displays</h4>
          <div className="displays-grid">
            {displays.map(display => (
              <div 
                key={display._id} 
                className={`display-card ${selectedDisplay?._id === display._id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDisplay(display);
                  loadDisplaySettings(display._id);
                }}
              >
                <div className="display-icon">
                  <i className={`fas fa-${getDisplayIcon(display.type)}`}></i>
                </div>
                <div className="display-info">
                  <div className="display-name">{display.name}</div>
                  <div className="display-location">{display.location}</div>
                  <div className="display-type">{display.type}</div>
                </div>
                <button 
                  className="btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDisplay(display);
                  }}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedDisplay && (
          <div className="customization-panel">
            <h4>Customize {selectedDisplay.name}</h4>
            
            <div className="customization-section">
              <h5>Appearance</h5>
              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={customization.showLogo}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      showLogo: e.target.checked
                    }))}
                  />
                  Show Hospital Logo
                </label>
              </div>
              
              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={customization.showAds}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      showAds: e.target.checked
                    }))}
                  />
                  Show Advertisements
                </label>
              </div>

              <div className="setting-group">
                <label>Theme</label>
                <select
                  value={customization.theme}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    theme: e.target.value
                  }))}
                >
                  <option value="default">Default Blue</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="dark">Dark</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>

            <div className="customization-section">
              <h5>Content</h5>
              <div className="setting-group">
                <label>Custom Message</label>
                <textarea
                  value={customization.customMessage}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    customMessage: e.target.value
                  }))}
                  placeholder="Enter custom message to display..."
                  rows="3"
                />
              </div>

              <div className="setting-group">
                <label>Ad Rotation Interval (seconds)</label>
                <input
                  type="number"
                  value={customization.adInterval}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    adInterval: parseInt(e.target.value)
                  }))}
                  min="10"
                  max="120"
                />
              </div>
            </div>

            <div className="customization-section">
              <h5>Preview</h5>
              <div className="display-preview">
                <div className={`preview-screen ${customization.theme}`}>
                  {customization.showLogo && (
                    <div className="preview-logo">
                      <i className="fas fa-hospital-alt"></i>
                      <span>Razi Hospital</span>
                    </div>
                  )}
                  <div className="preview-content">
                    <div className="preview-token">A101</div>
                    <div className="preview-counter">Counter 1</div>
                  </div>
                  {customization.showAds && (
                    <div className="preview-ad">
                      Quality Healthcare Services
                    </div>
                  )}
                  {customization.customMessage && (
                    <div className="preview-message">
                      {customization.customMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="customization-actions">
              <button className="btn-primary" onClick={saveCustomization}>
                Save Settings
              </button>
              <button className="btn-secondary" onClick={() => openDisplay(selectedDisplay)}>
                Open Display
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getDisplayIcon = (type) => {
  const icons = {
    waiting: 'tv',
    counter: 'desktop',
    department: 'clinic-medical',
    reception: 'user-md'
  };
  return icons[type] || 'tv';
};

export default DisplayManager;