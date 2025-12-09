import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { displayService } from '../services/displayService';
import '../styles/DisplayScreen.css';

const DisplayScreen = () => {
  const { id } = useParams();
  const socket = useSocket();
  const [display, setDisplay] = useState(null);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    loadDisplay();
    setupSocketListeners();
  }, [id]);

  const loadDisplay = async () => {
    try {
      const displayData = await displayService.getDisplay(id);
      const liveData = await displayService.getDisplayData(id);
      setDisplay(displayData);
      setCurrentData(liveData);
    } catch (error) {
      console.error('Error loading display:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.emit('join-display', id);

    socket.on('ticket-called', () => {
      loadDisplay();
    });

    socket.on('ticket-completed', () => {
      loadDisplay();
    });

    socket.on('display-updated', (updatedDisplay) => {
      if (updatedDisplay._id === id) {
        setDisplay(updatedDisplay);
      }
    });
  };

  if (!display || !currentData) return <div>Loading display...</div>;

  return (
    <div className={`display-screen ${display.settings.theme}`}>
      {display.settings.showLogo && (
        <div className="display-header">
          <div className="hospital-logo">
            <i className="fas fa-hospital-alt"></i>
            <h1>Razi Hospital</h1>
          </div>
        </div>
      )}

      <div className="display-content">
        {display.type === 'waiting' && (
          <WaitingAreaDisplay data={currentData} />
        )}
        
        {display.type === 'counter' && (
          <CounterDisplay data={currentData} counterId={display.counter} />
        )}
        
        {display.type === 'custom' && (
          <CustomDisplay data={currentData} settings={display.settings} />
        )}
      </div>

      {display.settings.showAds && (
        <div className="advertisement-section">
          <div className="ad-content">
            {/* Ad content would be loaded here */}
            <p>Quality Healthcare Services</p>
          </div>
        </div>
      )}
    </div>
  );
};

const WaitingAreaDisplay = ({ data }) => {
  return (
    <div className="waiting-display">
      <div className="now-serving">
        <h2>NOW SERVING</h2>
        <div className="current-tickets">
          {data.currentTickets.map(ticket => (
            <div key={ticket._id} className="serving-ticket">
              <div className="ticket-number-large">{ticket.ticketNumber}</div>
              <div className="ticket-info">
                <div>Counter {ticket.assignedCounter?.counterNumber}</div>
                <div>{ticket.department.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CounterDisplay = ({ data, counterId }) => {
  const counter = data.counters.find(c => c._id === counterId);
  
  return (
    <div className="counter-display">
      <div className="counter-info">
        <div className="counter-number-large">Counter {counter?.counterNumber}</div>
        <div className="counter-status">{counter?.status}</div>
      </div>
      
      {counter?.currentTicket && (
        <div className="current-ticket-display">
          <div className="ticket-number-xlarge">{counter.currentTicket.ticketNumber}</div>
          <div className="department-name">{counter.department.name}</div>
        </div>
      )}
    </div>
  );
};

const CustomDisplay = ({ data, settings }) => {
  // Custom display logic based on settings
  return (
    <div className="custom-display">
      <h2>Custom Display</h2>
      <div>Configure this display in admin settings</div>
    </div>
  );
};

export default DisplayScreen;