import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeadphones, FiPlay, FiDownload, FiLoader, FiCheck, FiAlertCircle, FiUpload, FiLink, FiFileText, FiPause, FiSkipForward, FiSkipBack } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import ComplexityButton from '../components/common/ComplexityButton';
import StarBorder from '../components/ui/star-border';
import { GlowCard } from '../components/ui/spotlight-card';
import { useComplexity } from '../contexts/ComplexityContext';

const PodcastGeneration = () => {
  const navigate = useNavigate();
  const { complexity } = useComplexity();
  const [inputType, setInputType] = useState('arxiv'); // arxiv, pdf, latex
  const [arxivUrl, setArxivUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('idle'); // idle, uploading, generating, audio, complete
  const [paperId, setPaperId] = useState(null);
  const [dialogue, setDialogue] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [showScript, setShowScript] = useState(false);

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  ];

  const generatePodcastFromPaper = async (newPaperId) => {
    try {
      // Step 2: Generate scripts (required for podcast)
      setCurrentStep('generating');
      toast.loading('Generating scripts...');
      
      await api.generateScript(newPaperId);
      toast.dismiss();
      
      // Step 3: Generate podcast script
      toast.loading('Creating podcast dialogue...');
      const podcastResponse = await api.post(`/podcast/${newPaperId}/generate-script`, {
        num_exchanges: 8,
        language: selectedLanguage,
        complexity_level: complexity
      });
      
      const generatedDialogue = podcastResponse.data.dialogue;
      setDialogue(generatedDialogue);
      
      toast.dismiss();
      toast.success(`Podcast script ready! ${generatedDialogue.length} segments`);
      
      // Step 4: Show script immediately
      setCurrentStep('complete');
      
      // Generate audio in background (optional, non-blocking)
      setCurrentStep('audio');
      toast('Generating audio in background...', { icon: '🎵' });
      
      api.post(`/podcast/${newPaperId}/generate-audio`)
        .then(audioResponse => {
          const generatedAudio = audioResponse.data.audio_files || [];
          if (generatedAudio.length > 0) {
            setAudioFiles(generatedAudio);
            toast.success(`Audio ready! ${generatedAudio.length} files generated`);
          } else {
            toast.error('Audio generation failed - script only mode');
          }
          setCurrentStep('complete');
        })
        .catch(audioError => {
          console.log('Audio generation failed:', audioError);
          toast.error('Audio unavailable - showing script only');
          setCurrentStep('complete');
        });
      
    } catch (error) {
      console.error('Podcast generation error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.detail || 'Failed to generate podcast');
      setCurrentStep('idle');
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
      // Step 1: Upload paper
      toast.loading('Fetching paper from arXiv...');
      const paperResponse = await api.scrapeArxiv(arxivUrl);
      const newPaperId = paperResponse.data.paper_id;
      setPaperId(newPaperId);
      
      toast.dismiss();
      toast.success('Paper uploaded successfully!');
      
      await generatePodcastFromPaper(newPaperId);
      
    } catch (error) {
      console.error('arXiv upload error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.detail || 'Failed to fetch paper from arXiv');
      setCurrentStep('idle');
    } finally {
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
      toast.success('Paper uploaded successfully!');
      
      await generatePodcastFromPaper(newPaperId);
      
    } catch (error) {
      console.error('File upload error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      setCurrentStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (inputType === 'pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Please select a PDF file');
        return;
      }
      if (inputType === 'latex' && !file.name.toLowerCase().endsWith('.zip')) {
        toast.error('Please select a ZIP file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const playAudio = (index) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(`http://localhost:8000${audioFiles[index].url}`);
    setCurrentAudio(audio);
    audio.play();
    setPlayingIndex(index);
    
    audio.onended = () => {
      setPlayingIndex(null);
      setCurrentAudio(null);
      // Auto-play next segment
      if (index < audioFiles.length - 1) {
        setTimeout(() => playAudio(index + 1), 500);
      }
    };
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingIndex(null);
    }
  };

  const downloadAllAudio = async () => {
    toast.success('Downloading all audio files...');
    for (const audio of audioFiles) {
      const link = document.createElement('a');
      link.href = `http://localhost:8000${audio.url}`;
      link.download = audio.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
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
                Podcast Generator
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
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHeadphones className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Interactive Learning Podcast
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transform research papers into dynamic conversations between a curious student and an expert teacher
          </p>
        </motion.div>

        {/* Input Form */}
        {currentStep === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlowCard className="card p-8 bg-white/5 text-white rounded-xl shadow-sm">
            {/* Input Type Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setInputType('arxiv'); setSelectedFile(null); }}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  inputType === 'arxiv'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FiLink className="inline w-4 h-4 mr-2" />
                arXiv URL
              </button>
              <button
                onClick={() => { setInputType('pdf'); setArxivUrl(''); setSelectedFile(null); }}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  inputType === 'pdf'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FiFileText className="inline w-4 h-4 mr-2" />
                PDF File
              </button>
              <button
                onClick={() => { setInputType('latex'); setArxivUrl(''); setSelectedFile(null); }}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  inputType === 'latex'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FiUpload className="inline w-4 h-4 mr-2" />
                LaTeX ZIP
              </button>
            </div>

            {/* Language Selector */}
            <div className="my-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Podcast Language
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    disabled={loading}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* arXiv URL Input */}
            {inputType === 'arxiv' && (
              <form onSubmit={handleArxivSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    arXiv URL
                  </label>
                  <input
                    type="text"
                    value={arxivUrl}
                    onChange={(e) => setArxivUrl(e.target.value)}
                    placeholder="https://arxiv.org/abs/2301.12345"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Generating Podcast...
                    </>
                  ) : (
                    <>
                      <FiHeadphones className="w-5 h-5" />
                      Generate Podcast
                    </>
                  )}
                </button>
              </form>
            )}

            {/* PDF File Upload */}
            {inputType === 'pdf' && (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload PDF File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="pdf-upload"
                      disabled={loading}
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Click to upload PDF
                    </label>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Generating Podcast...
                    </>
                  ) : (
                    <>
                      <FiHeadphones className="w-5 h-5" />
                      Generate Podcast from PDF
                    </>
                  )}
                </button>
              </form>
            )}

            {/* LaTeX ZIP Upload */}
            {inputType === 'latex' && (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload LaTeX Source (ZIP)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="latex-upload"
                      disabled={loading}
                    />
                    <label
                      htmlFor="latex-upload"
                      className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Click to upload ZIP file
                    </label>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Generating Podcast...
                    </>
                  ) : (
                    <>
                      <FiHeadphones className="w-5 h-5" />
                      Generate Podcast from LaTeX
                    </>
                  )}
                </button>
              </form>
            )}
            </GlowCard>
          </motion.div>
        )}

        {/* Progress Steps */}
        {currentStep !== 'idle' && currentStep !== 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GlowCard className="card p-8 mb-6 bg-white/5 text-white rounded-xl shadow-sm">
              <div className="space-y-4">
              {[
                { key: 'uploading', label: 'Uploading and processing paper' },
                { key: 'generating', label: 'Generating dialogue script' },
                { key: 'audio', label: 'Creating audio with Bhashini TTS' }
              ].map((step) => (
                <div key={step.key} className="flex items-center gap-3">
                  {currentStep === step.key ? (
                    <FiLoader className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <FiCheck className="w-5 h-5 text-green-500" />
                  )}
                  <span className={`text-sm ${currentStep === step.key ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
              </div>
            </GlowCard>
          </motion.div>
        )}

        {/* Podcast Player */}
        {currentStep === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* View Toggle */}
            <GlowCard className="card p-4 bg-white/5 text-white rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiHeadphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Podcast Generated!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {audioFiles.length > 0 
                        ? `${audioFiles.length} audio segments • ${dialogue.length} script segments` 
                        : `${dialogue.length} script segments (audio pending)`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {audioFiles.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowScript(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          !showScript
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        🎵 Audio Player
                      </button>
                      <button
                        onClick={() => setShowScript(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          showScript
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        📝 View Script
                      </button>
                    </>
                  )}
                  {audioFiles.length > 0 && !showScript && (
                    <button
                      onClick={downloadAllAudio}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <FiDownload className="w-4 h-4" />
                      Download All
                    </button>
                  )}
                </div>
              </div>

              {/* Now Playing - Only show in Audio Player mode */}
              {!showScript && playingIndex !== null && audioFiles.length > 0 && (
                <GlowCard className="p-4 mb-4 bg-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                      Now Playing
                    </span>
                    <span className="text-xs text-gray-500">
                      #{playingIndex + 1} of {audioFiles.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {audioFiles[playingIndex].text}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => playingIndex > 0 && playAudio(playingIndex - 1)}
                      disabled={playingIndex === 0}
                      className="p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <FiSkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={stopAudio}
                      className="p-2 px-6 rounded bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FiPause className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => playingIndex < audioFiles.length - 1 && playAudio(playingIndex + 1)}
                      disabled={playingIndex === audioFiles.length - 1}
                      className="p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <FiSkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </GlowCard>
              )}
            </GlowCard>

            {/* Audio Player List - Show when audio exists and not viewing script */}
            {!showScript && audioFiles.length > 0 && (
              <GlowCard className="card p-6 bg-white/5 text-white rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-white mb-4">
                  🎵 All Audio Episodes
                </h3>
                <div className="space-y-3">
                  {audioFiles.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      playingIndex === index
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => playingIndex === index ? stopAudio() : playAudio(index)}
                        className={`mt-1 p-2 rounded-full transition-colors ${
                          playingIndex === index
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800'
                        }`}
                      >
                        {playingIndex === index ? (
                          <FiPause className="w-4 h-4 text-white" />
                        ) : (
                          <FiPlay className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-300 uppercase">
                            {item.speaker}
                          </span>
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </GlowCard>
            )}

            {/* Script View - Show when viewing script or no audio */}
            {(showScript || audioFiles.length === 0) && (
              <GlowCard className="card p-6 bg-white/5 text-white rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-white mb-4">
                  📝 Podcast Script
                </h3>
                <div className="space-y-3">
                  {dialogue.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-300 uppercase">
                              {item.speaker}
                            </span>
                            <span className="text-xs text-gray-400">#{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-300">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlowCard>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCurrentStep('idle');
                  setDialogue([]);
                  setAudioFiles([]);
                  setPaperId(null);
                  setArxivUrl('');
                  setSelectedFile(null);
                  setShowScript(false);
                  setInputType('arxiv');
                }}
                className="btn-secondary flex-1"
              >
                Generate Another Podcast
              </button>
              <button
                onClick={() => navigate('/api-setup')}
                className="btn-primary flex-1"
              >
                Go to Full Workflow
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PodcastGeneration;
