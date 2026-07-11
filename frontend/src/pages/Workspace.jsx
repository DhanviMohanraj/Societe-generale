import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from '../components/UploadZone';
import StatusBadge from '../components/StatusBadge';

const PIPELINE_STAGES = [
  { name: 'Reading Policies', msg: 'Reading uploaded documents...' },
  { name: 'Extracting Obligations', msg: 'Extracting obligations...' },
  { name: 'Normalizing Policies', msg: 'Standardizing policy language...' },
  { name: 'Building Knowledge Graph', msg: 'Building semantic knowledge...' },
  { name: 'Detecting Policy Conflicts', msg: 'Detecting contradictions...' },
  { name: 'Generating AI Health Report', msg: 'Generating executive report...' }
];

export default function Workspace() {
  const navigate = useNavigate();
  const { addToast } = useOutletContext();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Initial uploads list
  const [uploads, setUploads] = useState([
    { name: 'Cybersecurity_Protocol_v4.pdf', status: 'Verified', time: '2 hours ago' },
    { name: 'Employee_Code_Conduct_2024.docx', status: 'Pending Review', time: '5 hours ago' },
    { name: 'Data_Privacy_Standard_EMEA.pdf', status: 'Verified', time: '12 hours ago' },
    { name: 'Remote_Work_Access_Guide.pdf', status: 'Conflict Detected', time: '14 hours ago' },
  ]);

  // Uploading progress tracking
  const [uploadingFiles, setUploadingFiles] = useState([]);

  // Processing state: currentStep ranges from -1 (idle) to 5 (active steps), and 6 (completed)
  const [pipeline, setPipeline] = useState({
    active: false,
    currentStep: -1,
    fileName: null,
    failedStep: -1
  });

  const [aiInsight, setAiInsight] = useState({
    title: 'AI Insight',
    text: 'Two uploaded policies contain conflicting password rotation rules (90 vs 180 days).',
    linkText: 'Review Conflict',
    hasConflict: true
  });

  // Filtered uploads list
  const filteredUploads = uploads.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Triggered when files are dropped or browsed
  const handleFilesUploaded = (files) => {
    const filesList = Array.from(files);
    
    // Add to uploading files list to show progress animation
    const newUploading = filesList.map(f => ({ name: f.name, progress: 0 }));
    setUploadingFiles(prev => [...prev, ...newUploading]);

    // Simulate upload progress
    filesList.forEach((file, index) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setUploadingFiles(prev =>
          prev.map(item =>
            item.name === file.name ? { ...item, progress: currentProgress } : item
          )
        );

        if (currentProgress >= 100) {
          clearInterval(interval);
          
          // Remove from upload list and start AI processing pipeline
          setUploadingFiles(prev => prev.filter(item => item.name !== file.name));
          startAIProcessing(file.name);
        }
      }, 200 + index * 100);
    });
  };

  // Timed AI processing pipeline simulation
  const startAIProcessing = (fileName) => {
    setPipeline({
      active: true,
      currentStep: 0,
      fileName: fileName,
      failedStep: -1
    });

    const stepDuration = 1400;

    // Transition between the 6 pipeline stages
    const triggerNextStep = (step) => {
      if (step < 6) {
        setTimeout(() => {
          setPipeline(prev => {
            if (!prev.active) return prev;
            return {
              ...prev,
              currentStep: step
            };
          });
          triggerNextStep(step + 1);
        }, stepDuration);
      } else {
        // Pipeline Completion
        setTimeout(() => {
          setPipeline(prev => {
            if (!prev.active) return prev;
            return {
              ...prev,
              currentStep: 6,
              active: false
            };
          });

          // Show success toast
          addToast("Analysis completed successfully", "success");

          // Determine status dynamically
          let status = 'Verified';
          if (fileName.toLowerCase().includes('draft') || fileName.toLowerCase().includes('review')) {
            status = 'Pending Review';
          } else if (fileName.toLowerCase().includes('conflict') || fileName.toLowerCase().includes('restricted')) {
            status = 'Conflict Detected';
          }

          // Append to recent uploads
          setUploads(prev => [
            { name: fileName, status, time: 'Just now' },
            ...prev
          ]);

          // Set Dynamic AI Insights
          if (fileName.toLowerCase().includes('gdpr') || fileName.toLowerCase().includes('privacy')) {
            setAiInsight({
              title: 'AI Insight (GDPR Focus)',
              text: `Privacy clause conflict detected in: ${fileName}. The data storage duration overrides the standard global 7-year mandate.`,
              linkText: 'Analyze Privacy Mismatches',
              hasConflict: true
            });
          } else if (status === 'Conflict Detected') {
            setAiInsight({
              title: 'AI Insight (Conflict Alert)',
              text: `Security clearance levels mismatch found in newly uploaded policy: ${fileName}.`,
              linkText: 'Inspect Mismatches',
              hasConflict: true
            });
          } else {
            setAiInsight({
              title: 'AI Insight',
              text: `Successfully cross-referenced ${fileName} against 14 active policies. No new conflicts identified.`,
              linkText: 'View Library Status',
              hasConflict: false
            });
          }

        }, stepDuration);
      }
    };

    triggerNextStep(1);
  };

  // Get current active pipeline messaging
  const getPipelineMessage = () => {
    if (pipeline.currentStep === 6) return 'Exporting PDF... Analysis complete!';
    if (pipeline.currentStep >= 0 && pipeline.currentStep < 6) {
      return PIPELINE_STAGES[pipeline.currentStep].msg;
    }
    return 'System idle. Upload a document to start analysis.';
  };

  // Calculate dynamic progress percentage
  const getProgressPercent = () => {
    if (pipeline.currentStep === 6) return 100;
    if (pipeline.currentStep === -1) return 0;
    // Maps steps 0-5 incrementally up to ~90%, and 6 completes to 100%
    return Math.round(((pipeline.currentStep + 1) / 6) * 100);
  };

  return (
    <div className="space-y-10">
      {/* Hero Upload Section */}
      <section>
        <UploadZone onFilesUploaded={handleFilesUploaded} />
      </section>

      {/* Uploading Progress Overlay */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-[#111827] border border-[#2A3447] rounded-xl inner-glow space-y-4"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Uploading Files ({uploadingFiles.length})
            </h3>
            <div className="space-y-3">
              {uploadingFiles.map(file => (
                <div key={file.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#fedad7] font-medium truncate max-w-xs">{file.name}</span>
                    <span className="text-[#C8102E] font-bold">{file.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0A1220] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#C8102E] to-[#B11226]"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Recent Uploads */}
        <div className="col-span-12 lg:col-span-8 bg-[#111827] rounded-xl border border-[#2A3447] inner-glow overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A3447] flex justify-between items-center">
            <h2 className="font-headline text-lg font-bold text-white">Recent Uploads</h2>
            <span className="text-[10px] text-[#e8bcb9] uppercase tracking-widest opacity-60">Last 24 Hours</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#05080f]/30">
                  <th className="px-6 py-3 text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Policy Name</th>
                  <th className="px-6 py-3 text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Status</th>
                  <th className="px-6 py-3 text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Upload Time</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3447]/30">
                {/* Skeletons when actively processing a new file */}
                <AnimatePresence>
                  {pipeline.active && pipeline.currentStep < 6 && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      className="bg-[#C8102E]/5 border-b border-[#2A3447]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#C8102E] animate-pulse">description</span>
                          <span className="text-sm font-medium text-[#ffb3ae] animate-pulse">
                            Processing {pipeline.fileName}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-code text-[10px] font-bold tracking-wider uppercase bg-[#C8102E]/10 text-[#C8102E] animate-pulse">
                          Analyzing
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-16 h-2 bg-[#2A3447] rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="w-4 h-4 bg-[#2A3447] rounded-full ml-auto animate-pulse" />
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>

                {filteredUploads.length > 0 ? (
                  filteredUploads.map((upload) => (
                    <motion.tr
                      layoutId={upload.name}
                      key={upload.name}
                      whileHover={{ backgroundColor: 'rgba(23, 32, 51, 0.4)' }}
                      className="transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#C8102E]/60">description</span>
                          <span className="text-sm font-medium text-white">{upload.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={upload.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-[#e8bcb9] opacity-75">{upload.time}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="material-symbols-outlined text-[#e8bcb9] opacity-0 group-hover:opacity-100 transition-opacity">
                          chevron_right
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-xs text-[#e8bcb9] opacity-50">
                      No matching policies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Insights & Processing */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* AI Insight Card */}
          <motion.div
            layout
            className="bg-[#172033] border border-[#2A3447] rounded-xl p-6 inner-glow ai-mesh relative overflow-hidden"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-1 bg-[#C8102E]/20 rounded">
                <span className="material-symbols-outlined text-[#C8102E] text-lg material-symbols-fill">
                  auto_awesome
                </span>
              </div>
              <h3 className="font-headline text-md font-bold text-[#fedad7]">{aiInsight.title}</h3>
            </div>
            <p className="text-sm text-[#fedad7] mb-6 leading-relaxed">
              {aiInsight.text}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (aiInsight.hasConflict) {
                  navigate('/conflicts');
                } else {
                  navigate('/policies');
                }
              }}
              className="w-full bg-[#C8102E]/10 border border-[#C8102E]/30 text-[#C8102E] font-bold py-2 rounded-lg hover:bg-[#C8102E] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              {aiInsight.linkText}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </motion.button>
          </motion.div>

          {/* Processing Status Section */}
          <div className="bg-[#111827] rounded-xl border border-[#2A3447] p-6 inner-glow space-y-6">
            <div className="flex items-center justify-between border-b border-[#2A3447]/30 pb-3">
              <h3 className="text-[10px] uppercase tracking-widest text-[#e8bcb9] opacity-60 font-bold">
                Current Processing Status
              </h3>
              {pipeline.active && (
                <span className="text-[9px] uppercase tracking-widest text-[#C8102E] font-bold animate-pulse">
                  Processing...
                </span>
              )}
            </div>
            
            {/* 6 Stage Timeline */}
            <div className="space-y-4">
              {PIPELINE_STAGES.map((stage, idx) => {
                // Determine stage state
                let state = 'waiting'; // waiting | running | completed | failed
                
                if (pipeline.currentStep === 6) {
                  state = 'completed';
                } else if (pipeline.currentStep > idx) {
                  state = 'completed';
                } else if (pipeline.currentStep === idx) {
                  state = (pipeline.failedStep === idx) ? 'failed' : 'running';
                }

                // Render styles based on state
                let iconEl = null;
                let circleClass = 'border border-[#2A3447] text-[#e8bcb9]/20';
                let textClass = 'text-[#e8bcb9] opacity-50';

                if (state === 'completed') {
                  circleClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
                  iconEl = <span className="material-symbols-outlined text-xs font-bold">check</span>;
                  textClass = 'text-white font-medium';
                } else if (state === 'running') {
                  circleClass = 'border-2 border-[#C8102E] border-t-transparent animate-spin';
                  textClass = 'text-[#C8102E] font-bold animate-pulse';
                } else if (state === 'failed') {
                  circleClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
                  iconEl = <span className="material-symbols-outlined text-xs font-bold">close</span>;
                  textClass = 'text-red-400 font-bold';
                }

                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${circleClass}`}>
                        {iconEl}
                      </div>
                      {idx < PIPELINE_STAGES.length - 1 && (
                        <div className={`w-[1px] h-6 ${
                          state === 'completed' ? 'bg-green-500/30' : 'bg-[#2A3447]'
                        }`} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs mt-0.5 transition-colors duration-300 ${textClass}`}>
                        {stage.name}
                      </span>
                      {state === 'running' && (
                        <span className="text-[10px] text-[#e8bcb9] opacity-60 mt-0.5 italic">
                          {stage.msg}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic AI Message Indicator */}
            {pipeline.currentStep !== -1 && (
              <div className="bg-[#0A1220]/50 p-3 rounded-lg border border-[#2A3447]/40 text-center">
                <span className="text-[11px] font-semibold text-[#fedad7]">
                  {getPipelineMessage()}
                </span>
              </div>
            )}

            {/* Global Progress Bar */}
            <div className="pt-4 border-t border-[#2A3447]/30">
              <div className="flex justify-between items-center mb-1">
                <span className="font-code text-[10px] text-[#e8bcb9] opacity-60">Global Progress</span>
                <span className="font-code text-[10px] text-[#C8102E] font-bold">
                  {getProgressPercent()}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#172033] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C8102E] to-[#B11226] transition-all duration-500 ease-out"
                  style={{
                    width: `${getProgressPercent()}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
