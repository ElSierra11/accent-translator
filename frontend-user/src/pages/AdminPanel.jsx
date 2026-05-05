import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Activity, Settings, List } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { ACCENTS } from '../utils/accents';

export const AdminPanel = () => {
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('config');
  const [enabledIds, setEnabledIds] = useState([]);
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [voiceMapping, setVoiceMapping] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'config') {
        const config = await apiService.getConfig();
        setEnabledIds(config.enabledIds || ACCENTS.map(a => a.id));
        setElevenLabsKey(config.elevenlabs_api_key || '');
        setVoiceMapping(config.voiceMapping || {});
      } else {
        const historyData = await apiService.getConversionsHistory();
        setHistory(historyData);
      }
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const toggleAccent = async (id) => {
    const newEnabled = enabledIds.includes(id) 
      ? enabledIds.filter(eId => eId !== id)
      : [...enabledIds, id];
    
    setEnabledIds(newEnabled);
    try {
      await apiService.saveConfig({ enabledIds: newEnabled });
    } catch (err) {
      showMessage('Error al guardar configuración de acentos', 'error');
    }
  };

  const handleVoiceChange = (id, val) => {
    setVoiceMapping(prev => ({ ...prev, [id]: val }));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await apiService.saveConfig({
        elevenlabsApiKey: elevenLabsKey,
        voiceMapping: voiceMapping
      });
      showMessage('Configuración guardada correctamente', 'success');
    } catch (err) {
      showMessage('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text font-body">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted hover:text-text">
              <ArrowLeft size={20} />
            </Link>
            <div className="font-display text-xl font-bold">Panel de Control</div>
          </div>
          <button 
            onClick={logout}
            className="text-sm font-medium text-muted hover:text-text px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === 'config' 
                  ? 'bg-accent/10 text-accent border border-accent/20' 
                  : 'text-muted hover:text-text hover:bg-white/5 border border-transparent'
              }`}
            >
              <Settings size={18} /> Configuración
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === 'history' 
                  ? 'bg-accent/10 text-accent border border-accent/20' 
                  : 'text-muted hover:text-text hover:bg-white/5 border border-transparent'
              }`}
            >
              <Activity size={18} /> Historial
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-surface border border-border rounded-3xl p-8 min-h-[600px]">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
              message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
            }`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full text-muted">Cargando datos...</div>
          ) : activeTab === 'config' ? (
            <div className="space-y-10 animate-fade-in">
              <section>
                <h2 className="text-xl font-display font-bold mb-4">Configuración General</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted mb-2 font-medium">ElevenLabs API Key</label>
                    <input 
                      type="password"
                      value={elevenLabsKey}
                      onChange={e => setElevenLabsKey(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl font-mono text-sm focus:border-accent outline-none transition-colors focus:bg-black/50"
                      placeholder="sk_..."
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-display font-bold mb-4 flex items-center justify-between">
                  Gestión de Acentos
                  <button 
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)] hover:-translate-y-0.5 disabled:opacity-70"
                  >
                    <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Todo'}
                  </button>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {ACCENTS.map(accent => {
                    const isEnabled = enabledIds.includes(accent.id);
                    return (
                      <div key={accent.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <img src={accent.flag} alt="" className="w-8 rounded" />
                            <div>
                              <div className="font-bold">{accent.name}</div>
                              <div className="text-xs text-muted font-mono">{accent.locale}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleAccent(accent.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                              isEnabled 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-white/5 text-muted border-white/10'
                            }`}
                          >
                            {isEnabled ? 'Habilitado' : 'Deshabilitado'}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                          <span className="text-xs text-muted whitespace-nowrap pl-2">Voice ID:</span>
                          <input 
                            type="text" 
                            value={voiceMapping[accent.id] || ''}
                            onChange={e => handleVoiceChange(accent.id, e.target.value)}
                            placeholder="Ej: pNInz6obpgDQGcFmaJgB"
                            className="flex-1 bg-transparent border-none text-sm font-mono outline-none px-2"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="animate-fade-in overflow-x-auto">
              <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <List size={20} className="text-accent" /> Últimas Conversiones
              </h2>
              {history.length === 0 ? (
                <div className="text-muted text-center py-10 bg-black/20 rounded-xl border border-white/5">No hay historial de conversiones.</div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="py-3 px-4 font-medium">ID</th>
                      <th className="py-3 px-4 font-medium">Fecha</th>
                      <th className="py-3 px-4 font-medium">Acento</th>
                      <th className="py-3 px-4 font-medium">Texto</th>
                      <th className="py-3 px-4 font-medium">Audio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(row => (
                      <tr key={row.id} className="border-b border-border hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-muted font-mono text-xs">{row.id}</td>
                        <td className="py-3 px-4 text-muted whitespace-nowrap">{new Date(row.date).toLocaleString()}</td>
                        <td className="py-3 px-4 font-medium">{row.accent}</td>
                        <td className="py-3 px-4 max-w-xs truncate" title={row.text}>{row.text}</td>
                        <td className="py-3 px-4">
                          <audio src={`/uploads/${row.audio_filename}`} controls className="h-8 w-48 custom-audio" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
