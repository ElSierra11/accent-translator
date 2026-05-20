import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { RecordScreen } from './pages/RecordScreen';

const isBrowserSupported = () => {
  const hasRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const hasSynthesis = 'speechSynthesis' in window;
  return hasRecognition && hasSynthesis;
};

function App() {
  if (!isBrowserSupported()) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center font-body">
        <div className="bg-surface border border-red-500/30 p-8 rounded-2xl max-w-md shadow-lg flex flex-col items-center gap-4">
          <AlertCircle size={48} className="text-red-500" />
          <h1 className="text-2xl font-display font-bold text-text">Navegador No Compatible</h1>
          <p className="text-muted text-sm leading-relaxed">
            Esta aplicación requiere capacidades nativas de procesamiento de voz (Web Speech API) que no están disponibles en tu navegador actual.
          </p>
          <div className="mt-4 p-4 bg-background rounded-lg border border-border w-full">
            <p className="text-sm font-medium text-text mb-2">Te recomendamos usar:</p>
            <ul className="text-sm text-muted text-left list-disc list-inside">
              <li>Google Chrome (Recomendado)</li>
              <li>Microsoft Edge</li>
              <li>Safari (Versiones recientes)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId="585325731605-5h19gko7sk42le3lc00brv3spr0uj2g4.apps.googleusercontent.com">
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#27272a', color: '#fff', border: '1px solid #3f3f46' } }} />
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
