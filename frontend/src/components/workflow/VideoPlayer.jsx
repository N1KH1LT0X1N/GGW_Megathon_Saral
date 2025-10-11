import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMic, FiVideo, FiPlay, FiPause, FiDownload, 
  FiSettings, FiVolume2, FiMusic, FiArrowRight, FiExternalLink
} from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';

const VideoPlayer = ({ src, title, paperId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef} 
      className="bg-black rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700"
    >
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          playsInline
          preload="metadata"
        />

        
        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          {/* Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-neutral-900/40 hover:bg-neutral-900/60 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 border border-white/20"
            >
              {isPlaying ? (
                <FiPause className="w-8 h-8 text-white" />
                ) : (
                <FiPlay className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>

          {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
              <div className="mb-3">
                <div 
                  className="w-full h-2 bg-neutral-600/40 rounded-full cursor-pointer hover:bg-neutral-600/60 transition-colors duration-200"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-blue-500 hover:bg-blue-400 rounded-full transition-all duration-200"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>

            {/* Control Bar */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={togglePlay} 
                    className="hover:text-blue-400 transition-colors duration-200 p-1 rounded"
                  >
                    {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
                  </button>
                  <div className="flex items-center space-x-2">
                    <FiVolume2 className="w-4 h-4 text-neutral-300" />
                    <span className="text-sm font-medium text-neutral-200">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={toggleFullscreen}
                    className="hover:text-blue-400 transition-colors duration-200 p-1 rounded"
                    title="Toggle fullscreen"
                  >
                    <FiExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* Loading State Overlay */}
          {!duration && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/20">
              <div className="flex items-center space-x-2 text-white">
                <LoadingSpinner size="sm" />
                <span className="text-sm font-medium">Loading video...</span>
              </div>
            </div>
            )}
        </div>

      {/* Video Info */}
        {title && (
          <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {title}
            </h4>
            {paperId && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Paper ID: {paperId}
              </p>
              )}
          </div>
          )}
      </div>
      );
};

export default VideoPlayer;