import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from '../components/UploadZone';
import StatusBadge from '../components/StatusBadge';

export default function Workspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Initial uploads list
  const [uploads, setUploads] = useState([
    { name: 'Cybersecurity_Protocol_v4.pdf', status: 'Verified', time: '2 hours ago' },
    { name: 'Employee_Code_Conduct_2024.docx', status: 'Pending Review', time: '5 hours ago' },
    { name: 'Data_Privacy_Standard_EMEA.pdf', status: 'Verified', time: '12 hours ago' },
    { name: 'Remote_Work_Access_Guide.pdf', status: 'Conflict Detected', time: '14 hours ago' },
  ]);

  // Uploading and processing states
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [activeProcessing, setActiveProcessing] = useState(null); // { name: string, step: number }
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
    
    // 1. Add to uploading files list to show progress animation
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
      }, 200 + index * 100); // slightly staggered progress
    });
  };

  // Timed AI processing pipeline
  const startAIProcessing = (fileName) => {
    setActiveProcessing({ name: fileName, step: 0 }); // Step 0: Reading Policies

    // Steps timing:
    // Step 0 (Reading Policies) -> Step 1 (Extracting Obligations) after 1.5s
    // Step 1 -> Step 2 (Comparing Policies) after 1.5s
    // Step 2 -> Step 3 (Generating Health Report) after 1.5s
    // Step 3 -> Completed after 1.5s

    const stepDuration = 1500;
    
    setTimeout(() => {
      setActiveProcessing(prev => prev ? { ...prev, step: 1 } : null);
      
      setTimeout(() => {
        setActiveProcessing(prev => prev ? { ...prev, step: 2 } : null);
        
        setTimeout(() => {
          setActiveProcessing(prev => prev ? { ...prev, step: 3 } : null);
          
          setTimeout(() => {
            // Complete processing
            setActiveProcessing(null);
            
            // Determine dynamic status based on file name
            let status = 'Verified';
            if (fileName.toLowerCase().includes('draft') || fileName.toLowerCase().includes('review')) {
              status = 'Pending Review';
            } else if (fileName.toLowerCase().includes('conflict') || fileName.toLowerCase().includes('restricted')) {
              status = 'Conflict Detected';
            }

            // Automatically add to Recent Uploads
            setUploads(prev => [
              { name: fileName, status, time: 'Just now' },
              ...prev
            ]);

            // Update AI Insight dynamically based on file type
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
        }, stepDuration);
      }, stepDuration);
    }, stepDuration);
  };

  return (
    <div className="space-y-10">
      {/* Hero Upload Section */}
      <section>
        <UploadZone onFilesUploaded={handleFilesUploaded} />
      </section>

      {/* Uploading Progress Overlay (shown directly below Upload Zone) */}
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
                  {activeProcessing && (
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
                            Processing {activeProcessing.name}...
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
                  filteredUploads.map((upload, idx) => (
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
          <div className="bg-[#111827] rounded-xl border border-[#2A3447] p-6 inner-glow">
            <h3 className="text-[10px] uppercase tracking-widest text-[#e8bcb9] opacity-60 mb-6 font-bold">
              Current Processing Status
            </h3>
            
            <div className="space-y-4">
              {/* Step 1: Reading Policies */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    activeProcessing ? (
                      activeProcessing.step > 0 ? 'bg-[#C8102E]/20 text-[#C8102E]' : 'border-2 border-[#C8102E] border-t-transparent animate-spin'
                    ) : 'bg-[#C8102E]/20 text-[#C8102E]'
                  }`}>
                    {(!activeProcessing || activeProcessing.step > 0) ? (
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    ) : null}
                  </div>
                  <div className={`w-[1px] h-6 ${
                    (!activeProcessing || activeProcessing.step > 0) ? 'bg-[#C8102E]/30' : 'bg-[#2A3447]'
                  }`} />
                </div>
                <span className={`text-xs mt-0.5 ${
                  activeProcessing && activeProcessing.step === 0 ? 'text-[#C8102E] font-bold animate-pulse' : 'text-white font-medium'
                }`}>
                  Reading Policies
                </span>
              </div>
              
              {/* Step 2: Extracting Obligations */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    activeProcessing ? (
                      activeProcessing.step === 1 ? 'border-2 border-[#C8102E] border-t-transparent animate-spin' :
                      activeProcessing.step > 1 ? 'bg-[#C8102E]/20 text-[#C8102E]' : 'border border-[#2A3447]'
                    ) : 'bg-[#C8102E]/20 text-[#C8102E]'
                  }`}>
                    {(!activeProcessing || activeProcessing.step > 1) ? (
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    ) : null}
                  </div>
                  <div className={`w-[1px] h-6 ${
                    (!activeProcessing || activeProcessing.step > 1) ? 'bg-[#C8102E]/30' : 'bg-[#2A3447]'
                  }`} />
                </div>
                <span className={`text-xs mt-0.5 ${
                  activeProcessing ? (
                    activeProcessing.step === 1 ? 'text-[#C8102E] font-bold animate-pulse' :
                    activeProcessing.step > 1 ? 'text-white font-medium' : 'text-[#e8bcb9] opacity-50'
                  ) : 'text-white font-medium'
                }`}>
                  Extracting Obligations
                </span>
              </div>

              {/* Step 3: Comparing Policies */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    activeProcessing ? (
                      activeProcessing.step === 2 ? 'border-2 border-[#C8102E] border-t-transparent animate-spin' :
                      activeProcessing.step > 2 ? 'bg-[#C8102E]/20 text-[#C8102E]' : 'border border-[#2A3447]'
                    ) : 'bg-[#C8102E]/20 text-[#C8102E]'
                  }`}>
                    {(!activeProcessing || activeProcessing.step > 2) ? (
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    ) : null}
                  </div>
                  <div className={`w-[1px] h-6 ${
                    (!activeProcessing || activeProcessing.step > 2) ? 'bg-[#C8102E]/30' : 'bg-[#2A3447]'
                  }`} />
                </div>
                <span className={`text-xs mt-0.5 ${
                  activeProcessing ? (
                    activeProcessing.step === 2 ? 'text-[#C8102E] font-bold animate-pulse' :
                    activeProcessing.step > 2 ? 'text-white font-medium' : 'text-[#e8bcb9] opacity-50'
                  ) : 'text-white font-medium'
                }`}>
                  Comparing Policies
                </span>
              </div>

              {/* Step 4: Generating Health Report */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    activeProcessing ? (
                      activeProcessing.step === 3 ? 'border-2 border-[#C8102E] border-t-transparent animate-spin' :
                      'border border-[#2A3447]'
                    ) : 'bg-[#C8102E]/20 text-[#C8102E]'
                  }`}>
                    {!activeProcessing ? (
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    ) : null}
                  </div>
                </div>
                <span className={`text-xs mt-0.5 ${
                  activeProcessing ? (
                    activeProcessing.step === 3 ? 'text-[#C8102E] font-bold animate-pulse' : 'text-[#e8bcb9] opacity-50'
                  ) : 'text-white font-medium'
                }`}>
                  Generating Health Report
                </span>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="mt-8 pt-6 border-t border-[#2A3447]/30">
              <div className="flex justify-between items-center mb-1">
                <span className="font-code text-[10px] text-[#e8bcb9] opacity-60">Global Progress</span>
                <span className="font-code text-[10px] text-[#C8102E] font-bold">
                  {activeProcessing ? `${Math.round((activeProcessing.step + 1) * 25)}%` : '100%'}
                </span>
              </div>
              <div className="h-1 w-full bg-[#172033] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C8102E] transition-all duration-500 ease-out"
                  style={{
                    width: activeProcessing ? `${(activeProcessing.step + 1) * 25}%` : '100%'
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
