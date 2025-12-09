import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { settingsService } from '../../services/settingsService';

import SettingsHeader from './SettingsHeader';
import SettingsNavigation from './SettingsNavigation';
import SettingsFooter from './SettingsFooter';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

import GeneralSettings from './tabs/GeneralSettings';
import QueueSettings from './tabs/QueueSettings';
import ThemeSettings from './tabs/ThemeSettings';
import AdvertisementSettings from './tabs/AdvertisementSettings';
import MaintenanceSettings from './tabs/MaintenanceSettings';

import '../../styles/SystemSettings.css';

const SystemSettings = () => {
  const { settings: contextSettings, updateSettings, refreshSettings } = useSettings();
  
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load context settings
  useEffect(() => {
    if (contextSettings) {
      setSettings(JSON.parse(JSON.stringify(contextSettings)));
    }
  }, [contextSettings]);

  // ✅ Handle input change (supports nested keys like "themes.primaryColor")
  const handleInputChange = (key, value) => {
    setSettings(prev => {
      if (key.includes('.')) {
        const keys = key.split('.');
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: value
          }
        };
      }
      return { ...prev, [key]: value };
    });
    setHasUnsavedChanges(true);
  };

  // ✅ Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setMessage('Saving settings...');
      const updated = await updateSettings(settings);
      setSettings(updated);
      setHasUnsavedChanges(false);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      await refreshSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Refresh settings from server
  const handleRefreshSettings = async () => {
    try {
      await refreshSettings();
      setHasUnsavedChanges(false);
      setMessage('Settings refreshed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error refreshing settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // ✅ Reset to last saved state
  const discardChanges = () => {
    setSettings(JSON.parse(JSON.stringify(contextSettings)));
    setHasUnsavedChanges(false);
    setMessage('Changes discarded');
    setTimeout(() => setMessage(''), 3000);
  };

  // ✅ Delete all data confirmation
  const handleDeleteAllData = async () => {
    try {
      setSaving(true);
      await settingsService.deleteAllData();
      setMessage('All data deleted successfully! System will reload...');
      setShowDeleteConfirm(false);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      setMessage('Error deleting data: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Loading state
  if (!settings) {
    return (
      <div className="system-settings loading">
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <div className="loading-text">Loading Settings...</div>
        </div>
      </div>
    );
  }

  // ✅ Render tab content dynamically
  const renderActiveTab = () => {
    const tabProps = {
      settings,
      onInputChange: handleInputChange,
      setHasUnsavedChanges,
      setMessage,
      onSettingsChange: setSettings,
    };

    switch (activeTab) {
      case 'general': return <GeneralSettings {...tabProps} />;
      case 'queue': return <QueueSettings {...tabProps} />;
      case 'theme': return <ThemeSettings {...tabProps} />;
      case 'ads': return <AdvertisementSettings {...tabProps} />;
      case 'maintenance':
        return (
          <MaintenanceSettings
            {...tabProps}
            onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
          />
        );
      default:
        return <GeneralSettings {...tabProps} />;
    }
  };

  // ✅ Render main layout
  return (
    <div className="system-settings">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAllData}
          saving={saving}
        />
      )}

      {/* Header */}
      <SettingsHeader
        hasUnsavedChanges={hasUnsavedChanges}
        onRefresh={handleRefreshSettings}
        message={message}
      />

      {/* Navigation */}
      <SettingsNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <div className="settings-content">
        {renderActiveTab()}
      </div>

      {/* Footer */}
      <SettingsFooter
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSaveSettings}
        onDiscard={discardChanges}
      />
    </div>
  );
};

export default SystemSettings;