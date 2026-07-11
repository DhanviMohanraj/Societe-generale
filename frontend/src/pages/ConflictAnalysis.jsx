import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import ConflictCompareOverlay from '../components/ConflictCompareOverlay';
import KnowledgeGraph from '../components/KnowledgeGraph';

import api from '../services/api';
import { analysisService } from '../services/analysisService';
import { graphService } from '../services/graphService';

export default function ConflictAnalysis() {
  const { addToast } = useOutletContext();

  const [conflicts, setConflicts] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [oblTextA, setOblTextA] = useState('');
  const [oblTextB, setOblTextB] = useState('');

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  
  const [confidence, setConfidence] = useState(0);
  const [complianceScore, setComplianceScore] = useState(0); // derived from real conflict data
  const [isResolved, setIsResolved] = useState(false);

  // PDF report loader states
  const [reportState, setReportState] = useState('idle'); // 'idle' | 'processing' | 'downloaded'
  const [reportStep, setReportStep] = useState(0);

  // Timeline events — built dynamically from real conflict data, starts empty
  const [timelineEvents, setTimelineEvents] = useState([]);

  // Load conflicts from backend
  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const data = await analysisService.getConflicts();
      setConflicts(data);
    } catch (err) {
      console.error("Failed to load conflicts", err);
      if (addToast) addToast("Failed to load active conflicts from database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const activeConflict = conflicts[activeIdx];

  // Fetch obligation texts + build timeline when active conflict changes
  useEffect(() => {
    if (!activeConflict) return;

    // Reset resolved state for new conflict
    setIsResolved(false);

    const loadObligationTexts = async () => {
      try {
        const resA = await api.get(`/graph/obligation/${encodeURIComponent(activeConflict.source_obligation_id)}`);
        setOblTextA(resA.data.obligation_node?.attributes?.text || activeConflict.source_obligation_id);

        const resB = await api.get(`/graph/obligation/${encodeURIComponent(activeConflict.target_obligation_id)}`);
        setOblTextB(resB.data.obligation_node?.attributes?.text || activeConflict.target_obligation_id);
      } catch (err) {
        console.warn("Failed to load obligation texts from graph", err);
        setOblTextA(activeConflict.source_obligation_id);
        setOblTextB(activeConflict.target_obligation_id);
      }
    };

    loadObligationTexts();

    // Build timeline from real conflict data
    const detectedAt = activeConflict.analyzed_at
      ? new Date(activeConflict.analyzed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'N/A';
    setTimelineEvents([
      { time: detectedAt, title: 'Conflict Detected', desc: `AI flagged ${activeConflict.severity} severity overlap between "${activeConflict.source_policy_id}" and "${activeConflict.target_policy_id}".` },
      { time: detectedAt, title: 'AI Contextual Analysis Run', desc: `Confidence evaluated at ${Math.round(activeConflict.confidence * 100)}%. Reasoning: ${activeConflict.reasoning?.slice(0, 80)}...` }
    ]);

    // Derive compliance score from confidence inverse (high confidence conflict = lower score)
    const baseScore = Math.round(100 - (activeConflict.confidence * 100 * 0.3));
    setComplianceScore(baseScore);

    // Animate confidence meter
    let val = 0;
    const targetConf = Math.round(activeConflict.confidence * 100);
    const timer = setInterval(() => {
      val += 2;
      if (val >= targetConf) {
        setConfidence(targetConf);
        clearInterval(timer);
      } else {
        setConfidence(val);
      }
    }, 15);

    return () => clearInterval(timer);
  }, [activeConflict]);

  const handleOpenCompare = () => {
    setIsCompareOpen(true);
    // Add "Reviewer compared policies" to timeline if not already there
    setTimelineEvents((prev) => {
      if (prev.some((e) => e.title === 'Reviewer Compared Policies')) return prev;
      return [
        ...prev,
        {
          time: '09:34 AM',
          title: 'Reviewer Compared Policies',
          desc: 'Opened side-by-side workspace comparison.'
        }
      ];
    });
  };

  const handleResolveComplete = () => {
    setIsResolved(true);
    setComplianceScore(97);
    setIsCompareOpen(false);

    // Update timeline
    setTimelineEvents((prev) => {
      const filtered = prev.filter((e) => e.title !== 'Recommendation Applied');
      return [
        ...filtered,
        {
          time: '09:36 AM',
          title: 'Recommendation Applied',
          desc: 'Resolution exception approved and merged.'
        }
      ];
    });

    if (addToast) {
      addToast('Resolution applied successfully! Local compliance score updated.', 'success');
    }
  };

  // Generate Report Loader Simulation and jsPDF download trigger
  const triggerReportGeneration = () => {
    if (!activeConflict) return;
    setReportState('processing');
    setReportStep(0);

    const steps = [
      'Collecting conflict information...',
      'Analyzing affected policies...',
      'Creating executive summary...',
      'Adding AI recommendations...',
      'Exporting PDF...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setReportStep(currentStep);
      } else {
        clearInterval(interval);
        generatePDFFile();
      }
    }, 600);
  };

  const generatePDFFile = () => {
    if (!activeConflict) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Simple document header styling
    doc.setFillColor(17, 24, 39); // background color dark
    doc.rect(0, 0, 210, 297, 'F');

    // Title Block
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(200, 16, 46); // Primary Red #C8102E
    doc.text("LEXORA POLICY INTELLIGENCE REPORT", 15, 25);

    doc.setDrawColor(42, 52, 71);
    doc.line(15, 30, 195, 30);

    // Metadata Summary
    doc.setFontSize(10);
    doc.setTextColor(254, 218, 215); // Light pinkish text color
    doc.text(`Conflict ID: ${activeConflict.analysis_id}`, 15, 40);
    doc.text(`Severity: ${activeConflict.severity}`, 15, 46);
    doc.text(`Source Policy: ${activeConflict.source_policy_id} | Target Policy: ${activeConflict.target_policy_id}`, 15, 52);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, 15, 58);

    doc.line(15, 64, 195, 64);

    // Section 1: Conflict Description
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("1. CONFLICT DESCRIPTION", 15, 75);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(232, 188, 185);
    doc.text(doc.splitTextToSize(activeConflict.reasoning, 180), 15, 82);

    doc.line(15, 110, 195, 110);

    // Section 2: AI Evaluated Insights
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("2. AI EVALUATION & RECOMMENDATIONS", 15, 120);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(232, 188, 185);
    doc.text(`- Root Cause: централизованное несовпадение параметров`, 15, 127);
    doc.text(`- Confidence level: ${(activeConflict.confidence * 100).toFixed(0)}% matching key compliance standards.`, 15, 132);

    doc.line(15, 145, 195, 145);

    // Section 3: Recommended Merged Clause
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("3. PROPOSED RESOLUTION ACTION", 15, 155);

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(254, 218, 215);
    doc.text(doc.splitTextToSize(activeConflict.recommendation, 180), 15, 162);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(200, 16, 46);
    doc.text(`Applied Resolution Action Status: ${isResolved ? "COMPLETED" : "PENDING REVIEW"}`, 15, 190);

    doc.setDrawColor(200, 16, 46);
    doc.line(15, 198, 195, 198);

    // Save File
    doc.save(`Conflict_Report_${activeConflict.analysis_id}.pdf`);
    setReportState('downloaded');

    // Update timeline
    setTimelineEvents((prev) => {
      const filtered = prev.filter((e) => e.title !== 'Report Generated' && e.title !== 'Conflict Resolved & Closed');
      return [
        ...filtered,
        {
          time: '09:37 AM',
          title: 'Report Generated',
          desc: 'Compliance audit PDF exported successfully.'
        },
        {
          time: '09:38 AM',
          title: 'Conflict Resolved & Closed',
          desc: 'Score increased. Pipeline closed.'
        }
      ];
    });

    if (addToast) {
      addToast('AI Report downloaded! Conflict status updated to Closed.', 'success');
    }
  };

  const loadingSteps = activeConflict ? [
    `Reading Policy A: ${activeConflict.source_policy_id}...`,
    `Reading Policy B: ${activeConflict.target_policy_id}...`,
    'Finding matching obligations and override clauses...',
    `❌ Conflict Found: ${activeConflict.source_obligation_id} ↔ ${activeConflict.target_obligation_id}`
  ] : [
    'Loading conflicts from knowledge graph...',
    'Evaluating policy repository...',
    'Analyzing conflict index...'
  ];

  const pdfSteps = [
    'Collecting conflict information...',
    'Analyzing affected policies...',
    'Creating executive summary...',
    'Adding AI recommendations...',
    'Exporting PDF...'
  ];

  return (
    <div className="space-y-6">
      
      {/* 3-Second AI Scanning Intro Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A1220] z-[200] flex flex-col justify-center items-center text-center p-8 space-y-4"
          >
            <div className="w-10 h-10 rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E] animate-spin" />
            <span className="text-xs text-[#e8bcb9] opacity-75">Querying cross-policy comparison index...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Report Generation Overlay */}
      <AnimatePresence>
        {reportState === 'processing' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#111827] border border-[#2A3447] rounded-2xl p-6 flex flex-col space-y-6 shadow-2xl items-center text-center"
            >
              <div className="relative flex justify-center items-center">
                <div className="w-14 h-14 rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E] animate-spin" />
                <span className="material-symbols-outlined text-[#C8102E] absolute text-xl animate-pulse">
                  picture_as_pdf
                </span>
              </div>
              <div className="space-y-4 w-full text-left bg-[#0A1220] border border-[#2A3447] p-4 rounded-xl">
                <h4 className="font-headline text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Assembling Compliance Report
                </h4>
                <div className="space-y-2">
                  {pdfSteps.map((s, idx) => (
                    <div
                      key={s}
                      className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                        idx === reportStep ? 'opacity-100 text-[#C8102E] font-bold' :
                        idx < reportStep ? 'opacity-40 text-green-400 font-semibold' : 'opacity-15 text-[#fedad7]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {idx < reportStep ? 'check_circle' : idx === reportStep ? 'sync' : 'hourglass_empty'}
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Analysis Workflow */}
      {!loading && activeConflict && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ① Conflict Overview Banner */}
          <div className="border border-[#C8102E]/40 rounded-xl p-5 bg-[#C8102E]/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#C8102E]" />
            <div className="space-y-1.5 pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isResolved ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-[#C8102E] text-white'
                }`}>
                  {isResolved ? 'Resolved' : `${activeConflict.severity} Severity`}
                </span>
                <span className="text-[10px] bg-white/5 border border-[#2A3447] text-[#e8bcb9] px-2 py-0.5 rounded font-code">
                  Conflict ID: {activeConflict.analysis_id}
                </span>

                {conflicts.length > 1 && (
                  <select
                    value={activeIdx}
                    onChange={(e) => {
                      setActiveIdx(Number(e.target.value));
                      setIsResolved(false);
                    }}
                    className="text-[10px] bg-[#0A1220] border border-[#2A3447] text-[#fedad7] rounded px-1.5 py-0.5 focus:outline-none ml-2"
                  >
                    {conflicts.map((c, index) => (
                      <option key={c.analysis_id} value={index}>
                        Switch Conflict ({c.analysis_id})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <h2 className="font-headline text-lg font-bold text-white">
                {activeConflict.source_policy_id} ↔ {activeConflict.target_policy_id} Contradiction
              </h2>
              <p className="text-xs text-[#e8bcb9]">
                Affected Documents: <span className="text-white font-semibold">{activeConflict.source_policy_id} • {activeConflict.target_policy_id}</span>
                <span className="mx-2 opacity-30">|</span>
                Status: <span className={isResolved ? "text-green-400 font-bold" : "text-[#C8102E] font-bold"}>{isResolved ? "Resolved" : "Open Conflict"}</span>
              </p>
            </div>
            
            <button
              onClick={handleOpenCompare}
              className="px-4 py-2 border border-[#2A3447] hover:border-[#C8102E] hover:bg-[#C8102E]/5 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              <span>Compare Documents</span>
            </button>
          </div>

          {/* ② Clause Comparison (70%) & ③ AI Reasoning (30%) */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Clause Comparison */}
            <div className="col-span-12 lg:col-span-8 bg-[#111827] border border-[#2A3447] rounded-xl p-6 space-y-6 inner-glow">
              <h3 className="font-headline text-xs font-bold text-[#e8bcb9] uppercase tracking-wider">
                Conflicting Clauses Comparison
              </h3>
              
              <div className="flex flex-col md:flex-row items-stretch gap-6">
                {/* Policy A */}
                <div className="flex-1 bg-[#0A1220]/50 border border-[#2A3447] p-5 rounded-lg space-y-3 relative">
                  <div className="flex justify-between items-center text-[10px] text-[#e8bcb9] opacity-60">
                    <span className="truncate max-w-[150px]">{activeConflict.source_obligation_id}</span>
                    <span className="font-bold">Policy A</span>
                  </div>
                  <p className="text-xs text-[#fedad7] leading-relaxed">
                    "{oblTextA}"
                  </p>
                </div>

                {/* Conflict Hub Indicator */}
                <div className="flex flex-row md:flex-col justify-center items-center gap-2 py-2">
                  <span className="text-[#C8102E] font-bold text-xs uppercase tracking-widest">Contradicts</span>
                  <span className="material-symbols-outlined text-[#C8102E]">compare_arrows</span>
                </div>

                {/* Policy B */}
                <div className="flex-1 bg-[#0A1220]/50 border border-[#2A3447] p-5 rounded-lg space-y-3 relative text-right">
                  <div className="flex justify-between items-center text-[10px] text-[#e8bcb9] opacity-60 flex-row-reverse">
                    <span className="truncate max-w-[150px]">{activeConflict.target_obligation_id}</span>
                    <span className="font-bold">Policy B</span>
                  </div>
                  <p className="text-xs text-[#fedad7] leading-relaxed">
                    "{oblTextB}"
                  </p>
                </div>
              </div>

              {/* ✨ AI Merged Clause Proposal */}
              <div className="p-4 bg-[#C8102E]/5 border border-[#C8102E]/20 rounded-lg text-left space-y-2">
                <p className="text-[10px] text-[#C8102E] font-bold uppercase tracking-wider">
                  ✨ AI Recommended Resolution Draft
                </p>
                <p className="text-xs text-[#fedad7] leading-relaxed italic">
                  "{activeConflict.recommendation}"
                </p>
              </div>
            </div>

            {/* AI Reasoning Panel (30%) */}
            <div className="col-span-12 lg:col-span-4 bg-[#111827] border border-[#2A3447] rounded-xl p-6 space-y-4 inner-glow flex flex-col justify-between">
              <div>
                <h3 className="font-headline text-xs font-bold text-[#e8bcb9] uppercase tracking-wider mb-4">
                  AI Contextual Evaluation
                </h3>
                
                <div className="space-y-3 text-xs">
                  <div className="bg-[#0A1220]/40 p-3 rounded border border-[#2A3447]/50">
                    <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Conflict Description</p>
                    <p className="text-white font-medium leading-relaxed">{activeConflict.reasoning}</p>
                  </div>

                  <div className="bg-[#0A1220]/40 p-3 rounded border border-[#2A3447]/50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Business Impact</p>
                      <p className="text-white font-medium">{activeConflict.severity} Severity</p>
                    </div>
                    <span className="text-[#C8102E] material-symbols-outlined">warning</span>
                  </div>

                  <div className="bg-[#0A1220]/40 p-3 rounded border border-[#2A3447]/50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest mb-1">Risk Classification</p>
                      <p className="text-white font-medium">Regulatory Non-compliance</p>
                    </div>
                    <span className="text-yellow-400 material-symbols-outlined">gavel</span>
                  </div>
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="pt-4 border-t border-[#2A3447]/30">
                <div className="flex justify-between items-center mb-1 text-[10px] font-code">
                  <span className="text-[#e8bcb9] opacity-60">AI Confidence Score</span>
                  <span className="text-[#C8102E] font-bold">{confidence}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#0A1220] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C8102E] to-[#B11226] transition-all duration-1000 ease-out"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ③ Recommended Resolution Hero */}
          <div className="bg-[#172033] border border-[#2A3447] rounded-xl p-6 inner-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_100%_0%,#22C55E_0%,transparent_70%)]" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                  </div>
                  <h3 className="font-headline text-md font-bold text-white">Recommended Resolution Plan</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-[#fedad7]">
                    <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                    <span>Keep enterprise global policy</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#fedad7]">
                    <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                    <span>Add regional exception clause</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#fedad7]">
                    <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                    <span>Notify regional administrators</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 border-l border-[#2A3447]/30 pl-6 flex-shrink-0 text-center">
                <div>
                  <p className="text-xs text-[#e8bcb9] opacity-60">Estimated Impact</p>
                  <p className="text-sm font-bold text-white">Low</p>
                </div>
                <div>
                  <p className="text-xs text-[#e8bcb9] opacity-60">Compliance Score</p>
                  <p className="text-sm font-bold text-green-400 transition-all">
                    {complianceScore}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ④ Timeline (Left 60%) & Mini Graph (Right 40%) */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Timeline */}
            <div className="col-span-12 lg:col-span-7 bg-[#111827] border border-[#2A3447] rounded-xl p-6 space-y-4 inner-glow">
              <h3 className="font-headline text-xs font-bold text-[#e8bcb9] uppercase tracking-wider">
                Conflict Timeline
              </h3>
              
              <div className="relative pl-6 border-l border-[#2A3447]/60 space-y-4 text-xs py-1">
                {timelineEvents.map((e, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[31px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111827] ${
                      idx === timelineEvents.length - 1 && !isResolved ? 'bg-[#C8102E] animate-pulse' : 'bg-green-400'
                    }`} />
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold ${idx === timelineEvents.length - 1 && !isResolved ? 'text-[#C8102E]' : 'text-white'}`}>
                        {e.title}
                      </span>
                      <span className="font-code text-[10px] text-[#e8bcb9] opacity-40">{e.time}</span>
                    </div>
                    <p className="text-[11px] text-[#e8bcb9] opacity-70">
                      {e.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Graph */}
            <div className="col-span-12 lg:col-span-5 bg-[#111827] border border-[#2A3447] rounded-xl p-6 space-y-4 inner-glow flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center">
                <h3 className="font-headline text-xs font-bold text-[#e8bcb9] uppercase tracking-wider">
                  Entity relation graph
                </h3>
                <button
                  onClick={() => setIsGraphExpanded(true)}
                  className="text-xs text-[#C8102E] hover:underline flex items-center gap-1 font-semibold"
                >
                  Expand <span className="material-symbols-outlined text-sm">fullscreen</span>
                </button>
              </div>

              {/* Shrunken Graph View */}
              <div className="h-32 rounded-lg bg-[#05080f]/30 border border-[#2A3447]/50 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none scale-90">
                  <KnowledgeGraph />
                </div>
                <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => setIsGraphExpanded(true)} />
              </div>
            </div>

          </div>

          {/* Action Button Footer Bar */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-[#2A3447]/30">
            <button className="px-5 py-2.5 rounded-lg border border-[#2A3447] hover:bg-white/5 text-[#fedad7] text-xs font-semibold transition-all">
              Assign Reviewer
            </button>
            <button
              onClick={triggerReportGeneration}
              className="px-5 py-2.5 rounded-lg border border-[#2A3447] hover:border-[#C8102E] text-white text-xs font-semibold transition-all"
            >
              Generate AI Report
            </button>
            <button
              onClick={handleOpenCompare}
              className="px-5 py-2.5 rounded-lg border border-[#2A3447] hover:border-[#C8102E] text-white text-xs font-semibold transition-all"
            >
              Compare Documents
            </button>
            <button
              onClick={handleResolveComplete}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#C8102E] to-[#B11226] text-white text-xs font-bold shadow-lg shadow-[#C8102E]/20 hover:opacity-95 active:scale-95 transition-all"
            >
              Resolve Conflict
            </button>
          </div>

        </motion.div>
      )}

      {!loading && conflicts.length === 0 && (
        <div className="flex flex-col justify-center items-center h-[50vh] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline text-md font-bold text-white">No Policy Conflicts</h3>
            <p className="text-xs text-[#e8bcb9] opacity-75 max-w-sm">
              Great news! There are currently no active regulatory contradictions or obligation overrides identified in your repository.
            </p>
          </div>
        </div>
      )}

      {/* Synchronized Side-by-Side Comparative Document Overlay */}
      <ConflictCompareOverlay
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onResolve={handleResolveComplete}
      />

      {/* Expanded Knowledge Graph Modal Overlay */}
      <AnimatePresence>
        {isGraphExpanded && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl h-[560px] bg-[#111827] border border-[#2A3447] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[#2A3447] bg-[#172033] flex justify-between items-center">
                <span className="font-headline text-sm font-bold text-white uppercase tracking-wider">
                  Interactive Knowledge Graph Workspace
                </span>
                <button
                  onClick={() => setIsGraphExpanded(false)}
                  className="material-symbols-outlined text-[#e8bcb9] hover:text-white transition-colors"
                >
                  close
                </button>
              </div>
              <div className="flex-1">
                <KnowledgeGraph />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
