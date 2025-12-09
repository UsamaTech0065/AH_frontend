import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { useSettings } from '../context/SettingsContext';
import '../styles/CounterSelection.css';

const CounterSelectionRenamed = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [countersList, setCountersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCounterItem, setSelectedCounterItem] = useState(null);

  // Get theme settings with proper fallbacks
  const themeConfig = settings?.themes || {};
  const mainColor = themeConfig.primaryColor || '#1e3a8a';
  const secondaryColor = themeConfig.accentColor || '#dc2626';
  const textFontFamily = themeConfig.fontFamily || 'Inter, sans-serif';

  // Get hospital info
  const hospitalTitle = settings?.hospitalName || 'ALKHIDMAT RAAZI HOSPITAL';
  const hospitalLogoImage = settings?.hospitalLogo || '';
  const hospitalLocation = settings?.hospitalCity || 'ISLAMABAD';

  useEffect(() => {
    // Apply theme settings
    document.body.style.fontFamily = textFontFamily;
    document.body.style.overflow = 'auto'; // Changed from hidden to auto

    fetchCountersData();
  }, [textFontFamily]);

  const fetchCountersData = async () => {
    try {
      setIsLoading(true);
      const countersResponse = await adminService.getCounters();
      
      const currentUserData = authService.getCurrentUser();
      let userAccessibleCounters = countersResponse;
      
      if (currentUserData?.counter) {
        userAccessibleCounters = countersResponse.filter(counter => 
          counter._id === currentUserData.counter._id || counter._id === currentUserData.counter
        );
      }
      
      setCountersList(userAccessibleCounters);
    } catch (error) {
      console.error('Error loading counters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCounterSelection = (counter) => {
    setSelectedCounterItem(counter);
    navigate(`/counter/${counter._id}`);
  };

  const handleUserLogout = () => {
    authService.logout();
  };

  if (isLoading) {
    return (
      <div className="theme-container dark-blue-theme">
        <div className="background-logo-container">
          {hospitalLogoImage && <img src={hospitalLogoImage} alt="Hospital Logo" className="background-logo-blur" />}
        </div>
        <div className="border-lines-container">
          <div className="border-line horizontal-line top-line"></div>
          <div className="border-line horizontal-line bottom-line"></div>
          <div className="border-line vertical-line left-line"></div>
          <div className="border-line vertical-line right-line"></div>
        </div>
        <div className="corner-elements">
          <div className="corner-element top-left-corner blue-corner"></div>
          <div className="corner-element top-right-corner red-corner"></div>
          <div className="corner-element bottom-left-corner red-corner"></div>
          <div className="corner-element bottom-right-corner blue-corner"></div>
        </div>
        <div className="loading-spinner-container">
          <div className="spinner-3d-animation"></div>
          <div className="loading-text-content">Loading Counters...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-container dark-blue-theme counter-selection-panel">
      {/* Background Elements */}
      <div className="background-logo-container">
        {hospitalLogoImage && <img src={hospitalLogoImage} alt="Hospital Logo" className="background-logo-blur" />}
      </div>
      
      <div className="border-lines-container">
        <div className="border-line horizontal-line top-line"></div>
        <div className="border-line horizontal-line bottom-line"></div>
        <div className="border-line vertical-line left-line"></div>
        <div className="border-line vertical-line right-line"></div>
      </div>
      
      <div className="corner-elements">
        <div className="corner-element top-left-corner blue-corner"></div>
        <div className="corner-element top-right-corner red-corner"></div>
        <div className="corner-element bottom-left-corner red-corner"></div>
        <div className="corner-element bottom-right-corner blue-corner"></div>
      </div>

      {/* Main Content */}
      <div className="main-content-wrapper counter-selection-content">
        {/* Header Section */}
        <div className="panel-header-theme selection-panel-header">
          <div className="hospital-branding-theme">
            {hospitalLogoImage ? (
              <img src={hospitalLogoImage} alt="Hospital Logo" className="hospital-logo-img" />
            ) : (
              <div className="hospital-logo-placeholder">
                <i className="fas fa-hospital-alt"></i>
              </div>
            )}
            <div className="hospital-details-theme">
              <h1 className="hospital-title-theme">
                {hospitalTitle}
              </h1>
              <p className="hospital-location-theme">{hospitalLocation}</p>
              <p className="arabic-text-theme">الخدمت رازی ہسپتال اسلام آباد</p>
            </div>
          </div>
          
          <div className="header-status-theme">
            <div className="status-indicator-theme online-status">
              <i className="fas fa-circle"></i>
              System Online
            </div>
            <div className="current-time-display">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="selection-main-panel">
          <div className="section-header-panel">
            <h2 className="section-title-panel">Select Counter</h2>
            <p className="section-subtitle-panel">
              Choose the counter you want to operate
            </p>
          </div>

          {/* Counters Grid */}
          <div className="counters-grid-panel">
            {countersList.map((counter, index) => (
              <div 
                key={counter._id} 
                className={`counter-selection-card ${counter.status} ${selectedCounterItem?._id === counter._id ? 'selected-counter' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleCounterSelection(counter)}
              >
                <div className="card-header-section">
                  <div className="counter-number-display">Counter {counter.counterNumber}</div>
                  <div className={`status-indicator ${counter.status}`}>
                    <div className="status-indicator-dot"></div>
                  </div>
                </div>
                
                <div className="counter-details-section">
                  <div className="counter-name-display">{counter.name}</div>
                  <div className="department-name">{counter.department?.name}</div>
                </div>

                {counter.currentTicket && (
                  <div className="current-ticket-section">
                    <div className="ticket-label-text">Current Token:</div>
                    <div className="ticket-number-display" style={{ color: secondaryColor }}>
                      {counter.currentTicket.ticketNumber}
                    </div>
                  </div>
                )}

                <div className="selection-footer-section">
                  <span className={`status-text-label ${counter.status}`}>
                    {counter.status.charAt(0).toUpperCase() + counter.status.slice(1)}
                  </span>
                  <button className="counter-select-button">
                    <i className="fas fa-arrow-right"></i> Select Counter
                  </button>
                </div>
              </div>
            ))}
          </div>

          {countersList.length === 0 && (
            <div className="empty-state-panel">
              <div className="empty-state-icon">
                <i className="fas fa-desktop"></i>
              </div>
              <h3>No Counters Available</h3>
              <p>You don't have access to any counters or no counters are configured.</p>
              <p>Please contact administrator for counter access.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="panel-footer-theme selection-panel-footer">
          <div className="footer-content-section">
            <div className="system-info-text">
              {hospitalTitle} • Queue Management System v1.0
            </div>
            <button className="logout-action-button" onClick={handleUserLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterSelectionRenamed;