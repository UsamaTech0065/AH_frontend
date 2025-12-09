import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { adminService } from '../services/adminService';
import { useSettings } from '../context/SettingsContext';
import '../styles/CounterPopup.css';

const CounterPopup = ({ counter, onClose, getLocalizedText }) => {
  const socket = useSocket();
  const { settings } = useSettings();
  const [counterData, setCounterData] = useState(counter);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCounterDetails();
    setupSocketListeners();
    
    return () => {
      if (socket) {
        socket.off('counter-updated');
        socket.off('token-called');
        socket.off('token-completed');
      }
    };
  }, [counter._id]);

  const loadCounterDetails = async () => {
    try {
      setLoading(true);
      const details = await adminService.getCounters();
      const currentCounter = details.find(c => c._id === counter._id);
      
      if (currentCounter) {
        setCounterData(currentCounter);
        
        if (currentCounter.department?._id) {
          const queueData = await adminService.getQueue(currentCounter.department._id);
          setQueue(queueData);
        }
      }
    } catch (error) {
      console.error('❌ Error loading counter details:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.emit('join-counter', counter._id);

    socket.on('counter-updated', (updatedCounter) => {
      if (updatedCounter._id === counter._id) {
        setCounterData(updatedCounter);
      }
    });

    socket.on('token-called', (data) => {
      if (data.counter._id === counter._id) {
        loadCounterDetails();
      }
    });

    socket.on('token-completed', (data) => {
      if (data.counter._id === counter._id) {
        loadCounterDetails();
      }
    });
  };

  const getNextTokenNumber = () => {
    const currentToken = counterData.currentTicket;
    if (!currentToken) return '---';
    
    try {
      const ticketNumber = currentToken.ticketNumber;
      const prefix = ticketNumber.replace(/\d+$/, '');
      const currentNum = parseInt(ticketNumber.replace(/\D/g, ''));
      return `${prefix}${(currentNum + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      return '---';
    }
  };

  const currentToken = counterData.currentTicket?.ticketNumber || '---';
  const nextToken = getNextTokenNumber();

  const getLocalizedTextDefault = (key) => {
    const translations = {
      'counter': 'Counter',
      'currentlyServing': 'Currently Serving',
      'available': 'Available',
      'currentToken': 'Current Token',
      'nextToken': 'Next Token',
      'patients': 'Patient',
      'serving': 'Serving Since',
      'waiting': 'Waiting Queue',
      'noPatients': 'No patients waiting'
    };
    return getLocalizedText ? getLocalizedText(key) : translations[key] || key;
  };

  return (
    <div className="counter-popup-overlay" onClick={onClose}>
      <div className="counter-popup" onClick={(e) => e.stopPropagation()}>
        {/* Header with Logo */}
        <div className="popup-header">
          <div className="popup-title">
            <div className="logo-section">
              {settings?.hospitalLogo && (
                <img 
                  src={settings.hospitalLogo} 
                  alt="Hospital Logo" 
                  className="hospital-logo" 
                />
              )}
              <div className="title-content">
                <h2>{getLocalizedTextDefault('counter')} {counterData.counterNumber}</h2>
                <div className="department">{counterData.department?.name}</div>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Current Status */}
        <div className="current-status-section">
          <div className="status-indicator large">
            <div className={`status-dot ${counterData.status}`}></div>
            <span className="status-text">
              {counterData.status === 'busy' ? 
                getLocalizedTextDefault('currentlyServing') : 
                getLocalizedTextDefault('available')
              }
            </span>
          </div>

          <div className="tokens-display-large">
            <div className="token-display">
              <div className="token-label">{getLocalizedTextDefault('currentToken')}</div>
              <div className="token-number-large">{currentToken}</div>
            </div>
            <div className="token-display">
              <div className="token-label">{getLocalizedTextDefault('nextToken')}</div>
              <div className="token-number-large next">{nextToken}</div>
            </div>
          </div>

          {counterData.currentTicket && (
            <div className="current-patient-info">
              <div className="patient-name">
                {getLocalizedTextDefault('patients')}: {counterData.currentTicket.patientName || 'Anonymous'}
              </div>
              <div className="call-time">
                {getLocalizedTextDefault('serving')}: {counterData.currentTicket.calledAt ? 
                  new Date(counterData.currentTicket.calledAt).toLocaleTimeString() : 'Recently'
                }
              </div>
            </div>
          )}
        </div>

        {/* Queue - View Only */}
        <div className="queue-section">
          <h3>{getLocalizedTextDefault('waiting')} ({queue.length})</h3>
          <div className="queue-list">
            {loading ? (
              <div className="loading-queue">
                <i className="fas fa-spinner fa-spin"></i>
                Loading queue...
              </div>
            ) : queue.slice(0, 8).map((ticket, index) => (
              <div key={ticket._id} className="queue-item">
                <div className="queue-position">#{index + 1}</div>
                <div className="ticket-info">
                  <span className="ticket-number">{ticket.ticketNumber}</span>
                  {ticket.patientName && (
                    <span className="patient-name-small">{ticket.patientName}</span>
                  )}
                </div>
                <div className="wait-time">
                  {new Date(ticket.generatedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {!loading && queue.length === 0 && (
              <div className="empty-queue">
                <i className="fas fa-check-circle"></i>
                {getLocalizedTextDefault('noPatients')}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="popup-footer">
          <button 
            className="btn btn-primary"
            onClick={() => {
              window.open(`/counter/${counter._id}`, `Counter${counter._id}`);
              onClose();
            }}
          >
            <i className="fas fa-external-link-alt"></i> Open Counter Interface
          </button>
          <button 
            className="btn btn-outline"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterPopup;