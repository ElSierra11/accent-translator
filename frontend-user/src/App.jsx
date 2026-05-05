import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { RecordScreen } from './pages/RecordScreen';

function App() {
  return (
    <GoogleOAuthProvider clientId="585325731605-5h19gko7sk42le3lc00brv3spr0uj2g4.apps.googleusercontent.com">
      <AuthProvider>
        <Toaster position="top-right" />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <RecordScreen />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
