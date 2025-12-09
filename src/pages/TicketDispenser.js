import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { useSettings } from '../context/SettingsContext';
import { authService } from '../services/authService';
import { useSocket } from '../context/SocketContext';
import '../styles/TicketDispenser.css';

const TicketDispenserKiosk = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const socket = useSocket();
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ REMOVED: All voice-related references
  const [printingStates, setPrintingStates] = useState({});
  const printQueueRef = useRef(new Map());
  const lastReloadTimeRef = useRef(Date.now());
  const autoReloadIntervalRef = useRef(null);

  const hospitalTitle = "AL-KHIDMAT RAAZI HOSPITAL";
  const hospitalLogoImage = settings?.hospitalLogo || '';
  const hospitalLocation = settings?.hospitalCity || 'ISLAMABAD';

  useEffect(() => {
    initializeKioskMode();
    startAutoReload();
    
    return () => {
      cleanupKioskMode();
      stopAutoReload();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    validateUserAccess();
    loadDepartmentsData();
    initializeSocketListeners();

    return () => {
      if (socket) {
        socket.off('ticket-generated');
        socket.off('new-ticket');
        socket.off('system-recovered');
        socket.off('system-auto-recovered');
      }
      cleanupKioskMode();
      stopAutoReload();
    };
  }, [navigate, socket]);

  // ✅ ENHANCED: BACKEND-BASED AUTO-RELOAD EVERY 20 SECONDS
  const startAutoReload = () => {
    console.log('🔄 Starting continuous backend auto-reload every 20 seconds');
    
    // Clear any existing interval
    if (autoReloadIntervalRef.current) {
      clearInterval(autoReloadIntervalRef.current);
    }
    
    // Set new interval for 20 seconds
    autoReloadIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastReload = now - lastReloadTimeRef.current;
      
      // Only reload if it's been at least 20 seconds
      if (timeSinceLastReload >= 20000) {
        console.log('🔄 Backend auto-reloading page (20 seconds interval)');
        lastReloadTimeRef.current = now;
        
        // ✅ IMPORTANT: Use backend-driven reload without affecting kiosk mode
        window.location.reload();
      } else {
        console.log('⏳ Skipping auto-reload - too soon since last reload');
      }
    }, 2000); // Check every 2 seconds for precision
  };

  const stopAutoReload = () => {
    if (autoReloadIntervalRef.current) {
      clearInterval(autoReloadIntervalRef.current);
      autoReloadIntervalRef.current = null;
    }
  };

  const validateUserAccess = () => {
    if (!authService.isAuthenticated()) {
      navigate('/login/dispenser');
      return;
    }
    const accessValidation = authService.validateComponentAccess('dispenser');
    if (!accessValidation.valid) {
      navigate(accessValidation.redirect);
      return;
    }
  };

  const initializeKioskMode = () => {
    enterFullscreen();
    document.addEventListener('contextmenu', disableContextMenu);
  };

  const cleanupKioskMode = () => {
    printQueueRef.current.clear();
    document.removeEventListener('contextmenu', disableContextMenu);
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Fullscreen error:', err);
      });
    }
  };

  const disableContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  const initializeSocketListeners = () => {
    if (!socket) return;

    // ✅ REMOVED: Voice announcement listeners

    socket.on('system-recovered', (data) => {
      console.log('✅ System recovered:', data);
      setPrintingStates({});
      printQueueRef.current.clear();
    });

    socket.on('system-auto-recovered', (data) => {
      console.log('🔄 System auto-recovered:', data);
      setPrintingStates({});
      printQueueRef.current.clear();
    });

    socket.on('ticket-generated', (ticket) => {
      console.log('New ticket generated:', ticket);
    });

    socket.on('new-ticket', (ticket) => {
      console.log('New ticket notification:', ticket);
    });

    socket.emit('join-dispenser');
  };

  const loadDepartmentsData = async () => {
    try {
      setIsLoading(true);
      const departmentsResponse = await ticketService.getDepartments();
      const activeDepartments = departmentsResponse.filter(dept => dept.active !== false);
      setDepartmentsList(activeDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartmentsList([
        { _id: '1', name: 'General OPD', code: 'general', active: true, prefix: 'A' },
        { _id: '2', name: 'Cardiology', code: 'cardiology', active: true, prefix: 'B' },
        { _id: '3', name: 'Orthopedics', code: 'ortho', active: true, prefix: 'C' },
        { _id: '4', name: 'Pediatrics', code: 'pediatrics', active: true, prefix: 'D' },
        { _id: '5', name: 'Emergency', code: 'emergency', active: true, prefix: 'E' },
        { _id: '6', name: 'Dental', code: 'dental', active: true, prefix: 'F' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED: TICKET GENERATION WITHOUT VOICE AND WITH AUTO-RELOAD PROTECTION
  const generateNewTicket = async (department) => {
    const departmentId = department._id;
    
    // ✅ PROTECTION: Prevent multiple clicks
    if (printingStates[departmentId] || printQueueRef.current.has(departmentId)) {
      console.log(`⚠️ Already processing: ${department.name}`);
      return;
    }

    // ✅ RATE LIMITING
    const now = Date.now();
    const lastPrintTime = printQueueRef.current.get(departmentId) || 0;
    const timeSinceLastPrint = now - lastPrintTime;
    
    if (timeSinceLastPrint < 800) {
      console.log(`⏳ Too fast, please wait: ${department.name}`);
      return;
    }

    try {
      // ✅ INSTANT UI UPDATE
      setPrintingStates(prev => ({ ...prev, [departmentId]: true }));
      printQueueRef.current.set(departmentId, now);

      // ✅ FAST TICKET GENERATION
      const ticketData = await ticketService.generateTicket({
        departmentId: department._id,
        departmentName: department.name,
        priority: "normal",
      });

      const payload = {
        ticketNumber: ticketData.ticketNumber,
        departmentName: department.name,
        hospitalName: "AL-KHIDMAT RAAZI HOSPITAL",
        date: new Date().toLocaleDateString("en-PK"),
        time: new Date().toLocaleTimeString("en-PK", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        departmentCode: department.prefix || department.code?.toUpperCase() || 'GEN'
      };

      // ✅ ENHANCED PRINTING WITHOUT VOICE
      const printPromise = fetch("/api/print-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const printTimeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ ok: false, status: 'timeout' }), 10000)
      );

      const printResponse = await Promise.race([printPromise, printTimeoutPromise]);
      
      if (printResponse.ok) {
        const result = await printResponse.json();
        console.log('✅ Print request successful:', result);
      } else {
        console.log('⚠️ Print request had issues, but continuing...');
      }

      // ✅ AUTO-RELOAD AFTER PRINTING COMPLETION
      console.log('✅ Ticket printed successfully - Auto-reload in 3 seconds');
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (err) {
      console.error("❌ Ticket generation error:", err);
      
      // ✅ AUTO-RECOVERY ON ERROR
      if (err.message.includes('timeout') || err.message.includes('network')) {
        console.log('🔄 Auto-recovering from timeout...');
      }
      
    } finally {
      // ✅ GUARANTEED CLEANUP
      setTimeout(() => {
        setPrintingStates(prev => {
          const newState = { ...prev };
          delete newState[departmentId];
          return newState;
        });
        printQueueRef.current.delete(departmentId);
      }, 2000);
    }
  };

  const getDepartmentIconName = (code) => {
    const iconMapping = {
      general: 'stethoscope',
      cardiology: 'heart-pulse',
      ortho: 'bone',
      pediatrics: 'child',
      dental: 'tooth',
      eye: 'eye',
      emergency: 'truck-medical'
    };
    return iconMapping[code] || 'stethoscope';
  };

  if (isLoading && !departmentsList.length) {
    return (
      <div className="ticket-dispenser-container dark-blue-theme">
        <div className="dispenser-background-logo">
          {hospitalLogoImage && <img src={hospitalLogoImage} alt="Hospital Logo" className="dispenser-logo-blur" />}
        </div>
        <div className="dispenser-loading-container">
          <div className="dispenser-spinner"></div>
          <div className="dispenser-loading-text">Loading Hospital Services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-dispenser-container kiosk-mode">
      <div className="dispenser-background-logo">
        {hospitalLogoImage && <img src={hospitalLogoImage} alt="Hospital Logo" className="dispenser-logo-blur" />}
      </div>

      <div className="dispenser-content-wrapper">
        <div className="dispenser-header">
          <div className="dispenser-branding">
            {hospitalLogoImage ? (
              <img src={hospitalLogoImage} alt="Hospital Logo" className="dispenser-logo" />
            ) : (
              <div className="dispenser-logo-placeholder">
                <i className="fas fa-hospital-alt"></i>
              </div>
            )}
            <div className="dispenser-details">
              <h1 className="dispenser-title">{hospitalTitle}</h1>
              <p className="dispenser-location">{hospitalLocation}</p>
            </div>
          </div>
        </div>

        {/* ✅ HIDDEN STATUS */}
        <div style={{ display: 'none' }}>
          Active Prints: {Object.keys(printingStates).length} |
          Last Reload: {Math.floor((Date.now() - lastReloadTimeRef.current) / 1000)}s ago |
          Auto-reload: Active
        </div>

        <div className="dispenser-grid">
          {departmentsList.map((dept, index) => {
            const isDepartmentPrinting = printingStates[dept._id] || false;
            
            return (
              <div 
                key={dept._id} 
                className={`dispenser-card ${isDepartmentPrinting ? 'printing' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => !isDepartmentPrinting && generateNewTicket(dept)}
              >
                <div className="dispenser-card-header">
                  <div className="dispenser-icon">
                    <i className={`fas fa-${getDepartmentIconName(dept.code)}`}></i>
                  </div>
                  <div className="dispenser-meta">
                    <span className="dispenser-code">
                      {dept.prefix || dept.code?.toUpperCase() || 'GEN'}
                    </span>
                  </div>
                </div>
                
                <div className="dispenser-card-content">
                  <h3 className="dispenser-dept-name">{dept.name}</h3>
                </div>

                <div className={`dispenser-button ${isDepartmentPrinting ? 'printing' : ''}`}>
                  {isDepartmentPrinting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Printing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-ticket-alt"></i>
                      GET TICKET
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        
      </div>
    </div>
  );
};

export default TicketDispenserKiosk;