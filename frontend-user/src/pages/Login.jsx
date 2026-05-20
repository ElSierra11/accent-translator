import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  // If already authenticated, redirect
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" />;
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Por favor completa todos los campos", { style: { background: '#0c0d12', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }});
      return;
    }

    setLoading(true);

    try {
      let data;
      if (isRegistering) {
        data = await apiService.register(username, password);
        toast.success("Cuenta creada exitosamente", { style: { background: '#0c0d12', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }});
      } else {
        data = await apiService.login(username, password);
        toast.success(`Bienvenido, ${data.username}`, { style: { background: '#0c0d12', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }});
      }

      if (data.success) {
        login(data.token, data.role);
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      toast.error(err.message || (isRegistering ? "Error al registrarse" : "Error al iniciar sesión"), { style: { background: '#7f1d1d', color: '#fff', border: '1px solid #991b1b' }});
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        let data = await apiService.register(userInfo.email, userInfo.sub).catch(async () => {
          return await apiService.login(userInfo.email, userInfo.sub);
        });

        if (data.success) {
          toast.success("Autenticado con Google", { style: { background: '#0c0d12', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }});
          login(data.token, data.role);
          navigate('/');
        }
      } catch (err) {
        toast.error("Error de autenticación", { style: { background: '#7f1d1d', color: '#fff', border: '1px solid #991b1b' }});
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Error de conexión", { style: { background: '#7f1d1d', color: '#fff', border: '1px solid #991b1b' }})
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden font-body text-text">
      {/* Background Orbs */}
      <div className="orb-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md glass-panel p-8 mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            {/* Custom Sleek Logo - Professional Soundwaves */}
            <svg className="w-9 h-9 text-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M8 6V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M12 3V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 6V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M20 10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-text via-text to-muted bg-clip-text text-transparent">
              AccentShift
            </h1>
          </div>
          <p className="text-muted text-xs uppercase tracking-widest font-semibold">
            Plataforma de Síntesis Neuronal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wider opacity-85">Correo electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Mail size={16} />
              </div>
              <input
                type="text"
                placeholder="nombre@empresa.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-background/60 border border-white/5 rounded-xl text-text text-sm outline-none transition-all focus:border-accent focus:bg-background/90 focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wider opacity-85">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-background/60 border border-white/5 rounded-xl text-text text-sm outline-none transition-all focus:border-accent focus:bg-background/90 focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-3 bg-gradient-to-r from-accent to-accent2 hover:opacity-95 active:scale-[0.99] text-white rounded-xl font-semibold text-sm transition-all shadow-[0_4px_20px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.35)] disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar sesión')}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center gap-4">
          <div className="h-px bg-white/5 flex-1"></div>
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest">O</span>
          <div className="h-px bg-white/5 flex-1"></div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => loginWithGoogle()}
            className="w-full py-2.5 bg-background/40 hover:bg-background/90 text-text border border-white/5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 hover:border-white/10 active:scale-[0.99]"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238598)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-muted">
          {isRegistering ? "¿Ya tienes una cuenta? " : "¿No tienes cuenta? "}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-text font-bold hover:text-accent transition-colors underline underline-offset-4"
          >
            {isRegistering ? "Iniciar sesión" : "Solicitar acceso"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
