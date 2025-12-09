import React from 'react';

const ThemePreview = ({ settings }) => {
  return (
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
  );
};

export default ThemePreview;