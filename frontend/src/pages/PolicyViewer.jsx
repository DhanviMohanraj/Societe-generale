import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function PolicyViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, setIsCopilotOpen } = useOutletContext();

  const [aiState, setAiState] = useState('idle'); // 'idle' | 'analyzing' | 'completed'
  const [aiProgress, setAiProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [highlightedClause, setHighlightedClause] = useState(null); // { id: string, type: 'obligation' | 'conflict' }

  const pdfContainerRef = useRef(null);
  const clauseRefs = {
    hospitality: useRef(null),
    vendors: useRef(null),
    rotation: useRef(null),
    conflict: useRef(null)
  };

  // Mock Policy details
  const policyDatabase = {
    'POL-GBL-201': {
      id: 'POL-GBL-201',
      title: 'Global Anti-Corruption Policy',
      department: 'Legal & Compliance',
      version: 'v2.4',
      pages: [
        {
          num: 1,
          title: '1. EXECUTIVE STATEMENT',
          content: 'This Global Anti-Corruption Policy establishes Lexora\'s zero-tolerance stance on bribery and corruption. It applies to all operations, subsidiaries, directors, and contract workers globally.'
        },
        {
          num: 2,
          title: '2. GIFTS & CORPORATE HOSPITALITY',
          content: 'Any corporate hospitality gifts offered or received by any employee exceeding $250 USD must be logged in the Global Registry within 48 hours of receipt. Mandatory reporting is required for all instances.',
          clauseId: 'hospitality',
          clauseText: 'Gifts exceeding $250 must be logged in the Global Registry within 48 hours.'
        },
        {
          num: 3,
          title: '3. THIRD-PARTY DUE DILIGENCE',
          content: 'All third-party vendors operating outside the European Union require a Level 2 compliance background check before contract issuance. Non-EU vendors require additional background verification.',
          clauseId: 'vendors',
          clauseText: 'All non-EU vendors require an L2 background check before contract issuance.'
        }
      ],
      obligations: [
        { id: 'hospitality', title: 'Reporting of Hospitality', desc: 'Gifts exceeding $250 must be logged in the Global Registry within 48 hours.' },
        { id: 'vendors', title: 'Third-Party Due Diligence', desc: 'All non-EU vendors require an L2 background check before contract issuance.' }
      ],
      conflicts: [],
      summary: 'The Global Anti-Corruption Policy (v2.4) maintains high alignment with US FCPA and UK Bribery Act requirements. Our analysis identifies strict reporting thresholds for corporate hospitality ($250 USD) and mandates quarterly compliance certifications.'
    },
    'POL-GBL-204': {
      id: 'POL-GBL-204',
      title: 'IT Authentication Standards',
      department: 'Security Operations',
      version: 'v1.8',
      pages: [
        {
          num: 1,
          title: '1. SCOPE & IDENTITY MANAGEMENT',
          content: 'This policy governs employee authentication, password requirements and MFA enforcement protocols across all enterprise-level cloud and local operating environments.'
        },
        {
          num: 2,
          title: '2. CREDENTIAL ROTATION PERIOD',
          content: 'All system credentials must be subject to a strict rotation cycle of 90 Days. Central directory managers are responsible for enforcing automatic system locks on accounts failing this timeframe.',
          clauseId: 'rotation',
          clauseText: 'Rotation Cycle: 90 Days.'
        },
        {
          num: 3,
          title: '3. REGIONAL SETTING OVERRIDES',
          content: 'CONFLICT AREA: Regional operations in the EMEA region may implement local settings up to 180 Days. Note: This exception has not been formally approved by the central compliance registry.',
          clauseId: 'conflict',
          clauseText: 'EMEA regional settings allow rotation frequency up to 180 Days.'
        }
      ],
      obligations: [
        { id: 'rotation', title: 'Credential Rotation Period', desc: 'All system credentials must be subject to a strict rotation cycle of 90 Days.' }
      ],
      conflicts: [
        { id: 'conflict', title: 'EMEA Rotation Overlap', desc: 'EMEA regional settings allow rotation frequency up to 180 Days, directly violating the 90-day Global Standard.', target: '/conflicts' }
      ],
      summary: 'This policy governs cloud and operating systems authentication, but contains a severe password rotation frequency conflict with EMEA local setting overrides.'
    },
    'POL-HR-302': {
      id: 'POL-HR-302',
      title: 'Remote Work Guidelines',
      department: 'Human Resources',
      version: 'v3.1',
      pages: [
        {
          num: 1,
          title: '1. OVERVIEW & REMOTE ACCESS',
          content: 'Defines expectations for remote and hybrid work arrangements, including core hours, communication standards, and hardware reimbursement policies.'
        },
        {
          num: 2,
          title: '2. DATA ACCESS SEGREGATION',
          content: 'Employees working remotely must connect through the virtual private network (VPN) and ensure zero local storage of proprietary client information.'
        },
        {
          num: 3,
          title: '3. COMPLIANCE OBLIGATIONS',
          content: 'Provides details about physical and digital security requirements when executing operations outside regional business offices.'
        }
      ],
      obligations: [
        { id: 'remote_vpn', title: 'Obligatory VPN Access', desc: 'Remote workers must use designated secure VPN portals for all database entries.' }
      ],
      conflicts: [],
      summary: 'Provides detailed HR, hardware reimbursement, and secure remote VPN configurations.'
    }
  };

  const policy = policyDatabase[id] || policyDatabase['POL-GBL-201'];

  const runAIPipeline = () => {
    setAiState('analyzing');
    setAiProgress(0);
    setActiveStep(0);
    if (addToast) addToast('Kicking off AI Document Analysis...', 'info');

    // Simulate progress increments
    const totalDuration = 3000; // 3s total
    const intervalTime = 50;
    const stepsCount = totalDuration / intervalTime;
    let stepNumber = 0;

    const interval = setInterval(() => {
      stepNumber++;
      const currentProgress = Math.min(Math.round((stepNumber / stepsCount) * 100), 100);
      setAiProgress(currentProgress);

      // Transition stages based on progress levels
      if (currentProgress < 25) setActiveStep(0); // Reading clauses
      else if (currentProgress < 50) setActiveStep(1); // Finding obligations
      else if (currentProgress < 75) setActiveStep(2); // Comparing enterprise policies
      else setActiveStep(3); // Generating summary

      if (currentProgress >= 100) {
        clearInterval(interval);
        setAiState('completed');
        if (addToast) addToast('Document analysis report generated!', 'success');
      }
    }, intervalTime);
  };

  const scrollToClause = (clauseId, type) => {
    const targetRef = clauseRefs[clauseId];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedClause({ id: clauseId, type });

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedClause(null);
      }, 3000);
    }
  };

  const pipelineSteps = [
    'Reading clauses',
    'Finding obligations',
    'Comparing enterprise policies',
    'Generating summary'
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] overflow-hidden">
      
      {/* Left Column (70%): PDF Viewer */}
      <section className="flex-1 bg-[#111827] border border-[#2A3447] rounded-xl flex flex-col h-full overflow-hidden inner-glow">
        {/* Document header bar */}
        <div className="px-6 py-4 border-b border-[#2A3447] bg-[#172033] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C8102E]">description</span>
            <span className="font-headline text-sm font-bold text-white">{policy.title}</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-[#e8bcb9] opacity-60">
              {policy.id} • {policy.version}
            </span>
          </div>
          <span className="text-xs text-[#e8bcb9] opacity-60">
            Simulated PDF Reader
          </span>
        </div>

        {/* Scrollable Simulated Pages */}
        <div
          ref={pdfContainerRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#05080f]/50 scroll-smooth custom-scrollbar"
        >
          {policy.pages.map((page) => {
            const isHighlighted = highlightedClause && highlightedClause.id === page.clauseId;
            let highlightStyle = '';
            if (isHighlighted) {
              highlightStyle = highlightedClause.type === 'conflict'
                ? 'bg-red-500/20 border-l-4 border-l-[#C8102E] shadow-[0_0_15px_rgba(200,16,46,0.2)]'
                : 'bg-yellow-500/20 border-l-4 border-l-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            }

            return (
              <motion.div
                key={page.num}
                layout
                className="w-full bg-[#111827] border border-[#2A3447] rounded-xl shadow-lg p-8 relative min-h-[220px]"
              >
                {/* Page Page Number Indicator */}
                <div className="absolute top-4 right-4 text-[10px] text-[#e8bcb9] opacity-40 font-code">
                  Page {page.num}
                </div>

                <h3 className="font-headline text-xs font-bold text-[#e8bcb9] mb-4 opacity-50 tracking-wider">
                  {page.title}
                </h3>
                
                {/* Scroll Target Container */}
                <div
                  ref={page.clauseId ? clauseRefs[page.clauseId] : null}
                  className={`p-4 rounded-lg transition-all duration-300 ${highlightStyle}`}
                >
                  <p className="text-sm text-[#fedad7] leading-relaxed whitespace-pre-line">
                    {page.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Right Column (30%): AI actions panel */}
      <section className="w-80 bg-[#111827] border border-[#2A3447] rounded-xl flex flex-col h-full overflow-hidden inner-glow">
        
        {/* Panel Title */}
        <div className="px-6 py-4 border-b border-[#2A3447] bg-[#172033] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C8102E]">smart_toy</span>
            <span className="font-headline text-xs font-bold text-white uppercase tracking-wider">
              AI Panel
            </span>
          </div>
        </div>

        {/* Dynamic States */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* STATE 1: IDLE */}
          {aiState === 'idle' && (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-12">
              <div className="w-16 h-16 rounded-full bg-[#C8102E]/10 border border-[#C8102E]/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#C8102E] text-3xl animate-pulse">
                  psychology
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="font-headline text-md font-bold text-white">Compliance Intelligence</h3>
                <p className="text-xs text-[#e8bcb9] opacity-75 max-w-[220px] mx-auto leading-relaxed">
                  Trigger automated document analysis to extract key compliance obligations and compare against global standards.
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={runAIPipeline}
                className="px-6 py-3 w-full bg-gradient-to-r from-[#C8102E] to-[#B11226] text-white font-headline text-xs rounded-xl shadow-lg shadow-[#C8102E]/15 font-bold"
              >
                Analyze with AI
              </motion.button>
            </div>
          )}

          {/* STATE 2: PIPELINE PROCESSING */}
          {aiState === 'analyzing' && (
            <div className="h-full flex flex-col justify-center space-y-8 py-6">
              {/* Spinning progress */}
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E] animate-spin" />
                  <span className="font-code text-xs text-[#C8102E] font-bold absolute">
                    {aiProgress}%
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Analyzing Policy</h4>
                  <div className="font-code text-[10px] text-[#e8bcb9] opacity-40 mt-1">
                    [ {('█'.repeat(Math.round(aiProgress / 10))) + ('░'.repeat(10 - Math.round(aiProgress / 10)))} ]
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-3">
                {pipelineSteps.map((stepName, idx) => (
                  <div
                    key={stepName}
                    className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                      idx === activeStep ? 'opacity-100 text-[#C8102E] font-bold' :
                      idx < activeStep ? 'opacity-40 text-green-400 font-semibold' : 'opacity-20 text-[#e8bcb9]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {idx < activeStep ? 'check_circle' : idx === activeStep ? 'sync' : 'hourglass_empty'}
                    </span>
                    <span>{stepName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATE 3: COMPLETED */}
          {aiState === 'completed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 text-xs text-[#fedad7]"
            >
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-[#172033] border border-[#2A3447]/50 ai-mesh">
                <h4 className="font-bold text-[#e8bcb9] mb-2 flex items-center gap-1.5 font-headline">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  Executive Summary
                </h4>
                <p className="leading-relaxed text-[11px]">
                  {policy.summary}
                </p>
              </div>

              {/* Key Obligations list */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#e8bcb9] uppercase tracking-wider">
                  Key Obligations
                </h4>
                <div className="space-y-2">
                  {policy.obligations.map((ob) => (
                    <div
                      key={ob.id}
                      onClick={() => scrollToClause(ob.id, 'obligation')}
                      className="p-3 bg-[#0A1220] border border-[#2A3447] hover:border-[#F59E0B] rounded-lg transition-colors cursor-pointer group flex items-start gap-2"
                    >
                      <span className="material-symbols-outlined text-[#F59E0B] mt-0.5 text-sm flex-shrink-0">
                        arrow_right_alt
                      </span>
                      <div>
                        <p className="font-semibold text-white group-hover:text-[#F59E0B] transition-colors">
                          {ob.title}
                        </p>
                        <p className="text-[10px] text-[#e8bcb9] opacity-60 mt-0.5 leading-normal">
                          {ob.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks & Conflicts (Rendered if exists) */}
              {policy.conflicts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[#ffadaa] uppercase tracking-wider">
                    Risk / Conflicts Detected
                  </h4>
                  <div className="space-y-2">
                    {policy.conflicts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => scrollToClause(c.id, 'conflict')}
                        className="p-3 bg-[#C8102E]/5 border border-[#C8102E]/30 hover:border-[#C8102E] rounded-lg transition-colors cursor-pointer group flex flex-col gap-2"
                      >
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[#C8102E] mt-0.5 text-sm flex-shrink-0">
                            error
                          </span>
                          <div>
                            <p className="font-semibold text-white group-hover:text-[#ffadaa] transition-colors">
                              {c.title}
                            </p>
                            <p className="text-[10px] text-[#e8bcb9] opacity-60 mt-0.5 leading-normal">
                              {c.desc}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(c.target);
                          }}
                          className="w-full mt-1 bg-[#C8102E]/10 hover:bg-[#C8102E] border border-[#C8102E]/30 text-white font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1 text-[10px]"
                        >
                          <span>Deep Conflict Analysis</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask Lexora Inline Helper */}
              <div className="p-4 rounded-xl border border-[#2A3447] bg-[#0A1220] flex flex-col gap-3 text-center">
                <p className="text-[#e8bcb9] opacity-70 text-[10px]">
                  Need clarification about clauses or obligation compliance?
                </p>
                <button
                  onClick={() => setIsCopilotOpen(true)}
                  className="w-full py-2 bg-transparent hover:bg-white/5 border border-[#2A3447] text-[#fedad7] text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  <span>✨ Ask Lexora</span>
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </section>
    </div>
  );
}
