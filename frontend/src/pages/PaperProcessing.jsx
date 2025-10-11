                                    import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/common/Layout';
import PaperUpload from '../components/forms/PaperUpload';
import MetadataEditor from '../components/forms/MetadataEditor';
import { GlowCard } from '../components/ui/spotlight-card';
import { useWorkflow } from '../contexts/WorkflowContext';
import { FiUpload, FiEdit3 } from 'react-icons/fi';

const PaperProcessing = () => {
  const { paperId, metadata } = useWorkflow();
  
  const breadcrumbs = [
    { label: 'Paper Processing', href: '/paper-processing' }
  ];

  return (
    <Layout title="" breadcrumbs={breadcrumbs}>
      {/* Enable global dark theme for this page and wrap content in landing gradient */}
      <div>
        <DarkPageWrapper />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="max-w-4xl mx-auto space-y-6 text-white"
      >
        {!paperId ? (
          <GlowCard className="p-6 bg-white/95 dark:bg-neutral-900 text-gray-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                <FiUpload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Upload Research Paper
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose your upload method to get started
                </p>
              </div>
            </div>
            <PaperUpload />
          </GlowCard>
        ) : (
          <GlowCard className="p-6 bg-white/95 dark:bg-neutral-900 text-gray-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-6">
            <MetadataEditor />
          </GlowCard>
        )}

        {/* Processing Status */}
        {paperId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.15 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {metadata?.title ? `"${metadata.title}"` : 'Your paper'} has been uploaded and is ready for script generation.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
      </div>
    </Layout>
  );
};

function DarkPageWrapper() {
  useEffect(() => {
    // apply the dark class to root so Tailwind's `dark:` variants take effect
    document.documentElement.classList.add('dark');
    // also ensure body background matches landing gradient
    const prevBg = document.body.style.background;
    document.body.style.background = 'linear-gradient(180deg, #071026 0%, #030406 60%, #071026 100%)';
    document.body.style.color = '#ffffff';
    return () => {
      document.documentElement.classList.remove('dark');
      document.body.style.background = prevBg || '';
      document.body.style.color = '';
    };
  }, []);

  // The wrapper element visually sits behind the page content; using a full-bleed fixed element
  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none">
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-black to-slate-800" />
    </div>
  );
}

export default PaperProcessing;