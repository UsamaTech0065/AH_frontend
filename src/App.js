import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import TicketDispenser from './pages/TicketDispenser';
import WaitingArea from './pages/WaitingArea';
import CounterInterface from './pages/CounterInterface';
import CounterSelection from './pages/CounterSelection'; // New component
import DisplayScreen from './pages/DisplayScreen';
import ReceptionDisplay from './pages/ReceptionDisplay';
import DepartmentDisplay from './pages/DepartmentDisplay';
import IndividualWaitingScreen from './pages/IndividualWaitingScreen';
import UniversalLogin from './components/UniversalLogin';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Component-specific login routes */}
                  <Route path="/login/admin" element={<UniversalLogin component="admin" />} />
                  <Route path="/login/counter" element={<UniversalLogin component="counter" />} />
                  <Route path="/login/dispenser" element={<UniversalLogin component="dispenser" />} />
                  <Route path="/login/waiting" element={<UniversalLogin component="waiting" />} />
                  <Route path="/login/display" element={<UniversalLogin component="display" />} />
                  
                  {/* Default login redirect */}
                  <Route path="/login" element={<Navigate to="/login/admin" replace />} />
                  
                  {/* Protected routes with component-specific authentication */}
                  <Route 
                    path="/admin/*" 
                    element={
                      <ProtectedRoute component="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Counter Selection Route */}
                  <Route 
                    path="/counter/select" 
                    element={
                      <ProtectedRoute component="counter">
                        <CounterSelection />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Individual Counter Route */}
                  <Route 
                    path="/counter/:counterId" 
                    element={
                      <ProtectedRoute component="counter">
                        <CounterInterface />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/dispenser" 
                    element={
                      <ProtectedRoute component="dispenser">
                        <TicketDispenser />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/waiting/:displayId?" 
                    element={
                      <ProtectedRoute component="waiting">
                        <WaitingArea />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/display/:displayId" 
                    element={
                      <ProtectedRoute component="display">
                        <DisplayScreen />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Public routes - No authentication required */}
                  <Route path="/reception/:displayId?" element={<ReceptionDisplay />} />
                  <Route path="/department/:deptCode" element={<DepartmentDisplay />} />
                  <Route path="/waiting/counter/:counterId" element={<IndividualWaitingScreen />} />
                  
                  {/* Redirects */}
                  <Route path="/" element={<Navigate to="/login/admin" replace />} />
                  <Route path="*" element={<Navigate to="/login/admin" replace />} />
                </Routes>
              </div>
            </Router>
          </SocketProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;