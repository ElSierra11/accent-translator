import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { AdminPanel } from './pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router basename="/admin">
        <Routes>
          <Route path="/login" element={<Login isAdminApp={true} />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
