import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, RefreshCcw, LogOut, CheckCircle2, History, X } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { ACCENTS } from '../utils/accents';
import { CustomAudioPlayer } from '../components/CustomAudioPlayer';

export const RecordScreen = () => {
  const { logout } = useContext(AuthContext);
  const [accents, setAccents] = useState(ACCENTS);
  const [selectedAccent, setSelectedAccent] = useState(ACCENTS[0]);
  const selectedAccentRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    selectedAccentRef.current = selectedAccent;
  }, [selectedAccent]);

  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState({ msg: 'Selecciona una voz y comienza', type: 'idle' });
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const latestTranscriptRef = useRef('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await apiService.getConversionsHistory();
        setHistory(historyData);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    
    // Helper to get general base language for maximum Web Speech compatibility on mobile
    const getBaseLanguage = (locale) => {
      if (!locale) return 'es';
      return locale.split('-')[0]; // Returns 'es', 'en', 'pt', etc.
    };

    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es';
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalT = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalT += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalT) {
          const accumulated = (recognitionRef.current.accumulatedFinal || '') + finalT;
          recognitionRef.current.accumulatedFinal = accumulated;
          setFinalTranscript(accumulated);
        }
        
        const currentAccumulated = recognitionRef.current.accumulatedFinal || '';
        const currentFullText = (currentAccumulated + ' ' + interimTranscript).trim();
        
        latestTranscriptRef.current = currentFullText;
        setTranscript(interimTranscript || finalT);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error/warning:", event.error);
        
        // Critical: Mobile browsers frequently trigger 'no-speech' or 'aborted' during silences.
        // We MUST ignore them to keep the recording active instead of crashing.
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        setStatus({ msg: "Error de reconocimiento: " + event.error, type: "error" });
        isRecordingRef.current = false;
        setIsRecording(false);
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
        }
        clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
      };

      recognition.onend = () => {
        console.log("Speech recognition ended. activeState:", isRecordingRef.current);
        // On mobile, the recognition engine often times out or suspends.
        // If the user hasn't pressed stop, we auto-restart the listener immediately.
        if (isRecordingRef.current) {
          try {
            recognition.start();
            console.log("Speech recognition engine auto-restarted successfully");
          } catch (err) {
            console.error("Failed to auto-restart speech recognition:", err);
          }
        }
      };
      
      recognitionRef.current = recognition;
    } else {
      setStatus({ msg: "Tu navegador no soporta Web Speech API. Usa Chrome.", type: "error" });
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timer >= 60 && isRecording) stopRecording();
  }, [timer, isRecording]);

  const drawWaveform = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let phase = 0;

    const draw = () => {
      if (!isRecordingRef.current) return;
      animFrameRef.current = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const themeColor = selectedAccentRef.current?.color || '#3b82f6';
      
      // Create glowing linear gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, themeColor);
      gradient.addColorStop(0.5, '#6366f1');
      gradient.addColorStop(1, themeColor);

      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      
      // Custom shadow glow effect
      ctx.shadowBlur = 12;
      ctx.shadowColor = themeColor;
      
      ctx.beginPath();

      const points = 100;
      const sliceWidth = canvas.width / points;
      phase += 0.18; // Speed of movement

      // Draw first glowing fluid wave
      for (let i = 0; i <= points; i++) {
        const x = i * sliceWidth;
        const edgeFactor = Math.sin((i / points) * Math.PI); // Fades out at the edges
        const y = (canvas.height / 2) + 
          (Math.sin(i * 0.15 + phase) * 22 * edgeFactor) + 
          (Math.cos(i * 0.08 - phase * 0.5) * 11 * edgeFactor);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw a second, thinner, out-of-phase wave for multi-layered depth
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      for (let i = 0; i <= points; i++) {
        const x = i * sliceWidth;
        const edgeFactor = Math.sin((i / points) * Math.PI);
        const y = (canvas.height / 2) - 
          (Math.sin(i * 0.22 + phase * 1.3) * 16 * edgeFactor) - 
          (Math.cos(i * 0.06 - phase * 0.7) * 9 * edgeFactor);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Reset shadow for performance
      ctx.shadowBlur = 0;
    };
    draw();
  };

  const startRecording = async () => {
    if (!selectedAccent) {
      setStatus({ msg: "Selecciona un acento primero", type: "warning" });
      return;
    }
    if (!recognitionRef.current) return;

    if (recognitionRef.current) {
      // Map to base language code (e.g. es, en, pt) to ensure max mobile support
      const baseLang = selectedAccent.locale ? selectedAccent.locale.split('-')[0] : 'es';
      recognitionRef.current.lang = baseLang;
    }

    try {
      setFinalTranscript('');
      setTranscript('');
      latestTranscriptRef.current = '';
      if (recognitionRef.current) recognitionRef.current.accumulatedFinal = '';
      setAudioUrl(null);
      
      isRecordingRef.current = true;
      setIsRecording(true);
      recognitionRef.current.start();
      setTimer(0);
      
      timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
      setStatus({ msg: "Escuchando... habla ahora", type: "recording" });
      setTimeout(() => drawWaveform(), 100);
    } catch (err) {
      isRecordingRef.current = false;
      setIsRecording(false);
      setStatus({ msg: "Error de micrófono: " + err.message, type: "error" });
    }
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e) {}
    }
    
    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const currentFinal = latestTranscriptRef.current;
    
    if (currentFinal.trim() !== '') {
      setStatus({ msg: "Procesando transcripción en servidor...", type: "loading" });
      setFinalTranscript(currentFinal);
      setTranscript('');
      synthesizeAndShowResult(currentFinal);
    } else {
      const testText = "Hola, esta es una prueba generada. No detecté audio.";
      setStatus({ msg: "Generando texto de prueba...", type: "warning" });
      setFinalTranscript(testText);
      setTranscript('');
      synthesizeAndShowResult(testText);
    }
  };

  const synthesizeAndShowResult = async (text) => {
    const currentAccent = selectedAccentRef.current;
    if (!currentAccent) return;

    try {
      const data = await apiService.createConversion({
        text,
        accentId: currentAccent.id,
        accentName: currentAccent.name,
        locale: currentAccent.locale,
        voice: currentAccent.voice
      });
      
      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        
        // Autoplay the result cleanly
        const autoplayAudio = new Audio(data.audioUrl);
        autoplayAudio.play().catch(e => console.error("Error autplaying audio:", e));
        
        setStatus({ msg: `Voz generada: ${currentAccent.name}`, type: "success" });
        
        const newHistoryItem = {
          id: data.id || Date.now(),
          date: new Date().toISOString(),
          text: text,
          accent: currentAccent.name,
          audio_filename: data.audioUrl.split('/').pop()
        };
        setHistory(prev => [newHistoryItem, ...prev]);
        
      } else throw new Error("Audio URL no devuelta por el servidor");
    } catch (err) {
      console.error(err);
      setStatus({ msg: err.message || "Error al conectar con el servidor", type: "error" });
    }
  };

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-background text-text font-body flex relative overflow-hidden">
      {/* Background Orbs */}
      <div className="orb-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Sidebar Historial */}
      <div className={`fixed inset-y-0 right-0 z-30 w-80 bg-surface/85 border-l border-border transform transition-transform duration-500 ease-in-out flex flex-col backdrop-blur-2xl ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-3 font-display font-semibold text-lg text-text">
            <History className="text-muted" size={20} /> Historial
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-muted hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-muted/70 text-sm mt-10">
              Sin registros recientes.
            </div>
          ) : (
            history.map((item) => (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={item.id} className="bg-background/60 border border-border p-4 rounded-xl hover:border-accent/40 transition-all duration-300 group">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs text-accent font-bold tracking-wide uppercase">{item.accent}</span>
                </div>
                <p className="text-sm text-text/80 line-clamp-2 mb-3.5 font-medium italic">
                  "{item.text}"
                </p>
                <CustomAudioPlayer src={`/uploads/${item.audio_filename}`} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Overlay for Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        
        {/* Header */}
        <header className="w-full flex justify-between items-center p-6 lg:px-8 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {/* Custom Soundwaves Logo */}
            <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M8 6V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M12 3V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 6V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M20 10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="font-display text-xl font-bold tracking-tight text-text">
              AccentShift
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-white/5 bg-surface/50 hover:bg-white/5 rounded-xl transition-all text-sm font-semibold"
            >
              <History size={16} /> <span className="hidden sm:inline">Historial</span>
            </button>
            <button 
              onClick={logout}
              className="p-2.5 border border-white/5 bg-surface/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-xl transition-all active:scale-95"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Main Interface */}
        <main className="w-full max-w-5xl mx-auto flex-1 flex flex-col items-center py-10 px-4 sm:px-6">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-3 bg-gradient-to-r from-text via-text to-muted bg-clip-text text-transparent">
              Conversión de Voz
            </h1>
            <p className="text-muted max-w-lg mx-auto text-sm font-medium">
              Selecciona una variante idiomática y procesa tu audio.
            </p>
          </div>
          
          {/* Accent Carousel */}
          <div className="w-full mb-8">
            {loading ? (
              <div className="flex gap-4 justify-center animate-pulse overflow-hidden">
                {[1,2,3,4].map(i => <div key={i} className="w-44 h-28 bg-surface border border-border rounded-xl"></div>)}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar snap-x scroll-smooth">
                {accents.map(accent => {
                  const isSelected = selectedAccent?.id === accent.id;
                  return (
                    <button
                      key={accent.id}
                      onClick={() => setSelectedAccent(accent)}
                      style={isSelected ? {
                        borderColor: accent.color,
                        color: accent.color,
                        boxShadow: `0 0 15px ${accent.color}25`,
                        background: `${accent.color}08`
                      } : {}}
                      className={`snap-center shrink-0 w-44 p-4 rounded-xl flex flex-col items-center gap-3.5 transition-all duration-300 ${
                        isSelected 
                        ? 'ring-1 ring-offset-0' 
                        : 'bg-surface/50 border-border text-text hover:border-white/10 hover:bg-surface'
                      } border`}
                    >
                      <div className="w-12 h-12 rounded-full bg-background/50 border border-white/5 flex items-center justify-center shadow-inner overflow-hidden">
                        <img 
                          src={accent.flag} 
                          alt={accent.country} 
                          className="w-full h-full object-cover opacity-95 scale-105"
                          onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                      </div>
                      <div className="text-center w-full">
                        <div className="font-bold text-sm truncate w-full" title={accent.name}>{accent.name}</div>
                        <div className="text-[9px] text-muted font-mono uppercase tracking-wider mt-1">{accent.locale}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Core Recording Interface */}
          <div className="relative w-full max-w-xl glass-panel p-8 md:p-10 flex flex-col items-center">
            
            {/* Status Bar */}
            <div className="w-full flex justify-center mb-6">
              <div className={`px-4.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 ${
                status.type === 'recording' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.08)]' :
                status.type === 'success' ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(59,130,246,0.08)]' :
                status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                status.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-background border border-border text-muted'
              }`}>
                {status.type === 'recording' && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>}
                {status.msg}
              </div>
            </div>

            {/* Glowing Record Button */}
            <div className="mb-6 relative flex justify-center items-center h-44 w-44">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-500/5 animate-ping border border-red-500/10"></div>
              )}
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  isRecording 
                    ? 'bg-background/90 border-2 border-red-500/30 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)] active:scale-95' 
                    : 'bg-gradient-to-r from-accent to-accent2 text-white shadow-[0_4px_25px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_30px_rgba(59,130,246,0.45)] hover:scale-105 active:scale-95'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square fill="currentColor" size={20} className="text-red-500" />
                    <span className="text-xs font-bold font-mono text-red-400">{formatTime(timer)}</span>
                  </>
                ) : (
                  <>
                    <Mic size={26} fill="currentColor" />
                  </>
                )}
              </button>
            </div>

            {/* Canvas Visualizer */}
            <div className="w-full h-20 bg-background/55 rounded-2xl border border-border relative overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}></canvas>
              {!isRecording && <div className="text-muted/40 font-mono text-xs uppercase tracking-widest font-bold">Inactivo</div>}
            </div>

            {/* Live Transcript */}
            <div className="mt-8 text-center min-h-[4rem] w-full px-4 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={transcript || 'empty'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`text-base font-semibold leading-relaxed ${isRecording ? 'text-text' : 'text-muted'}`}
                >
                  {transcript || (isRecording ? 'Escuchando...' : '')}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Synthesized Result */}
          <AnimatePresence>
            {audioUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-xl mt-6 bg-surface/50 border border-border rounded-2xl p-6 relative overflow-hidden shadow-xl backdrop-blur-md"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
                    <CheckCircle2 size={15} /> Transcripción procesada
                  </div>
                  <div className="text-text/90 font-medium bg-background/40 p-4 rounded-xl border border-border text-sm leading-relaxed italic">
                    "{finalTranscript}"
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center mt-1">
                    <div className="w-full flex-1">
                      <CustomAudioPlayer src={audioUrl} />
                    </div>
                    
                    <button 
                      onClick={() => {
                        setAudioUrl(null);
                        setFinalTranscript('');
                        setTranscript('');
                        latestTranscriptRef.current = '';
                        setStatus({ msg: 'Listo', type: 'idle' });
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-background hover:bg-white/5 border border-border rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm text-text whitespace-nowrap active:scale-95"
                    >
                      <RefreshCcw size={16} /> Limpiar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
