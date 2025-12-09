import React from 'react';


const SettingsNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'general', icon: 'cog', title: 'General', subtitle: 'Basic system configuration' },
    { key: 'queue', icon: 'list-ol', title: 'Queue Settings', subtitle: 'Patient flow management' },
    
    { key: 'theme', icon: 'palette', title: 'Theme Settings', subtitle: 'Visual customization' },
    { key: 'ads', icon: 'ad', title: 'Advertisements', subtitle: 'Display messages' },
    { key: 'maintenance', icon: 'tools', title: 'Maintenance', subtitle: 'System management' }
  ];

  return (
    <div className="settings-navigation">
      <div className="nav-tabs">
        {tabs.map(tab => (
          <button 
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <div className="tab-icon">
              <i className={`fas fa-${tab.icon}`}></i>
            </div>
            <div className="tab-content">
              <div className="tab-title">{tab.title}</div>
              <div className="tab-subtitle">{tab.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsNavigation;