import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiLoader, FiAlertCircle, FiGitBranch, FiUpload, FiLink, FiFile } from 'react-icons/fi';
import Layout from '../components/common/Layout';
import toast from 'react-hot-toast';
import mermaid from 'mermaid';

const MindmapGeneration = () => {
  const [inputMode, setInputMode] = useState('arxiv'); // 'arxiv', 'pdf', 'latex'
  const [arxivUrl, setArxivUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [mindmapData, setMindmapData] = useState(null);
  const [error, setError] = useState(null);
  const [diagramRendered, setDiagramRendered] = useState(false);

  // Initialize mermaid
  React.useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#4f46e5',
        primaryTextColor: '#fff',
        primaryBorderColor: '#6366f1',
        lineColor: '#6366f1',
        secondaryColor: '#818cf8',
        tertiaryColor: '#a5b4fc',
      },
      mindmap: {
        padding: 20,
        maxNodeWidth: 200,
      }
    });
  }, []);

  // Render mermaid diagram when data changes
  React.useEffect(() => {
    if (mindmapData?.mermaid_diagram && !diagramRendered) {
      const renderDiagram = async () => {
        try {
          const element = document.querySelector('#mermaid-diagram');
          if (element) {
            element.innerHTML = mindmapData.mermaid_diagram;
            await mermaid.run({ nodes: [element] });
            setDiagramRendered(true);
          }
        } catch (err) {
          console.error('Error rendering mermaid diagram:', err);
          toast.error('Failed to render mind map diagram');
        }
      };
      renderDiagram();
    }
  }, [mindmapData, diagramRendered]);

  const validateUrl = (url) => {
    const arxivPatterns = [
      /arxiv\.org\/abs\/[0-9]+\.[0-9]+/,
      /arxiv\.org\/pdf\/[0-9]+\.[0-9]+/,
      /^[0-9]+\.[0-9]+$/
    ];
    return arxivPatterns.some(pattern => pattern.test(url));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'text/x-tex', 'application/x-latex', 'text/plain'];
      const validExtensions = ['.pdf', '.tex', '.latex'];
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
        toast.error('Please upload a PDF or LaTeX (.tex) file');
        return;
      }
      
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleGenerateMindmap = async () => {
    setLoading(true);
    setError(null);
    setMindmapData(null);
    setDiagramRendered(false);

    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      
      if (inputMode === 'arxiv') {
        // Validate arXiv URL
        if (!arxivUrl.trim()) {
          toast.error('Please enter an arXiv URL or ID');
          return;
        }

        if (!validateUrl(arxivUrl)) {
          toast.error('Please enter a valid arXiv URL or ID (e.g., 2301.00001 or https://arxiv.org/abs/2301.00001)');
          return;
        }

        // Generate from arXiv URL
        const response = await fetch(`${API_BASE}/api/mindmap/generate-mindmap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ arxiv_url: arxivUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to generate mind map');
        }

        const data = await response.json();
        setMindmapData(data);
        toast.success('Mind map generated successfully!');
      } else {
        // Generate from file upload
        if (!selectedFile) {
          toast.error('Please select a file to upload');
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        if (customTitle.trim()) {
          formData.append('title', customTitle);
        }

        const response = await fetch(`${API_BASE}/api/mindmap/generate-mindmap-from-file`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to generate mind map');
        }

        const data = await response.json();
        setMindmapData(data);
        toast.success('Mind map generated successfully!');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSVG = () => {
    const svgElement = document.querySelector('#mermaid-diagram svg');
    if (!svgElement) {
      toast.error('No diagram to download');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${mindmapData?.metadata?.arxiv_id || 'export'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Mind map downloaded!');
  };

  const handleDownloadMermaidCode = () => {
    if (!mindmapData?.mermaid_diagram) return;
    
    const blob = new Blob([mindmapData.mermaid_diagram], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${mindmapData?.metadata?.arxiv_id || 'export'}.mmd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Mermaid code downloaded!');
  };

  return (
    <Layout title="Mind Map Generation">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Generate Research Paper Mind Map
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Transform research papers into visual mind maps using AI - supports arXiv URLs, PDF files, and LaTeX source
          </p>
        </motion.div>

        {/* Input Section with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.05 }}
          className="card p-6"
        >
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-6 border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setInputMode('arxiv')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-150 border-b-2 ${
                inputMode === 'arxiv'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <FiLink className="w-4 h-4 inline mr-2" />
              arXiv URL
            </button>
            <button
              onClick={() => setInputMode('pdf')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-150 border-b-2 ${
                inputMode === 'pdf'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <FiFile className="w-4 h-4 inline mr-2" />
              PDF Upload
            </button>
            <button
              onClick={() => setInputMode('latex')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-150 border-b-2 ${
                inputMode === 'latex'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <FiFile className="w-4 h-4 inline mr-2" />
              LaTeX Upload
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {inputMode === 'arxiv' ? (
              /* arXiv URL Input */
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  arXiv URL or ID
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={arxivUrl}
                    onChange={(e) => setArxivUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateMindmap()}
                    placeholder="e.g., https://arxiv.org/abs/2301.00001 or 2301.00001"
                    className="flex-1 input"
                    disabled={loading}
                  />
                  <button
                    onClick={handleGenerateMindmap}
                    disabled={loading}
                    className="btn-primary min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiGitBranch className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Enter the full arXiv URL or just the paper ID (e.g., 2301.00001)
                </p>
              </div>
            ) : (
              /* File Upload Input */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Upload {inputMode === 'pdf' ? 'PDF' : 'LaTeX'} File
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-150">
                      <FiUpload className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {selectedFile ? selectedFile.name : `Choose ${inputMode === 'pdf' ? 'PDF' : 'LaTeX (.tex)'} file`}
                      </span>
                      <input
                        type="file"
                        accept={inputMode === 'pdf' ? '.pdf' : '.tex,.latex'}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                    <button
                      onClick={handleGenerateMindmap}
                      disabled={loading || !selectedFile}
                      className="btn-primary min-w-[140px]"
                    >
                      {loading ? (
                        <>
                          <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FiGitBranch className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Upload a {inputMode === 'pdf' ? 'PDF' : 'LaTeX'} file to generate a mind map
                  </p>
                </div>
                
                {/* Optional Title Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Custom Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Override the detected title..."
                    className="w-full input"
                    disabled={loading}
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Leave blank to use the title from the document
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="card p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900 dark:text-red-200 mb-1">
                  Generation Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mindmap Display */}
        {mindmapData && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Paper Info */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                {mindmapData.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600 dark:text-neutral-400">arXiv ID:</span>
                  <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                    {mindmapData.metadata.arxiv_id}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-600 dark:text-neutral-400">Processing Time:</span>
                  <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                    {mindmapData.metadata.processing_time_seconds}s
                  </span>
                </div>
                <div>
                  <span className="text-neutral-600 dark:text-neutral-400">Node Count:</span>
                  <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                    {mindmapData.metadata.node_count}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-600 dark:text-neutral-400">Categories:</span>
                  <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                    {mindmapData.metadata.categories.join(', ')}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-neutral-600 dark:text-neutral-400">Authors:</span>
                <p className="mt-1 text-neutral-900 dark:text-white">
                  {mindmapData.metadata.authors.join(', ')}
                </p>
              </div>
            </div>

            {/* Mind Map Visualization */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Mind Map Visualization
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadMermaidCode}
                    className="btn-secondary text-sm"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Mermaid Code
                  </button>
                  <button
                    onClick={handleDownloadSVG}
                    className="btn-primary text-sm"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Download SVG
                  </button>
                </div>
              </div>
              
              <div className="bg-neutral-900 dark:bg-neutral-950 rounded-lg p-8 overflow-auto">
                <div 
                  id="mermaid-diagram" 
                  className="flex justify-center items-center min-h-[400px]"
                >
                  {loading && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Rendering diagram...
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
                {mindmapData.analysis_summary}
              </p>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        {!mindmapData && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="card p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              How to use:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>Choose your input method: arXiv URL, PDF file, or LaTeX source</li>
              <li>
                {inputMode === 'arxiv' 
                  ? 'Enter an arXiv paper URL or ID'
                  : `Upload your ${inputMode === 'pdf' ? 'PDF' : 'LaTeX'} file`
                }
              </li>
              <li>Click "Generate" to create the mind map</li>
              <li>Wait for the AI to analyze the paper (may take 30-60 seconds)</li>
              <li>View and download the generated mind map</li>
            </ol>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-4">
              💡 The mind map will include 4 main sections: Introduction, Methodology, Results, and Conclusions
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
              📄 Supported formats: arXiv URLs, PDF files, and LaTeX source files (.tex)
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default MindmapGeneration;
