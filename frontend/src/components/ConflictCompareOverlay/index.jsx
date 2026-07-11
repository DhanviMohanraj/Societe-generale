import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

export default function ConflictCompareOverlay({ isOpen, onClose, onResolve }) {
  const [showResolution, setShowResolution] = useState(false);
  const [resolveState, setResolveState] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [resolveProgress, setResolveProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const bottomRef = useRef(null);

  const steps = [
    'Applying Recommendation...',
    'Updating enterprise policy...',
    'Creating exception clause...',
    'Recording audit trail...'
  ];

  // Disable background scrolling on mount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setShowResolution(false);
      setResolveState('idle');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleEvaluate = () => {
    setShowResolution(true);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleApplyClick = () => {
    setResolveState('processing');
    setResolveProgress(0);
    setActiveStep(0);

    const totalDuration = 2000;
    const intervalTime = 50;
    const stepsCount = totalDuration / intervalTime;
    let stepNumber = 0;

    const interval = setInterval(() => {
      stepNumber++;
      const currentProgress = Math.min(Math.round((stepNumber / stepsCount) * 100), 100);
      setResolveProgress(currentProgress);

      if (currentProgress < 25) setActiveStep(0);
      else if (currentProgress < 50) setActiveStep(1);
      else if (currentProgress < 75) setActiveStep(2);
      else setActiveStep(3);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setResolveState('success');
      }
    }, intervalTime);
  };

  const handleSuccessClose = () => {
    setResolveState('idle');
    if (onResolve) {
      onResolve();
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 210, 297, 'F');

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(200, 16, 46);
    doc.text("LEXORA COMPLIANCE COMPARISON REPORT", 15, 25);

    doc.setDrawColor(42, 52, 71);
    doc.line(15, 30, 195, 30);

    // Section 1: Compared Policies
    doc.setFontSize(10);
    doc.setTextColor(254, 218, 215);
    doc.text("Policy A: Global Password Policy (POL-GBL-204) - v1.8", 15, 42);
    doc.text("Policy B: EMEA Regional Standard (POL-REG-EMEA-08) - v1.1", 15, 48);

    doc.line(15, 56, 195, 56);

    // Section 2: AI Explanation
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("1. AI CONFLICT EXPLANATION", 15, 68);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(232, 188, 185);
    doc.text("Root Cause: The regional policy overrides the enterprise security mandate, creating a compliance violation.", 15, 75);
    doc.text("Affected Regulations: GDPR, ISO 27001, SOC2", 15, 81);
    doc.text("AI Confidence: 98%", 15, 87);

    doc.line(15, 95, 195, 95);

    // Section 3: Recommended Merged Clause
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("2. AI RECOMMENDED MERGED CLAUSE", 15, 107);

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(254, 218, 215);
    doc.text('"Enterprise systems shall follow a 90-day password rotation cycle. Regional offices may', 15, 114);
    doc.text('extend this period only through approved compliance exceptions documented within the', 15, 119);
    doc.text('central governance registry."', 15, 124);

    doc.save("Compliance_Comparison_CON-882.pdf");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
        {/* Dark Blurred Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A1220]/80 backdrop-blur-xl pointer-events-auto"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-5xl h-[85vh] bg-[#111827] border border-[#2A3447] rounded-2xl flex flex-col overflow-hidden shadow-2xl z-10"
        >
          {/* Header */}
          <div className="px-8 py-4 border-b border-[#2A3447] bg-[#172033] flex justify-between items-center flex-shrink-0">
            <div className="space-y-0.5">
              <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">
                Document Comparison Workspace
              </h3>
              <p className="text-[10px] text-[#e8bcb9] opacity-60">
                Compare policy clauses and review AI recommendations
              </p>
            </div>
            <button
              onClick={onClose}
              className="material-symbols-outlined text-[#e8bcb9] hover:text-white transition-colors"
            >
              close
            </button>
          </div>

          {/* Dynamic Resolve State Processing */}
          {resolveState === 'processing' && (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-8 bg-[#0A1220]">
              <div className="relative flex justify-center items-center">
                <div className="w-16 h-16 rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E] animate-spin" />
                <span className="font-code text-xs text-[#C8102E] font-bold absolute">{resolveProgress}%</span>
              </div>
              <div className="space-y-4 max-w-sm text-left bg-[#111827] border border-[#2A3447] p-5 rounded-xl shadow-lg">
                <h4 className="font-headline text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Applying Merged Resolution
                </h4>
                <div className="space-y-2">
                  {steps.map((s, idx) => (
                    <div
                      key={s}
                      className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                        idx === activeStep ? 'opacity-100 text-[#C8102E] font-bold' :
                        idx < activeStep ? 'opacity-40 text-green-400 font-semibold' : 'opacity-10 text-[#fedad7]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {idx < activeStep ? 'check_circle' : idx === activeStep ? 'sync' : 'hourglass_empty'}
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {resolveState === 'success' && (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-6 bg-[#0A1220]">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="font-headline text-lg font-bold text-white">✓ Recommendation Applied Successfully</h3>
                <div className="text-xs text-[#e8bcb9] leading-relaxed space-y-1">
                  <p>Enterprise policy updated</p>
                  <p>Audit trail recorded</p>
                  <p>Report regenerated</p>
                </div>
              </div>
              <button
                onClick={handleSuccessClose}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C8102E] to-[#B11226] text-white font-headline text-xs font-bold rounded-lg shadow-lg hover:opacity-95 active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          )}

          {/* Normal View Scrollable Workspace */}
          {resolveState === 'idle' && (
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0A1220]/30">
              
              {/* Section 1: Side-by-Side Policy Comparison */}
              <div className="grid grid-cols-2 gap-6 flex-shrink-0">
                {/* Left Side: Policy A */}
                <div className="bg-[#111827] border border-[#2A3447] rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#2A3447]/30">
                    <div className="space-y-0.5">
                      <h4 className="font-headline text-[11px] font-bold text-white">Policy A: Global Password Policy</h4>
                      <p className="text-[9px] text-[#e8bcb9] opacity-60">Security Operations • Dept</p>
                    </div>
                    <span className="font-code text-[9px] bg-white/5 px-2 py-0.5 rounded text-[#fedad7]">
                      POL-GBL-204 (v1.8)
                    </span>
                  </div>
                  
                  <div className="bg-[#0A1220]/50 border border-[#2A3447] p-4 rounded-lg space-y-2">
                    <p className="text-[10px] text-[#e8bcb9] opacity-40 font-code uppercase">Section 4.2</p>
                    <p className="text-xs text-[#fedad7] leading-relaxed">
                      "All system credentials must be subject to a strict rotation cycle of{' '}
                      <span className="bg-[#C8102E]/25 text-[#ffb3ae] border border-[#C8102E]/40 px-1 py-0.5 rounded font-bold">
                        90 Days
                      </span>
                      . Central directory managers are responsible for enforcing automatic system locks."
                    </p>
                  </div>
                </div>

                {/* Right Side: Policy B */}
                <div className="bg-[#111827] border border-[#2A3447] rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#2A3447]/30">
                    <div className="space-y-0.5">
                      <h4 className="font-headline text-[11px] font-bold text-white">Policy B: EMEA Regional Standard</h4>
                      <p className="text-[9px] text-[#e8bcb9] opacity-60">EMEA Operations • Dept</p>
                    </div>
                    <span className="font-code text-[9px] bg-white/5 px-2 py-0.5 rounded text-[#fedad7]">
                      POL-REG-EMEA-08 (v1.1)
                    </span>
                  </div>
                  
                  <div className="bg-[#0A1220]/50 border border-[#2A3447] p-4 rounded-lg space-y-2">
                    <p className="text-[10px] text-[#e8bcb9] opacity-40 font-code uppercase">Section 3.1</p>
                    <p className="text-xs text-[#fedad7] leading-relaxed">
                      "EMEA regional operations may implement local settings up to{' '}
                      <span className="bg-[#C8102E]/25 text-[#ffb3ae] border border-[#C8102E]/40 px-1 py-0.5 rounded font-bold">
                        180 Days
                      </span>
                      . Note: This exception has not been formally approved by compliance."
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: AI Conflict Explanation */}
              <div className="bg-[#111827] border border-[#2A3447] rounded-xl p-5 space-y-4">
                <h4 className="font-headline text-xs font-bold text-[#e8bcb9] uppercase tracking-wider">
                  AI Conflict Explanation
                </h4>
                
                <div className="grid grid-cols-12 gap-6 items-start text-xs">
                  <div className="col-span-8 bg-[#0A1220]/40 p-4 rounded-lg border border-[#2A3447]/50 space-y-2">
                    <p className="font-bold text-white">Root Cause</p>
                    <p className="text-[#fedad7] opacity-80 leading-relaxed">
                      The regional policy overrides the enterprise security mandate, creating a compliance violation that disrupts active centralized directory audit reporting.
                    </p>
                  </div>

                  <div className="col-span-4 space-y-4">
                    <div className="bg-[#0A1220]/40 p-3.5 rounded-lg border border-[#2A3447]/50 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Affected Regulations</p>
                        <p className="text-white font-semibold flex flex-wrap gap-1 mt-0.5">
                          <span className="bg-white/5 border border-[#2A3447] px-1.5 py-0.5 rounded text-[9px]">GDPR</span>
                          <span className="bg-white/5 border border-[#2A3447] px-1.5 py-0.5 rounded text-[9px]">ISO 27001</span>
                          <span className="bg-white/5 border border-[#2A3447] px-1.5 py-0.5 rounded text-[9px]">SOC2</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] font-code">
                        <span className="text-[#e8bcb9] opacity-60">AI Confidence Score</span>
                        <span className="text-[#C8102E] font-bold">98%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0A1220] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#C8102E] to-[#B11226] w-[98%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progressive disclosure toggle button */}
                {!showResolution && (
                  <div className="pt-4 border-t border-[#2A3447]/30 flex justify-center">
                    <button
                      onClick={handleEvaluate}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#C8102E] to-[#B11226] hover:opacity-95 text-white font-headline text-xs font-bold rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>Evaluate AI Recommendation Plan</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Progressive Disclosure Content (Sections 3, 4, 5) */}
              {showResolution && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Section 3: AI Recommended Clause */}
                  <div className="bg-[#172033] border border-[#C8102E]/30 rounded-xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#C8102E]" />
                    <h4 className="font-headline text-xs font-bold text-[#C8102E] uppercase tracking-wider mb-2">
                      ✨ AI Recommended Merged Clause
                    </h4>
                    <p className="text-xs text-[#fedad7] leading-relaxed italic bg-[#0A1220]/60 p-4 rounded-lg border border-[#2A3447]/30">
                      "Enterprise systems shall follow a 90-day password rotation cycle. Regional offices may extend this period only through approved compliance exceptions documented within the central governance registry."
                    </p>
                  </div>

                  {/* Section 4: Impact Preview */}
                  <div className="bg-[#111827] border border-[#2A3447] rounded-xl p-5 space-y-4">
                    <h4 className="font-headline text-xs font-bold text-[#e8bcb9] uppercase tracking-wider">
                      Compliance Impact Preview
                    </h4>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-[#0A1220]/30 rounded-lg border border-[#2A3447]/50">
                        <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Compliance</p>
                        <p className="text-sm font-bold text-green-400">82% ➔ 97%</p>
                      </div>
                      <div className="p-3 bg-[#0A1220]/30 rounded-lg border border-[#2A3447]/50">
                        <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Conflicts</p>
                        <p className="text-sm font-bold text-green-400">2 ➔ 0</p>
                      </div>
                      <div className="p-3 bg-[#0A1220]/30 rounded-lg border border-[#2A3447]/50">
                        <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Risk Profile</p>
                        <p className="text-sm font-bold text-green-400">High ➔ Low</p>
                      </div>
                      <div className="p-3 bg-[#0A1220]/30 rounded-lg border border-[#2A3447]/50">
                        <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Policies Updated</p>
                        <p className="text-sm font-bold text-white">2</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Action Bar */}
                  <div className="pt-4 border-t border-[#2A3447]/30 flex justify-end gap-3" ref={bottomRef}>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-lg border border-[#2A3447] hover:bg-white/5 text-[#fedad7] text-xs font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleDownloadPDF}
                      className="px-5 py-2.5 rounded-lg border border-[#2A3447] hover:border-[#C8102E] text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>Download Report</span>
                    </button>

                    <button
                      onClick={handleApplyClick}
                      className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#C8102E] to-[#B11226] text-white text-xs font-bold shadow-lg shadow-[#C8102E]/20 hover:opacity-95 active:scale-95 transition-all"
                    >
                      Apply Recommendation
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
