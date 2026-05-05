import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, RefreshCcw, LogOut, CheckCircle2, AlertCircle, Menu, X, History, MessageSquare } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export const RecordScreen = () => {
  const { logout } = useContext(AuthContext);
  const [accents, setAccents] = useState([]);
  const [selectedAccent, setSelectedAccent] = useState(null);
  const selectedAccentRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    selectedAccentRef.current = selectedAccent;
  }, [selectedAccent]);

  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState({ msg: 'Selecciona un acento y presiona grabar', type: 'idle' });
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const resultAudioRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accentsData, historyData] = await Promise.all([
          apiService.getEnabledAccents(),
          apiService.getConversionsHistory()
        ]);
        setAccents(accentsData);
        setHistory(historyData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      
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
          setFinalTranscript(prev => prev + finalT);
        }
        setTranscript(interimTranscript || finalT);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setStatus({ msg: "❌ Error de reconocimiento: " + event.error, type: "error" });
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsRecording(false);
        clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
      };
      
      recognitionRef.current = recognition;
    } else {
      setStatus({ msg: "⚠️ Tu navegador no soporta Web Speech API. Usa Chrome o Edge.", type: "error" });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timer >= 60 && isRecording) {
      stopRecording();
    }
  }, [timer, isRecording]);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0ea5e9";
      ctx.shadowColor = "#0ea5e9";
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  };

  const startRecording = async () => {
    if (!selectedAccent) {
      setStatus({ msg: "⚠️ Selecciona un acento primero", type: "warning" });
      return;
    }
    if (!recognitionRef.current) {
      setStatus({ msg: "⚠️ Reconocimiento de voz no soportado", type: "error" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      setFinalTranscript('');
      setTranscript('');
      setAudioUrl(null);
      
      recognitionRef.current.start();
      setIsRecording(true);
      setTimer(0);
      
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

      setStatus({ msg: "🔴 Grabando... habla ahora", type: "recording" });
      
      setTimeout(() => drawWaveform(), 100);
    } catch (err) {
      setStatus({ msg: "❌ Error al acceder al micrófono: " + err.message, type: "error" });
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();

    setFinalTranscript(currentFinal => {
      if (currentFinal.trim() !== '') {
        setStatus({ msg: "⏳ Generando audio en el servidor...", type: "loading" });
        synthesizeAndShowResult(currentFinal);
      } else {
        const testText = "Hola, esta es una prueba de acento. Al parecer tu micrófono no detectó audio, pero así sueno.";
        setStatus({ msg: "⚠️ No se detectó audio, usando texto de prueba...", type: "warning" });
        synthesizeAndShowResult(testText);
      }
      return currentFinal;
    });
  };

  const synthesizeAndShowResult = async (text) => {
    const currentAccent = selectedAccentRef.current;
    if (!currentAccent) {
      setStatus({ msg: "❌ Error: Ningún acento seleccionado", type: "error" });
      return;
    }

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
        if (resultAudioRef.current) {
          resultAudioRef.current.src = data.audioUrl;
          resultAudioRef.current.play().catch(e => console.error(e));
        }
        setStatus({ msg: `✅ ¡Listo! Reproduciendo acento ${currentAccent.name}`, type: "success" });
        
        // Actualizar historial
        const newHistoryItem = {
          id: data.id || Date.now(),
          date: new Date().toISOString(),
          text: text,
          accent: currentAccent.name,
          audio_filename: data.audioUrl.split('/').pop()
        };
        setHistory(prev => [newHistoryItem, ...prev]);
        
      } else {
        throw new Error("No audio url returned");
      }
    } catch (err) {
      setStatus({ msg: "❌ " + err.message, type: "error" });
    }
  };

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-background text-text font-body flex relative overflow-hidden">
      
      {/* Sidebar Historial */}
      <div className={`fixed inset-y-0 left-0 z-20 w-80 bg-surface border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2 font-display font-bold">
            <History className="text-accent" size={20} /> Historial
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-muted hover:text-text rounded">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center text-muted text-sm mt-10">
              No tienes conversiones aún.<br/>¡Empieza a grabar!
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-black/20 border border-white/5 p-3 rounded-xl hover:border-white/10 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded font-bold">{item.accent}</span>
                    <span className="text-[10px] text-muted font-mono">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-text/80 line-clamp-2 italic mb-3 flex gap-2">
                    <MessageSquare size={14} className="mt-0.5 text-muted shrink-0" />
                    "{item.text}"
                  </p>
                  <audio src={`/uploads/${item.audio_filename}`} controls className="h-7 w-full custom-audio scale-90 origin-left" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-10 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Header */}
        <header className="w-full flex justify-between items-center p-6 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-muted hover:text-text bg-surface rounded-lg border border-border"
            >
              <Menu size={20} />
            </button>
            <div className="font-display text-xl font-extrabold tracking-tight">
              Accent<span className="bg-clip-text text-transparent bg-gradient-to-br from-accent to-accent2">Shift</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg border border-border transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Salir
          </button>
        </header>

        {/* Main Recording Content */}
        <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center py-10 px-6">
          <h1 className="text-3xl font-display font-bold mb-2">Selecciona un Acento</h1>
          <p className="text-muted mb-8 text-center max-w-md">Elige cómo quieres sonar y graba tu voz.</p>
          
          {loading ? (
            <div className="text-muted animate-pulse">Cargando acentos...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full mb-10">
              {accents.map(accent => (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={accent.id}
                  onClick={() => setSelectedAccent(accent)}
                  className={`p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 border transition-all ${selectedAccent?.id === accent.id ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'bg-surface border-border hover:bg-surface-hover'}`}
                >
                  <img src={accent.flag} alt={accent.country} className="w-10 rounded shadow-sm" />
                  <span className="font-bold text-sm text-center">{accent.name}</span>
                  <span className="text-xs text-muted text-center">{accent.description}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Recorder Section */}
          <div className="w-full bg-surface border border-border rounded-3xl p-8 flex flex-col items-center mb-10 relative overflow-hidden">
            {/* Status Bar */}
            <div className={`w-full p-3 rounded-xl mb-8 flex items-center justify-center gap-2 font-medium transition-colors text-sm ${
              status.type === 'recording' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              status.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              status.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              status.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              'bg-black/30 text-muted border border-border'
            }`}>
              {status.type === 'success' && <CheckCircle2 size={16} />}
              {status.type === 'error' && <AlertCircle size={16} />}
              {status.msg}
            </div>

            {/* Visualization area */}
            <div className="w-full h-32 bg-black/40 rounded-xl mb-8 border border-white/5 relative overflow-hidden flex items-center justify-center">
              {isRecording ? (
                <canvas ref={canvasRef} className="w-full h-full absolute inset-0"></canvas>
              ) : (
                <span className="text-muted/50 text-5xl font-display opacity-20">00:00</span>
              )}
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-mono text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse">
                  {formatTime(timer)}
                </div>
              )}
            </div>

            <div className="text-center text-base font-medium min-h-[3rem] mb-8 w-full px-4">
              {isRecording ? <span className="text-accent">{transcript}</span> : <span className="text-muted">La transcripción aparecerá aquí...</span>}
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 shadow-[0_4px_20px_rgba(239,68,68,0.4)] animate-pulse-btn' 
                  : 'bg-gradient-to-br from-accent to-accent2 hover:scale-105 shadow-[0_10px_25px_rgba(14,165,233,0.4)]'
              } text-white`}
            >
              {isRecording ? (
                <>
                  <Square fill="currentColor" size={24} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Detener</span>
                </>
              ) : (
                <>
                  <Mic size={28} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Grabar</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {audioUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full bg-surface border border-accent/30 rounded-3xl p-6 sm:p-8 mb-10 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent2"></div>
                <h2 className="text-lg sm:text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <img src={selectedAccent?.flag} alt="" className="w-6 rounded" />
                  Tu voz en {selectedAccent?.name}
                </h2>
                
                <div className="bg-black/30 p-4 rounded-xl text-base sm:text-lg mb-6 border border-white/5 font-medium italic text-text/90">
                  "{finalTranscript || 'Texto de prueba...'}"
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <audio ref={resultAudioRef} src={audioUrl} controls className="flex-1 w-full h-12 outline-none rounded-lg custom-audio" />
                  <button 
                    onClick={() => {
                      setAudioUrl(null);
                      setFinalTranscript('');
                      setTranscript('');
                      setStatus({ msg: 'Selecciona un acento y presiona grabar', type: 'idle' });
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-surface hover:bg-surface-hover border border-border rounded-xl font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <RefreshCcw size={18} /> Otra vez
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
