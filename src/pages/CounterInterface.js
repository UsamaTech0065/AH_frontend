import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { counterService } from '../services/counterService';
import { authService } from '../services/authService';
import '../styles/CounterInterface.css';

const CounterInterface = () => {
  const { counterId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { settings } = useSettings();
  
  const [counterData, setCounterData] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketQueue, setTicketQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [connectionState, setConnectionState] = useState('connected');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [targetDepartment, setTargetDepartment] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [callInProgress, setCallInProgress] = useState(false);
  const [buttonCooldown, setButtonCooldown] = useState(false);

  // ✅ ENHANCED: Auto-reload state
  const [autoReloadTrigger, setAutoReloadTrigger] = useState(0);
  const [lastAction, setLastAction] = useState('');

  const themeConfig = settings?.themes || {};
  const mainColor = themeConfig.primaryColor || '#1e3a8a';
  const highlightColor = themeConfig.accentColor || '#dc2626';
  const textFontFamily = themeConfig.fontFamily || 'Inter, sans-serif';

  const hospitalTitle = settings?.hospitalName || 'ALKHIDMAT RAAZI HOSPITAL';
  const hospitalLogoImage = settings?.hospitalLogo || '';
  const hospitalLocation = settings?.hospitalCity || 'ISLAMABAD';

  useEffect(() => {
    document.body.style.fontFamily = textFontFamily;
    document.body.style.overflow = 'auto';

    initializeCounterSystem();
    loadDepartmentData();
    
    return () => {
      removeSocketListeners();
    };
  }, [counterId, textFontFamily]);

  // ✅ ENHANCED: AUTO-RELOAD AFTER ACTIONS
  useEffect(() => {
    if (autoReloadTrigger > 0) {
      console.log('🔄 AUTO-RELOAD: Triggering reload after action:', lastAction);
      const reloadTimer = setTimeout(() => {
        reloadCounterData();
      }, 1500); // 1.5 seconds delay for auto-reload

      return () => clearTimeout(reloadTimer);
    }
  }, [autoReloadTrigger]);

  // ✅ ENHANCED: CALL NEXT PATIENT - WITH AUTO-RELOAD
  const callNextInQueue = async () => {
    if (ticketQueue.length === 0 || counterData?.status === 'busy' || callInProgress || buttonCooldown) {
      console.log('❌ Call Next disabled:', {
        queueLength: ticketQueue.length,
        counterStatus: counterData?.status,
        callInProgress,
        buttonCooldown
      });
      return;
    }

    try {
      setIsLoading(true);
      setCallInProgress(true);
      setButtonCooldown(true);
      setLastAction('call_next');
      
      const nextTicket = ticketQueue[0];
      console.log('🎯 CENTRALIZED: Calling next ticket:', nextTicket.ticketNumber);

      // ✅ ENHANCED: Use centralized voice system with faster processing
      socket.emit('request-voice-call', {
        ticket: {
          _id: nextTicket._id,
          ticketNumber: nextTicket.ticketNumber,
          priority: nextTicket.priority,
          department: nextTicket.department
        },
        counter: {
          _id: counterData._id,
          counterNumber: counterData.counterNumber
        },
        isRecall: false,
        source: 'counter',
        timestamp: Date.now()
      });

      console.log('✅ CENTRALIZED: Call request sent successfully');
      
      // ✅ AUTO-RELOAD: Trigger reload after call
      setAutoReloadTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Call next error:', error);
      setCallInProgress(false);
      setButtonCooldown(false);
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED: RECALL CURRENT TICKET - WITH AUTO-RELOAD
  const recallCurrentTicket = async () => {
    if (!activeTicket || callInProgress || buttonCooldown) {
      console.log('❌ Recall disabled:', {
        activeTicket: !!activeTicket,
        callInProgress,
        buttonCooldown
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setCallInProgress(true);
      setButtonCooldown(true);
      setLastAction('recall');
      
      console.log('🎯 CENTRALIZED: Recalling ticket:', activeTicket.ticketNumber);

      // ✅ ENHANCED: Use centralized voice system with faster processing
      socket.emit('request-voice-recall', {
        ticket: {
          _id: activeTicket._id,
          ticketNumber: activeTicket.ticketNumber,
          priority: activeTicket.priority,
          department: activeTicket.department
        },
        counter: {
          _id: counterData._id,
          counterNumber: counterData.counterNumber
        },
        isRecall: true,
        source: 'counter',
        timestamp: Date.now()
      });

      console.log('✅ CENTRALIZED: Recall request sent successfully');
      
      // ✅ AUTO-RELOAD: Trigger reload after recall
      setAutoReloadTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Recall error:', error);
      setCallInProgress(false);
      setButtonCooldown(false);
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED: COMPLETE CURRENT SERVICE WITH AUTO-RELOAD
  const completeCurrentService = async () => {
    if (!activeTicket) return;
    
    try {
      setIsLoading(true);
      setLastAction('complete');
      await counterService.completeTicket(counterId);
      
      console.log('✅ Service completed, triggering auto-reload');
      
      // ✅ AUTO-RELOAD: Trigger reload after completion
      setAutoReloadTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Completion failed:', error);
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED: RELOAD FUNCTION
  const reloadCounterData = async () => {
    try {
      console.log('🔄 Auto-reloading counter data...');
      await loadCounterInformation();
      setCallInProgress(false);
      setButtonCooldown(false);
      setIsLoading(false);
      console.log('✅ Auto-reload completed');
    } catch (error) {
      console.error('❌ Auto-reload failed:', error);
      setCallInProgress(false);
      setButtonCooldown(false);
      setIsLoading(false);
    }
  };

  const reloadFullPage = () => {
    window.location.reload();
  };

  // ✅ ENHANCED: TRANSFER TICKET WITH AUTO-RELOAD
  const initiateTicketTransfer = async () => {
    if (!activeTicket || !targetDepartment) return;

    try {
      setIsTransferring(true);
      setLastAction('transfer');
      await counterService.transferTicket(counterId, targetDepartment);
      setShowTransferDialog(false);
      setTargetDepartment('');
      
      console.log('✅ Ticket transferred, triggering auto-reload');
      
      // ✅ AUTO-RELOAD: Trigger reload after transfer
      setAutoReloadTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Transfer failed:', error);
      setIsTransferring(false);
    }
  };

  const openTransferDialog = () => {
    if (!activeTicket) return;
    setShowTransferDialog(true);
  };

  const closeTransferDialog = () => {
    setShowTransferDialog(false);
    setTargetDepartment('');
  };

  const openWaitingDisplay = () => {
    const baseUrl = window.location.origin;
    const waitingUrl = `${baseUrl}/waiting/counter/${counterId}`;
    window.open(waitingUrl, `Waiting_${counterId}`, 'width=1400,height=900,location=no,menubar=no,toolbar=no');
  };

  const getPriorityDetails = (priority) => {
    const priorityTypes = {
      emergency: { label: 'Emergency', color: '#dc2626', icon: 'fa-truck-medical' },
      priority: { label: 'Priority', color: '#ea580c', icon: 'fa-star' },
      senior: { label: 'Senior', color: '#7c3aed', icon: 'fa-user-tie' },
      child: { label: 'Child', color: '#0891b2', icon: 'fa-child' },
      normal: { label: 'Normal', color: '#059669', icon: 'fa-user' }
    };
    return priorityTypes[priority] || priorityTypes.normal;
  };

  const getStatusColorCode = (status) => {
    const statusColors = {
      active: '#059669',
      busy: '#dc2626',
      break: '#d97706',
      offline: '#6b7280'
    };
    return statusColors[status] || statusColors.offline;
  };

  const loadDepartmentData = async () => {
    try {
      const departmentsResponse = await counterService.getDepartments();
      setDepartmentList(departmentsResponse.filter(dept => dept.active !== false));
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const initializeCounterSystem = async () => {
    if (!await validateUserAccess()) return;
    await loadCounterInformation();
    setupSocketListeners();
  };

  const validateUserAccess = async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login/counter');
      return false;
    }

    const currentUser = authService.getCurrentUser();
    const currentComponent = authService.getCurrentComponent();
    
    if (currentComponent !== 'counter') {
      navigate('/login/counter');
      return false;
    }

    if (currentUser?.counter && currentUser.counter._id !== counterId && currentUser.counter !== counterId) {
      alert('Access denied to this counter');
      navigate('/counter/select');
      return false;
    }

    return true;
  };

  const loadCounterInformation = async () => {
    try {
      setIsLoading(true);
      const counterDetails = await counterService.getCounterDetails(counterId);
      
      setCounterData(counterDetails.counter);
      setActiveTicket(counterDetails.counter?.currentTicket || null);
      setTicketQueue(counterDetails.queue || []);
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.error('Failed to load counter data:', error);
      setConnectionState('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) {
      setConnectionState('disconnected');
      return;
    }

    socket.emit('join-counter', counterId);

    socket.on('connect', () => {
      setConnectionState('connected');
      loadCounterInformation();
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    // ✅ CENTRALIZED: SUCCESS RESPONSES
    socket.on('call-request-stored', (data) => {
      console.log('✅ CENTRALIZED: Call request stored in database:', data);
      setCallInProgress(false);
      setIsLoading(false);
    });

    socket.on('recall-request-stored', (data) => {
      console.log('✅ CENTRALIZED: Recall request stored in database:', data);
      setCallInProgress(false);
      setIsLoading(false);
    });

    // ✅ CENTRALIZED: ERROR HANDLING
    socket.on('call-request-error', (data) => {
      console.error('❌ CENTRALIZED: Call request error:', data);
      setCallInProgress(false);
      setButtonCooldown(false);
      setIsLoading(false);
      alert(`Call failed: ${data.error}`);
    });

    socket.on('recall-request-error', (data) => {
      console.error('❌ CENTRALIZED: Recall request error:', data);
      setCallInProgress(false);
      setButtonCooldown(false);
      setIsLoading(false);
      alert(`Recall failed: ${data.error}`);
    });

    // Database updated notifications
    socket.on('database-updated', (data) => {
      console.log('🔄 Database updated, reloading counter data');
      loadCounterInformation();
    });

    socket.on('counter-status-updated', (data) => {
      if (data.counter._id === counterId) {
        setCounterData(data.counter);
        setActiveTicket(data.activeTicket || null);
        setLastUpdateTime(new Date());
      }
    });

    socket.on('ticket-status-updated', (data) => {
      if (data.counter._id === counterId) {
        loadCounterInformation();
      }
    });

    socket.on('call-request-completed', (data) => {
      console.log('✅ Call request completed:', data);
    });

    socket.on('reload-all-counters', () => {
      console.log('🔄 Reload signal received');
      reloadCounterData();
    });

    socket.on('reload-counter-data', () => {
      console.log('🔄 Counter reload signal received');
      reloadCounterData();
    });

    socket.on('full-page-reload', () => {
      reloadFullPage();
    });

    // ✅ ENHANCED: SUCCESS HANDLERS FOR CALL REQUESTS
    socket.on('call-request-received', (data) => {
      console.log('✅ Call request received:', data);
    });

    socket.on('recall-request-received', (data) => {
      console.log('✅ Recall request received:', data);
    });

    socket.on('token-completed', (data) => {
      if (data.counter._id === counterId) {
        reloadCounterData();
      }
    });

    socket.on('queue-updated', (data) => {
      if (data.counterId === counterId) {
        reloadCounterData();
      }
    });

    // ✅ NEW: AUTO-RELOAD TRIGGERS
    socket.on('voice-announcement-completed', () => {
      console.log('🔊 Voice completed, triggering auto-reload');
      setAutoReloadTrigger(prev => prev + 1);
    });
  };

  const removeSocketListeners = () => {
    if (!socket) return;
    
    const events = [
      'call-request-stored', 'recall-request-stored',
      'call-request-error', 'recall-request-error',
      'database-updated', 'counter-status-updated',
      'ticket-status-updated', 'call-request-completed',
      'reload-all-counters', 'reload-counter-data', 'full-page-reload',
      'call-request-received', 'recall-request-received', 'queue-updated',
      'connect', 'disconnect', 'voice-announcement-completed', 'token-completed'
    ];
    
    events.forEach(event => socket.off(event));
  };

  const isCallNextEnabled = () => {
    return ticketQueue.length > 0 && 
           counterData?.status === 'active' && 
           !isLoading && 
           !callInProgress &&
           !buttonCooldown;
  };

  const isRecallEnabled = () => {
    return activeTicket && 
           !isLoading && 
           !callInProgress &&
           !buttonCooldown;
  };

  // ✅ COOLDOWN RESET EFFECT
  useEffect(() => {
    if (buttonCooldown) {
      const timer = setTimeout(() => {
        setButtonCooldown(false);
      }, 2000); // 2 second cooldown
      return () => clearTimeout(timer);
    }
  }, [buttonCooldown]);

  if (isLoading && !counterData) {
    return (
      <div className="theme-container dark-blue-theme">
        <div className="background-logo-container">
          {hospitalLogoImage && <img src={hospitalLogoImage} alt="Hospital Logo" className="background-logo-blur" />}
        </div>
        <div className="loading-container">
          <div className="spinner-3d-animation"></div>
          <div className="loading-text">Initializing Counter Interface</div>
        </div>
      </div>
    );
  }

  if (!counterData) {
    return (
      <div className="theme-container dark-blue-theme">
        <div className="error-display">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Counter Not Available</h2>
          <div className="error-actions">
            <button onClick={loadCounterInformation} className="action-btn primary-btn">
              <i className="fas fa-redo"></i> Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-container dark-blue-theme counter-panel-theme">
      <div className="background-logo-container">
        {hospitalLogoImage && <img src={hospitalLogoImage} alt="Hospital Logo" className="background-logo-blur" />}
      </div>

      {showTransferDialog && (
        <div className="modal-overlay-container">
          <div className="modal-content-panel">
            <div className="modal-header-section">
              <h3>Transfer Ticket</h3>
              <button className="modal-close-btn" onClick={closeTransferDialog}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-content">
              <div className="transfer-details">
                <p>Transferring ticket: <strong>{activeTicket?.ticketNumber}</strong></p>
                <p>Current Department: <strong>{activeTicket?.department?.name}</strong></p>
              </div>
              <div className="form-input-group">
                <label htmlFor="department-selection">Select New Department:</label>
                <select
                  id="department-selection"
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="department-selection"
                >
                  <option value="">Select a department</option>
                  {departmentList
                    .filter(dept => dept._id !== activeTicket?.department?._id)
                    .map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
            <div className="modal-footer-section">
              <button 
                className="action-btn secondary-btn"
                onClick={closeTransferDialog}
                disabled={isTransferring}
              >
                Cancel
              </button>
              <button 
                className="action-btn warning-btn"
                onClick={initiateTicketTransfer}
                disabled={!targetDepartment || isTransferring}
              >
                {isTransferring ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Transferring...
                  </>
                ) : (
                  <>
                    <i className="fas fa-exchange-alt"></i>
                    Transfer Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-content-wrapper counter-panel-wrapper">
        {/* HEADER */}
        <div className="panel-header-theme counter-panel-header smaller-header">
          <div className="hospital-branding-theme">
            {hospitalLogoImage ? (
              <img src={hospitalLogoImage} alt="Hospital Logo" className="hospital-logo-img smaller-logo" />
            ) : (
              <div className="hospital-logo-placeholder smaller-logo">
                <i className="fas fa-hospital-alt"></i>
              </div>
            )}
            <div className="hospital-details-theme">
              <h1 className="hospital-title-theme smaller-title">
                {hospitalTitle}
              </h1>
              <p className="hospital-location-theme smaller-location">{hospitalLocation}</p>
            </div>
          </div>
          
          <div className="header-status-theme">
            <div className="counter-identification">
              <div 
                className="counter-identifier-badge smaller-badge"
                style={{ backgroundColor: mainColor }}
              >
                <i className="fas fa-desktop"></i>
                Counter {counterData.counterNumber}
              </div>
              <div 
                className="status-indicator-theme smaller-badge"
                style={{ backgroundColor: getStatusColorCode(counterData.status) }}
              >
                <i className="fas fa-circle"></i>
                {counterData.status === 'busy' ? 'Serving Patient' : 
                 counterData.status === 'active' ? 'Available' : 
                 counterData.status === 'break' ? 'On Break' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ ENHANCED: SYSTEM STATUS WITH AUTO-RELOAD INDICATOR */}
        <div className="system-status-panel smaller-status">
          <div className="system-status-info">
            <div className="status-info-item">
              <i className="fas fa-broadcast-tower"></i>
              Voice System: <strong>Centralized & Fast</strong>
            </div>
            <div className="status-info-item">
              <i className={`fas fa-${connectionState === 'connected' ? 'wifi' : 'wifi-slash'}`}></i>
              {connectionState === 'connected' ? 'Connected' : 'Offline'}
            </div>
            <div className="status-info-item">
              <i className="fas fa-users"></i>
              Queue: <strong>{ticketQueue.length}</strong>
            </div>
            {(callInProgress || buttonCooldown || autoReloadTrigger > 0) && (
              <div className="status-info-item reload-indicator">
                <i className="fas fa-sync-alt fa-spin"></i>
                <strong>
                  {callInProgress ? 'Calling...' : 
                   buttonCooldown ? 'Processing...' : 
                   'Auto-Reloading...'}
                </strong>
              </div>
            )}
          </div>

          <button 
            className="display-action-btn smaller-display-btn"
            onClick={openWaitingDisplay}
          >
            <i className="fas fa-external-link-alt"></i>
            Display
          </button>
        </div>

        <div className="counter-dashboard-panel smaller-layout">
          {/* CURRENT PATIENT SECTION */}
          <div className="dashboard-section-panel current-patient-panel smaller-patient-section">
            <div className="section-header-panel smaller-section-header">
              <h2 className="section-title-text smaller-section-title">Current Patient</h2>
              <div className="queue-summary-info smaller-queue-info">
                <span className="queue-count-badge smaller-queue-badge">{ticketQueue.length} waiting</span>
                <span className="last-update-time smaller-update-time">
                  {lastUpdateTime.toLocaleTimeString()}
                  {autoReloadTrigger > 0 && (
                    <span className="auto-reload-badge">Auto-reload active</span>
                  )}
                </span>
              </div>
            </div>

            <div className="current-ticket-display-panel smaller-ticket-display">
              {activeTicket ? (
                <div className="active-ticket-container smaller-ticket">
                  <div className="ticket-visual-display">
                    <div className="ticket-number-large-display" style={{ color: highlightColor }}>
                      {activeTicket.ticketNumber}
                    </div>
                    <div className="ticket-status-text">Now Serving</div>
                  </div>
                  <div className="ticket-details-container">
                    <div className="details-grid-layout smaller-details">
                      <div className="detail-item-panel">
                        <i className="fas fa-building"></i>
                        <label>Department</label>
                        <span>{activeTicket.department?.name}</span>
                      </div>
                      {activeTicket.patientName && (
                        <div className="detail-item-panel">
                          <i className="fas fa-user"></i>
                          <label>Patient Name</label>
                          <span>{activeTicket.patientName}</span>
                        </div>
                      )}
                      <div className="detail-item-panel">
                        <i className="fas fa-flag"></i>
                        <label>Priority</label>
                        <span 
                          className="priority-indicator-badge"
                          style={{ backgroundColor: getPriorityDetails(activeTicket.priority).color }}
                        >
                          <i className={`fas ${getPriorityDetails(activeTicket.priority).icon}`}></i>
                          {getPriorityDetails(activeTicket.priority).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-active-ticket smaller-empty">
                  <div className="no-ticket-visual">
                    <i className="fas fa-user-clock"></i>
                  </div>
                  <div className="no-ticket-content">
                    <h3>No Active Patient</h3>
                    <p>Ready to serve next patient</p>
                    <div className="queue-status-info">
                      {ticketQueue.length > 0 
                        ? `${ticketQueue.length} patients in queue` 
                        : 'Queue is empty'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ✅ ENHANCED: QUICK ACTIONS SECTION WITH AUTO-RELOAD */}
          <div className="dashboard-section-panel control-actions-panel smaller-actions">
            <div className="section-header-panel smaller-section-header">
              <h2 className="section-title-text smaller-section-title">Quick Actions</h2>
              <div className="system-notice-small smaller-notice">
                <i className="fas fa-bolt"></i>
                Auto-reload (1.5s) • Centralized Voice
              </div>
            </div>
            <div className="control-buttons-grid smaller-buttons">
              {/* ✅ CALL NEXT BUTTON - WITH AUTO-RELOAD */}
              <button 
                className={`control-action-btn primary-action ${!isCallNextEnabled() ? 'disabled' : ''}`}
                onClick={callNextInQueue}
                disabled={!isCallNextEnabled()}
              >
                <div className="button-icon-container">
                  {callInProgress ? (
                    <i className="fas fa-volume-up fa-spin"></i>
                  ) : (
                    <i className="fas fa-phone"></i>
                  )}
                </div>
                <div className="button-content-area">
                  <span className="button-title-text">
                    {callInProgress ? 'Calling...' : 'Call Next'}
                  </span>
                  <span className="button-subtitle-text">
                    Auto-reload after call
                  </span>
                </div>
                
                {/* WAITING PATIENTS BADGE */}
                {ticketQueue.length > 0 && (
                  <div className="waiting-patients-badge">
                    <span className="badge-count">{ticketQueue.length}</span>
                    <span className="badge-text">Waiting</span>
                  </div>
                )}
              </button>
              
              {/* ✅ RECALL BUTTON - WITH AUTO-RELOAD */}
              <button 
                className="control-action-btn accent-action"
                onClick={recallCurrentTicket}
                disabled={!isRecallEnabled()}
              >
                <div className="button-icon-container">
                  <i className="fas fa-redo"></i>
                </div>
                <div className="button-content-area">
                  <span className="button-title-text">Recall</span>
                  <span className="button-subtitle-text">Auto-reload after recall</span>
                </div>
              </button>

              {/* ✅ COMPLETE BUTTON - WITH AUTO-RELOAD */}
              <button 
                className="control-action-btn success-action"
                onClick={completeCurrentService}
                disabled={!activeTicket || isLoading}
              >
                <div className="button-icon-container">
                  <i className="fas fa-check-double"></i>
                </div>
                <div className="button-content-area">
                  <span className="button-title-text">Complete</span>
                  <span className="button-subtitle-text">Auto-reload after complete</span>
                </div>
              </button>

              {/* ✅ TRANSFER BUTTON - WITH AUTO-RELOAD */}
              <button 
                className="control-action-btn warning-action"
                onClick={openTransferDialog}
                disabled={!activeTicket || isLoading}
              >
                <div className="button-icon-container">
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="button-content-area">
                  <span className="button-title-text">Transfer</span>
                  <span className="button-subtitle-text">Auto-reload after transfer</span>
                </div>
              </button>

              {/* MANUAL RELOAD BUTTON */}
              <button 
                className="control-action-btn info-action"
                onClick={reloadCounterData}
                disabled={isLoading}
              >
                <div className="button-icon-container">
                  <i className="fas fa-redo-alt"></i>
                </div>
                <div className="button-content-area">
                  <span className="button-title-text">Reload Now</span>
                  <span className="button-subtitle-text">Manual refresh</span>
                </div>
              </button>

              {/* FULL PAGE RELOAD */}
              <button 
                className="control-action-btn dark-action"
                onClick={reloadFullPage}
              >
                <div className="button-icon-container">
                  <i className="fas fa-sync"></i>
                </div>
                <div className="button-content-area">
                  <span className="button-title-text">Full Reload</span>
                  <span className="button-subtitle-text">Refresh page</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ✅ AUTO-RELOAD STATUS PANEL */}
        {autoReloadTrigger > 0 && (
          <div className="auto-reload-status-panel">
            <div className="reload-status-content">
              <div className="reload-icon">
                <i className="fas fa-sync-alt fa-spin"></i>
              </div>
              <div className="reload-details">
                <div className="reload-title">AUTO-RELOAD ACTIVE</div>
                <div className="reload-action">Last Action: {lastAction.replace('_', ' ').toUpperCase()}</div>
                <div className="reload-timer">Reloading in 1.5 seconds...</div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="panel-footer-theme counter-panel-footer smaller-footer">
          <div className="footer-content-theme">
            <div className="system-info-theme">
              {hospitalTitle} • Counter {counterData.counterNumber} • Auto-Reload System Active
            </div>
            <div className="system-status-info">
              <span className="status-info-item">
                <i className="fas fa-ticket-alt"></i>
                {counterData.ticketsServedToday || 0} served today
              </span>
              <span className="status-info-item">
                <i className="fas fa-clock"></i>
                {lastUpdateTime.toLocaleTimeString()}
              </span>
              <span className="status-info-item">
                <i className="fas fa-sync-alt"></i>
                {autoReloadTrigger} auto-reloads
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterInterface;