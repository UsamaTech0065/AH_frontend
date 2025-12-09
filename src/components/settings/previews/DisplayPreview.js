import React, { useState, useEffect } from 'react';
import '../../../styles/SystemSettings.css';

const DisplayPreview = ({ type, settings, screenSettings }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for better UX
    const timer = setTimeout(() => setIsLoading(false), 500);
    
    // Update time every second for realistic preview
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  const getScreenName = () => {
    const names = {
      waiting: 'Waiting Screen',
      dispenser: 'Ticket Dispenser',
      counter: 'Counter Screen',
      individual: 'Individual Waiting Screen'
    };
    return names[type] || 'Display Preview';
  };

  const renderWaitingPreview = () => (
    <div 
      className="display-preview waiting-preview"
      style={{
        backgroundColor: screenSettings?.backgroundColor || '#1a5276',
        color: screenSettings?.textColor || '#ffffff',
        backgroundImage: screenSettings?.backgroundImage ? `url(${screenSettings.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="preview-header">
        <div className="preview-logo">
          {settings?.hospitalLogo ? (
            <img src={settings.hospitalLogo} alt="Hospital" className="logo-image" />
          ) : (
            <div className="logo-placeholder">
              <i className="fas fa-hospital-alt"></i>
            </div>
          )}
          <div className="hospital-info">
            <h2>{settings?.hospitalName || 'Razi Hospital'}</h2>
            <p>Queue Management System</p>
          </div>
        </div>
        <div className="preview-time">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="preview-content">
        <div className="department-overview">
          <div className="dept-card">
            <div className="dept-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="dept-info">
              <h4>General OPD</h4>
              <div className="dept-status">
                <span className="current-ticket">A101</span>
                <span className="waiting-count">5 waiting</span>
              </div>
            </div>
          </div>
          
          <div className="dept-card">
            <div className="dept-icon">
              <i className="fas fa-heartbeat"></i>
            </div>
            <div className="dept-info">
              <h4>Cardiology</h4>
              <div className="dept-status">
                <span className="current-ticket">B205</span>
                <span className="waiting-count">3 waiting</span>
              </div>
            </div>
          </div>
        </div>

        <div className="current-calls">
          <h3>Currently Serving</h3>
          <div className="call-item">
            <span className="ticket-number">A101</span>
            <span className="counter-info">Counter 1 - General OPD</span>
          </div>
          <div className="call-item">
            <span className="ticket-number">B205</span>
            <span className="counter-info">Counter 3 - Cardiology</span>
          </div>
        </div>
      </div>

      {screenSettings?.showAds && (
        <div className="preview-ad">
          <div className="ad-content">
            <i className="fas fa-star"></i>
            <span>{settings?.advertisements?.[0]?.text || 'Quality Healthcare Services - Excellence in Medical Care'}</span>
          </div>
        </div>
      )}

      {screenSettings?.customMessage && (
        <div className="preview-custom-message">
          <i className="fas fa-bullhorn"></i>
          {screenSettings.customMessage}
        </div>
      )}

      <div className="preview-footer">
        <div className="last-updated">
          Last updated: {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );

  const renderDispenserPreview = () => (
    <div 
      className="display-preview dispenser-preview"
      style={{
        backgroundColor: screenSettings?.backgroundColor || '#ffffff',
        color: screenSettings?.textColor || '#000000',
        backgroundImage: screenSettings?.backgroundImage ? `url(${screenSettings.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="preview-header">
        <div className="preview-logo">
          {settings?.hospitalLogo ? (
            <img src={settings.hospitalLogo} alt="Hospital" className="logo-image" />
          ) : (
            <div className="logo-placeholder">
              <i className="fas fa-hospital-alt"></i>
            </div>
          )}
          <div className="hospital-info">
            <h1>{settings?.hospitalName || 'Razi Hospital'}</h1>
            <p>Ticket Dispensing System</p>
          </div>
        </div>
        <div className="system-status">
          <span className="status-indicator online">
            <i className="fas fa-circle"></i>
            System Online
          </span>
        </div>
      </div>

      <div className="preview-content">
        <div className="welcome-section">
          <div className="preview-welcome">
            {screenSettings?.welcomeMessage || 'Welcome to Razi Hospital'}
          </div>
          <p className="welcome-subtitle">Please select your required department</p>
        </div>

        <div className="preview-departments">
          <div className="dept-button">
            <div className="dept-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="dept-info">
              <h3>General OPD</h3>
              <p>General Consultation</p>
            </div>
            <div className="dept-action">
              <button className="ticket-btn">
                <i className="fas fa-ticket-alt"></i>
                Get Ticket
              </button>
            </div>
          </div>

          <div className="dept-button">
            <div className="dept-icon">
              <i className="fas fa-heartbeat"></i>
            </div>
            <div className="dept-info">
              <h3>Cardiology</h3>
              <p>Heart Specialist</p>
            </div>
            <div className="dept-action">
              <button className="ticket-btn">
                <i className="fas fa-ticket-alt"></i>
                Get Ticket
              </button>
            </div>
          </div>

          <div className="dept-button">
            <div className="dept-icon">
              <i className="fas fa-ambulance"></i>
            </div>
            <div className="dept-info">
              <h3>Emergency</h3>
              <p>Urgent Care</p>
            </div>
            <div className="dept-action">
              <button className="ticket-btn emergency">
                <i className="fas fa-ticket-alt"></i>
                Get Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-footer">
        <div className="printing-info">
          {screenSettings?.autoPrint && (
            <div className="auto-print-indicator">
              <i className="fas fa-print"></i>
              Auto Print Enabled
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCounterPreview = () => (
    <div 
      className="display-preview counter-preview"
      style={{
        backgroundColor: screenSettings?.backgroundColor || '#f8f9fa',
        color: screenSettings?.textColor || '#333333',
        backgroundImage: screenSettings?.backgroundImage ? `url(${screenSettings.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="preview-header">
        <div className="counter-info">
          <div className="counter-badge">
            <i className="fas fa-desktop"></i>
            Counter 1
          </div>
          <div className="department-name">General OPD</div>
        </div>
        <div className="preview-status">
          <span className={`status-indicator ${screenSettings?.status || 'active'}`}>
            <i className="fas fa-circle"></i>
            {screenSettings?.status === 'busy' ? 'Serving Patient' : 'Available'}
          </span>
          <div className="current-time">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="preview-content">
        <div className="current-patient-section">
          <div className="section-label">Current Patient</div>
          <div className="preview-current-ticket">
            <div className="preview-ticket-number">A101</div>
            <div className="preview-patient-info">
              <div className="patient-name">John Smith</div>
              <div className="ticket-time">
                Called: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        <div className="preview-controls">
          <div className="control-grid">
            <button className="control-btn primary">
              <i className="fas fa-phone"></i>
              Call Next
            </button>
            <button className="control-btn accent">
              <i className="fas fa-redo"></i>
              Recall
            </button>
            <button className="control-btn success">
              <i className="fas fa-check-double"></i>
              Complete
            </button>
            <button className="control-btn warning">
              <i className="fas fa-exchange-alt"></i>
              Transfer
            </button>
          </div>
        </div>

        {screenSettings?.showActivityLog && (
          <div className="activity-log-preview">
            <div className="section-label">Recent Activity</div>
            <div className="activity-items">
              <div className="activity-item">
                <span className="activity-time">14:25</span>
                <span className="activity-message">Called ticket A101</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">14:20</span>
                <span className="activity-message">Completed ticket A100</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="preview-footer">
        <div className="queue-info">
          <span className="queue-count">3 patients waiting</span>
          <span className="served-today">12 served today</span>
        </div>
      </div>
    </div>
  );

  const renderIndividualPreview = () => (
    <div 
      className="display-preview individual-preview"
      style={{
        backgroundColor: screenSettings?.backgroundColor || '#1a5276',
        color: screenSettings?.textColor || '#ffffff',
        backgroundImage: screenSettings?.backgroundImage ? `url(${screenSettings.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="preview-header">
        <div className="preview-logo">
          {settings?.hospitalLogo ? (
            <img src={settings.hospitalLogo} alt="Hospital" className="logo-image" />
          ) : (
            <div className="logo-placeholder">
              <i className="fas fa-hospital-alt"></i>
            </div>
          )}
          <div className="hospital-info">
            <h2>{settings?.hospitalName || 'Razi Hospital'}</h2>
            <p>Counter 1 - General OPD</p>
          </div>
        </div>
        {screenSettings?.showTime && (
          <div className="preview-time-large">
            <div className="current-time">{currentTime.toLocaleTimeString()}</div>
            <div className="current-date">{currentTime.toLocaleDateString()}</div>
          </div>
        )}
      </div>

      <div className="preview-content">
        <div className="serving-section">
          <div className="serving-label">NOW SERVING</div>
          <div className="current-ticket-large">A101</div>
          <div className="patient-details">
            <div className="patient-name">John Smith</div>
            <div className="counter-number">Counter 1</div>
          </div>
        </div>

        <div className="waiting-queue">
          <div className="queue-label">WAITING QUEUE</div>
          <div className="queue-list">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="queue-item">
                <span className="queue-position">#{item}</span>
                <span className="queue-ticket">A10{1 + item}</span>
                <span className="queue-time">
                  {new Date(currentTime.getTime() - item * 60000).toLocaleTimeString([], { 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="preview-footer">
        <div className="estimated-wait">
          Estimated wait time: 25 minutes
        </div>
        {screenSettings?.showHospitalInfo && (
          <div className="hospital-contact">
            {settings?.hospitalContact || 'Contact: (123) 456-7890'}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="setting-card full-width">
        <div className="setting-content">
          <label className="setting-label">Preview - {getScreenName()}</label>
          <div className="preview-loading">
            <div className="loading-spinner"></div>
            <p>Loading preview...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setting-card full-width">
      <div className="setting-content">
        <div className="preview-header-info">
          <label className="setting-label">Live Preview - {getScreenName()}</label>
          <div className="preview-refresh">
            <small>Live: {currentTime.toLocaleTimeString()}</small>
          </div>
        </div>
        
        <div className="preview-container">
          {type === 'waiting' && renderWaitingPreview()}
          {type === 'dispenser' && renderDispenserPreview()}
          {type === 'counter' && renderCounterPreview()}
          {type === 'individual' && renderIndividualPreview()}
        </div>

        <div className="preview-settings-info">
          <div className="settings-summary">
            <span className="setting-item">
              <strong>Background:</strong> {screenSettings?.backgroundImage ? 'Custom Image' : 'Color'}
            </span>
            <span className="setting-item">
              <strong>Colors:</strong> {screenSettings?.backgroundColor?.substring(0, 7) || 'Default'} / {screenSettings?.textColor?.substring(0, 7) || 'Default'}
            </span>
            {screenSettings?.showAds !== undefined && (
              <span className="setting-item">
                <strong>Ads:</strong> {screenSettings.showAds ? 'On' : 'Off'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayPreview;