import React from 'react';


const SettingsHeader = ({ hasUnsavedChanges, onRefresh, message }) => {
  return (
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
        <button className="btn btn-outline" onClick={onRefresh}>
          <i className="fas fa-sync"></i> Refresh
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          <i className={`fas ${message.includes('Error') ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsHeader;