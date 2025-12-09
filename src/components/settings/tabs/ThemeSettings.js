import React, { useState } from 'react';
import ThemePreview from '../previews/ThemePreview';


const ThemeSettings = ({ settings, onSettingsChange, setHasUnsavedChanges }) => {
  const [activeTab, setActiveTab] = useState('templates');

  // Predefined theme templates
  const themeTemplates = {
    modern: {
      name: 'Modern Blue',
      primaryColor: '#2980b9',
      secondaryColor: '#2c3e50',
      backgroundColor: '#ecf0f1',
      accentColor: '#e74c3c',
      fontFamily: 'Segoe UI',
      description: 'Clean and professional blue theme'
    },
    healthcare: {
      name: 'Healthcare Green',
      primaryColor: '#27ae60',
      secondaryColor: '#2c3e50',
      backgroundColor: '#f8f9fa',
      accentColor: '#e67e22',
      fontFamily: 'Arial',
      description: 'Calming green theme for healthcare environment'
    },
    corporate: {
      name: 'Corporate Dark',
      primaryColor: '#34495e',
      secondaryColor: '#2c3e50',
      backgroundColor: '#f5f6fa',
      accentColor: '#9b59b6',
      fontFamily: 'Inter',
      description: 'Professional dark theme for corporate settings'
    },
    emergency: {
      name: 'Emergency Red',
      primaryColor: '#c0392b',
      secondaryColor: '#7f8c8d',
      backgroundColor: '#fdf2f2',
      accentColor: '#e74c3c',
      fontFamily: 'Roboto',
      description: 'High visibility theme for emergency departments'
    },
    soothing: {
      name: 'Soothing Purple',
      primaryColor: '#8e44ad',
      secondaryColor: '#34495e',
      backgroundColor: '#f8f9fa',
      accentColor: '#3498db',
      fontFamily: 'Open Sans',
      description: 'Calming purple theme for patient comfort'
    },
    classic: {
      name: 'Classic Hospital',
      primaryColor: '#1a5276',
      secondaryColor: '#566573',
      backgroundColor: '#f4f6f6',
      accentColor: '#dc7633',
      fontFamily: 'Helvetica',
      description: 'Traditional hospital color scheme'
    }
  };

  const handleThemeChange = (themeKey, value) => {
    onSettingsChange(prev => ({
      ...prev,
      themes: {
        ...prev.themes,
        [themeKey]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const applyTemplate = (template) => {
    onSettingsChange(prev => ({
      ...prev,
      themes: {
        ...prev.themes,
        ...template
      }
    }));
    setHasUnsavedChanges(true);
  };

  const resetToDefault = () => {
    onSettingsChange(prev => ({
      ...prev,
      themes: {
        primaryColor: '#2980b9',
        secondaryColor: '#2c3e50',
        backgroundColor: '#ecf0f1',
        accentColor: '#e74c3c',
        fontFamily: 'Segoe UI',
        fontSize: 'medium',
        borderRadius: 'medium',
        shadowIntensity: 'medium'
      }
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>Theme Settings</h2>
        <p>Customize the visual appearance of your system</p>
      </div>

      {/* Theme Tabs */}
      <div className="theme-tabs">
        <button 
          className={`theme-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <i className="fas fa-palette"></i>
          Theme Templates
        </button>
        <button 
          className={`theme-tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <i className="fas fa-sliders-h"></i>
          Customize
        </button>
      </div>

      {activeTab === 'templates' && (
        <div className="templates-section">
          <div className="section-subheader">
            <h3>Predefined Themes</h3>
            <p>Choose from professionally designed theme templates</p>
          </div>
          
          <div className="templates-grid">
            {Object.entries(themeTemplates).map(([key, template]) => (
              <div 
                key={key}
                className="template-card"
                onClick={() => applyTemplate(template)}
              >
                <div 
                  className="template-preview"
                  style={{
                    background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)`
                  }}
                >
                  <div className="template-colors">
                    <div 
                      className="color-swatch primary"
                      style={{ backgroundColor: template.primaryColor }}
                    ></div>
                    <div 
                      className="color-swatch secondary"
                      style={{ backgroundColor: template.secondaryColor }}
                    ></div>
                    <div 
                      className="color-swatch accent"
                      style={{ backgroundColor: template.accentColor }}
                    ></div>
                  </div>
                </div>
                <div className="template-info">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-font">
                    <i className="fas fa-font"></i>
                    {template.fontFamily}
                  </div>
                </div>
                <button className="apply-template-btn">
                  <i className="fas fa-check"></i>
                  Apply Theme
                </button>
              </div>
            ))}
          </div>

          <div className="template-actions">
            <button 
              className="btn btn-outline"
              onClick={resetToDefault}
            >
              <i className="fas fa-undo"></i>
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="customize-section">
          <div className="section-subheader">
            <h3>Custom Theme Settings</h3>
            <p>Fine-tune your theme with custom colors and fonts</p>
          </div>

          <div className="settings-grid">
            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-paint-brush"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Primary Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    className="color-picker"
                    value={settings.themes?.primaryColor || '#2980b9'}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="color-input"
                    value={settings.themes?.primaryColor || '#2980b9'}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    placeholder="#2980b9"
                  />
                </div>
                <div className="setting-description">
                  Main brand color for buttons and headers
                </div>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-fill-drip"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Secondary Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    className="color-picker"
                    value={settings.themes?.secondaryColor || '#2c3e50'}
                    onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="color-input"
                    value={settings.themes?.secondaryColor || '#2c3e50'}
                    onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                    placeholder="#2c3e50"
                  />
                </div>
                <div className="setting-description">
                  Secondary color for backgrounds and borders
                </div>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-square"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Background Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    className="color-picker"
                    value={settings.themes?.backgroundColor || '#ecf0f1'}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="color-input"
                    value={settings.themes?.backgroundColor || '#ecf0f1'}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    placeholder="#ecf0f1"
                  />
                </div>
                <div className="setting-description">
                  Background color for screens and panels
                </div>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Accent Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    className="color-picker"
                    value={settings.themes?.accentColor || '#e74c3c'}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="color-input"
                    value={settings.themes?.accentColor || '#e74c3c'}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    placeholder="#e74c3c"
                  />
                </div>
                <div className="setting-description">
                  Accent color for highlights and important elements
                </div>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-font"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Font Family</label>
                <select
                  className="setting-select"
                  value={settings.themes?.fontFamily || 'Segoe UI'}
                  onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                >
                  <option value="Segoe UI">Segoe UI</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Lato">Lato</option>
                </select>
                <div className="setting-description">
                  Font family for all text in the system
                </div>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-text-height"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Base Font Size</label>
                <select
                  className="setting-select"
                  value={settings.themes?.fontSize || 'medium'}
                  onChange={(e) => handleThemeChange('fontSize', e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">Extra Large</option>
                </select>
                <div className="setting-description">
                  Base font size for all text elements
                </div>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-border-style"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Border Radius</label>
                <select
                  className="setting-select"
                  value={settings.themes?.borderRadius || 'medium'}
                  onChange={(e) => handleThemeChange('borderRadius', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="full">Full Rounded</option>
                </select>
                <div className="setting-description">
                  Border radius for buttons and cards
                </div>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <i className="fas fa-box-shadow"></i>
              </div>
              <div className="setting-content">
                <label className="setting-label">Shadow Intensity</label>
                <select
                  className="setting-select"
                  value={settings.themes?.shadowIntensity || 'medium'}
                  onChange={(e) => handleThemeChange('shadowIntensity', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="subtle">Subtle</option>
                  <option value="medium">Medium</option>
                  <option value="strong">Strong</option>
                </select>
                <div className="setting-description">
                  Shadow intensity for cards and containers
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Preview */}
      <div className="theme-preview-section">
        <div className="section-subheader">
          <h3>Theme Preview</h3>
          <p>See how your theme will look across different screens</p>
        </div>
        <ThemePreview settings={settings} />
      </div>
    </div>
  );
};

export default ThemeSettings;