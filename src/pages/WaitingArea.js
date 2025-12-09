import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { useVoiceService } from '../services/voiceService';
import { authService } from '../services/authService';
import { departmentService } from '../services/departmentService';
import { counterService } from '../services/counterService';
import { ticketService } from '../services/ticketService';
import '../styles/WaitingArea.css';

const WaitingArea = () => {
  const { displayId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { settings } = useSettings();
  const { voiceService, voiceStatus, queueInfo, processAnnouncement } = useVoiceService();
  
  // State variables
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [timeSinceLastUpdate, setTimeSinceLastUpdate] = useState(0);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [queueData, setQueueData] = useState({});
  const [counters, setCounters] = useState([]);
  const [activeCounters, setActiveCounters] = useState([]);
  
  // Voice announcement state
  const [showVoiceStatus, setShowVoiceStatus] = useState(false);
  const [centralizedStatus, setCentralizedStatus] = useState('connecting');

  // Timer references
  const timeIntervalRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const announcementIntervalRef = useRef(null);
  const adIntervalRef = useRef(null);
  const autoUpdateRef = useRef(null);
  const voiceStatusRef = useRef(null);

  // Get theme settings
  const themeConfig = settings?.themes || {};
  const mainColor = themeConfig.primaryColor || '#1e3a8a';
  const secondaryColor = themeConfig.accentColor || '#dc2626';
  const textFontFamily = themeConfig.fontFamily || 'Inter, sans-serif';

  // Get hospital info
  const hospitalTitle = settings?.hospitalName || 'ALKHIDMAT RAAZI HOSPITAL';
  const hospitalLogoImage = settings?.hospitalLogo || '';
  const hospitalLocation = settings?.hospitalCity || 'ISLAMABAD';

  // Get waiting screen settings
  const waitingSettings = settings?.waitingScreen || {};
  const showAds = waitingSettings.showAds !== false;
  const soundNotifications = waitingSettings.soundNotifications !== false;
  const customMessage = waitingSettings.customMessage || '';
  const language = waitingSettings.language || 'en';

  // Get advertisements from settings
  const advertisements = settings?.advertisements || [];

  // ✅ INITIALIZE VOICE SERVICE WITH SOCKET
  useEffect(() => {
    if (socket) {
      voiceService.setSocket(socket);
      console.log('🔊 CENTRALIZED: Voice service initialized with socket');
    }
  }, [socket, voiceService]);

  // ✅ UPDATE VOICE SERVICE SETTINGS
  useEffect(() => {
    voiceService.updateSettings({
      soundNotifications: soundNotifications,
      autoPlay: true,
      voiceVolume: 1.0
    });
  }, [soundNotifications, voiceService]);

  // ✅ SHOW VOICE STATUS WHEN ACTIVE
  useEffect(() => {
    if (voiceStatus.isSpeaking || voiceStatus.isProcessingQueue || queueInfo.queueLength > 0) {
      setShowVoiceStatus(true);
      if (voiceStatusRef.current) {
        clearTimeout(voiceStatusRef.current);
      }
      voiceStatusRef.current = setTimeout(() => {
        setShowVoiceStatus(false);
      }, 5000);
    }
  }, [voiceStatus.isSpeaking, voiceStatus.isProcessingQueue, queueInfo.queueLength]);

  const cleanupIntervals = () => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    if (announcementIntervalRef.current) clearInterval(announcementIntervalRef.current);
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    if (autoUpdateRef.current) clearInterval(autoUpdateRef.current);
    if (voiceStatusRef.current) clearTimeout(voiceStatusRef.current);
  };

  useEffect(() => {
    const validateAccess = () => {
      if (!authService.isAuthenticated()) {
        const adminToken = localStorage.getItem('adminAccessToken');
        const adminUser = localStorage.getItem('adminUser');
        
        if (adminToken && adminUser) {
          localStorage.setItem('accessToken', adminToken);
          localStorage.setItem('user', adminUser);
          localStorage.setItem('component', 'waiting');
          localStorage.setItem('loginTime', new Date().toISOString());
          
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminComponent');
        } else {
          navigate('/login/waiting');
          return;
        }
      }

      const accessValidation = authService.validateComponentAccess('waiting');
      if (!accessValidation.valid) {
        navigate(accessValidation.redirect);
        return;
      }
    };

    validateAccess();
    loadInitialData();
    setupSocketListeners();
    
    // Apply theme settings
    document.body.style.fontFamily = textFontFamily;

    // Set up intervals
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    announcementIntervalRef.current = setInterval(() => {
      setAnnouncementIndex(prev => (prev + 1) % getAnnouncements().length);
    }, 10000);
    
    if (showAds) {
      adIntervalRef.current = setInterval(() => {
        setAdIndex(prev => (prev + 1) % getAdvertisements().length);
      }, 30000);
    }

    autoUpdateRef.current = setInterval(() => {
      console.log('🔄 AUTO-UPDATE: Refreshing data every 30 seconds');
      loadCounters();
      loadQueueData();
      setLastUpdate(new Date());
    }, 30000);

    updateIntervalRef.current = setInterval(() => {
      setTimeSinceLastUpdate(prev => prev + 1);
    }, 1000);

    return () => {
      cleanupIntervals();
      removeSocketListeners();
    };
  }, [displayId, navigate, showAds, textFontFamily]);

  // ✅ FIXED: CENTRALIZED SOCKET LISTENERS FOR DATABASE-BASED ANNOUNCEMENTS
  const setupSocketListeners = () => {
    if (!socket) {
      console.log('Running in demo mode - no socket connection');
      return;
    }
  
    // ✅ JOIN CENTRALIZED SYSTEM AS WAITING SCREEN
    socket.emit('join-waiting-screen', displayId || 'main-waiting');
    socket.emit('waiting-screen-ready', {
      screenId: displayId || 'main-waiting',
      timestamp: new Date()
    });

    // ✅ CENTRALIZED SYSTEM CONFIRMATION
    socket.on('centralized-system-ready', (data) => {
      console.log('✅ CENTRALIZED: Connected to database system:', data);
      setCentralizedStatus('connected');
    });

    // ✅ LISTEN FOR CENTRALIZED VOICE ANNOUNCEMENTS FROM DATABASE
    socket.on('urdu-voice-announcement', (data) => {
      console.log('🔊 CENTRALIZED: Voice announcement received:', data);
      
      // ✅ UPDATE COUNTER DISPLAY IMMEDIATELY
      if (data.counterNumber && data.ticketNumber) {
        setCounters(prev => {
          const updatedCounters = prev.map(counter => {
            if (counter.counterNumber === data.counterNumber) {
              return {
                ...counter,
                currentTicket: {
                  ticketNumber: data.ticketNumber,
                  calledAt: new Date(),
                  isRecall: data.isRecall
                },
                status: 'busy',
                lastActivity: new Date()
              };
            }
            return counter;
          });
          
          return sortCountersByStatus(updatedCounters);
        });
        
        setLastUpdate(new Date());
        setTimeSinceLastUpdate(0);
      }

      // ✅ USE THE CENTRALIZED VOICE SERVICE FOR PROCESSING
      processAnnouncement(data)
        .then(result => {
          console.log('✅ CENTRALIZED: Voice announcement processed:', result);
        })
        .catch(error => {
          console.error('❌ CENTRALIZED: Failed to process announcement:', error);
        });
    });

    // Listen for new call requests available
    socket.on('new-call-request-available', (data) => {
      console.log('🆕 New call request available:', data);
      // The system will automatically process these every 3 seconds
    });

    // Listen for database updates
    socket.on('database-updated', (data) => {
      console.log('🔄 Database updated, refreshing display');
      loadCounters();
      loadQueueData();
    });

    // ✅ RELOAD SIGNALS
    socket.on('reload-display-data', () => {
      console.log('🔄 CENTRALIZED: Reloading display data...');
      loadCounters();
      loadQueueData();
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
    });

    socket.on('counter-updated', (counter) => {
      console.log('🔄 Counter updated via socket:', counter);
      setCounters(prev => {
        const updatedCounters = prev.map(c => 
          c._id === counter._id ? counter : c
        );
        return sortCountersByStatus(updatedCounters);
      });
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
      updateActiveCounters(counters);
    });

    socket.on('counter-created', (counter) => {
      console.log('🆕 Counter created via socket:', counter);
      setCounters(prev => {
        const exists = prev.find(c => c._id === counter._id);
        const newCounters = !exists ? [...prev, counter] : prev;
        return sortCountersByStatus(newCounters);
      });
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
      updateActiveCounters(counters);
    });

    socket.on('counter-deleted', (counterId) => {
      console.log('🗑️ Counter deleted via socket:', counterId);
      setCounters(prev => {
        const filteredCounters = prev.filter(c => c._id !== counterId);
        return sortCountersByStatus(filteredCounters);
      });
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
      updateActiveCounters(counters);
    });

    socket.on('token-completed', (data) => {
      console.log('✅ Token completed via socket:', data);
      setCounters(prev => {
        const updatedCounters = prev.map(c => 
          c._id === data.counter._id ? data.counter : c
        );
        return sortCountersByStatus(updatedCounters);
      });
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
      updateActiveCounters(counters);
    });

    socket.on('ticket-generated', (data) => {
      console.log('🎫 New ticket generated via socket:', data);
      setQueueData(prev => ({
        ...prev,
        [data.department._id]: {
          ...prev[data.department._id],
          waitingCount: (prev[data.department._id]?.waitingCount || 0) + 1
        }
      }));
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
    });

    socket.on('queue-updated', (data) => {
      console.log('📊 Queue updated via socket:', data);
      setQueueData(prev => ({
        ...prev,
        [data.departmentId]: data.queueData
      }));
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
    });

    socket.on('department-updated', () => {
      console.log('🏥 Department updated via socket');
      loadDepartments();
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
    });

    socket.on('settings-updated', () => {
      console.log('⚙️ Settings updated via socket');
      loadInitialData();
    });

    socket.on('counter-status-changed', (data) => {
      console.log('🔄 Counter status changed via socket:', data);
      setCounters(prev => {
        const updatedCounters = prev.map(c => 
          c._id === data.counterId ? { ...c, status: data.status } : c
        );
        return sortCountersByStatus(updatedCounters);
      });
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
      updateActiveCounters(counters);
    });

    socket.on('force-reload-waiting', () => {
      console.log('🔄 Force reload triggered via socket');
      loadInitialData();
    });
  };

  const removeSocketListeners = () => {
    if (!socket) return;
    
    socket.off('centralized-system-ready');
    socket.off('urdu-voice-announcement');
    socket.off('new-call-request-available');
    socket.off('database-updated');
    socket.off('reload-display-data');
    socket.off('counter-updated');
    socket.off('counter-created');
    socket.off('counter-deleted');
    socket.off('token-completed');
    socket.off('ticket-generated');
    socket.off('queue-updated');
    socket.off('department-updated');
    socket.off('settings-updated');
    socket.off('counter-status-changed');
    socket.off('force-reload-waiting');
  };

  // ✅ FIXED: Format time since last update
  const formatTimeSinceUpdate = (seconds) => {
    if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadDepartments();
      await loadCounters();
      await loadQueueData();
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      console.log('🔄 Loading departments...');
      const departmentsData = await departmentService.getDepartments();
      const activeDepartments = departmentsData.filter(dept => dept.active !== false);
      setDepartments(activeDepartments);
      console.log(`✅ Loaded ${activeDepartments.length} departments`);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadCounters = async () => {
    try {
      console.log('🔄 Loading counters...');
      const countersData = await counterService.getAllCounters();
      console.log('📊 Raw counters data:', countersData);
      
      // ✅ SORT COUNTERS: Busy counters first, then by counter number
      const sortedCounters = sortCountersByStatus(countersData);
      setCounters(sortedCounters);
      setLastUpdate(new Date());
      setTimeSinceLastUpdate(0);
      
      // Update active counters based on loaded counters
      updateActiveCounters(sortedCounters);
      
      console.log(`✅ Loaded ${sortedCounters.length} counters, ${activeCounters.length} active`);
    } catch (error) {
      console.error('❌ Error loading counters:', error);
      // Fallback to demo data if API fails
      const demoCounters = getDemoCounters();
      const sortedDemoCounters = sortCountersByStatus(demoCounters);
      setCounters(sortedDemoCounters);
      updateActiveCounters(sortedDemoCounters);
    }
  };

  // ✅ SORT COUNTERS: Busy counters first, then by counter number
  const sortCountersByStatus = (countersData) => {
    return countersData.sort((a, b) => {
      // First sort by status: busy counters first
      if (a.status === 'busy' && b.status !== 'busy') return -1;
      if (a.status !== 'busy' && b.status === 'busy') return 1;
      
      // Then sort by counter number
      return a.counterNumber - b.counterNumber;
    });
  };

  const updateActiveCounters = (countersData) => {
    if (!countersData || !Array.isArray(countersData)) {
      console.warn('⚠️ No counters data provided to updateActiveCounters');
      setActiveCounters([]);
      return;
    }

    // Filter active counters - include both active and busy status
    const activeCountersData = countersData.filter(counter => {
      const isActive = counter.status === 'active' || counter.status === 'busy';
      return isActive;
    });
    
    setActiveCounters(activeCountersData);
    console.log(`✅ Updated ${activeCountersData.length} active counters:`, 
      activeCountersData.map(c => `${c.counterNumber}(${c.status})`));
  };

  const getDemoCounters = () => {
    return [
      {
        _id: '1',
        counterNumber: 1,
        name: 'Reception Counter 1',
        status: 'active',
        department: { _id: '1', name: 'Reception', code: 'RECEPTION' },
        currentTicket: { 
          ticketNumber: 'A015', 
          calledAt: new Date(),
        },
        type: 'reception'
      },
      {
        _id: '2',
        counterNumber: 2,
        name: 'OPD Counter 1',
        status: 'busy',
        department: { _id: '2', name: 'General OPD', code: 'OPD' },
        currentTicket: { 
          ticketNumber: 'B008', 
          calledAt: new Date(Date.now() - 5 * 60000),
        },
        type: 'department'
      },
      {
        _id: '3',
        counterNumber: 3,
        name: 'Emergency Counter',
        status: 'active',
        department: { _id: '3', name: 'Emergency', code: 'ER' },
        currentTicket: null,
        type: 'emergency'
      }
    ];
  };

  const loadQueueData = async () => {
    try {
      console.log('🔄 Loading queue data from database...');
      
      // Load real queue data from API
      const queueStats = await ticketService.getQueueStats();
      const newQueueData = {};
      
      // Process queue data for each department
      departments.forEach(dept => {
        const deptStats = queueStats.find(stat => stat.departmentId === dept._id) || {};
        const waitingTickets = deptStats.waitingTickets || [];
        const servedToday = deptStats.servedToday || 0;
        
        // Get active counters for this department
        const deptCounters = counters.filter(counter => 
          counter.department?._id === dept._id && 
          (counter.status === 'active' || counter.status === 'busy')
        );
        
        // Get current serving ticket
        const currentTicket = counters.find(counter => 
          counter.department?._id === dept._id && 
          counter.currentTicket
        )?.currentTicket;

        newQueueData[dept._id] = {
          waitingCount: waitingTickets.length,
          servedToday: servedToday,
          avgWaitTime: dept.estimatedWaitTime || 15,
          activeCounters: deptCounters.length,
          currentTicket: currentTicket,
          waitingTickets: waitingTickets
        };
      });
      
      setQueueData(newQueueData);
      console.log('✅ Real queue data loaded successfully from database');
      
    } catch (error) {
      console.error('Error loading queue data from database:', error);
    }
  };

  const getAnnouncements = () => {
    if (advertisements.length > 0 && showAds) {
      const activeAds = advertisements.filter(ad => ad.active);
      if (activeAds.length > 0) return activeAds.map(ad => ad.text);
    }
    
    const defaultAnnouncements = [
      "QUALITY HEALTHCARE SERVICES AVAILABLE • EMERGENCY CASES PRIORITIZED • MAINTAIN SOCIAL DISTANCING",
      "FREE HEALTH CHECKUP CAMP THIS WEEKEND • CONSULT OUR SPECIALISTS FOR EXPERT CARE • THANK YOU FOR YOUR PATIENCE",
      "NEW CARDIOLOGY DEPARTMENT NOW OPEN • STATE-OF-THE-ART MEDICAL EQUIPMENT • 24/7 EMERGENCY SERVICES AVAILABLE",
      "PLEASE HAVE YOUR DOCUMENTS READY • KEEP THE WAITING AREA CLEAN • FOLLOW STAFF INSTRUCTIONS"
    ];
    
    if (customMessage) {
      return [customMessage, ...defaultAnnouncements];
    }
    
    return defaultAnnouncements;
  };

  const getAdvertisements = () => {
    // Use advertisements from settings if available and active
    if (advertisements.length > 0 && showAds) {
      const activeAds = advertisements.filter(ad => ad.active);
      if (activeAds.length > 0) {
        return activeAds.map(ad => ({
          type: ad.type || 'text',
          video: ad.video,
          image: ad.image,
          content: ad.text,
          title: ad.title || "Hospital Information",
          subtitle: ad.subtitle || "Quality Healthcare Services"
        }));
      }
    }
    
    // Fallback to default advertisements
    return [
      { 
        type: 'text', 
        content: "Welcome to " + hospitalTitle + " • Your Health is Our Top Priority • 24/7 Emergency Services Available",
        title: "Quality Healthcare",
        subtitle: "Serving You with Excellence"
      }
    ];
  };

  const currentAd = getAdvertisements()[adIndex];

  // ✅ MANUAL REFRESH FUNCTION
  const manualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    loadInitialData();
  };

  return (
    <div className="theme-container dark-blue-theme waiting-area-theme">
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

      {/* ✅ ENHANCED VOICE STATUS INDICATOR */}
      {showVoiceStatus && (
        <div className="voice-status-indicator centralized-voice-status">
          <div className="voice-status-content">
            <div className="voice-icon">
              {voiceStatus.isSpeaking ? (
                <i className="fas fa-volume-up fa-spin"></i>
              ) : voiceStatus.isProcessingQueue ? (
                <i className="fas fa-sync-alt fa-spin"></i>
              ) : (
                <i className="fas fa-volume-up"></i>
              )}
            </div>
            <div className="voice-details">
              <div className="voice-title">
                {voiceStatus.isSpeaking ? 'NOW ANNOUNCING' : 
                 voiceStatus.isProcessingQueue ? 'PROCESSING' : 'VOICE SYSTEM ACTIVE'}
              </div>
              {queueInfo.currentPlaying && queueInfo.queue[0] && (
                <>
                  <div className="voice-ticket">Token: {queueInfo.queue[0].ticketNumber}</div>
                  <div className="voice-counter">Counter: {queueInfo.queue[0].counterNumber}</div>
                  {queueInfo.queue[0].isRecall && (
                    <div className="voice-recall-badge">URGENT RECALL</div>
                  )}
                </>
              )}
              <div className="voice-queue-info">
                Queue: {queueInfo.queueLength} • {voiceStatus.voiceReady ? 'VOICE READY' : 'FALLBACK MODE'}
              </div>
            </div>
          </div>
          
          {/* ✅ VOICE CONTROL BUTTONS */}
          <div className="voice-controls">
            <button 
              className="voice-control-btn"
              onClick={() => voiceService.stopAllAudio()}
              title="Stop All Audio"
            >
              <i className="fas fa-stop"></i>
            </button>
            <button 
              className="voice-control-btn"
              onClick={() => voiceService.testVoiceSystem()}
              title="Test Voice System"
            >
              <i className="fas fa-test"></i>
            </button>
            <button 
              className="voice-control-btn"
              onClick={() => setShowVoiceStatus(false)}
              title="Hide Panel"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <div className="content-wrapper waiting-content-wrapper">
        {/* Header Section with Voice Status */}
        <div className="dispenser-header-theme waiting-header-theme">
          <div className="hospital-brand-theme">
            {hospitalLogoImage ? (
              <img src={hospitalLogoImage} alt="Hospital Logo" className="hospital-logo-theme" />
            ) : (
              <div className="hospital-logo-theme-icon">
                <i className="fas fa-hospital-alt"></i>
              </div>
            )}
            <div className="hospital-info-theme">
              <h1 className="hospital-name-theme white-text">
                {hospitalTitle}
              </h1>
              <p className="hospital-city-theme">{hospitalLocation}</p>
            </div>
          </div>
          
          <div className="header-time-section">
            <div className="current-time-theme live-clock">
              <i className="fas fa-clock"></i>
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="spinner-3d-animation"></div>
              <div className="loading-text">Loading Queue Data...</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="waiting-main-content">
          {/* Advertisement Panel */}
          <div className="waiting-ad-panel">
            <div className="ad-content-section">
              {showAds ? (
                <div className="ad-queue-container">
                  <div className="ad-queue-header">
                    <h3 className="ad-queue-title">
                      <i className="fas fa-play-circle"></i>
                      ADVERTISEMENTS
                    </h3>
                    <div className="ad-queue-indicator">
                      {adIndex + 1} / {getAdvertisements().length}
                    </div>
                  </div>
                  
                  <div className="ad-content-queue">
                    {currentAd?.type === 'video' && currentAd?.video ? (
                      <div className="video-container">
                        <video 
                          className="ad-video"
                          autoPlay 
                          muted 
                          loop
                          playsInline
                          key={currentAd.video}
                        >
                          <source src={currentAd.video} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <div className="video-overlay">
                          <h3 className="video-title">{currentAd.title}</h3>
                          <p className="video-subtitle">{currentAd.subtitle}</p>
                          <div className="video-mute-indicator">
                            <i className="fas fa-volume-mute"></i>
                            Auto Muted
                          </div>
                        </div>
                      </div>
                    ) : currentAd?.type === 'image' && currentAd?.image ? (
                      <div className="image-container">
                        <img 
                          src={currentAd.image} 
                          alt="Advertisement" 
                          className="ad-image"
                          key={currentAd.image}
                        />
                        <div className="image-overlay">
                          <h3 className="image-title">{currentAd.title}</h3>
                          <p className="image-subtitle">{currentAd.subtitle}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-ad-container">
                        <div className="text-ad-content">
                          <h3 className="text-ad-title">{currentAd?.title || "Hospital Information"}</h3>
                          <p className="text-ad-subtitle">{currentAd?.subtitle || "Quality Healthcare Services"}</p>
                          <div className="text-ad-message">
                            {currentAd?.content || "24/7 Emergency Services • Expert Medical Professionals • Modern Medical Equipment"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="default-ad-content">
                  <div className="ad-text-content">
                    <h2 className="ad-main-title">
                      Welcome to {hospitalTitle}
                    </h2>
                    <p className="ad-main-subtitle">Your Health is Our Top Priority</p>
                  </div>
                </div>
              )}
            </div>

            {/* News Ticker */}
            <div className="news-ticker-section">
              <div className="ticker-container">
                <span className="ticker-label">ANNOUNCEMENT:</span>
                <div className="ticker-content">
                  <span className="ticker-text">
                    {getAnnouncements()[announcementIndex]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Counter Display Panel */}
          <div className="counter-queue-panel">
            {/* SIMPLIFIED COUNTERS GRID */}
            <div className="all-counters-grid">
              {counters.length > 0 ? (
                counters.map((counter) => (
                  <CounterCardSimple 
                    key={counter._id}
                    counter={counter}
                  />
                ))
              ) : (
                <div className="no-active-counters">
                  <i className="fas fa-desktop"></i>
                  <div className="no-counters-text">
                    <div>No Counters Available</div>
                    <div className="counters-count">
                      Please configure counters in the admin panel
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

// ✅ SIMPLIFIED Counter Card Component - ONLY TOKEN NUMBER
const CounterCardSimple = ({ counter }) => {
  return (
    <div className={`counter-card-simple ${counter.status}`}>
      <div className="counter-header-simple">
        <div className="counter-number-simple">
          <i className="fas fa-desktop"></i>
          Counter {counter.counterNumber}
        </div>
      </div>
      
      {/* CURRENT SERVING TICKET - ONLY TOKEN NUMBER */}
      <div className="serving-ticket-section">
        {counter.currentTicket ? (
          <>
            <div className="ticket-number-large">
              {counter.currentTicket.ticketNumber}
            </div>
            {counter.currentTicket.isRecall && (
              <div className="recall-badge">URGENT RECALL</div>
            )}
          </>
        ) : (
          <div className="no-ticket">
            <i className="fas fa-user-clock"></i>
            <div>Waiting</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingArea;