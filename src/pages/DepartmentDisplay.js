import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { departmentService } from '../services/departmentService';
import '../styles/DepartmentDisplay.css';

const DepartmentDisplay = () => {
  const { deptCode } = useParams();
  const socket = useSocket();
  const { settings } = useSettings();
  const [department, setDepartment] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    loadDepartmentData();
    setupSocketListeners();
  }, [deptCode]);

  const loadDepartmentData = async () => {
    try {
      const deptData = await departmentService.getDepartmentByCode(deptCode);
      setDepartment(deptData);
      
      const queueData = await departmentService.getQueue(deptData._id);
      setQueue(queueData);
      
      // Find currently serving ticket
      const serving = queueData.find(t => t.status === 'called');
      setCurrentTicket(serving);
    } catch (error) {
      console.error('Error loading department data:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.emit('join-department', deptCode);

    socket.on('token-called', (data) => {
      if (data.ticket.department.code === deptCode) {
        setCurrentTicket(data.ticket);
        loadDepartmentData();
      }
    });

    socket.on('token-completed', (data) => {
      if (data.ticket.department.code === deptCode) {
        setCurrentTicket(null);
        loadDepartmentData();
      }
    });
  };

  return (
    <div className="department-display">
      <div className="dept-header">
        <div className="dept-branding">
          <i className={`fas fa-${getDepartmentIcon(deptCode)}`}></i>
          <div className="dept-info">
            <h1>{department?.name || deptCode.toUpperCase()} Department</h1>
            <p>{settings?.hospitalName || 'Razi Hospital'}</p>
          </div>
        </div>
      </div>

      <div className="dept-content">
        <div className="current-serving">
          <h2 className="serving-title">NOW SERVING</h2>
          {currentTicket ? (
            <div className="serving-ticket-large">
              <div className="ticket-number-xlarge">{currentTicket.ticketNumber}</div>
              <div className="ticket-counter">Counter {currentTicket.assignedCounter?.counterNumber}</div>
              {currentTicket.patientName && (
                <div className="patient-name">Patient: {currentTicket.patientName}</div>
              )}
            </div>
          ) : (
            <div className="no-serving">
              <div className="placeholder-xlarge">---</div>
              <div className="subtext">Please wait</div>
            </div>
          )}
        </div>

        <div className="upcoming-queue">
          <h3 className="queue-title">Next in Line</h3>
          <div className="queue-list">
            {queue.slice(0, 5).map(ticket => (
              <div key={ticket._id} className="queue-item">
                <span className="queue-number">{ticket.ticketNumber}</span>
                <span className="queue-time">
                  {new Date(ticket.generatedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {queue.length === 0 && (
              <div className="empty-queue">No patients waiting</div>
            )}
          </div>
        </div>

        <div className="dept-stats">
          <div className="stat-card">
            <div className="stat-value">{queue.length}</div>
            <div className="stat-label">Waiting</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{department?.estimatedWaitTime || 15}m</div>
            <div className="stat-label">Avg. Wait</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getDepartmentIcon = (code) => {
  const icons = {
    general: 'user-md',
    cardiology: 'heartbeat',
    ortho: 'bone',
    pediatrics: 'baby',
    dental: 'tooth',
    eye: 'eye',
    emergency: 'ambulance',
    lab: 'flask',
    pharmacy: 'pills'
  };
  return icons[code] || 'user-md';
};

export default DepartmentDisplay;