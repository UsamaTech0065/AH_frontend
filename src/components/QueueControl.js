import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import '../styles/QueueControl.css';

const QueueControl = () => {
  const socket = useSocket();
  const { settings } = useSettings();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [queue, setQueue] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [counters, setCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('queue');

  useEffect(() => {
    loadInitialData();
    setupSocketListeners();
    
    return () => {
      // Cleanup socket listeners
      if (socket) {
        socket.off('ticket-generated');
        socket.off('token-called');
        socket.off('token-completed');
        socket.off('token-recalled');
        socket.off('counter-updated');
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [deptsData, countersData] = await Promise.all([
        adminService.getDepartments(),
        adminService.getCounters()
      ]);
      
      setDepartments(deptsData);
      setCounters(countersData);
      
      if (deptsData.length > 0) {
        setSelectedDept(deptsData[0]._id);
        loadQueue(deptsData[0]._id);
      }
      if (countersData.length > 0) {
        setSelectedCounter(countersData[0]._id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      addToActivityLog('Error loading initial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async (departmentId) => {
    try {
      const tickets = await adminService.getQueue(departmentId);
      setQueue(tickets);
    } catch (error) {
      console.error('Error loading queue:', error);
      addToActivityLog('Error loading queue', 'error');
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('ticket-generated', (ticket) => {
      if (ticket.department === selectedDept) {
        loadQueue(selectedDept);
        addToActivityLog(`New ticket generated: ${ticket.ticketNumber}`, 'info');
      }
    });

    socket.on('token-called', (data) => {
      setCurrentCall(data.ticket);
      loadQueue(selectedDept);
      updateCounterStatus(data.counter._id, 'busy');
      addToActivityLog(`Ticket ${data.ticket.ticketNumber} called to Counter ${data.counter.counterNumber}`, 'success');
    });

    socket.on('token-completed', (data) => {
      if (currentCall && currentCall._id === data.ticket._id) {
        setCurrentCall(null);
      }
      loadQueue(selectedDept);
      updateCounterStatus(data.counter._id, 'active');
      addToActivityLog(`Ticket ${data.ticket.ticketNumber} completed at Counter ${data.counter.counterNumber}`, 'info');
    });

    socket.on('token-recalled', (data) => {
      addToActivityLog(`Ticket ${data.ticket.ticketNumber} recalled at Counter ${data.counter.counterNumber}`, 'warning');
    });

    socket.on('counter-updated', (counter) => {
      setCounters(prev => prev.map(c => 
        c._id === counter._id ? counter : c
      ));
    });
  };

  const updateCounterStatus = (counterId, status) => {
    setCounters(prev => prev.map(c => 
      c._id === counterId ? { ...c, status } : c
    ));
  };

  const addToActivityLog = (message, type = 'info') => {
    const logEntry = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setActivityLog(prev => [logEntry, ...prev.slice(0, 49)]);
  };

  // MANUAL CONTROL FUNCTIONS
  const callNextTicket = async (counterId = selectedCounter) => {
    if (!counterId) {
      addToActivityLog('Please select a counter first', 'warning');
      return;
    }

    try {
      const nextTicket = getNextTicketByPriority();
      if (!nextTicket) {
        addToActivityLog('No tickets available in queue', 'warning');
        return;
      }

      await callTicketToCounter(nextTicket._id, counterId);
    } catch (error) {
      console.error('Error calling next ticket:', error);
      addToActivityLog('Error calling next ticket: ' + error.message, 'error');
    }
  };

  const callTicketToCounter = async (ticketId, counterId) => {
    try {
      await adminService.callNextTicket(counterId);
    } catch (error) {
      console.error('Error calling ticket:', error);
      addToActivityLog('Error calling ticket: ' + error.message, 'error');
      throw error;
    }
  };

  const completeCurrent = async (counterId = selectedCounter) => {
    if (!counterId) {
      addToActivityLog('Please select a counter first', 'warning');
      return;
    }

    try {
      const counter = counters.find(c => c._id === counterId);
      if (!counter?.currentTicket) {
        addToActivityLog('No active ticket to complete', 'warning');
        return;
      }

      await adminService.completeTicket(counterId);
      addToActivityLog(`Completed ticket at Counter ${counter.counterNumber}`, 'info');
    } catch (error) {
      console.error('Error completing ticket:', error);
      addToActivityLog('Error completing ticket: ' + error.message, 'error');
    }
  };

  const recallTicket = async (counterId = selectedCounter) => {
    if (!counterId) {
      addToActivityLog('Please select a counter first', 'warning');
      return;
    }

    try {
      const counter = counters.find(c => c._id === counterId);
      if (!counter?.currentTicket) {
        addToActivityLog('No active ticket to recall', 'warning');
        return;
      }

      await adminService.recallTicket(counterId);
      addToActivityLog(`Recalled ticket at Counter ${counter.counterNumber}`, 'warning');
    } catch (error) {
      console.error('Error recalling ticket:', error);
      addToActivityLog('Error recalling ticket: ' + error.message, 'error');
    }
  };

  const callSpecificTicket = async (ticketId, counterId = selectedCounter) => {
    if (!counterId) {
      addToActivityLog('Please select a counter first', 'warning');
      return;
    }

    try {
      await adminService.callSpecificTicket(ticketId, counterId);
      addToActivityLog(`Manually called specific ticket ${ticketId}`, 'info');
    } catch (error) {
      console.error('Error calling specific ticket:', error);
      addToActivityLog('Error calling specific ticket: ' + error.message, 'error');
    }
  };

  const skipTicket = async (ticketId) => {
    try {
      await adminService.skipTicket(ticketId);
      const updatedQueue = queue.filter(t => t._id !== ticketId);
      const skippedTicket = queue.find(t => t._id === ticketId);
      setQueue([...updatedQueue, skippedTicket]);
      addToActivityLog(`Skipped ticket ${skippedTicket.ticketNumber}`, 'warning');
    } catch (error) {
      console.error('Error skipping ticket:', error);
      addToActivityLog('Error skipping ticket: ' + error.message, 'error');
    }
  };

  const getNextTicketByPriority = () => {
    if (!settings?.priorityRules) return queue[0];

    const priorityOrder = settings.priorityRules.split(',');
    
    for (const priority of priorityOrder) {
      const ticket = queue.find(t => t.priority === priority);
      if (ticket) return ticket;
    }
    
    return queue[0];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return '#ef4444';
      case 'priority': return '#f59e0b';
      case 'senior': return '#8b5cf6';
      case 'child': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'emergency': return 'Emergency';
      case 'priority': return 'Priority';
      case 'senior': return 'Senior';
      case 'child': return 'Child';
      default: return 'Normal';
    }
  };

  const getCounterStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="queue-control-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div>Loading Queue Control...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-control">
      {/* Header Section */}
      <div className="control-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Queue Control Center</h1>
            <p>Manage and monitor patient queues in real-time</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="control-navigation">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeView === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveView('queue')}
          >
            <i className="fas fa-list"></i>
            Queue Management
          </button>
          <button 
            className={`nav-tab ${activeView === 'counters' ? 'active' : ''}`}
            onClick={() => setActiveView('counters')}
          >
            <i className="fas fa-desktop"></i>
            Counters
          </button>
          <button 
            className={`nav-tab ${activeView === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveView('activity')}
          >
            <i className="fas fa-history"></i>
            Activity Log
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{queue.length}</div>
            <div className="stat-label">Waiting</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {counters.filter(c => c.status === 'busy' && c.department?._id === selectedDept).length}
            </div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {counters.filter(c => c.status === 'active' && c.department?._id === selectedDept).length}
            </div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {queue.length > 0 ? Math.round(queue.length * 5) : 0}
            </div>
            <div className="stat-label">Est. Wait (min)</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="control-content">
        {/* Filters and Controls */}
        <div className="control-filters">
          <div className="filter-group">
            <label>Department</label>
            <select 
              value={selectedDept} 
              onChange={(e) => {
                setSelectedDept(e.target.value);
                loadQueue(e.target.value);
              }}
              className="filter-select"
            >
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.waitingCount || 0} waiting)
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Counter</label>
            <select 
              value={selectedCounter} 
              onChange={(e) => setSelectedCounter(e.target.value)}
              className="filter-select"
            >
              <option value="">Select Counter</option>
              {counters.map(counter => (
                <option key={counter._id} value={counter._id}>
                  Counter {counter.counterNumber} - {counter.department?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-buttons">
            <button 
              className="btn btn-primary" 
              onClick={() => callNextTicket()}
              disabled={queue.length === 0 || !selectedCounter}
            >
              <i className="fas fa-phone"></i>
              Call Next
            </button>
            <button 
              className="btn btn-warning" 
              onClick={() => recallTicket()}
              disabled={!currentCall}
            >
              <i className="fas fa-redo"></i>
              Recall
            </button>
            <button 
              className="btn btn-success" 
              onClick={() => completeCurrent()}
              disabled={!currentCall}
            >
              <i className="fas fa-check"></i>
              Complete
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => loadQueue(selectedDept)}
            >
              <i className="fas fa-sync"></i>
            </button>
          </div>
        </div>

        {/* Current Call Display */}
        {currentCall && (
          <div className="current-call-banner">
            <div className="call-content">
              <div className="call-icon">
                <i className="fas fa-bullhorn"></i>
              </div>
              <div className="call-details">
                <div className="ticket-number-large">{currentCall.ticketNumber}</div>
                <div className="call-meta">
                  <span>Counter {currentCall.assignedCounter?.counterNumber}</span>
                  <span>•</span>
                  <span>{currentCall.department?.name}</span>
                  <span>•</span>
                  <span 
                    className="priority-tag"
                    style={{ backgroundColor: getPriorityColor(currentCall.priority) }}
                  >
                    {getPriorityLabel(currentCall.priority)}
                  </span>
                </div>
              </div>
              <div className="call-time">
                Called at {new Date(currentCall.calledAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content based on Active View */}
        {activeView === 'queue' && (
          <div className="queue-management">
            <div className="section-header">
              <h3>Waiting Queue</h3>
              <div className="queue-info">
                <span className="queue-count">{queue.length} patients waiting</span>
                <span className="department-name">{departments.find(d => d._id === selectedDept)?.name}</span>
              </div>
            </div>
            
            <div className="queue-list">
              {queue.map((ticket, index) => (
                <div key={ticket._id} className="queue-item">
                  <div className="item-main">
                    <div className="ticket-header">
                      <div className="ticket-number">{ticket.ticketNumber}</div>
                      <div className="position-badge">#{index + 1}</div>
                    </div>
                    <div className="ticket-details">
                      <div className="patient-info">
                        <span className="patient-name">{ticket.patientName || 'Anonymous'}</span>
                        <span className="ticket-time">
                          {new Date(ticket.generatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div 
                        className="priority-badge"
                        style={{ 
                          backgroundColor: getPriorityColor(ticket.priority),
                          color: 'white'
                        }}
                      >
                        {getPriorityLabel(ticket.priority)}
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="btn-icon primary"
                      onClick={() => callSpecificTicket(ticket._id)}
                      disabled={!selectedCounter}
                      title="Call this ticket"
                    >
                      <i className="fas fa-phone"></i>
                    </button>
                    <button 
                      className="btn-icon warning"
                      onClick={() => skipTicket(ticket._id)}
                      title="Skip this ticket"
                    >
                      <i className="fas fa-forward"></i>
                    </button>
                  </div>
                </div>
              ))}
              {queue.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-check-circle"></i>
                  <h4>No patients in queue</h4>
                  <p>All patients have been served</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'counters' && (
          <div className="counters-view">
            <div className="section-header">
              <h3>Counter Status</h3>
              <div className="counters-summary">
                <span className="summary-item">
                  <span className="dot active"></span>
                  Available: {counters.filter(c => c.status === 'active').length}
                </span>
                <span className="summary-item">
                  <span className="dot busy"></span>
                  Busy: {counters.filter(c => c.status === 'busy').length}
                </span>
                <span className="summary-item">
                  <span className="dot offline"></span>
                  Offline: {counters.filter(c => c.status === 'offline').length}
                </span>
              </div>
            </div>
            
            <div className="counters-grid">
              {counters.map(counter => (
                <div key={counter._id} className={`counter-card ${counter.status}`}>
                  <div className="counter-header">
                    <div className="counter-number">Counter {counter.counterNumber}</div>
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getCounterStatusColor(counter.status) }}
                    ></div>
                  </div>
                  <div className="counter-info">
                    <div className="counter-department">{counter.department?.name || 'Unassigned'}</div>
                    <div className="counter-status">{counter.status}</div>
                  </div>
                  {counter.currentTicket && (
                    <div className="current-ticket">
                      <div className="ticket-number-small">{counter.currentTicket.ticketNumber}</div>
                      <div className="ticket-time">Active</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'activity' && (
          <div className="activity-view">
            <div className="section-header">
              <h3>Activity Log</h3>
              <button 
                className="btn btn-text"
                onClick={() => setActivityLog([])}
              >
                Clear Log
              </button>
            </div>
            
            <div className="activity-list">
              {activityLog.map(log => (
                <div key={log.id} className={`activity-item ${log.type}`}>
                  <div className="activity-icon">
                    <i className={`fas ${
                      log.type === 'success' ? 'fa-check-circle' :
                      log.type === 'error' ? 'fa-exclamation-circle' :
                      log.type === 'warning' ? 'fa-exclamation-triangle' :
                      'fa-info-circle'
                    }`}></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-message">{log.message}</div>
                    <div className="activity-time">{log.timestamp}</div>
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-history"></i>
                  <h4>No activities yet</h4>
                  <p>Activities will appear here as they occur</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueControl;