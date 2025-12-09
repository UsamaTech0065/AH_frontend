import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useSocket } from '../context/SocketContext';
import '../styles/CounterManagement.css';

const CounterManagement = ({ counters: initialCounters }) => {
  const socket = useSocket();
  const [counters, setCounters] = useState(initialCounters || []);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCounter, setNewCounter] = useState({
    counterNumber: '',
    name: '',
    department: '',
    type: 'department'
  });
  const [departments, setDepartments] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    prefix: '',
    estimatedWaitTime: 15
  });
  const [deptLoading, setDeptLoading] = useState(false);

  useEffect(() => {
    if (!initialCounters || initialCounters.length === 0) {
      loadCounters();
    }
    loadDepartments();
    setupSocketListeners();
  }, []);

  const loadCounters = async () => {
    try {
      setLoading(true);
      const countersData = await adminService.getCounters();
      setCounters(countersData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading counters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      setDeptLoading(true);
      console.log('🔄 Loading departments...');
      
      // Try to fetch from the correct endpoint
      const response = await fetch('/api/departments');
      if (response.ok) {
        const deptsData = await response.json();
        console.log('✅ Departments loaded:', deptsData);
        setDepartments(deptsData);
      } else {
        console.error('❌ Failed to load departments:', response.status);
        // Fallback: create default departments if none exist
        createDefaultDepartments();
      }
    } catch (error) {
      console.error('❌ Error loading departments:', error);
      // Fallback: create default departments
      createDefaultDepartments();
    } finally {
      setDeptLoading(false);
    }
  };

  const createDefaultDepartments = () => {
    console.log('🔄 Creating default departments...');
    const defaultDepartments = [
      {
        _id: '1',
        name: 'General OPD',
        code: 'GENERAL',
        prefix: 'G',
        estimatedWaitTime: 15,
        active: true
      },
      {
        _id: '2',
        name: 'Cardiology',
        code: 'CARDIO',
        prefix: 'C',
        estimatedWaitTime: 25,
        active: true
      },
      {
        _id: '3',
        name: 'Orthopedics',
        code: 'ORTHO',
        prefix: 'O',
        estimatedWaitTime: 20,
        active: true
      },
      {
        _id: '4',
        name: 'Pediatrics',
        code: 'PEDIA',
        prefix: 'P',
        estimatedWaitTime: 18,
        active: true
      },
      {
        _id: '5',
        name: 'Dental',
        code: 'DENTAL',
        prefix: 'D',
        estimatedWaitTime: 22,
        active: true
      }
    ];
    setDepartments(defaultDepartments);
    console.log('✅ Default departments created');
  };

  const setupSocketListeners = () => {
    if (!socket) {
      console.warn('Socket not available for counter management');
      return;
    }

    socket.on('counter-updated', (counter) => {
      setCounters(prev => prev.map(c => 
        c._id === counter._id ? counter : c
      ));
      setLastUpdate(new Date());
    });

    socket.on('counter-created', (counter) => {
      setCounters(prev => {
        const exists = prev.find(c => c._id === counter._id);
        if (!exists) {
          return [...prev, counter];
        }
        return prev;
      });
      setShowAddForm(false);
      setIsAdding(false);
      setLastUpdate(new Date());
    });

    socket.on('counter-deleted', (counterId) => {
      setCounters(prev => prev.filter(c => c._id !== counterId));
      setLastUpdate(new Date());
    });

    socket.on('token-called', (data) => {
      setCounters(prev => prev.map(c => 
        c._id === data.counter._id ? data.counter : c
      ));
      setLastUpdate(new Date());
    });

    socket.on('token-completed', (data) => {
      setCounters(prev => prev.map(c => 
        c._id === data.counter._id ? data.counter : c
      ));
      setLastUpdate(new Date());
    });

    socket.on('token-recalled', (data) => {
      setCounters(prev => prev.map(c => 
        c._id === data.counter._id ? data.counter : c
      ));
      setLastUpdate(new Date());
    });

    return () => {
      socket.off('counter-updated');
      socket.off('counter-created');
      socket.off('counter-deleted');
      socket.off('token-called');
      socket.off('token-completed');
      socket.off('token-recalled');
    };
  };

  const updateCounterStatus = async (counterId, status) => {
    try {
      await adminService.updateCounterStatus(counterId, status);
    } catch (error) {
      console.error('Error updating counter status:', error);
      alert('Error updating counter status: ' + error.message);
    }
  };

  const addCounter = async () => {
    if (isAdding) return;

    try {
      setIsAdding(true);
      
      // Auto-generate counter number if not provided
      const existingNumbers = counters.map(c => c.counterNumber);
      const nextNumber = newCounter.counterNumber || (existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1);
      
      const counterData = {
        counterNumber: nextNumber,
        name: newCounter.name || `Counter ${nextNumber}`,
        department: newCounter.department,
        type: newCounter.type || 'department'
      };

      console.log('📝 Creating counter with data:', counterData);

      await adminService.createCounter(counterData);

      // Reset form
      setNewCounter({
        counterNumber: '',
        name: '',
        department: '',
        type: 'department'
      });

    } catch (error) {
      console.error('Error adding counter:', error);
      alert('Error adding counter: ' + error.message);
      setIsAdding(false);
    }
  };

  const deleteCounter = async (counterId) => {
    if (window.confirm('Are you sure you want to delete this counter? This action cannot be undone.')) {
      try {
        await adminService.deleteCounter(counterId);
      } catch (error) {
        console.error('Error deleting counter:', error);
        alert('Error deleting counter: ' + error.message);
      }
    }
  };

  const openCounterInterface = (counter) => {
    const baseUrl = window.location.origin;
    window.open(
      `${baseUrl}/login/counter`,
      `Counter_${counter._id}`,
      'width=1200,height=800'
    );
  };

  const openWaitingScreen = (counter) => {
    const baseUrl = window.location.origin;
    window.open(
      `${baseUrl}/waiting/counter/${counter._id}`,
      `Waiting_${counter._id}`,
      'width=1400,height=900'
    );
  };

  const callNextForCounter = async (counterId) => {
    try {
      await adminService.callNextTicket(counterId);
    } catch (error) {
      console.error('Error calling next ticket:', error);
      alert('Error calling next ticket: ' + error.message);
    }
  };

  // Department management functions
  const addDepartment = async () => {
    try {
      const deptData = {
        name: newDept.name,
        code: newDept.code.toLowerCase(),
        prefix: newDept.prefix.toUpperCase(),
        estimatedWaitTime: newDept.estimatedWaitTime
      };

      console.log('📝 Creating department with data:', deptData);

      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create department');
      }

      const result = await response.json();
      
      setNewDept({
        name: '',
        code: '',
        prefix: '',
        estimatedWaitTime: 15
      });
      setShowDeptForm(false);
      
      // Reload departments
      await loadDepartments();
      
      alert(result.message || 'Department created successfully!');
      
    } catch (error) {
      console.error('Error adding department:', error);
      alert('Error adding department: ' + error.message);
    }
  };

  const deleteDepartment = async (deptId) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/departments/${deptId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete department');
        }

        await loadDepartments();
        alert('Department deleted successfully!');
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Error deleting department: ' + error.message);
      }
    }
  };

  const manualRefresh = async () => {
    await loadCounters();
    await loadDepartments();
  };

  const getCounterStats = () => {
    const active = counters.filter(c => c.status === 'active').length;
    const busy = counters.filter(c => c.status === 'busy').length;
    const onBreak = counters.filter(c => c.status === 'break').length;
    const offline = counters.filter(c => c.status === 'offline').length;
    const total = counters.length;

    return { active, busy, onBreak, offline, total };
  };

  const stats = getCounterStats();

  if (loading && counters.length === 0) {
    return (
      <div className="counter-management loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div className="loading-text">Loading counters...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="counter-management">
      {/* Header Section */}
      <div className="management-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">Counter Management</h1>
            <p className="page-subtitle">
              <i className="fas fa-info-circle"></i>
              Manage counter access and open operator interfaces
            </p>
          </div>
          <div className="header-info">
            <div className="last-update">
              <i className="fas fa-clock"></i>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            {!socket && (
              <div className="socket-warning">
                <i className="fas fa-exclamation-triangle"></i>
                Real-time updates disabled
              </div>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(true)}
            disabled={isAdding}
          >
            <i className="fas fa-plus"></i> Add Counter
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowDeptForm(true)}
          >
            <i className="fas fa-building"></i> Manage Departments
          </button>
          <button className="btn btn-outline" onClick={manualRefresh} disabled={loading}>
            <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-play-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon busy">
            <i className="fas fa-phone-alt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.busy}</div>
            <div className="stat-label">Busy</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon break">
            <i className="fas fa-coffee"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.onBreak}</div>
            <div className="stat-label">On Break</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon offline">
            <i className="fas fa-power-off"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.offline}</div>
            <div className="stat-label">Offline</div>
          </div>
        </div>
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Counters</div>
          </div>
        </div>
      </div>

      {/* Add Counter Form */}
      {showAddForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>Add New Counter</h3>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowAddForm(false);
                  setIsAdding(false);
                }}
                disabled={isAdding}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="form-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Counter Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCounter.name}
                    onChange={(e) => setNewCounter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Reception Counter 1"
                    disabled={isAdding}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  {deptLoading ? (
                    <div className="loading-small">
                      <i className="fas fa-spinner fa-spin"></i> Loading departments...
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={newCounter.department}
                      onChange={(e) => setNewCounter(prev => ({ ...prev, department: e.target.value }))}
                      disabled={isAdding || departments.length === 0}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  )}
                  {departments.length === 0 && !deptLoading && (
                    <div className="form-error">
                      No departments available. Please create a department first.
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Counter Type</label>
                  <select
                    className="form-select"
                    value={newCounter.type}
                    onChange={(e) => setNewCounter(prev => ({ ...prev, type: e.target.value }))}
                    disabled={isAdding}
                  >
                    <option value="reception">Reception</option>
                    <option value="department">Department</option>
                    <option value="special">Special</option>
                  </select>
                </div>
              </div>
              
              {isAdding && (
                <div className="form-notice">
                  <i className="fas fa-circle-notch fa-spin"></i>
                  Creating counter, please wait...
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                className="btn btn-success" 
                onClick={addCounter}
                disabled={isAdding || !newCounter.department || departments.length === 0}
              >
                {isAdding ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i> Create Counter
                  </>
                )}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setIsAdding(false);
                }}
                disabled={isAdding}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the component remains the same... */}
      {/* Department Management Form */}
      {showDeptForm && (
        <div className="form-overlay">
          <div className="form-modal large">
            <div className="form-header">
              <h3>Manage Departments</h3>
              <button 
                className="btn-close"
                onClick={() => setShowDeptForm(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="form-body">
              <div className="form-section">
                <h4>Add New Department</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newDept.name}
                      onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., General OPD"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Department Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newDept.code}
                      onChange={(e) => setNewDept(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., general"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Ticket Prefix *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newDept.prefix}
                      onChange={(e) => setNewDept(prev => ({ ...prev, prefix: e.target.value }))}
                      placeholder="e.g., A"
                      maxLength="3"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Estimated Wait Time (minutes)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newDept.estimatedWaitTime}
                      onChange={(e) => setNewDept(prev => ({ ...prev, estimatedWaitTime: parseInt(e.target.value) || 15 }))}
                      min="5"
                      max="120"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn btn-success" 
                    onClick={addDepartment}
                    disabled={!newDept.name || !newDept.code || !newDept.prefix}
                  >
                    <i className="fas fa-plus"></i> Add Department
                  </button>
                </div>
              </div>
              
              <div className="form-section">
                <h4>Existing Departments ({departments.length})</h4>
                {deptLoading ? (
                  <div className="loading-small">
                    <i className="fas fa-spinner fa-spin"></i> Loading departments...
                  </div>
                ) : (
                  <div className="departments-list">
                    {departments.map(dept => (
                      <div key={dept._id} className="department-item">
                        <div className="dept-info">
                          <div className="dept-name">{dept.name}</div>
                          <div className="dept-details">
                            Code: {dept.code} | Prefix: {dept.prefix} | Wait: {dept.estimatedWaitTime}m
                          </div>
                          <div className="dept-counters">
                            Counters: {dept.counters ? dept.counters.length : 0}
                          </div>
                        </div>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteDepartment(dept._id)}
                          disabled={dept.counters && dept.counters.length > 0}
                          title={dept.counters && dept.counters.length > 0 ? 'Cannot delete department with counters' : 'Delete department'}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                    {departments.length === 0 && (
                      <div className="empty-departments">
                        No departments found. Add your first department above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowDeptForm(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counters Grid */}
      <div className="section-header">
        <h3>Service Counters ({counters.length})</h3>
        <div className="section-info">
          <span className="info-text">
            <i className="fas fa-desktop"></i> Open counter interfaces with dedicated login
          </span>
        </div>
      </div>

      <div className="counters-grid">
        {counters.map(counter => (
          <div 
            key={counter._id} 
            className={`counter-card ${counter.status}`}
          >
            <div className="card-header">
              <div className="counter-title">
                <div className="counter-number">Counter {counter.counterNumber}</div>
                <div className="counter-name">{counter.name}</div>
              </div>
              <div className={`status-badge ${counter.status}`}>
                <span className="status-dot"></span>
                {counter.status.charAt(0).toUpperCase() + counter.status.slice(1)}
              </div>
            </div>
            
            <div className="card-body">
              <div className="counter-info">
                <div className="info-item">
                  <i className="fas fa-building"></i>
                  <span>{counter.department?.name || 'No Department'}</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-tag"></i>
                  <span>Type: {counter.type}</span>
                </div>
              </div>
              
              <div className="current-ticket">
                <div className="ticket-label">Current Ticket</div>
                {counter.currentTicket ? (
                  <div className="ticket-info">
                    <div className="ticket-number">{counter.currentTicket.ticketNumber}</div>
                    <div className="patient-name">
                      {counter.currentTicket.patientName || 'Patient'}
                    </div>
                    <div className="ticket-time">
                      <i className="fas fa-clock"></i>
                      {counter.currentTicket.calledAt ? 
                        new Date(counter.currentTicket.calledAt).toLocaleTimeString() : 'Recently'}
                    </div>
                  </div>
                ) : (
                  <div className="no-ticket">No active ticket</div>
                )}
              </div>
            </div>

            <div className="card-actions">
              <div className="action-group">
                <button 
                  className="btn-action primary"
                  onClick={() => openCounterInterface(counter)}
                  title="Open Counter Operator Interface"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Operator
                </button>
                
                <button 
                  className="btn-action info"
                  onClick={() => openWaitingScreen(counter)}
                  title="Open Waiting Screen Display"
                >
                  <i className="fas fa-tv"></i>
                  Display
                </button>
              </div>
              
              <div className="action-group">
                <button 
                  className="btn-action success"
                  onClick={(e) => {
                    e.stopPropagation();
                    callNextForCounter(counter._id);
                  }}
                  disabled={counter.status === 'busy' || counter.status === 'offline'}
                  title="Call Next Ticket"
                >
                  <i className="fas fa-phone"></i>
                </button>

                <select 
                  value={counter.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateCounterStatus(counter._id, e.target.value);
                  }}
                  className="status-select"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="active">Active</option>
                  <option value="busy">Busy</option>
                  <option value="break">Break</option>
                  <option value="offline">Offline</option>
                </select>

                <button 
                  className="btn-action danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCounter(counter._id);
                  }}
                  disabled={counter.status === 'busy'}
                  title="Delete Counter"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div className="card-footer">
              <div className="access-info">
                <i className="fas fa-key"></i> Requires separate login for operator access
              </div>
            </div>
          </div>
        ))}
      </div>

      {counters.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-desktop"></i>
          </div>
          <h3>No Counters Found</h3>
          <p>Get started by adding your first service counter.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <i className="fas fa-plus"></i> Add First Counter
          </button>
        </div>
      )}
    </div>
  );
};

export default CounterManagement;