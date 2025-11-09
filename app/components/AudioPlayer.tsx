"use client";

import { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface AudioPlayerProps {
  postId: string;
}

export default function AudioPlayer({ postId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const volumeSliderRef = useRef<HTMLDivElement | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    const checkAndLoadAudio = async () => {
      // Only check once per component mount
      if (checkedRef.current) return;
      checkedRef.current = true;

      try {
        // Check if audio exists
        const response = await fetch(`/api/audio/${postId}`, { method: 'HEAD' });
        
        if (response.ok) {
          // Audio exists, load and show player
          setHasAudio(true);
          loadAudio();
        } else {
          // Audio doesn't exist, silently generate it (no UI indication)
          generateAudioSilently();
        }
      } catch (err) {
        // Silently generate on error
        generateAudioSilently();
      }
    };

    checkAndLoadAudio();
  }, [postId]);

  const generateAudioSilently = async () => {
    try {
      // Silent API call - no UI feedback
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });
      // Don't wait for response or show anything to user
    } catch (err) {
      // Silently fail - no error messages
      console.error('Audio generation failed silently:', err);
    }
  };

  const loadAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(`/api/audio/${postId}`);
    }

    const audio = audioRef.current;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.volume = volume;
    audio.load();
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !hasAudio) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Silently handle play errors
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || !hasAudio) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeSliderRef.current || !audioRef.current) return;

    const rect = volumeSliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));

    setVolume(percentage);
    setIsMuted(percentage === 0);
    if (audioRef.current) {
      audioRef.current.volume = percentage;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Only show player if audio exists
  if (!hasAudio) {
    return null;
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercentage = isMuted ? 0 : volume * 100;

  return (
    <div className="my-6 w-full max-w-2xl mx-auto">
      <div className="relative backdrop-blur-xl bg-white/10 dark:bg-gray-800/30 rounded-2xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/50">
        {/* Main Controls */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={togglePlayPause}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur-sm border border-white/30 dark:border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <FaPause className="text-white text-lg ml-0.5" />
            ) : (
              <FaPlay className="text-white text-lg ml-1" />
            )}
          </button>

          {/* Progress Bar */}
          <div className="flex-1">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="relative h-2 bg-white/20 dark:bg-gray-700/50 rounded-full cursor-pointer group"
            >
              <div
                className="absolute h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-150"
                style={{ width: `${progressPercentage}%` }}
              />
              <div
                className="absolute h-4 w-4 bg-white rounded-full shadow-lg -top-1 transition-all duration-150 opacity-0 group-hover:opacity-100"
                style={{ left: `calc(${progressPercentage}% - 8px)` }}
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="flex-shrink-0 text-sm text-white/90 dark:text-gray-200 font-mono min-w-[80px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={toggleMute}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 flex items-center justify-center transition-all duration-200"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <FaVolumeMute className="text-white/80 text-sm" />
            ) : (
              <FaVolumeUp className="text-white/80 text-sm" />
            )}
          </button>

          <div
            ref={volumeSliderRef}
            onClick={handleVolumeClick}
            className="flex-1 h-1.5 bg-white/20 dark:bg-gray-700/50 rounded-full cursor-pointer group max-w-[100px]"
          >
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-150"
              style={{ width: `${volumePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
