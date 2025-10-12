// frontend/src/pages/ScriptGeneration.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEdit3,
  FiSave,
  FiRefreshCw,
  FiCheck,
  FiPlay,
  FiImage,
  FiList,
  FiMinus,
  FiX,
} from 'react-icons/fi';

import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ImageSelector from '../components/workflow/ImageSelector';
import ChromeTabs from '../components/common/Pagination'; // Chrome-style tab bar
// Reuse landing page UI pieces as requested (Button/Box)
// import landing-style Button and Box (GlowCard) components
import Button from '../components/ui/star-border';
import Box from '../components/ui/spotlight-card';
import { useComplexity } from '../contexts/ComplexityContext';

import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWorkflow } from '../contexts/WorkflowContext';
import toast from 'react-hot-toast';

const ScriptTextarea = ({ value, onChange, disabled = false }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`w-full min-h-[200px] px-3 py-2 border rounded-md resize-y transition-all duration-150 ${
      disabled
      ? 'border-neutral-700 bg-neutral-800 text-neutral-500'
      : 'border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-800 hover:border-neutral-600'
    } bg-neutral-800 text-neutral-100 placeholder-neutral-500`}
    placeholder="Edit narration script here…"
  />
);

const BulletPointInput = ({ value, onChange, onRemove, disabled = false }) => (
  <div className="flex items-center gap-2">
    <span className="text-neutral-400">•</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`flex-1 px-3 py-2 text-sm border rounded-md transition-colors duration-150 ${
        disabled
        ? 'border-neutral-700 bg-neutral-800 text-neutral-500'
        : 'border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-800 hover:border-neutral-600'
      } bg-neutral-800 text-neutral-100 placeholder-neutral-500`}
      placeholder="Enter bullet point..."
    />
    {!disabled && (
      <button
        onClick={onRemove}
        className="p-1 text-red-400 hover:text-red-300 transition-colors duration-150"
        title="Remove bullet point"
      >
        <FiMinus className="w-4 h-4" />
      </button>
    )}
  </div>
);

const SectionPanel = ({
  section,
  script,
  onScriptChange,
  bullets,
  onBulletsChange,
  selectedImage,
  onSelectImage,
  paperId,
  images,
  savingScripts,
  generateBullets,
  hasLocalChanges,
}) => {
  const [localBullets, setLocalBullets] = useState(bullets || []);
  const [bulletGenerating, setBulletGenerating] = useState(false);
  const [localScript, setLocalScript] = useState(script);

  // Keep local state in sync
  useEffect(() => {
    setLocalBullets(bullets || []);
  }, [bullets]);

  useEffect(() => {
    setLocalScript(script);
  }, [script]);

  const handleBulletChange = (idx, value) => {
    const updated = [...localBullets];
    updated[idx] = value;
    setLocalBullets(updated);
    onBulletsChange(section, updated);
  };

  const addBullet = () => {
    const updated = [...localBullets, ''];
    setLocalBullets(updated);
    onBulletsChange(section, updated);
  };

  const removeBullet = (idx) => {
    const updated = localBullets.filter((_, i) => i !== idx);
    setLocalBullets(updated);
    onBulletsChange(section, updated);
  };

  const handleScriptChange = (value) => {
    setLocalScript(value);
    onScriptChange(section, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >

      {/* Script Editor */}
  <div className="bg-[#0b0b0b] rounded-md p-6 border border-neutral-800 space-y-1">
        <div className="flex items-center justify-between">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
          {/*<h3 className="text-xl font-semibold text-neutral-900 dark:text-white capitalize">
            {section.replace(/_/g, ' ')}
          </h3>*/}

          {/* Status indicators */}
              <div className="flex items-center space-x-2">
                {selectedImage && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-900/20 rounded-full">
                    <FiImage className="w-3 h-3 text-green-300" />
                    <span className="text-xs text-green-300">Image</span>
                  </div>
                  )}

                {hasLocalChanges && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-900/20 rounded-full">
                    <FiEdit3 className="w-3 h-3 text-yellow-300" />
                    <span className="text-xs text-yellow-300">Modified</span>
                  </div>
                  )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-neutral-400">
            <span>{localScript.length} characters</span>
            <span>•</span>
            <span>~{Math.ceil(localScript.length / 150)} minutes</span>
          </div>
        </div>
        
        <ScriptTextarea 
          value={localScript} 
          onChange={handleScriptChange}
          disabled={savingScripts}
        />
      </div>

      {/* Bullet Points + Image picker */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* Bullet Points */}
  <div className="bg-[#0b0b0b] rounded-md p-6 border border-neutral-800 space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-neutral-100">
            <FiList className="w-4 h-4" /> Slide Bullet Points
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {localBullets.map((bp, i) => (
              <BulletPointInput
                key={i}
                value={bp}
                onChange={(val) => handleBulletChange(i, val)}
                onRemove={() => removeBullet(i)}
                disabled={savingScripts}
                />
                ))}
            
            {localBullets.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 italic border-2 border-dashed border-neutral-700 rounded-md">
                <FiList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No bullet points yet.</p>
                <p className="text-xs mt-1">Add bullet points manually.</p>
              </div>
              ) : (
              <button
                onClick={addBullet}
                disabled={savingScripts}
                className="w-full py-2 border-2 border-dashed border-neutral-700 rounded-md text-sm text-neutral-400 hover:border-neutral-600 transition disabled:opacity-50"
              >
                + Add bullet point
              </button>
              )}
            </div>
          </div>

        {/* Image picker */}
          <div className="bg-neutral-900 rounded-md p-6 border border-neutral-800 space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-neutral-100">
              <FiImage className="w-4 h-4" /> Slide Image
            </h4>

            <div className="aspect-video bg-[#121212] rounded-md overflow-hidden border border-neutral-800 flex items-center justify-center">
              {selectedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={apiService.getImageUrl(paperId, selectedImage)}
                    alt={selectedImage}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                    {selectedImage}
                  </div>
                </div>
                ) : (
                <div className="text-center">
                  <FiImage className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <span className="text-neutral-400">No image selected</span>
                  <p className="text-xs text-neutral-400 mt-1">Text-only slide</p>
                </div>
                )}
              </div>

              <button
                onClick={() => onSelectImage(section)}
                disabled={savingScripts}
                className="w-full px-4 py-2 bg-[#121212] hover:bg-[#1a1a1a] text-white font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
              >
                {selectedImage ? 'Change Image' : 'Select Image'}
              </button>
            </div>
          </div>
        </motion.div>
        );
};

const ScriptGeneration = () => {
  // Force Tailwind "dark" mode for this page only by toggling the 'dark' class
  // on the root element while this component is mounted. This makes all
  // `dark:` utility variants render as dark for this page without changing
  // global user preferences.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (!hadDark) root.classList.add('dark');
    // Also force body background/text so the entire page (including margins)
    // looks like the landing dark page while this view is mounted.
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyColor = document.body.style.color;
    // use a landing-style gradient background for the whole page
    const prevBodyImage = document.body.style.backgroundImage;
    document.body.style.backgroundImage = 'linear-gradient(180deg, #0f1724 0%, #000000 50%, #0b1220 100%)';
    document.body.style.backgroundColor = '';
    document.body.style.color = '#e5e7eb'; // neutral-100

    return () => {
      if (!hadDark) root.classList.remove('dark');
      // restore body styles
      document.body.style.backgroundImage = prevBodyImage || '';
      document.body.style.backgroundColor = prevBodyBg || '';
      document.body.style.color = prevBodyColor || '';
    };
  }, []);
  const {
    paperId,
    metadata,
    scripts,
    editedScripts,
    bulletPoints,
    images,
    selectedImages,
    setScripts,
    setEditedScripts,
    setBulletPoints,
    updateScript,
    updateBulletPoints,
    setSelectedImage,
    progressToNextStep,
  } = useWorkflow();

  const { loading: apiLoading, execute } = useApi();
  const { complexity } = useComplexity();

  const [generating, setGenerating] = useState(false);
  const [savingScripts, setSavingScripts] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [imageSelectorSection, setImageSelectorSection] = useState(null);
  const [localChanges, setLocalChanges] = useState({});
  
  // Use refs to track initialization to prevent multiple loads
  const initializationRef = useRef(false);
  const loadingRef = useRef(false);
  const autoGenerateRef = useRef(false);

  /* ------------------------------------------------------------------ */
  /*  Load existing scripts + bullets                                    */
  /* ------------------------------------------------------------------ */
  const loadExisting = useCallback(async () => {
    if (!paperId || initializationRef.current || loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    console.log('Loading existing scripts for paperId:', paperId);
    
    try {
      const res = await apiService.getScriptsWithBullets(paperId);
      const sectionsData = res.data.sections || {};
      
      if (Object.keys(sectionsData).length > 0) {
        const loadedScripts = {};
        const loadedBullets = {};
        const loadedImages = {};
        
        Object.entries(sectionsData).forEach(([section, data]) => {
          loadedScripts[section] = data.script || '';
          loadedBullets[section] = data.bullet_points || [];
          if (data.assigned_image) {
            loadedImages[section] = data.assigned_image;
          }
        });
        
        setScripts(loadedScripts);
        setEditedScripts(loadedScripts);
        setBulletPoints(loadedBullets);
        
        // Update selected images
        Object.entries(loadedImages).forEach(([section, image]) => {
          setSelectedImage(section, image);
        });
        
        setActiveTab(Object.keys(loadedScripts)[0]);
        initializationRef.current = true;
        console.log('Scripts loaded successfully');
      }
    } catch (err) {
      console.log('No existing scripts found or error loading:', err);
    } finally {
      loadingRef.current = false;
    }
  }, [paperId, setScripts, setEditedScripts, setBulletPoints, setSelectedImage]);

  useEffect(() => {
    if (paperId && !initializationRef.current) {
      loadExisting();
    }
  }, [paperId, loadExisting]);

  /* ------------------------------------------------------------------ */
  /*  Generate scripts                                                  */
  /* ------------------------------------------------------------------ */
  const handleGenerateScripts = async () => {
    if (!paperId) {
      toast.error('Upload a paper first');
      return;
    }
    
    setGenerating(true);
    try {
      console.log('Generating scripts for paperId:', paperId);
      
      // Generate scripts with complexity level
      await apiService.generateScript(paperId, complexity);
      
      // Wait a moment for the backend to save the data
      await new Promise(resolve => setTimeout(resolve, 1000));
    
      // Refresh data from server
      const res = await apiService.getScriptsWithBullets(paperId);
      const sectionsData = res.data.sections || {};
      
      if (Object.keys(sectionsData).length > 0) {
        const generatedScripts = {};
        const generatedBullets = {};
        
        Object.entries(sectionsData).forEach(([section, data]) => {
          generatedScripts[section] = data.script || '';
          generatedBullets[section] = data.bullet_points || [];
        });
        
        setScripts(generatedScripts);
        setEditedScripts(generatedScripts);
        setBulletPoints(generatedBullets);
        setActiveTab(Object.keys(generatedScripts)[0]);
        setLocalChanges({});
        initializationRef.current = true;
        
        toast.success('Scripts generated successfully!');
      } else {
        toast.error('Scripts generated but failed to load');
      }
    } catch (error) {
      console.error('Error generating scripts:', error);
      toast.error('Failed to generate scripts');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const noScriptsYet = Object.keys(scripts || {}).length === 0;

    if (
      paperId &&                 // we have a paper
      noScriptsYet &&            // nothing to edit
      !generating &&             // not already running
      !apiLoading &&             // backend idle
      !autoGenerateRef.current   // hasn't fired before
      ) {
      autoGenerateRef.current = true;   // lock
      handleGenerateScripts();          // 👈 same helper you use on the button
    }
  }, [paperId, scripts, generating, apiLoading]);

  /* ------------------------------------------------------------------ */
  /*  Save scripts                                                      */
  /* ------------------------------------------------------------------ */
  const handleSaveScripts = async () => {
    if (!paperId) return;
    
    setSavingScripts(true);
    try {
      // Prepare data in the format expected by the backend
      const sectionsData = {};
      Object.keys(editedScripts).forEach(section => {
        sectionsData[section] = {
          script: editedScripts[section] || '',
          bullet_points: bulletPoints[section] || []
        };
      });

      console.log('Saving scripts data:', { sections: sectionsData });

      // Save to backend
      const response = await apiService.updateScriptsWithBullets(paperId, {
        sections: sectionsData
      });

      console.log('Save response:', response.data);

      // Update local state
      setScripts(editedScripts);
      setLocalChanges({});
      
      toast.success('Scripts saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save scripts');
    } finally {
      setSavingScripts(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Bullet point generator helper                                     */
  /* ------------------------------------------------------------------ */
  const generateBullets = async (section, text) => {
    const res = await apiService.generateBulletPoints(paperId, section, text);
    return res.data?.bullet_points ?? [];
  };

  /* ------------------------------------------------------------------ */
  /*  Track local changes                                               */
  /* ------------------------------------------------------------------ */
  const handleScriptChange = (section, value) => {
    updateScript(section, value);
    setLocalChanges(prev => ({ ...prev, [section]: true }));
  };

  const handleBulletsChange = (section, bullets) => {
    updateBulletPoints(section, bullets);
    setLocalChanges(prev => ({ ...prev, [section]: true }));
  };

  /* ------------------------------------------------------------------ */
  /*  Image selector helpers                                            */
  /* ------------------------------------------------------------------ */
  const openImageSelector = (section) => setImageSelectorSection(section);
  const closeImageSelector = () => setImageSelectorSection(null);

  const handleImagePicked = async (image) => {
    if (imageSelectorSection) {
      try {
        if (image) {
          await apiService.assignImageToSection(paperId, imageSelectorSection, image);
        }
        setSelectedImage(imageSelectorSection, image);
        toast.success(`Image ${image ? 'assigned' : 'removed'} successfully!`);
      } catch (error) {
        console.error('Error assigning image:', error);
        toast.error('Failed to assign image');
      }
    }
    closeImageSelector();
  };

  /* ------------------------------------------------------------------ */
  /*  Derived values                                                    */
  /* ------------------------------------------------------------------ */
  const sectionKeys = Object.keys(editedScripts);
  const hasScripts = sectionKeys.length > 0;
  const hasChanges = Object.keys(localChanges).some(key => localChanges[key]);

  /* ------------------------------------------------------------------ */
  /*  Continue to next step                                             */
  /* ------------------------------------------------------------------ */
  const handleContinueToSlides = () => {
    if (hasChanges) {
      toast.error('Please save your changes before continuing');
      return;
    }
    
    if (savingScripts) {
      toast.error('Please wait for scripts to finish saving');
      return;
    }
    
    if (!editedScripts || Object.keys(editedScripts).length === 0) {
      toast.error('Please generate scripts first');
      return;
    }
    
    progressToNextStep();
  };

  const breadcrumbs = [{ label: 'Script Generation', href: '/script-generation' }];

  if (!paperId) {
    return (
      <Layout title="" breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <FiEdit3 className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            No Paper Selected
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Please upload a paper first to generate scripts.
          </p>
        </div>
      </Layout>
      );
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <Layout title="" breadcrumbs={breadcrumbs}>
      {/* Force dark theme styling for this page only by using dark background classes */}
  <div className="min-h-screen py-6 bg-[#0b0b0b] text-neutral-100">
        <div className="max-w-7xl mx-auto space-y-0">
        {/* Header */}


        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
  className="bg-[#0b0b0b] rounded-md p-6 border border-neutral-700 space-y-6 mb-2"
        >
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {metadata?.title || 'Generate Presentation Scripts'}
            </h2>
            <p className="text-neutral-400">
              Create and customize scripts with bullet points for your academic presentation
            </p>
          </div>
          {/* Progress indicator */}
          {(generating || savingScripts) && (
            <div className="h-1 rounded bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
              <div className="h-full w-full animate-pulse bg-neutral-700 dark:bg-neutral-400" />
            </div>
            )}

          <div className="flex flex-wrap gap-3">
            {/* Use landing-style Button as primary action visual but keep behaviour */}
            <Button as="button" onClick={handleGenerateScripts} className="inline-block" disabled={generating}>
              <div className="flex items-center gap-2 px-4">
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" /> Generating
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="w-4 h-4" />
                    {hasScripts ? 'Regenerate' : 'Generate'}
                  </>
                )}
              </div>
            </Button>

            {hasScripts && (
              <>
                <Button as="button" onClick={handleSaveScripts} className="inline-block" disabled={savingScripts}>
                  <div className="flex items-center gap-2 px-4">
                    {savingScripts ? (
                      <>
                        <LoadingSpinner size="sm" /> Saving
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4" /> Save Scripts
                      </>
                    )}
                  </div>
                </Button>

                <Button as="button" onClick={handleContinueToSlides} className="inline-block" disabled={hasChanges || savingScripts}>
                  <div className="flex items-center gap-2 px-4">
                    <FiCheck className="w-4 h-4" /> Continue to Slides
                  </div>
                </Button>
              </>
            )}
          </div>

          </motion.div>

        {/* Chrome Tabs */}
          {hasScripts && (
            <div className="mt-4">
            <ChromeTabs
              tabs={sectionKeys.map((k) => ({
                id: k,
                title: k.replace(/_/g, ' '),
                hasChanges: localChanges[k] || false,
                isCompleted: bulletPoints[k]?.length > 0,
              }))}
              activeTab={activeTab}
              onTabClick={setActiveTab}
              />
               </div>
              )}

        {/* Section Panel */}
          {hasScripts && activeTab && (
            <Box className="p-0 bg-[#0b0b0b] border-none">
            <SectionPanel
              key={activeTab}
              section={activeTab}
              script={editedScripts[activeTab]}
              onScriptChange={handleScriptChange}
              bullets={bulletPoints[activeTab] || []}
              onBulletsChange={handleBulletsChange}
              selectedImage={selectedImages[activeTab]}
              onSelectImage={openImageSelector}
              paperId={paperId}
              images={images}
              savingScripts={savingScripts}
              generateBullets={generateBullets}
              hasLocalChanges={localChanges[activeTab]}
              />
            </Box>
              )}

        {/* Empty state */}
          {!hasScripts && !apiLoading && !generating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-[#0b0b0b] rounded-md border-2 border-dashed border-neutral-800"
            >
              <FiEdit3 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Scripts Generated Yet
              </h3>
              <p className="text-neutral-400 mb-6">
                Click "Generate" to let the AI create narration scripts from your paper.
              </p>
              <Button as="button" onClick={handleGenerateScripts} className="mx-auto" disabled={generating}>
                <div className="flex items-center gap-2 px-4">
                  <FiPlay className="w-4 h-4" /> Generate Scripts
                </div>
              </Button>
            </motion.div>
            )}
      {/* Image selector modal */}
        </div>
      </div>

      {/* Image selector modal */}
        <AnimatePresence>
          {imageSelectorSection && (
            <ImageSelector
              paperId={paperId}
              images={images}
              selectedImage={selectedImages[imageSelectorSection]}
              onSelect={handleImagePicked}
              onClose={closeImageSelector}
              />
              )}
        </AnimatePresence>
      </Layout>
      );
};

export default ScriptGeneration;