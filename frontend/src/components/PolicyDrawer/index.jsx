import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function PolicyDrawer({ isOpen, onClose, policy, addToast, setActivePolicy }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 to 4
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);

  // Timed AI extraction workflow when drawer is opened
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsDeepAnalyzing(false);

      const t1 = setTimeout(() => setStep(1), 1000); // 🤖 AI is extracting obligations...
      const t2 = setTimeout(() => setStep(2), 2000); // Related policies found...
      const t3 = setTimeout(() => setStep(3), 3000); // Summary generated...
      const t4 = setTimeout(() => setStep(4), 4000); // Display content

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [isOpen, policy]);

  if (!policy) return null;

  const handleDeepAIAnalysis = () => {
    setIsDeepAnalyzing(true);
    if (addToast) addToast('Triggering Deep AI Obligation Analysis...', 'info');

    setTimeout(() => {
      setIsDeepAnalyzing(false);
      if (addToast) addToast('Analysis complete! 2 conflict rules identified.', 'success');
      
      // Update global copilot context and navigate to conflicts
      if (setActivePolicy) {
        setActivePolicy(policy);
      }
      navigate('/conflicts');
    }, 2500);
  };

  const loadingMessages = [
    { text: 'Analyzing policy structure...', icon: 'analytics' },
    { text: '🤖 AI is extracting obligations and compliance boundaries...', icon: 'psychology' },
    { text: 'Searching related policies and entity networks...', icon: 'hub' },
    { text: 'Summary report generated successfully.', icon: 'check_circle' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-[480px] bg-[#111827] border-l border-[#2A3447] z-[100] overflow-y-auto"
          >
            <div className="p-6 h-full flex flex-col justify-between">
              
              {/* If still processing the initial extraction steps, render animated workflow loader */}
              {step < 4 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-8">
                  <div className="relative flex justify-center items-center">
                    {/* Ring Loader */}
                    <div className="w-16 h-16 rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E] animate-spin" />
                    <span className="material-symbols-outlined text-[#C8102E] absolute text-2xl animate-pulse">
                      {loadingMessages[step].icon}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-bold text-white">AI Analysis in Progress</h3>
                    
                    {/* Dynamic Loader Timestamps */}
                    <div className="space-y-2">
                      {loadingMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${
                            idx === step ? 'opacity-100 text-[#C8102E] font-bold' :
                            idx < step ? 'opacity-40 text-green-400 font-semibold' : 'opacity-20 text-[#e8bcb9]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {idx < step ? 'check' : idx === step ? 'sync' : 'hourglass_empty'}
                          </span>
                          <span>{msg.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Step 4: Display actual Content
                <div className="flex-1 flex flex-col">
                  {/* Close Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#C8102E]">analytics</span>
                      <span className="text-xs uppercase tracking-widest text-[#C8102E] font-bold">
                        Intelligence Report
                      </span>
                    </div>
                    <button
                      onClick={onClose}
                      className="material-symbols-outlined text-[#e8bcb9] hover:text-white transition-colors"
                    >
                      close
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mb-6">
                    <h2 className="font-headline text-2xl text-white mb-1">
                      {policy.title}
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-[#e8bcb9]">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        AI Verified
                      </div>
                      <span className="w-1 h-1 rounded-full bg-[#2A3447]" />
                      <span className="text-[#C8102E] font-code text-xs">
                        98.4% Confidence Score
                      </span>
                    </div>
                  </div>

                  {/* AI Summary Card */}
                  <div className="p-4 rounded-xl bg-[#172033] border border-[#2A3447]/50 ai-mesh mb-6">
                    <h4 className="text-xs font-bold text-[#e8bcb9] mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      AI Executive Summary
                    </h4>
                    <p className="text-xs text-[#fedad7] leading-relaxed">
                      {policy.summary || `The ${policy.title} maintains high alignment with US FCPA and UK Bribery Act requirements.`}
                    </p>
                  </div>

                  {/* Detailed Obligations */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <h4 className="text-xs font-bold text-[#e8bcb9] uppercase tracking-wider mb-3">
                        Key Obligations
                      </h4>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-[#fedad7] font-semibold">Reporting of Hospitality</p>
                            <p className="text-xs text-[#e8bcb9] opacity-60">Gifts exceeding $250 must be logged in the Global Registry within 48 hours.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-[#fedad7] font-semibold">Third-Party Due Diligence</p>
                            <p className="text-xs text-[#e8bcb9] opacity-60">All non-EU vendors require an L2 background check before contract issuance.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-[#e8bcb9] uppercase tracking-wider mb-3">
                        Policy Relationships
                      </h4>
                      <div className="flex items-center gap-3 p-3 bg-[#0A1220] border border-[#2A3447] rounded-lg">
                        <span className="material-symbols-outlined text-[#C8102E]">link</span>
                        <div>
                          <p className="text-xs text-[#fedad7]">Employee Code of Conduct</p>
                          <p className="text-[10px] text-[#e8bcb9] opacity-60">Direct Hierarchical Link</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-sm opacity-40">open_in_new</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button Area (always shown at the bottom of the drawer) */}
              {step === 4 && (
                <div className="pt-6 border-t border-[#2A3447]/30">
                  <button
                    disabled={isDeepAnalyzing}
                    onClick={handleDeepAIAnalysis}
                    className="w-full py-3 bg-gradient-to-r from-[#C8102E] to-[#B11226] text-white font-headline text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-[#C8102E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isDeepAnalyzing ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Running Deep Obligations Audit...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">psychology</span>
                        <span>Deep AI Analysis</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-[#e8bcb9] opacity-40 mt-3">
                    Generated in 1.4s • Lexora Model v4.2
                  </p>
                </div>
              )}

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
