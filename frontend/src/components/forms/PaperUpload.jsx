import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFile, FiX, FiGlobe, FiCheck, FiFileText, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { useWorkflow } from '../../contexts/WorkflowContext';
import LoadingSpinner from '../common/LoadingSpinner';
import StarBorder from '../../components/ui/star-border';

const UploadTypeCard = ({ type, currentType, onSelect, icon: Icon, title, description, isActive }) => {
  // Standardized tile color (dark-blue) for both active and inactive states.
  const baseBg = 'bg-[rgb(28,41,54)] dark:bg-[rgb(32,48,64)]';
  const baseBorder = 'border-[rgba(255,255,255,0.06)]';
  const iconColor = 'text-slate-200';
  const titleColor = 'text-white';
  const descColor = 'text-slate-300';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(type)}
      className={`w-full p-6 rounded-xl ${baseBg} ${baseBorder} transition-all duration-150 text-left`}
    >
      <Icon className={`w-6 h-6 mb-3 ${iconColor}`} />
      <h3 className={`font-semibold ${titleColor} mb-1`}>{title}</h3>
      <p className={`text-sm ${descColor}`}>{description}</p>
    </motion.button>
  );
};

const FileDisplay = ({ file, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    className="bg-white dark:bg-neutral-800 rounded-xl p-4 
               border border-neutral-200 dark:border-neutral-700"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <FiFile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors duration-150"
      >
        <FiX className="w-5 h-5" />
      </button>
    </div>
  </motion.div>
  );

const PaperUpload = () => {
  const { setLoading, setPaperId, setMetadata, setImages, progressToNextStep } = useWorkflow();
  const [uploadType, setUploadType] = useState('file');
  const [arxivUrl, setArxivUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const file = acceptedFiles[0];
    
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        toast.error('File size too large. Please upload a smaller file.');
      } else if (error.code === 'file-invalid-type') {
        toast.error(`Please upload a ${uploadType === 'file' ? 'ZIP' : 'PDF'} file`);
      } else {
        toast.error('File upload failed. Please try again.');
      }
      return;
    }

    if (file) {
      setUploadedFile(file);
      toast.success('File selected successfully');
    }
  }, [uploadType]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: uploadType === 'file' 
    ? { 'application/zip': ['.zip'] } 
    : { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB limit
  });

  const handleArxivSubmit = async () => {
    if (!arxivUrl.trim()) {
      toast.error('Please enter an arXiv URL');
      return;
    }

    if (!arxivUrl.includes('arxiv.org')) {
      toast.error('Please enter a valid arXiv URL');
      return;
    }

    setProcessing(true);
    setLoading(true);

    try {
      const response = await apiService.scrapeArxiv(arxivUrl);
      const { paper_id, metadata, image_files } = response.data;
      
      setPaperId(paper_id);
      setMetadata(metadata);
      setImages(image_files);
      
      toast.success('Paper processed successfully!');
      // Don't auto-progress - stay on step 2 to show metadata editor
      // The parent component (PaperProcessing) will handle showing MetadataEditor
    } catch (error) {
      console.error('arXiv processing error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to process arXiv paper';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      toast.error(`Please select a ${uploadType === 'file' ? 'ZIP' : 'PDF'} file`);
      return;
    }

    setProcessing(true);
    setLoading(true);

    try {
      let response;
      
      if (uploadType === 'file') {
        response = await apiService.uploadZip(uploadedFile);
      } else if (uploadType === 'pdf') {
        response = await apiService.uploadPdf(uploadedFile);
      }
      
      const { paper_id, metadata, image_files } = response.data;
      
      setPaperId(paper_id);
      setMetadata(metadata);
      setImages(image_files || []);
      
      toast.success(`${uploadType === 'file' ? 'LaTeX' : 'PDF'} processed successfully!`);
      // Don't auto-progress - stay on step 2 to show metadata editor
    } catch (error) {
      console.error(`Error uploading ${uploadType}:`, error);
      const errorMessage = error.response?.data?.detail || `Failed to process ${uploadType} file`;
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  const uploadTypes = [
    {
      type: 'file',
      icon: FiUpload,
      title: 'LaTeX Source',
      description: 'Upload ZIP file containing LaTeX source code and figures'
    },
    {
      type: 'pdf',
      icon: FiFileText,
      title: 'PDF Document',
      description: 'Upload research paper as PDF (text and images will be extracted)'
    },
    {
      type: 'arxiv',
      icon: FiGlobe,
      title: 'arXiv Import',
      description: 'Import paper directly from arXiv using URL'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* upload selection card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-800 rounded-xl p-6
                   border border-neutral-200 dark:border-neutral-700 space-y-6"
      >
        {/* loading indicator */}
        {processing && (
          <div className="h-1 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
            <div className="h-full w-full animate-pulse bg-gray-700 dark:bg-gray-400" />
          </div>
        )}

        {/* Upload Type Selection */}
        <div>
          <div className="grid md:grid-cols-3 gap-4">
            {uploadTypes.map((typeConfig) => (
              <UploadTypeCard
                key={typeConfig.type}
                type={typeConfig.type}
                currentType={uploadType}
                onSelect={(type) => {
                  setUploadType(type);
                  setUploadedFile(null);
                  setArxivUrl('');
                }}
                icon={typeConfig.icon}
                title={typeConfig.title}
                description={typeConfig.description}
                isActive={uploadType === typeConfig.type}
                />
                ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* File Upload Interface */}
          {(uploadType === 'file' || uploadType === 'pdf') && (
            <motion.div
              key={`${uploadType}-upload`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
                  isDragActive && !isDragReject
                  ? 'border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                  : isDragReject
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                <FiUpload className={`w-12 h-12 mx-auto mb-4 ${
                  isDragReject ? 'text-red-400' : 'text-gray-400'
                }`} />
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {isDragActive 
                  ? isDragReject
                  ? 'Invalid file type'
                  : `Drop your ${uploadType === 'file' ? 'ZIP' : 'PDF'} file here`
                  : `Upload ${uploadType === 'file' ? 'LaTeX Source' : 'PDF File'}`
                }
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop your {uploadType === 'file' ? 'ZIP' : 'PDF'} file here, or click to browse
              </p>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Maximum file size: 50MB</p>
                <p>Accepted format: {uploadType === 'file' ? 'ZIP' : 'PDF'} files only</p>
              </div>
            </div>

              {/* Uploaded File Display */}
            <AnimatePresence>
              {uploadedFile && (
                <FileDisplay 
                  file={uploadedFile} 
                  onRemove={() => setUploadedFile(null)} 
                  />
                  )}
            </AnimatePresence>

              {/* Upload Button - use landing page StarBorder */}
              <StarBorder as="button" onClick={handleFileUpload} className="w-full inline-block" disabled={!uploadedFile || processing}>
                <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent text-white font-medium ${processing ? 'opacity-60 pointer-events-none' : ''}`}>
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Processing {uploadType === 'file' ? 'LaTeX' : 'PDF'}...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-5 h-5" />
                      Process {uploadType === 'file' ? 'LaTeX' : 'PDF'} File
                    </>
                  )}
                </div>
              </StarBorder>
            </motion.div>
            )}

          {/* arXiv Import Interface */}
          {uploadType === 'arxiv' && (
            <motion.div
              key="arxiv-input"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  arXiv Paper URL
                </label>
                <input
                  type="url"
                  value={arxivUrl}
                  onChange={(e) => setArxivUrl(e.target.value)}
                  placeholder="https://arxiv.org/abs/2301.00000"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900
                             border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Enter the URL of an arXiv paper (e.g., https://arxiv.org/abs/2301.00000)
                </p>
              </div>

              <StarBorder as="button" onClick={handleArxivSubmit} className="w-full inline-block" disabled={!arxivUrl.trim() || processing}>
                <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent text-white font-medium ${processing ? 'opacity-60 pointer-events-none' : ''}`}>
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Importing from arXiv...
                    </>
                  ) : (
                    <>
                      <FiGlobe className="w-5 h-5" />
                      Import from arXiv
                    </>
                  )}
                </div>
              </StarBorder>
              </motion.div>
              )}
        </AnimatePresence>

        {/* Help Information */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-1 text-gray-900 dark:text-white">Upload Guidelines</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>LaTeX ZIP:</strong> Include all .tex files, figures, and bibliography files</li>
                <li><strong>PDF Upload:</strong> Ensure text is selectable (not scanned images)</li>
                <li><strong>arXiv Import:</strong> Use the full URL from the paper's arXiv page</li>
                <li>All uploads are processed securely and temporarily stored</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    );
};

export default PaperUpload;