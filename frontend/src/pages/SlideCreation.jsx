/* SlideCreation.jsx – Complete component with auto-generation and modern styling */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiSliders, FiDownload, FiEye, FiRefreshCw, FiImage,
  FiArrowRight, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import Layout           from '../components/common/Layout';
import LoadingSpinner   from '../components/common/LoadingSpinner';
import { useWorkflow }  from '../contexts/WorkflowContext';
import { apiService }   from '../services/api';
import { downloadBlob } from '../utils/helpers';
import toast            from 'react-hot-toast';

/* ─────────── minimal slide preview ─────────── */
const SlidePreview = ({ slides, current, setCurrent }) => {
  if (!slides?.length) return null;

  return (
    <div className="space-y-3">
      {/* main slide */}
      <div className="
        relative aspect-video
        bg-white dark:bg-gray-900
        border border-gray-300 dark:border-gray-700
        rounded-md shadow-sm overflow-hidden
      ">
        <img
          src={slides[current]}
          alt={`Slide ${current + 1}`}
          className="w-full h-full object-contain"
        />

        {/* nav arrows (fade when disabled) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              className="absolute inset-y-0 left-0 w-10 flex items-center justify-center
                         text-white bg-gradient-to-r from-black/20 to-transparent
                         hover:from-black/30 disabled:opacity-30 transition"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
              disabled={current === slides.length - 1}
              className="absolute inset-y-0 right-0 w-10 flex items-center justify-center
                         text-white bg-gradient-to-l from-black/20 to-transparent
                         hover:from-black/30 disabled:opacity-30 transition"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition
                          ${i === current
                            ? 'bg-gray-900 dark:bg-gray-100'
                            : 'bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────── preview container ─────────── */
const PreviewCard = ({ slides, loading, current, setCurrent }) => (
  <div className="
    bg-white dark:bg-gray-900
    border border-gray-300 dark:border-gray-700
    rounded-md shadow-sm p-5
  ">
    <SlidePreview
      slides={slides}
      current={current}
      setCurrent={setCurrent}
    />
  </div>
);



/* ─────────────────────────── main page ─────────────────────────── */
const SlideCreation = () => {
  const { paperId, slides, setSlides, progressToNextStep } = useWorkflow();

  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downPdf, setDownPdf] = useState(false);
  const [downLatex, setDownLatex] = useState(false);

  // Guard to prevent multiple auto-runs
  const autoGenerateRef = useRef(false);

  /* helpers ------------------------------------------------------- */
  const genSlides = async () => {
    if (!paperId) return;
    setLoading(true);
    try {
      await apiService.generateSlides(paperId);
      const { data } = await apiService.getSlidePreview(paperId);
      const urls = (data.images || []).map(img =>
        apiService.getSlideImageUrl(paperId, img)
      );
      setSlides(urls);
      setCurrentSlide(0);
      toast.success(`${urls.length} slides generated`);
    } catch (error) {
      console.error('Slide generation failed:', error);
      toast.error('Failed to generate slides');
    } finally {
      setLoading(false);
    }
  };

  const dlPdf = async () => {
    if (!paperId) return;
    setDownPdf(true);
    try {
      const { data } = await apiService.downloadSlides(paperId);
      downloadBlob(data, `slides_${paperId}.pdf`);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownPdf(false);
    }
  };

  const dlLatex = async () => {
    if (!paperId) return;
    setDownLatex(true);
    try {
      const { data } = await apiService.downloadLatexSource(paperId);
      downloadBlob(data, `slides_${paperId}.tex`);
      toast.success('LaTeX downloaded');
    } catch (error) {
      console.error('LaTeX download failed:', error);
      toast.error('Failed to download LaTeX');
    } finally {
      setDownLatex(false);
    }
  };

  /* ───────────────────────── auto-trigger effect ───────────────────────── */
  useEffect(() => {
    const noSlidesYet = !slides || slides.length === 0;

    if (
      paperId &&                // we have a paper
      noSlidesYet &&           // nothing to show
      !loading &&              // not already running
      !autoGenerateRef.current // hasn't fired before
    ) {
      autoGenerateRef.current = true; // lock
      genSlides();                    // same helper used by the button
    }
  }, [paperId, slides, loading]);

  /* route guard --------------------------------------------------- */
  const crumbs = [{ label: 'Slide Creation', href: '/slide-creation' }];
  if (!paperId) {
    return (
      <Layout title="Slide Creation" breadcrumbs={crumbs}>
        <EmptyState/>
      </Layout>
    );
  }

  return (
    <Layout breadcrumbs={crumbs}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="max-w-7xl mx-auto space-y-3"
      >
        {/* header */}
        <Header
          slides={slides}
          loading={loading}
          downPdf={downPdf}
          downLatex={downLatex}
          genSlides={genSlides}
          dlPdf={dlPdf}
          dlLatex={dlLatex}
          toNext={progressToNextStep}
        />

        {/* progress banner */}
        {loading && <ProgressBanner />}

        {/* preview - only show if slides exist */}
        {slides?.length > 0 && (
          <PreviewCard
            slides={slides}
            loading={loading}
            current={currentSlide}
            setCurrent={setCurrentSlide}
            regen={genSlides}
          />
        )}

        {/* empty state - only show if no slides and not loading */}
        {!slides?.length && !loading && (
          <GeneratePrompt onGenerate={genSlides} loading={loading} />
        )}
      </motion.div>
    </Layout>
  );
};

/* ────────────────────── sub-components ─────────────────────── */

const Header = ({
  slides,
  loading,
  downPdf,
  downLatex,
  genSlides,
  dlPdf,
  dlLatex,
  toNext
}) => (
  <div className="bg-white dark:bg-neutral-800 rounded-md p-5 border border-neutral-300 dark:border-neutral-600 shadow-sm">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* title + subtitle */}
      <div>
        <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-gray-100">
          Create Presentation Slides
        </h2>
        <p className="font-sans text-neutral-600 dark:text-neutral-400">
          Generate beautiful LaTeX slides from your scripts
        </p>
      </div>

      {/* action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!slides?.length ? (
          <PrimaryButton
            onClick={genSlides}
            disabled={loading}
            icon={FiSliders}
            loading={loading}
          >
            Generate Slides
          </PrimaryButton>
        ) : (
          <>
            <NeutralButton
              onClick={dlPdf}
              disabled={downPdf}
              icon={FiDownload}
              loading={downPdf}
            >
              Download PDF
            </NeutralButton>
            <NeutralButton
              onClick={dlLatex}
              disabled={downLatex}
              icon={FiDownload}
              loading={downLatex}
            >
              Download LaTeX
            </NeutralButton>
            <NeutralButton onClick={toNext} icon={FiArrowRight}>
              Continue to Audio & Video
            </NeutralButton>
          </>
        )}
      </div>
    </div>
  </div>
);

/* button helpers – monochrome palette, system fonts */
const PrimaryButton = ({ children, onClick, disabled, icon: Icon, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="
      flex items-center justify-center px-6 py-3
      bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400
      text-white font-sans font-medium rounded-md
      transition-colors duration-150
    "
  >
    {loading ? (
      <LoadingSpinner size="sm" className="mr-2" />
    ) : (
      <Icon className="w-5 h-5 mr-2" />
    )}
    {loading ? 'Working…' : children}
  </button>
);

const NeutralButton = ({ children, onClick, disabled, icon: Icon, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="
      flex items-center justify-center px-6 py-3
      bg-gray-900 hover:bg-gray-600 disabled:bg-gray-400
      text-white font-sans font-medium rounded-md
      transition-colors duration-150
    "
  >
    {loading ? (
      <LoadingSpinner size="sm" className="mr-2" />
    ) : (
      <Icon className="w-5 h-5 mr-2" />
    )}
    {loading ? 'Downloading…' : children}
  </button>
);

const ProgressBanner = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }}
    className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-6"
  >
    <div className="flex items-center space-x-3">
      <LoadingSpinner size="md"/>
      <div>
        <h3 className="text-lg font-heading font-semibold text-brand-800 dark:text-brand-200 mb-1">
          Generating Slides…
        </h3>
        <p className="font-body text-brand-700 dark:text-brand-300 text-sm">
          AI is converting your scripts into LaTeX slides. This may take a moment.
        </p>
      </div>
    </div>
  </motion.div>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <FiSliders className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-4"/>
    <h2 className="text-2xl font-heading font-semibold text-neutral-900 dark:text-white mb-2">
      No Paper Selected
    </h2>
    <p className="font-body text-neutral-600 dark:text-neutral-400">
      Please complete the script generation step first.
    </p>
  </div>
);

const GeneratePrompt = ({ onGenerate, loading }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600"
  >
    <FiSliders className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-4"/>
    <h3 className="text-xl font-heading font-semibold text-neutral-900 dark:text-white mb-2">
      Ready to Create Slides
    </h3>
    <p className="font-body text-neutral-600 dark:text-neutral-400 mb-6">
      Generate professional LaTeX slides from your presentation scripts.
    </p>
    <PrimaryButton 
      onClick={onGenerate} 
      disabled={loading} 
      icon={FiSliders} 
      loading={loading}
    >
      Generate Slides
    </PrimaryButton>
  </motion.div>
);

export default SlideCreation;