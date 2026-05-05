import { ACCENTS } from '../utils/accents';

const getHeaders = () => {
  const token = localStorage.getItem('accentshift_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
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
    const res = await fetch('/api/config', { headers: getHeaders() });
    if (!res.ok) throw new Error("Error loading config");
    return await res.json();
  },

  async saveConfig(configData) {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(configData)
    });
    if (!res.ok) throw new Error("Error saving config");
    return await res.json();
  },

  async getConversionsHistory() {
    const res = await fetch('/api/conversions', { headers: getHeaders() });
    if (!res.ok) throw new Error("Error fetching history");
    return await res.json();
  },

  async getAdminUsers() {
    const res = await fetch('/api/admin/users', { headers: getHeaders() });
    if (!res.ok) throw new Error("Error fetching users");
    return await res.json();
  },

  async getAdminUserConversions(userId) {
    const res = await fetch(`/api/admin/users/${userId}/conversions`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Error fetching user conversions");
    return await res.json();
  },

  async getAdminStats() {
    const res = await fetch('/api/admin/stats', { headers: getHeaders() });
    if (!res.ok) throw new Error("Error fetching stats");
    return await res.json();
  },

  async createConversion(conversionData) {
    const res = await fetch('/api/conversions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(conversionData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error en el servidor");
    return data;
  }
};
