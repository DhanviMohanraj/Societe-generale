import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from '../components/UploadZone';
import StatusBadge from '../components/StatusBadge';

import { repositoryService } from '../services/repositoryService';
import { pipelineService } from '../services/pipelineService';
import { governanceService } from '../services/governanceService';

const PIPELINE_STAGES = [
  { name: 'Uploading', msg: 'Uploading policy file...' },
  { name: 'Extraction', msg: 'Extracting policy obligations...' },
  { name: 'Normalization', msg: 'Standardizing obligation formats...' },
  { name: 'Knowledge Records', msg: 'Vectorizing and generating knowledge...' },
  { name: 'Repository', msg: 'Registering in policy repository...' },
  { name: 'Similarity', msg: 'Building FAISS index & similarity matching...' },
  { name: 'AI Reasoning', msg: 'Comparing obligations & identifying conflicts...' },
  { name: 'Knowledge Graph', msg: 'Compiling entity-relationship graph...' },
  { name: 'Governance Analytics', msg: 'Calculating risk and health scores...' }
];

export default function Workspace() {
  const navigate = useNavigate();
  const { addToast } = useOutletContext();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Uploaded and registered policies list
  const [uploads, setUploads] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Uploading progress tracking
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Processing state: currentStep ranges from -1 (idle) to 8 (active steps), and 9 (completed)
  const [pipeline, setPipeline] = useState({
    active: false,
    currentStep: -1,
    fileName: null,
    failedStep: -1
  });

  const [aiInsight, setAiInsight] = useState({
    title: 'AI Insight',
    text: 'System is ready. Upload a policy document to check for regulatory conflicts.',
    linkText: 'View Policy Library',
    hasConflict: false
  });

  // Fetch policies on mount and populate
  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const snapshot = await governanceService.getSnapshot();
      if (snapshot && snapshot.policy_summaries) {
        const mapped = snapshot.policy_summaries.map(p => ({
          name: p.policy_name,
          status: p.conflict_count > 0 ? 'Conflict Detected' : 'Verified',
          time: 'Active'
        }));
        setUploads(mapped);

        if (snapshot.critical_conflicts > 0) {
          setAiInsight({
            title: 'AI Insight (Conflict Alert)',
            text: `Enterprise governance shows ${snapshot.critical_conflicts} critical conflicts and ${snapshot.duplicate_requirements} duplicate requirements. Overall risk is ${snapshot.overall_risk_level}.`,
            linkText: 'Analyze Conflicts',
            hasConflict: true
          });
        } else {
          setAiInsight({
            title: 'AI Insight',
            text: 'Central compliance alignment is clean. No active conflicts identified.',
            linkText: 'View Policy Library',
            hasConflict: false
          });
        }
      }
    } catch (err) {
      console.warn("Could not fetch governance snapshot, loading raw policies:", err);
      try {
        const rawPolicies = await repositoryService.getPolicies();
        const mapped = rawPolicies.map(p => ({
          name: p.policy_name,
          status: p.status === 'ACTIVE' ? 'Verified' : p.status,
          time: 'Active'
        }));
        setUploads(mapped);
      } catch (repoErr) {
        console.error("Failed to load policies:", repoErr);
      }
    } finally {
      setLoadingPolicies(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Poll pipeline progress status when pipeline is active
  useEffect(() => {
    let pollInterval = null;
    if (pipeline.active) {
      pollInterval = setInterval(async () => {
        try {
          const status = await pipelineService.getPipelineStatus();
          
          const stepMap = {
            "Extraction": 1,
            "Normalization": 2,
            "Vectorization": 3,
            "Repository": 4,
            "Similarity": 5,
            "Analysis": 6,
            "Knowledge Graph": 7,
            "Governance": 8,
            "Completed": 9
          };
          
          const stepVal = stepMap[status.current_step] ?? 0;
          setPipeline(prev => {
            if (!prev.active) return prev;
            return {
              ...prev,
              currentStep: stepVal
            };
          });
        } catch (err) {
          console.error("Failed to poll status", err);
        }
      }, 1000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pipeline.active]);

  // Filtered uploads list
  const filteredUploads = uploads.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Triggered when file is uploaded via UploadZone
  const handleFilesUploaded = async (files) => {
    const filesList = Array.from(files);
    if (filesList.length === 0) return;

    const file = filesList[0]; // Process one file at a time as per flow
    
    // Add to uploading progress tracking
    setUploadingFiles([{ name: file.name, progress: 0 }]);
    
    try {
      const response = await repositoryService.uploadPolicy(file);
      // Update progress to 100% on success
      setUploadingFiles([{ name: file.name, progress: 100 }]);
      setTimeout(() => {
        setUploadingFiles([]);
        setUploadedFile(file.name);
        addToast("Upload Successful", "success");
      }, 500);
    } catch (err) {
      setUploadingFiles([]);
      addToast(err.message || "Failed to upload file.", "error");
    }
  };

  // Run the backend AI processing pipeline
  const startAIProcessing = async () => {
    if (!uploadedFile) return;

    setPipeline({
      active: true,
      currentStep: 0, // 0 = Uploading completed, pipeline starting
      fileName: uploadedFile,
      failedStep: -1
    });

    try {
      addToast("AI Pipeline triggered", "info");

      // Step 1: Kick off the pipeline — backend returns 202 immediately
      await pipelineService.runPipeline(uploadedFile);

      // Step 2: Poll until the backend marks it as Completed or Failed
      await pipelineService.waitForCompletion(
        (status) => {
          const stepMap = {
            "Starting": 0,
            "Extraction": 1,
            "Normalization": 2,
            "Vectorization": 3,
            "Repository": 4,
            "Similarity": 5,
            "Analysis": 6,
            "Knowledge Graph": 7,
            "Governance": 8,
            "Completed": 9
          };
          const stepVal = stepMap[status.current_step] ?? pipeline.currentStep;
          setPipeline(prev => prev.active ? { ...prev, currentStep: stepVal } : prev);
        },
        2000,   // poll every 2 seconds
        600000  // give up after 10 minutes
      );

      setPipeline(prev => ({ ...prev, active: false, currentStep: 9 }));

      addToast("Pipeline Completed", "success");
      addToast("Governance Updated", "success");
      addToast("Graph Built", "success");

      setUploadedFile(null);
      fetchPolicies();
    } catch (err) {
      setPipeline(prev => ({
        ...prev,
        active: false,
        failedStep: prev.currentStep >= 0 ? prev.currentStep : 1
      }));
      addToast(err.message || "Pipeline execution encountered an error.", "error");
    }
  };


  // Get current active pipeline messaging
  const getPipelineMessage = () => {
    if (pipeline.currentStep === 9) return 'Analysis complete!';
    if (pipeline.currentStep >= 0 && pipeline.currentStep < 9) {
      return PIPELINE_STAGES[pipeline.currentStep].msg;
    }
    return 'System idle. Upload a document to start analysis.';
  };

  // Calculate dynamic progress percentage
  const getProgressPercent = () => {
    if (pipeline.currentStep === 9) return 100;
    if (pipeline.currentStep === -1) return 0;
    return Math.round((pipeline.currentStep / 9) * 100);
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
            
            {/* 9 Stage Timeline */}
            <div className="space-y-4">
              {uploadedFile && !pipeline.active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#C8102E]/10 border border-[#C8102E]/30 p-4 rounded-xl text-center space-y-3 mb-4 inner-glow"
                >
                  <div className="flex items-center gap-2.5 justify-center text-[#fedad7]">
                    <span className="material-symbols-outlined text-[#C8102E] animate-pulse">description</span>
                    <span className="text-xs font-bold truncate max-w-[200px]">{uploadedFile}</span>
                  </div>
                  <button
                    onClick={startAIProcessing}
                    className="w-full bg-gradient-to-br from-[#C8102E] to-[#B11226] text-white font-bold py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#C8102E]/25"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Process Document
                  </button>
                </motion.div>
              )}

              {PIPELINE_STAGES.map((stage, idx) => {
                // Determine stage state
                let state = 'waiting'; // waiting | running | completed | failed
                
                if (pipeline.currentStep === 9) {
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
