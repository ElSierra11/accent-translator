import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

export const CustomAudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    // If source changes, reset player
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      setIsPlaying(true);
    }
  };

  const handleSliderChange = (e) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full flex flex-col gap-2 p-3 bg-surface/50 border border-border rounded-xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.1)] active:scale-95"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Progress Timeline */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="relative w-full group">
            {/* Custom Track Background */}
            <div className="absolute inset-y-0 left-0 h-1.5 w-full bg-border rounded-full pointer-events-none mt-1.5"></div>
            {/* Active Colored Progress */}
            <div 
              className="absolute inset-y-0 left-0 h-1.5 bg-gradient-to-r from-accent to-accent2 rounded-full pointer-events-none mt-1.5"
              style={{ width: `${progressPercent}%` }}
            ></div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSliderChange}
              className="absolute inset-w-0 w-full h-1.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity mt-1.5"
            />
            {/* Visual representation of range for cross-browser consistency */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-1.5 cursor-pointer accent-accent bg-transparent relative z-10 opacity-100"
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-muted tracking-tight">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Speed Selector */}
          <button
            onClick={toggleSpeed}
            className="px-2 py-1 text-[10px] font-bold font-mono rounded bg-background border border-border text-muted hover:text-text hover:border-accent/40 transition-colors"
            title="Velocidad de reproducción"
          >
            {playbackRate}x
          </button>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="p-2 text-muted hover:text-text rounded-lg hover:bg-background transition-colors"
            title={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};
