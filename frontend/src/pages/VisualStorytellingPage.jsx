import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFilm, FiPlay, FiDownload, FiLoader, FiCheck, FiUpload, FiLink, 
  FiImage, FiMic, FiVideo, FiSettings, FiEye, FiChevronRight 
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import ComplexityButton from '../components/common/ComplexityButton';
import { useComplexity } from '../contexts/ComplexityContext';

const VisualStorytellingPage = () => {
  const navigate = useNavigate();
  const { complexity } = useComplexity();
  
  // Input state
  const [inputType, setInputType] = useState('arxiv');
  const [arxivUrl, setArxivUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Configuration state
  const [videoDuration, setVideoDuration] = useState(180);
  const [videoStyle, setVideoStyle] = useState('educational');
  const [imageProvider, setImageProvider] = useState('placeholder');
  
  // Progress state
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('idle'); 
  // Steps: idle, uploading, script, images, audio, video, complete
  const [paperId, setPaperId] = useState(null);
  
  // Data state
  const [scriptData, setScriptData] = useState(null);
  const [imageCount, setImageCount] = useState(0);
  const [videoPath, setVideoPath] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const videoStyles = [
    { value: 'educational', label: 'Educational', icon: '📚', desc: 'Clear, structured teaching' },
    { value: 'dramatic', label: 'Dramatic', icon: '🎭', desc: 'Engaging storytelling' },
    { value: 'documentary', label: 'Documentary', icon: '🎬', desc: 'Professional, objective' },
    { value: 'minimalist', label: 'Minimalist', icon: '✨', desc: 'Clean, modern' }
  ];

  const imageProviders = [
    { value: 'placeholder', label: 'AI-Generated Images', icon: '🎨', cost: 'Free', speed: 'Fast' }
  ];

  const generateVisualStory = async (newPaperId) => {
    try {
      // Step 1: Generate storytelling script
      setCurrentStep('script');
      toast.loading('Generating narrative script...');
      
      const scriptResponse = await api.post(
        `/visual-storytelling/${newPaperId}/generate-storytelling-script`,
        {
          complexity_level: complexity,
          video_duration: videoDuration,
          style: videoStyle,
          image_provider: imageProvider,
          voice_selection: { "English": "vidya" }
        }
      );
      
      const script = scriptResponse.data.script_data;
      setScriptData(script);
      
      toast.dismiss();
      toast.success(`Script ready! ${script.scenes?.length || 0} scenes created`);
      
      // Step 2: Generate images
      setCurrentStep('images');
      toast.loading('Generating scene images...');
      
      const imagesResponse = await api.post(
        `/visual-storytelling/${newPaperId}/generate-storytelling-images`
      );
      
      setImageCount(imagesResponse.data.image_count);
      
      toast.dismiss();
      toast.success(`${imagesResponse.data.image_count} images generated!`);
      
      // Step 3: Generate audio
      setCurrentStep('audio');
      toast.loading('Generating narration audio...');
      
      await api.post(`/visual-storytelling/${newPaperId}/generate-storytelling-audio`);
      
      toast.dismiss();
      toast.success('Audio narration ready!');
      
      // Step 4: Create video
      setCurrentStep('video');
      toast.loading('Creating cinematic video...');
      
      const videoResponse = await api.post(
        `/visual-storytelling/${newPaperId}/generate-storytelling-video`
      );
      
      console.log('Video response:', videoResponse.data);
      setVideoPath(videoResponse.data.video_path || 'generated'); // Set any truthy value to show player
      
      toast.dismiss();
      toast.success('Visual storytelling video complete!');
      
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('Visual storytelling error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.detail || 'Failed to generate video');
      setCurrentStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleArxivSubmit = async (e) => {
    e.preventDefault();
    
    if (!arxivUrl.trim()) {
      toast.error('Please enter an arXiv URL');
      return;
    }

    setLoading(true);
    setCurrentStep('uploading');

    try {
      toast.loading('Fetching paper from arXiv...');
      const paperResponse = await api.scrapeArxiv(arxivUrl);
      const newPaperId = paperResponse.data.paper_id;
      setPaperId(newPaperId);
      
      toast.dismiss();
      toast.success('Paper uploaded successfully!');
      
      await generateVisualStory(newPaperId);
      
    } catch (error) {
      console.error('arXiv upload error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.detail || 'Failed to fetch paper from arXiv');
      setCurrentStep('idle');
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    setCurrentStep('uploading');

    try {
      let paperResponse;
      
      if (inputType === 'pdf') {
        toast.loading('Uploading PDF file...');
        paperResponse = await api.uploadPdf(selectedFile);
      } else if (inputType === 'latex') {
        toast.loading('Uploading LaTeX source...');
        paperResponse = await api.uploadZip(selectedFile);
      }
      
      const newPaperId = paperResponse.data.paper_id;
      setPaperId(newPaperId);
      
      toast.dismiss();
      toast.success('File uploaded successfully!');
      
      await generateVisualStory(newPaperId);
      
    } catch (error) {
      console.error('File upload error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      setCurrentStep('idle');
      setLoading(false);
    }
  };

  const handleDownloadVideo = async () => {
    try {
      toast.loading('Preparing download...');
      
      const response = await api.get(
        `/visual-storytelling/${paperId}/download-storytelling-video`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `storytelling_${paperId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Video downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download video');
    }
  };

  const progressSteps = [
    { key: 'uploading', label: 'Uploading', icon: FiUpload },
    { key: 'script', label: 'Script', icon: FiFilm },
    { key: 'images', label: 'Images', icon: FiImage },
    { key: 'audio', label: 'Audio', icon: FiMic },
    { key: 'video', label: 'Video', icon: FiVideo },
    { key: 'complete', label: 'Done', icon: FiCheck }
  ];

  const getStepStatus = (stepKey) => {
    const stepIndex = progressSteps.findIndex(s => s.key === stepKey);
    const currentIndex = progressSteps.findIndex(s => s.key === currentStep);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white font-primary overflow-hidden relative">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')}
                className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center"
              >
                <span className="text-white dark:text-gray-900 font-bold text-sm">SA</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Visual Storytelling
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ComplexityButton />
              <button onClick={() => navigate('/')} className="btn-secondary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFilm className="w-8 h-8 text-purple-600 dark:text-purple-300" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Visual Storytelling
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Transform research papers into engaging narrative videos with AI-generated imagery and professional narration
          </p>
        </motion.div>

        {/* Progress Bar */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  {progressSteps.map((step, index) => {
                    const status = getStepStatus(step.key);
                    const Icon = step.icon;
                    
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                            status === 'complete' ? 'bg-green-500 border-green-400' :
                            status === 'current' ? 'bg-indigo-500 border-indigo-400 animate-pulse' :
                            'bg-gray-700 border-gray-600'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              status === 'complete' || status === 'current' ? 'text-white' : 'text-gray-400'
                            }`} />
                          </div>
                          <span className={`text-sm font-medium ${
                            status === 'complete' || status === 'current' ? 'text-white' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        
                        {index < progressSteps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                            getStepStatus(progressSteps[index + 1].key) === 'complete' || 
                            getStepStatus(progressSteps[index + 1].key) === 'current'
                              ? 'bg-indigo-500'
                              : 'bg-gray-700'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Input & Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Paper Input */}
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiUpload className="mr-2" /> Upload Research Paper
              </h3>
              
              {/* Input Type Selector */}
              <div className="flex space-x-2 mb-6">
                {[
                  { value: 'arxiv', label: 'arXiv', icon: FiLink },
                  { value: 'pdf', label: 'PDF', icon: FiUpload },
                  { value: 'latex', label: 'LaTeX', icon: FiUpload }
                ].map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setInputType(type.value)}
                      disabled={loading}
                      className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                        inputType === type.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* arXiv Input */}
              {inputType === 'arxiv' && (
                <form onSubmit={handleArxivSubmit}>
                  <input
                    type="text"
                    value={arxivUrl}
                    onChange={(e) => setArxivUrl(e.target.value)}
                    placeholder="https://arxiv.org/abs/2301.00001"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !arxivUrl.trim()}
                    className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiPlay className="w-5 h-5" />
                        <span>Generate Visual Story</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* File Upload */}
              {(inputType === 'pdf' || inputType === 'latex') && (
                <form onSubmit={handleFileUpload}>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-4 hover:border-indigo-500 transition-colors">
                    <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      accept={inputType === 'pdf' ? '.pdf' : '.zip'}
                      disabled={loading}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-indigo-400 hover:text-indigo-300"
                    >
                      {selectedFile ? selectedFile.name : `Click to upload ${inputType.toUpperCase()}`}
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !selectedFile}
                    className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiPlay className="w-5 h-5" />
                        <span>Generate Visual Story</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Configuration */}
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiSettings className="mr-2" /> Video Configuration
              </h3>

              {/* Duration Slider */}
              <div className="mb-6">
                <label className="text-sm text-gray-300 mb-2 block">
                  Video Duration: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
                </label>
                <input
                  type="range"
                  min="60"
                  max="600"
                  step="30"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 min</span>
                  <span>10 min</span>
                </div>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <label className="text-sm text-gray-300 mb-3 block">Video Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {videoStyles.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setVideoStyle(style.value)}
                      disabled={loading}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        videoStyle === style.value
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-2xl mb-2">{style.icon}</div>
                      <div className="text-white font-medium text-sm">{style.label}</div>
                      <div className="text-gray-400 text-xs mt-1">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scene Cards Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📝</div>
                  <div>
                    <div className="text-white font-medium text-sm">Text-Based Scene Cards</div>
                    <div className="text-blue-400 text-xs">Script text displayed on gradient backgrounds</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Results */}
          <div className="space-y-6">
            {/* Script Preview */}
            {scriptData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <FiFilm className="mr-2" /> Script
                  </h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <FiEye className="w-4 h-4" />
                    <span className="text-sm">{showPreview ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Title:</span>
                    <span className="text-white font-medium">{scriptData.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Scenes:</span>
                    <span className="text-white font-medium">{scriptData.scenes?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white font-medium">{scriptData.total_duration}s</span>
                  </div>
                </div>

                {showPreview && scriptData.scenes && (
                  <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                    {scriptData.scenes.slice(0, 3).map((scene, idx) => (
                      <div key={idx} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Scene {scene.scene_number}</div>
                        <div className="text-sm text-white line-clamp-2">{scene.narration}</div>
                      </div>
                    ))}
                    {scriptData.scenes.length > 3 && (
                      <div className="text-center text-sm text-gray-400">
                        +{scriptData.scenes.length - 3} more scenes
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Image Count */}
            {imageCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50"
              >
                <h3 className="text-lg font-semibold text-white flex items-center mb-2">
                  <FiImage className="mr-2" /> Scene Cards Created
                </h3>
                <p className="text-3xl font-bold text-indigo-400">{imageCount}</p>
                <p className="text-sm text-gray-400 mt-1">Text-based scene visuals</p>
              </motion.div>
            )}

            {/* Video Ready */}
            {videoPath && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-6 backdrop-blur-sm border border-indigo-500/50"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Video Ready!</h3>
                  <p className="text-gray-300">Your visual storytelling video is complete</p>
                </div>

                {/* Video Player */}
                <div className="mb-6 bg-black rounded-lg overflow-hidden">
                  <video
                    key={paperId} 
                    controls
                    autoPlay
                    className="w-full max-h-96"
                    src={`http://localhost:8000/api/visual-storytelling/${paperId}/download-storytelling-video`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <button
                  onClick={handleDownloadVideo}
                  className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FiDownload className="w-5 h-5" />
                  <span>Download Video</span>
                </button>
              </motion.div>
            )}

            {/* Info Card */}
            {!loading && currentStep === 'idle' && (
              <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-3">How it Works</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <FiChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>Upload your research paper</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FiChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>AI generates a narrative script with scenes</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FiChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>Text-based scene cards are created with script text</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FiChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>Professional narration is added</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FiChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>Video is composed with transitions</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualStorytellingPage;
