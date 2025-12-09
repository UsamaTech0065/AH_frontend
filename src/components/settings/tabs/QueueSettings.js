import React from 'react';


const QueueSettings = ({ settings, onInputChange }) => {
  return (
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
                  onChange={(e) => onInputChange('autoCall', e.target.checked)}
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
                  onChange={(e) => onInputChange('soundNotifications', e.target.checked)}
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
                  onChange={(e) => onInputChange('displayAnnouncements', e.target.checked)}
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
              onChange={(e) => onInputChange('priorityRules', e.target.value)}
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
  );
};

export default QueueSettings;