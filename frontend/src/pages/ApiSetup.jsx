import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiKey, FiSkipForward, FiInfo } from 'react-icons/fi';
import StarBorder from '../components/ui/star-border';
import { GlowCard } from '../components/ui/spotlight-card';
import { useWorkflow } from '../contexts/WorkflowContext';
import ApiSetupForm from './ApiSetupForm';
import Layout from '../components/common/Layout';

const ApiSetup = () => {
  const [showForm, setShowForm] = useState(false);
  const { progressToNextStep } = useWorkflow();

  const crumbs = [{ label: 'API Setup', href: '/api-setup' }];

  return (
    <Layout breadcrumbs={crumbs}>
      {/* full-screen landing gradient background placed behind everything */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, #071026 0%, #030406 60%, #071026 100%)' }} />
      {/* content container sits above the background */}
      <div className="min-h-screen text-white py-6 relative z-10">
        <div className="max-w-3xl mx-auto space-y-6">
        {showForm ? (
          <ApiSetupForm />
        ) : (
          <>
            {/* Strong banner - dark themed for landing look */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border-l-4 border-indigo-500 rounded-r-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <FiInfo className="w-5 h-5 text-indigo-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">
                    <strong>Note:</strong> API keys are optional but recommended for best experience. 
                    You can always configure them later in the settings.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* setup card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <GlowCard className="p-6 bg-white/5 text-white rounded-xl border border-neutral-700 space-y-6">

                {/* icon section */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiKey className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    You can configure these now or skip this step and set them up later.
                  </p>
                </div>

                {/* action buttons - keep handlers unchanged but apply button effect */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <StarBorder as="button" onClick={() => setShowForm(true)} className="sm:flex-1">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent text-white font-medium w-full">
                      <FiKey className="w-5 h-5" />
                      Configure API Keys
                    </div>
                  </StarBorder>

                  <StarBorder as="button" onClick={progressToNextStep} className="sm:flex-1">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent text-white font-medium w-full">
                      <FiSkipForward className="w-5 h-5" />
                      Skip for Now
                    </div>
                  </StarBorder>
                </div>
              </GlowCard>
            </motion.div>
          </>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default ApiSetup;
