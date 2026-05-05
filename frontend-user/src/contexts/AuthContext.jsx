import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accentshift_token');
    const role = localStorage.getItem('accentshift_role');
    
    if (token) {
      setUser({ token, role });
    }
    
    setLoading(false);
  }, []);

  const login = (token, role) => {
    localStorage.setItem('accentshift_token', token);
    localStorage.setItem('accentshift_role', role);
    setUser({ token, role });
  };

  const logout = () => {
    localStorage.removeItem('accentshift_token');
    localStorage.removeItem('accentshift_role');
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-text font-display">Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};
