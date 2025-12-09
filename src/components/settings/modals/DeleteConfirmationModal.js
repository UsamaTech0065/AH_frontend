import React, { useState } from 'react';

const DeleteConfirmationModal = ({ onClose, onConfirm, saving }) => {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleConfirm = () => {
    if (deleteConfirmText !== 'DELETE ALL DATA') {
      return;
    }
    onConfirm();
  };

  return (
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
          <button className="close-btn" onClick={onClose}>
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
            onClick={handleConfirm}
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
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;