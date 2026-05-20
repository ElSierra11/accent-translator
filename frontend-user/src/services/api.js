import { ACCENTS } from '../utils/accents';

const getHeaders = () => {
  const token = localStorage.getItem('accentshift_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const fetchWithAuth = async (url, options = {}) => {
  const headers = { ...getHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('accentshift_token');
    localStorage.removeItem('accentshift_role');
    window.location.href = '/login';
    throw new Error("Sesión expirada. Por favor inicia sesión de nuevo.");
  }
  
  return res;
};

export const apiService = {
  async login(username, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
    return data;
  },

  async register(username, password) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrarse");
    return data;
  },

  async googleAuth(credential) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Autenticación de Google fallida");
    return data;
  },

  async getEnabledAccents() {
    const res = await fetch('/api/accents');
    if (!res.ok) throw new Error("Error fetching enabled accents");
    const enabledIds = await res.json();
    if (enabledIds && Array.isArray(enabledIds)) {
      return ACCENTS.filter(a => enabledIds.includes(a.id));
    }
    return ACCENTS;
  },

  async getConfig() {
    const res = await fetchWithAuth('/api/config');
    if (!res.ok) throw new Error("Error loading config");
    return await res.json();
  },

  async saveConfig(configData) {
    const res = await fetchWithAuth('/api/config', {
      method: 'POST',
      body: JSON.stringify(configData)
    });
    if (!res.ok) throw new Error("Error saving config");
    return await res.json();
  },

  async getConversionsHistory() {
    const res = await fetchWithAuth('/api/conversions');
    if (!res.ok) throw new Error("Error fetching history");
    return await res.json();
  },

  async createConversion(conversionData) {
    const res = await fetchWithAuth('/api/conversions', {
      method: 'POST',
      body: JSON.stringify(conversionData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error en el servidor");
    return data;
  }
};
