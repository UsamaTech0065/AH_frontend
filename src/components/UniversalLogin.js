import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useSettings } from '../context/SettingsContext';
import '../styles/UniversalLogin.css';

const UniversalLogin = ({ component, redirectPath }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();

  const componentConfig = {
    admin: {
      title: 'Admin Dashboard',
      subtitle: 'Hospital Management System',
      icon: 'fas fa-cog',
      primaryColor: '#1e3a8a',
      accentColor: '#dc2626'
    },
    counter: {
      title: 'Counter Login',
      subtitle: 'Service Counter Access',
      icon: 'fas fa-desktop',
      primaryColor: '#1e3a8a',
      accentColor: '#dc2626'
    },
    dispenser: {
      title: 'Ticket Dispenser',
      subtitle: 'Generate Patient Tickets',
      icon: 'fas fa-ticket-alt',
      primaryColor: '#1e3a8a',
      accentColor: '#dc2626'
    },
    waiting: {
      title: 'Waiting Area',
      subtitle: 'Patient Display System',
      icon: 'fas fa-tv',
      primaryColor: '#1e3a8a',
      accentColor: '#dc2626'
    },
    display: {
      title: 'Display Screen',
      subtitle: 'Information Display',
      icon: 'fas fa-desktop',
      primaryColor: '#1e3a8a',
      accentColor: '#dc2626'
    }
  };

  const config = componentConfig[component] || componentConfig.counter;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`🔐 Attempting login for ${username} to ${component}`);
      
      const result = await authService.login(username, password, component);
      
      console.log('✅ Login successful, result:', result);
      
      if (result.user) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('accessToken', result.tokens.accessToken);
        localStorage.setItem('refreshToken', result.tokens.refreshToken);
        localStorage.setItem('component', component);
        localStorage.setItem('loginTime', new Date().toISOString());

        const intendedPath = result.tokens.redirectPath || redirectPath || location.state?.from?.pathname || '/';
        
        console.log(`🔄 Redirecting to: ${intendedPath}`);
        
        navigate(intendedPath, { replace: true });
      } else {
        throw new Error('Login response missing user data');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCredentials = () => {
    const defaults = {
      admin: { username: 'admin', password: 'admin123' },
      operator: { username: 'operator', password: 'operator123' },
      dispenser: { username: 'dispenser', password: 'dispenser123' },
      display: { username: 'display', password: 'display123' },
      waiting: { username: 'display', password: 'display123' }
    };
    return defaults[component] || null;
  };

  const fillDefaultCredentials = () => {
    const defaults = getDefaultCredentials();
    if (defaults) {
      setUsername(defaults.username);
      setPassword(defaults.password);
    }
  };

  // Get hospital info
  const hospitalName = settings?.hospitalName || 'ALKHIDMAT RAAZI HOSPITAL';
  const hospitalLogo = settings?.hospitalLogo || '';
  const hospitalCity = settings?.hospitalCity || 'ISLAMABAD';

  return (
    <div className="theme-container dark-blue-theme">
      {/* Background Elements */}
      <div className="background-logo">
        {hospitalLogo && <img src={hospitalLogo} alt="Hospital Logo" className="blured-logo" />}
      </div>
      
      <div className="square-lines">
        <div className="line horizontal top"></div>
        <div className="line horizontal bottom"></div>
        <div className="line vertical left"></div>
        <div className="line vertical right"></div>
      </div>
      
      <div className="corner-decorations">
        <div className="corner top-left blue"></div>
        <div className="corner top-right red"></div>
        <div className="corner bottom-left red"></div>
        <div className="corner bottom-right blue"></div>
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        <div className="login-header-theme">
          <div className="hospital-brand-theme">
            {hospitalLogo ? (
              <img src={hospitalLogo} alt="Hospital Logo" className="hospital-logo-theme" />
            ) : (
              <div className="hospital-logo-theme-icon">
                <i className="fas fa-hospital-alt"></i>
              </div>
            )}
            <div className="hospital-info-theme">
              <h1 className="hospital-name-theme">
                {hospitalName}
              </h1>
              <p className="hospital-city-theme">{hospitalCity}</p>
              <p className="arabic-text">الخدمت رازی ہسپتال اسلام آباد</p>
            </div>
          </div>
          
          <div className="header-status-theme">
            <div className="status-indicator-theme online">
              <i className="fas fa-circle"></i>
              System Online
            </div>
            <div className="current-time-theme">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card-section">
          <div className="login-card-theme">
            <div className="login-card-header-theme">
              <div className="login-card-icon-theme">
                <i className={config.icon}></i>
              </div>
              <h2>{config.title}</h2>
              <p>{config.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form-theme">
              {error && (
                <div className="login-error-theme">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="login-form-group-theme">
                <div className="login-input-container-theme">
                  <i className="fas fa-user login-input-icon-theme"></i>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                    className="login-input-theme"
                  />
                  <div className="login-input-highlight-theme"></div>
                </div>
              </div>

              <div className="login-form-group-theme">
                <div className="login-input-container-theme">
                  <i className="fas fa-lock login-input-icon-theme"></i>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="login-input-theme"
                  />
                  <div className="login-input-highlight-theme"></div>
                </div>
              </div>

              {getDefaultCredentials() && (
                <div className="login-default-credentials-theme">
                  <button 
                    type="button" 
                    onClick={fillDefaultCredentials} 
                    className="login-btn-link-theme"
                  >
                    <i className="fas fa-key"></i>
                    Use Default Credentials
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="login-submit-btn-theme"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner login-spinner-theme"></i>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Sign In to {config.title}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer-theme">
          <div className="footer-content-theme">
            <div className="system-info-theme">
              {hospitalName} • Queue Management System v2.0
            </div>
            <div className="login-component-badge-theme">
              <i className="fas fa-microchip"></i>
              Accessing: <strong>{config.title}</strong>
            </div>
          </div>
          {getDefaultCredentials() && (
            <div className="login-debug-info-theme">
              <small>
                Demo: {getDefaultCredentials().username} / {getDefaultCredentials().password}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversalLogin;