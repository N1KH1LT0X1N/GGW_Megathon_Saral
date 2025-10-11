import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiDownload, FiMaximize2 } from 'react-icons/fi';

const FilePreview = ({ file, onClose, onDownload }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    return 'unknown';
  };

  const renderPreview = () => {
    const type = getFileType(file.name);
    
    switch (type) {
    case 'image':
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-full object-contain rounded-lg"
          />
          );
      
    case 'video':
      return (
        <video
          src={file.url}
          controls
          playsInline
          muted
          preload="metadata"
          className="max-w-full max-h-full rounded-lg"
        >
          <p className="text-neutral-500">Your browser does not support video playback.</p>
        </video>
        );
      
    case 'audio':
      return (
        <div className="flex items-center justify-center h-full">
          <audio 
            src={file.url} 
            controls 
            preload="metadata"
            className="w-full max-w-md"
          >
            <p className="text-neutral-500">Your browser does not support audio playback.</p>
          </audio>
        </div>
        );
      
    case 'pdf':
      return (
        <iframe
          src={file.url}
          className="w-full h-full border-0 rounded-lg"
          title={file.name}
          />
          );
      
    default:
      return (
        <div className="flex items-center justify-center h-full text-neutral-500">
          <div className="text-center">
            <p className="mb-4">Preview not available for this file type</p>
            <button
              onClick={onDownload}
              className="btn-primary"
            >
              Download File
            </button>
          </div>
        </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-xs flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-6xl max-h-screen p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between text-white">
          <h3 className="font-medium truncate">{file.name}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150"
            >
              <FiDownload className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="w-full h-full flex items-center justify-center pt-16">
          {renderPreview()}
        </div>
      </div>
    </motion.div>
    );
};

export default FilePreview;
