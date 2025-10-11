/**
 * Media processing utilities
 */

/**
 * Check if browser supports video format
 */
export const isVideoSupported = (mimeType) => {
  const video = document.createElement('video');
  return video.canPlayType(mimeType) !== '';
};

/**
 * Check if browser supports audio format
 */
export const isAudioSupported = (mimeType) => {
  const audio = document.createElement('audio');
  return audio.canPlayType(mimeType) !== '';
};

/**
 * Get video duration
 */
export const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Get audio duration
 */
export const getAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    
    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    
    audio.onerror = () => {
      reject(new Error('Failed to load audio metadata'));
    };
    
    audio.src = URL.createObjectURL(file);
  });
};

/**
 * Generate video thumbnail
 */
export const generateVideoThumbnail = (file, timeInSeconds = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = timeInSeconds;
    };
    
    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
      window.URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to generate thumbnail'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Resize image
 */
export const resizeImage = (file, maxWidth, maxHeight, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and convert to blob
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convert audio to base64
 */
export const audioToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Format duration in MM:SS format
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Get media file info
 */
export const getMediaInfo = async (file) => {
  const info = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
  
  if (file.type.startsWith('video/')) {
    try {
      info.duration = await getVideoDuration(file);
      info.thumbnail = await generateVideoThumbnail(file);
    } catch (error) {
      console.warn('Failed to get video info:', error);
    }
  } else if (file.type.startsWith('audio/')) {
    try {
      info.duration = await getAudioDuration(file);
    } catch (error) {
      console.warn('Failed to get audio info:', error);
    }
  } else if (file.type.startsWith('image/')) {
    try {
      info.dimensions = await getImageDimensions(file);
    } catch (error) {
      console.warn('Failed to get image info:', error);
    }
  }
  
  return info;
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      window.URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Create audio visualization data
 */
export const createAudioVisualization = (audioBuffer, samples = 100) => {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const visualizationData = [];
  
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;
    
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    
    visualizationData.push(sum / blockSize);
  }
  
  return visualizationData;
};
