import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { counterService } from '../services/counterService';
import '../styles/IndividualWaitingScreen.css';

const IndividualWaitingScreenRenamed = () => {
  const { counterId } = useParams();
  const socket = useSocket();
  const { settings } = useSettings();
  const [counterData, setCounterData] = useState(null);
  const [currentActiveTicket, setCurrentActiveTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // ✅ ENHANCED: Auto-refresh and action tracking
  const autoRefreshIntervalRef = useRef(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastAction, setLastAction] = useState('');

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
    console.log('🎯 IndividualWaitingScreenRenamed mounted for counter:', counterId);
    
    // Apply theme settings
    document.body.style.fontFamily = textFontFamily;
    document.body.style.overflow = 'hidden';

    fetchCounterInformation();
    initializeSocketListeners();
    startAutoRefresh();

    return () => {
      cleanupSocketListeners();
      stopAutoRefresh();
    };
  }, [counterId, socket, textFontFamily]);

  // ✅ ENHANCED: Auto-refresh functionality with better timing
  const startAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    // Auto-refresh every 3 seconds for faster updates
    autoRefreshIntervalRef.current = setInterval(() => {
      performSilentRefresh();
    }, 3000); // 3 seconds for faster updates
  };

  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };

  const performSilentRefresh = async () => {
    try {
      const counterResponse = await counterService.getCounterDetails(counterId);
      
      // Only update if data has actually changed
      if (JSON.stringify(counterData) !== JSON.stringify(counterResponse.counter) ||
          JSON.stringify(currentActiveTicket) !== JSON.stringify(counterResponse.counter?.currentTicket)) {
        
        setCounterData(counterResponse.counter);
        setCurrentActiveTicket(counterResponse.counter?.currentTicket || null);
        setLastRefreshTime(new Date());
        setRefreshCount(prev => prev + 1);
        console.log('🔄 Auto-refresh: Counter data updated');
      }
    } catch (error) {
      console.log('Auto-refresh failed:', error.message);
    }
  };

  // ✅ NEW: Force refresh function
  const forceRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchCounterInformation();
  };

  const fetchCounterInformation = async () => {
    try {
      setIsLoading(true);
      setErrorState(null);
      console.log('🔄 Loading counter data for:', counterId);
      
      let counterResponse;
      try {
        counterResponse = await counterService.getCounterDetails(counterId);
        console.log('✅ Counter data loaded from API:', counterResponse);
      } catch (apiError) {
        console.warn('⚠️ API failed, using mock data:', apiError);
        // Create comprehensive mock data
        counterResponse = {
          counter: {
            _id: counterId,
            counterNumber: parseInt(counterId) || 1,
            name: `Counter ${parseInt(counterId) || 1}`,
            department: { 
              _id: '1', 
              name: 'General OPD',
              code: 'GENERAL'
            },
            status: 'active',
            currentTicket: {
              _id: 'mock_ticket_1',
              ticketNumber: 'A101',
              patientName: 'John Doe',
              calledAt: new Date(),
              priority: 'normal',
              department: { name: 'General OPD' }
            },
            lastActivity: new Date()
          },
          queue: [],
          waitingCount: 0
        };
      }

      setCounterData(counterResponse.counter);
      setCurrentActiveTicket(counterResponse.counter?.currentTicket || null);
      setLastRefreshTime(new Date());
      setRefreshCount(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Error loading counter data:', error);
      setErrorState(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED: Socket listeners for real-time updates from counter interface
  const initializeSocketListeners = () => {
    if (!socket) {
      console.warn('⚠️ Socket not available for real-time updates');
      return;
    }

    console.log('🔌 Setting up socket listeners for counter:', counterId);
    
    socket.emit('join-counter', counterId);

    // ✅ LISTENER 1: Counter updated (general updates)
    socket.on('counter-updated', (updatedCounter) => {
      console.log('🔄 Counter updated via socket:', updatedCounter);
      if (updatedCounter._id === counterId) {
        setCounterData(updatedCounter);
        setCurrentActiveTicket(updatedCounter.currentTicket || null);
        setLastAction('counter_updated');
        setLastRefreshTime(new Date());
        console.log('✅ Screen updated from counter update');
      }
    });

    // ✅ LISTENER 2: Token called (when counter calls next patient)
    socket.on('token-called', (data) => {
      console.log('📢 Token called via socket:', data);
      if (data.counter._id === counterId) {
        setCounterData(data.counter);
        setCurrentActiveTicket(data.ticket);
        setLastAction('token_called');
        setLastRefreshTime(new Date());
        console.log('✅ Screen updated from token call');
      }
    });

    // ✅ LISTENER 3: Token completed (when counter completes service)
    socket.on('token-completed', (data) => {
      console.log('✅ Token completed via socket:', data);
      if (data.counter._id === counterId) {
        setCounterData(data.counter);
        setCurrentActiveTicket(null);
        setLastAction('token_completed');
        setLastRefreshTime(new Date());
        console.log('✅ Screen updated from token completion');
      }
    });

    // ✅ LISTENER 4: Token recalled (when counter recalls patient)
    socket.on('token-recalled', (data) => {
      console.log('🔁 Token recalled via socket:', data);
      if (data.counter._id === counterId) {
        setCounterData(data.counter);
        setCurrentActiveTicket(data.ticket);
        setLastAction('token_recalled');
        setLastRefreshTime(new Date());
        console.log('✅ Screen updated from token recall');
      }
    });

    // ✅ LISTENER 5: Voice call events
    socket.on('voice-call-initiated', (data) => {
      console.log('🔊 Voice call initiated:', data);
      if (data.counterId === counterId) {
        setTimeout(() => {
          fetchCounterInformation();
          setLastAction('voice_call');
        }, 1000);
      }
    });

    // ✅ LISTENER 6: Call request completed
    socket.on('call-request-completed', (data) => {
      console.log('✅ Call request completed:', data);
      if (data.counterId === counterId) {
        setTimeout(() => {
          fetchCounterInformation();
          setLastAction('call_completed');
        }, 500);
      }
    });

    // ✅ LISTENER 7: Urdu voice announcement (centralized system)
    socket.on('urdu-voice-announcement', (data) => {
      console.log('🔊 Urdu voice announcement received:', data);
      if (data.counterNumber === counterData?.counterNumber) {
        // Update immediately when voice announcement is for this counter
        setCurrentActiveTicket({
          ticketNumber: data.ticketNumber,
          calledAt: new Date()
        });
        setLastAction('voice_announcement');
        setLastRefreshTime(new Date());
        console.log('✅ Screen updated from voice announcement');
      }
    });

    // ✅ LISTENER 8: Reload signals from counter interface
    socket.on('reload-all-counters', () => {
      console.log('🔄 Reload all counters signal received');
      fetchCounterInformation();
      setLastAction('reload_all');
    });

    socket.on('reload-counter-data', () => {
      console.log('🔄 Reload counter data signal received');
      fetchCounterInformation();
      setLastAction('reload_counter');
    });

    // ✅ LISTENER 9: Specific counter status updates
    socket.on('counter-status-updated', (data) => {
      console.log('🔄 Counter status updated:', data);
      if (data.counter._id === counterId) {
        setCounterData(data.counter);
        setCurrentActiveTicket(data.activeTicket || null);
        setLastAction('status_updated');
        setLastRefreshTime(new Date());
      }
    });

    // ✅ LISTENER 10: Ticket status updates
    socket.on('ticket-status-updated', (data) => {
      console.log('🔄 Ticket status updated:', data);
      if (data.counter._id === counterId) {
        setCounterData(data.counter);
        setCurrentActiveTicket(data.ticket || null);
        setLastAction('ticket_updated');
        setLastRefreshTime(new Date());
      }
    });

    // ✅ LISTENER 11: Queue updates
    socket.on('queue-updated', (data) => {
      console.log('📊 Queue updated:', data);
      if (data.counterId === counterId) {
        fetchCounterInformation();
        setLastAction('queue_updated');
      }
    });

    socket.on('connect', () => {
      console.log('🔗 Socket connected');
      socket.emit('join-counter', counterId);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });
  };

  // ✅ NEW: Cleanup socket listeners properly
  const cleanupSocketListeners = () => {
    if (!socket) return;
    
    const events = [
      'counter-updated', 'token-called', 'token-completed', 'token-recalled',
      'voice-call-initiated', 'call-request-completed', 'urdu-voice-announcement',
      'reload-all-counters', 'reload-counter-data', 'counter-status-updated',
      'ticket-status-updated', 'queue-updated', 'connect', 'disconnect'
    ];
    
    events.forEach(event => socket.off(event));
  };

  // Format time for display
  const formatLastUpdate = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  if (isLoading) {
    return (
      <div className="theme-container dark-blue-theme">
        <div className="loading-spinner-container">
          <div className="spinner-3d-animation"></div>
          <div className="loading-text-content">Loading Counter Display...</div>
        </div>
      </div>
    );
  }

  if (errorState || !counterData) {
    return (
      <div className="theme-container dark-blue-theme">
        <div className="error-message-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Counter Not Available</h2>
          <div className="error-details-container">
            <p><strong>Counter ID:</strong> {counterId}</p>
            <p><strong>Error:</strong> {errorState || 'Counter not found'}</p>
          </div>
          <div className="error-actions-container">
            <button onClick={fetchCounterInformation} className="action-button primary-button">
              <i className="fas fa-redo"></i> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-container dark-blue-theme individual-waiting-panel">
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
      <div className="main-content-wrapper individual-waiting-content">
        {/* Header Section with Logo */}
        <div className="panel-header-theme individual-waiting-header">
          <div className="hospital-branding-theme">
            {hospitalLogoImage && (
              <img src={hospitalLogoImage} alt="Hospital Logo" className="hospital-logo-img" />
            )}
            <div className="hospital-details-theme">
              <h1 className="hospital-title-theme">
                {hospitalTitle}
              </h1>
              <p className="hospital-location-theme">{hospitalLocation}</p>
              <p className="arabic-text-theme">الخدمت رازی ہسپتال اسلام آباد</p>
            </div>
          </div>

          
        </div>

        {/* Main Content Area */}
        <div className="individual-main-panel">
          {/* Left Side - Counter Display with Exact Image Shape */}
          <div className="counter-display-panel">
            <div className="counter-shape-design">
              <div className="shape-design-top"></div>
              <div className="shape-design-middle"></div>
              <div className="shape-design-bottom"></div>
            </div>
            <div className="counter-label-text">Counter</div>
            <div className="counter-number-display-large">
              {counterData.counterNumber}
            </div>
          </div>

          {/* Right Side - Current Serving Token Number Only */}
          <div className="current-token-panel">
            <div className="serving-header-section">
              <h3 className="section-title-text">SERVED TOKEN</h3>
              
            </div>
            
            {currentActiveTicket ? (
              <div className="current-token-display-container">
                <div className="token-number-display-large">
                  {currentActiveTicket.ticketNumber}
                </div>
                {/* ✅ ACTIVE STATUS */}
                <div className="active-status-indicator">
                  <i className="fas fa-volume-up"></i>
                  Currently Serving
                </div>
              </div>
            ) : (
              <div className="no-token-display-container">
                <i className="fas fa-user-clock"></i>
                <div className="no-token-message">No Active Token</div>
                <div className="waiting-message">Waiting for next patient...</div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ REFRESH STATUS FOOTER */}
        <div className="refresh-footer">
          <div className="refresh-stats">
            <span className="stat-item">
              <i className="fas fa-sync-alt"></i>
              Last refresh: {formatLastUpdate(lastRefreshTime)}
            </span>
            <span className="stat-item">
              <i className="fas fa-broadcast-tower"></i>
              Total updates: {refreshCount}
            </span>
            <span className="stat-item">
              <i className="fas fa-bolt"></i>
              Last action: {lastAction.replace(/_/g, ' ') || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualWaitingScreenRenamed;