import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { Volume2, Mail, Lock, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
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
      let data;
      if (isRegistering) {
        data = await apiService.register(username, password);
        toast.success("Cuenta creada exitosamente");
      } else {
        data = await apiService.login(username, password);
        toast.success(`Bienvenido, ${data.username}`);
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
      toast.error(err.message || (isRegistering ? "Error al registrarse" : "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      // useGoogleLogin returns an access_token instead of credential if flow="implicit"
      // But we can also use flow="auth-code". 
      // Actually, since our backend expects an idToken, we might have an issue if useGoogleLogin returns accessToken.
      // We will fallback to the standard way if we need to, or use Google's credential from implicit flow.
      toast.error("El login personalizado de Google requiere configuración avanzada. Usa cuenta local por ahora.");
    } catch (err) {
      toast.error(err.message || "Error al autenticar con Google");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // With useGoogleLogin default flow, we get an access_token.
      // Our backend expects an ID Token. We would need to fetch userinfo.
      setLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        // This is a workaround since we modified the backend to expect Google ID token.
        // For now, we will simulate a register/login with the email as username.
        let data = await apiService.register(userInfo.email, userInfo.sub).catch(async () => {
          return await apiService.login(userInfo.email, userInfo.sub);
        });

        if (data.success) {
          toast.success("Login con Google exitoso");
          login(data.token, data.role);
          navigate('/');
        }
      } catch (err) {
        toast.error("Error al autenticar con Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Error al conectar con Google")
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden font-body transition-colors duration-300">
      {/* Premium Decorative Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-accent2/10 rounded-full blur-[100px] pointer-events-none"></div>

      <button
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 p-3 rounded-full bg-surface border border-border shadow-sm text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all z-20"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-surface border border-border rounded-[2rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Volume2 size={32} strokeWidth={2.5} />
            <h1 className="text-4xl font-extrabold tracking-tight">AccentShift</h1>
          </div>
          <p className="text-muted text-sm font-medium">Convierte texto a voz y voz a texto</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text ml-1">Correo electrónico / Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                <Mail size={18} />
              </div>
              <input
                type="text"
                placeholder="tu@correo.com"
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
            className="w-full py-3.5 mt-2 bg-accent hover:bg-accent2 text-white rounded-xl font-bold text-base transition-colors shadow-lg shadow-accent/30 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Crear cuenta' : 'Iniciar sesión')}
          </button>
        </form>

        <div className="my-8 flex items-center justify-center gap-4">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-xs text-muted font-medium bg-surface px-2">o continuar con</span>
          <div className="h-px bg-border flex-1"></div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => loginWithGoogle()}
            className="w-full py-3 bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text border border-border rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238598)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Google
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-muted">
          {isRegistering ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-accent font-semibold hover:underline"
          >
            {isRegistering ? "Inicia sesión" : "Crear cuenta"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
