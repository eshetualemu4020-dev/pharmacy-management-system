import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';

import CustomerDashboard from './pages/customer/CustomerDashboard';

import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  useEffect(() => {
    const handleAuthExpired = () => {
      alert('Your session has expired or is invalid. Please log in again to continue.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  return (
    <ThemeProvider>
      <Router>
      <Routes>
        {/* Root redirects to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Dashboards */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/pharmacist/*" element={
          <ProtectedRoute allowedRoles={['pharmacist']}>
            <ErrorBoundary>
              <PharmacistDashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/customer/*" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <ErrorBoundary>
              <CustomerDashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
