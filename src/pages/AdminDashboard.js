import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authService } from '../services/authService';
import QueueControl from '../components/QueueControl';
import CounterManagement from '../components/CounterManagement';
import SystemSettings from '../components/settings/SystemSettings';
import ReportsTab from '../components/ReportsTab';
import UserManagement from '../components/UserManagement';
import '../styles/AdminDashboard.css';

const AdminDashboardRenamed = () => {
  const socket = useSocket();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [statsData, setStatsData] = useState({});
  const [departmentsList, setDepartmentsList] = useState([]);
  const [countersList, setCountersList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [currentActiveTab, setCurrentActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get theme settings with proper fallbacks
  const themeConfig = settings?.themes || {};
  const mainColor = themeConfig.primaryColor || '#1e3a8a';
  const secondaryColor = themeConfig.accentColor || '#dc2626';
  const textFontFamily = themeConfig.fontFamily || 'Inter, sans-serif';

  // Get hospital info
  const hospitalTitle = settings?.hospitalName || 'ALKHIDMAT RAAZI HOSPITAL';
  const hospitalLogoImage = settings?.hospitalLogo || '';
  const hospitalLocation = settings?.hospitalCity || 'ISLAMABAD';

  // ✅ ENHANCED URL CHECK + AUTH VALIDATION
  useEffect(() => {
    const validateAccess = async () => {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        navigate('/login/admin');
        return;
      }

      // Check if user has admin access
      const user = authService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        navigate('/login/admin');
        return;
      }
    };

    validateAccess();
    
    // Apply theme settings
    document.body.style.fontFamily = textFontFamily;
    document.body.style.overflow = 'auto'; // Changed from hidden to auto
  }, [user, location, navigate, textFontFamily]);

  // ✅ LOAD + SOCKET + AUTO REFRESH
  useEffect(() => {
    fetchDashboardData();
    initializeSocketListeners();

    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsResponse, departmentsResponse, countersResponse, activitiesResponse] = await Promise.all([
        adminService.getStats(),
        adminService.getDepartments(),
        adminService.getCounters(),
        adminService.getActivities(),
      ]);
      setStatsData(statsResponse);
      setDepartmentsList(departmentsResponse);
      setCountersList(countersResponse);
      // Only keep the latest 3 activities
      setActivityLogs(activitiesResponse.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSocketListeners = () => {
    if (!socket) return;

    socket.on('ticket-generated', fetchDashboardData);
    socket.on('ticket-completed', fetchDashboardData);
    socket.on('counter-updated', fetchDashboardData);
    socket.on('settings-updated', fetchDashboardData);
  };

  const handleUserLogout = () => {
    logout();
  };

  // ✅ FIXED URL OPENING - ADMIN CAN ACCESS ALL COMPONENTS
  const openExternalComponent = (component, path) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${path}`;
    
    console.log(`🔄 Opening ${component} at: ${fullUrl}`);
    
    // For admin users, we can directly open the URL without validation
    // The target component will handle its own authentication
    window.open(fullUrl, '_blank', 'noopener,noreferrer,width=1200,height=800');
  };

  const renderCurrentTabContent = () => {
    switch (currentActiveTab) {
      case 'dashboard':
        return (
          <DashboardContent
            statistics={statsData}
            departments={departmentsList}
            counters={countersList}
            activities={activityLogs}
            loading={isLoading}
            hospitalName={hospitalTitle}
            hospitalCity={hospitalLocation}
          />
        );
      case 'queue-control':
        return <QueueControl />;
      case 'counters':
        return <CounterManagement counters={countersList} />;
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <SystemSettings />;
      case 'users':
        return <UserManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="theme-container dark-blue-theme admin-panel-theme">
      {/* Background Elements */}
      <div className="background-logo">
        {hospitalLogoImage && <img src={hospitalLogoImage} alt="Hospital Logo" className="blured-logo" />}
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
      <div className="content-wrapper admin-content-wrapper">
        {/* Header Section - Updated to match Ticket Dispenser */}
        <div className="dispenser-header-theme admin-header-theme">
          <div className="hospital-brand-theme">
            {hospitalLogoImage ? (
              <img src={hospitalLogoImage} alt="Hospital Logo" className="hospital-logo-theme" />
            ) : (
              <div className="hospital-logo-theme-icon">
                <i className="fas fa-hospital-alt"></i>
              </div>
            )}
            <div className="hospital-info-theme">
              <h1 className="hospital-name-theme">
                {hospitalTitle}
              </h1>
              <p className="hospital-city-theme">{hospitalLocation}</p>
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

        {/* Dashboard Content */}
        <div className="admin-main-content">
          {/* Sidebar */}
          <div className={`admin-sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
            <div className="sidebar-header">
              <button
                className="sidebar-toggle"
                onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
              >
                <i className={`fas ${isSidebarMinimized ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
              </button>
            </div>

            {/* Menu */}
            <div className="navigation-menu">
              {[
                { key: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
                { key: 'queue-control', icon: 'fa-list-ol', label: 'Queue Control' },
                { key: 'counters', icon: 'fa-desktop', label: 'Counters' },
                { key: 'users', icon: 'fa-user-shield', label: 'User Management' },
                { key: 'reports', icon: 'fa-chart-bar', label: 'Reports' },
                { key: 'settings', icon: 'fa-cog', label: 'Settings' },
              ].map(({ key, icon, label }) => (
                <div
                  key={key}
                  className={`menu-item ${currentActiveTab === key ? 'active' : ''}`}
                  onClick={() => setCurrentActiveTab(key)}
                >
                  <i className={`fas ${icon}`}></i>
                  <span className={isSidebarMinimized ? 'hidden' : ''}>{label}</span>
                </div>
              ))}
            </div>

            {/* System Controls */}
            <div className="system-controls">
              <button 
                className="btn-system" 
                onClick={() => openExternalComponent('dispenser', '/dispenser')}
                title="Open Ticket Dispenser in new window"
              >
                <i className="fas fa-ticket-alt"></i>
                <span className={isSidebarMinimized ? 'hidden' : ''}>Ticket Dispenser</span>
              </button>
              <button 
                className="btn-system" 
                onClick={() => openExternalComponent('waiting', '/waiting')}
                title="Open Waiting Area in new window"
              >
                <i className="fas fa-tv"></i>
                <span className={isSidebarMinimized ? 'hidden' : ''}>Waiting Area</span>
              </button>
              
              <button className="btn-system btn-danger" onClick={() => adminService.resetSystem()}>
                <i className="fas fa-redo"></i>
                <span className={isSidebarMinimized ? 'hidden' : ''}>Reset System</span>
              </button>
            </div>

            {/* User Info */}
            <div className="user-info-container">
              <div
                className="user-info"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="user-avatar">
                  <div className="avatar-letter">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name || 'System Admin'}</span>
                  <span className="user-role">{user?.role || 'Administrator'}</span>
                </div>
                <i className={`fas fa-chevron-down ${showProfileMenu ? 'rotate' : ''}`}></i>
              </div>

              {showProfileMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                    <i className="fas fa-user"></i>
                    <span>Profile</span>
                  </div>
                  <div className="dropdown-item logout" onClick={handleUserLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="admin-content-area">
            <div className="content-header">
              <h2>
                {currentActiveTab === 'dashboard' && 'Queue Management Dashboard'}
                {currentActiveTab === 'queue-control' && 'Queue Control Center'}
                {currentActiveTab === 'counters' && 'Counter Management'}
                {currentActiveTab === 'users' && 'User Management'}
                {currentActiveTab === 'reports' && 'Reports & Analytics'}
                {currentActiveTab === 'settings' && 'System Settings'}
              </h2>
              <button className="btn-refresh" onClick={fetchDashboardData}>
                <i className="fas fa-sync-alt"></i>
                Refresh
              </button>
            </div>

            <div className="tab-content">
              {renderCurrentTabContent()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dispenser-footer-theme admin-footer">
          <div className="footer-content-theme">
            <div className="system-info-theme">
              {hospitalTitle} • Queue Management System v2.0 • Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// DashboardContent component with updated activity display
const DashboardContent = ({ statistics, departments, counters, activities, loading, hospitalName, hospitalCity }) => {
  if (loading)
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <div className="spinner-3d"></div>
          <div>Loading Dashboard Data...</div>
        </div>
      </div>
    );

  return (
    <div className="dashboard-tab">
      <div className="stats-grid">
        {[
          { label: 'Total Waiting', value: statistics.totalWaiting || 0, icon: 'fa-users', color: 'primary' },
          { label: 'Served Today', value: statistics.servedToday || 0, icon: 'fa-check-circle', color: 'success' },
          { label: 'Avg Wait Time', value: `${statistics.avgWaitTime || 0}m`, icon: 'fa-clock', color: 'warning' },
          { label: 'Active Counters', value: `${statistics.activeCounters || 0}/10`, icon: 'fa-desktop', color: 'info' },
        ].map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color}`}>
            <div className="stat-icon"><i className={`fas ${stat.icon}`}></i></div>
            <div className="stat-info">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Departments */}
      <div className="dashboard-section">
        <div className="section-header"><h3>Department Queues</h3></div>
        <div className="queue-cards">
          {departments.map((dept) => (
            <div key={dept._id} className="queue-card">
              <h4>{dept.name}</h4>
              <div className="queue-count">{dept.waitingCount || 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Counters */}
      <div className="dashboard-section">
        <div className="section-header"><h3>Counter Status</h3></div>
        <div className="counters-grid">
          {counters.map((counter) => (
            <div key={counter._id} className={`counter-item ${counter.status}`}>
              <div className="counter-header">
                <div className="counter-number">Counter {counter.counterNumber}</div>
              </div>
              <div className="counter-department">
                {counter.department?.name || 'Unassigned'}
              </div>
              <div className="counter-footer">
                <span className={`status-text ${counter.status}`}>
                  {counter.status.charAt(0).toUpperCase() + counter.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity - Only 3 items */}
      <div className="dashboard-section full-width">
        <div className="section-header">
          <h3>Recent Activity</h3>
          <span className="activity-count">{activities.length} activities</span>
        </div>
        <div className="activity-list">
          {activities.length > 0 ? (
            activities.map((a) => (
              <div key={a._id} className="activity-item">
                <div className="activity-icon">
                  <i className="fas fa-bell"></i>
                </div>
                <div className="activity-content">
                  <div className="activity-details">{a.details}</div>
                  <small className="activity-time">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <i className="fas fa-inbox"></i>
              <p>No recent activities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardRenamed;