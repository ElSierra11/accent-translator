import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { login, isAuthenticated, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  // If already authenticated, redirect
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" />;
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await apiService.login(username, password);
      
      if (data.success) {
        toast.success(`Bienvenido, ${data.username}`);
        login(data.token, data.role);
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          toast.error("Acceso denegado: Se requieren permisos de administrador.");
          navigate('/');
        }
      }
    } catch (err) {
      toast.error(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden font-body transition-colors duration-300">
      {/* Decorative Background */}
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-accent to-accent2 dark:from-accent/50 dark:to-background"></div>
      
      <button 
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 p-3 rounded-full bg-surface border border-border shadow-sm text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all z-20"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-surface rounded-[2rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-border backdrop-blur-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Admin Panel</h1>
          <p className="text-muted text-sm font-medium mt-1">Acceso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text ml-1">Usuario de Administración</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                <Mail size={18} />
              </div>
              <input 
                type="text" 
                placeholder="admin" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent border border-border rounded-xl text-text font-medium outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent border border-border rounded-xl text-text font-medium outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 mt-4 bg-accent hover:bg-accent2 text-white rounded-xl font-bold text-base transition-colors shadow-lg shadow-accent/30 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? 'Cargando...' : 'Acceder al Panel'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
