import React from 'react';


const SettingsFooter = ({ saving, hasUnsavedChanges, onSave, onDiscard }) => {
  return (
    <div className="settings-footer">
      <div className="footer-actions">
        <button 
          className="btn btn-primary" 
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
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
          onClick={onDiscard}
          disabled={saving || !hasUnsavedChanges}
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
  );
};

export default SettingsFooter;