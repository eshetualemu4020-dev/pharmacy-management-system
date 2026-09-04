import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';

import CustomerDashboard from './pages/customer/CustomerDashboard';

import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

function App() {
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
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/pharmacist/*" element={
          <ProtectedRoute allowedRoles={['pharmacist']}>
            <PharmacistDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer/*" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
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
