import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import centralVoiceService from '../services/voiceService';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    console.log(`🔌 Connecting to socket server: ${socketUrl}`);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Set socket in central voice service
    centralVoiceService.setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
      setReconnectAttempts(attempt);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect', (attempt) => {
      console.log(`✅ Reconnected successfully after ${attempt} attempts`);
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      setConnectionStatus('failed');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Voice announcement events
    newSocket.on('broadcast-voice-call', (data) => {
      console.log('🔊 Received broadcast voice call:', data);
    });

    newSocket.on('broadcast-voice-recall', (data) => {
      console.log('🔊 Received broadcast voice recall:', data);
    });

    newSocket.on('central-voice-announcement', (data) => {
      console.log('🔊 Received central voice announcement:', data);
    });

    // Custom application events for debugging
    newSocket.on('counter-updated', (data) => {
      console.log('📊 Counter updated:', data);
    });

    newSocket.on('token-called', (data) => {
      console.log('📞 Token called:', data);
    });

    newSocket.on('token-completed', (data) => {
      console.log('✅ Token completed:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  // Enhanced emit function with error handling
  const emit = useCallback((event, data, callback) => {
    if (!socket || !isConnected) {
      console.error('❌ Cannot emit event: Socket not connected');
      if (callback) callback(new Error('Socket not connected'));
      return false;
    }

    try {
      console.log(`📤 Emitting event: ${event}`, data);
      if (callback) {
        socket.emit(event, data, callback);
      } else {
        socket.emit(event, data);
      }
      return true;
    } catch (error) {
      console.error(`❌ Error emitting event ${event}:`, error);
      if (callback) callback(error);
      return false;
    }
  }, [socket, isConnected]);

  // Enhanced event listener management
  const on = useCallback((event, callback) => {
    if (!socket) {
      console.error('❌ Cannot add listener: Socket not initialized');
      return () => {};
    }

    console.log(`📥 Adding listener for event: ${event}`);
    socket.on(event, callback);

    // Return cleanup function
    return () => {
      if (socket) {
        console.log(`📤 Removing listener for event: ${event}`);
        socket.off(event, callback);
      }
    };
  }, [socket]);

  // Remove specific event listener
  const off = useCallback((event, callback) => {
    if (!socket) {
      console.error('❌ Cannot remove listener: Socket not initialized');
      return;
    }

    console.log(`📤 Removing listener for event: ${event}`);
    socket.off(event, callback);
  }, [socket]);

  // Join specific room/channel
  const joinRoom = useCallback((roomId) => {
    if (!socket || !isConnected) {
      console.error('❌ Cannot join room: Socket not connected');
      return false;
    }

    try {
      console.log(`🚪 Joining room: ${roomId}`);
      socket.emit('join-room', roomId);
      return true;
    } catch (error) {
      console.error(`❌ Error joining room ${roomId}:`, error);
      return false;
    }
  }, [socket, isConnected]);

  // Leave specific room/channel
  const leaveRoom = useCallback((roomId) => {
    if (!socket || !isConnected) {
      console.error('❌ Cannot leave room: Socket not connected');
      return false;
    }

    try {
      console.log(`🚪 Leaving room: ${roomId}`);
      socket.emit('leave-room', roomId);
      return true;
    } catch (error) {
      console.error(`❌ Error leaving room ${roomId}:`, error);
      return false;
    }
  }, [socket, isConnected]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    if (!socket) {
      console.error('❌ Cannot reconnect: Socket not initialized');
      return false;
    }

    try {
      console.log('🔄 Manual reconnection attempt');
      socket.connect();
      return true;
    } catch (error) {
      console.error('❌ Manual reconnection failed:', error);
      return false;
    }
  }, [socket]);

  // Get connection status details
  const getConnectionDetails = useCallback(() => {
    if (!socket) {
      return {
        status: 'not_initialized',
        connected: false,
        id: null,
        reconnectAttempts
      };
    }

    return {
      status: connectionStatus,
      connected: isConnected,
      id: socket.id,
      reconnectAttempts,
      transport: socket.io?.engine?.transport?.name
    };
  }, [socket, isConnected, connectionStatus, reconnectAttempts]);

  const value = {
    // Core socket instance
    socket,
    
    // Connection status
    isConnected,
    connectionStatus,
    reconnectAttempts,
    
    // Enhanced methods
    emit,
    on,
    off,
    
    // Room management
    joinRoom,
    leaveRoom,
    
    // Connection management
    reconnect,
    getConnectionDetails,
    
    // Utility functions
    isInitialized: !!socket,
    
    // Quick status checkers
    isConnecting: connectionStatus === 'reconnecting',
    hasError: connectionStatus === 'error' || connectionStatus === 'failed',
    
    // Socket ID
    socketId: socket?.id
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Higher Order Component for socket connection status
export const withSocketStatus = (Component) => {
  return (props) => {
    const { isConnected, connectionStatus } = useSocket();
    
    return (
      <Component 
        {...props} 
        socketConnected={isConnected}
        socketStatus={connectionStatus}
      />
    );
  };
};

// Custom hook for specific event listening
export const useSocketEvent = (event, callback, dependencies = []) => {
  const { on, off } = useSocket();

  useEffect(() => {
    const cleanup = on(event, callback);
    return cleanup;
  }, [event, callback, on, ...dependencies]);
};

// Custom hook for joining rooms
export const useSocketRoom = (roomId) => {
  const { joinRoom, leaveRoom, isConnected } = useSocket();

  useEffect(() => {
    if (roomId && isConnected) {
      joinRoom(roomId);
      
      return () => {
        leaveRoom(roomId);
      };
    }
  }, [roomId, isConnected, joinRoom, leaveRoom]);
};

// Custom hook for connection status
export const useSocketConnection = () => {
  const { isConnected, connectionStatus, reconnectAttempts, reconnect } = useSocket();
  
  return {
    isConnected,
    status: connectionStatus,
    reconnectAttempts,
    reconnect,
    isOnline: isConnected && connectionStatus === 'connected',
    isOffline: !isConnected || connectionStatus === 'disconnected',
    isError: connectionStatus === 'error' || connectionStatus === 'failed',
    isReconnecting: connectionStatus === 'reconnecting'
  };
};