import React, { useState } from 'react';
import { settingsService } from '../../../services/settingsService';

const AdvertisementSettings = ({ settings, onSettingsChange, setHasUnsavedChanges, setMessage }) => {
  const [videoUploading, setVideoUploading] = useState(null);

  const handleAdvertisementChange = (index, field, value) => {
    const updatedAds = [...settings.advertisements];
    updatedAds[index] = {
      ...updatedAds[index],
      [field]: value
    };
    
    onSettingsChange(prev => ({
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

    onSettingsChange(prev => ({
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
    onSettingsChange(prev => ({
      ...prev,
      advertisements: updatedAds
    }));
    setHasUnsavedChanges(true);
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
      setVideoUploading(adIndex);
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
      
      onSettingsChange(prev => ({
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
      setVideoUploading(null);
    }
  };

  return (
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
                      disabled={videoUploading === index}
                    />
                  </label>
                  {videoUploading === index && (
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
  );
};

export default AdvertisementSettings;