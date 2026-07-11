import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { jsPDF } from 'jspdf';

// Initial Mock Reports Data
const INITIAL_REPORTS = [
  {
    id: 'rep-001',
    name: 'Policy Health Audit',
    type: 'Health',
    date: 'Today',
    status: 'Ready',
    department: 'EMEA',
    riskLevel: 'Low',
    policiesCompared: ['Global Password Policy', 'EMEA Regional Standard'],
    aiSummary: 'Overall policy health is excellent. 98% compliance alignment with global standard. Low exposure identified.',
    conflicts: [],
    recommendations: 'Maintain compliance monitoring cycle. Check minor changes in operational standards annually.',
    downloadCount: 4,
  },
  {
    id: 'rep-002',
    name: 'Conflict Report',
    type: 'Conflict',
    date: 'Today',
    status: 'Ready',
    department: 'Security',
    riskLevel: 'High',
    policiesCompared: ['EMEA Local Password Standard', 'Global Security Framework'],
    aiSummary: '2 Critical conflicts detected between local EMEA policy and global security framework. Immediate alignment required.',
    conflicts: [
      'Password policy rotation mismatch: EMEA specifies 180 days while Global mandate is 90 days.',
      'Access log retention period mismatch: EMEA specifies 30 days, Global Framework requires 365 days.'
    ],
    recommendations: 'Align local EMEA policy to the global standard (90 days rotation and 365 days logging) or obtain formal executive variance approval.',
    downloadCount: 12,
  },
  {
    id: 'rep-003',
    name: 'Executive Summary',
    type: 'Summary',
    date: 'Yesterday',
    status: 'Ready',
    department: 'Compliance',
    riskLevel: 'Medium',
    policiesCompared: ['Incident Response Policy', 'General Data Protection Regulation Guideline'],
    aiSummary: 'Summary of compliance updates for Q2. Stale policies identified with potential gaps in regulatory notification timelines.',
    conflicts: [
      'Notification period for breaches differ: Incident Response specifies 72 hours, GDPR Guideline mandates 24 hours under critical breaches.'
    ],
    recommendations: 'Implement automated notification trigger system to meet the stricter 24h GDPR requirement for high-severity incidents.',
    downloadCount: 0,
  },
  {
    id: 'rep-004',
    name: 'Compliance Audit',
    type: 'Compliance',
    date: 'Yesterday',
    status: 'Ready',
    department: 'Legal',
    riskLevel: 'High',
    policiesCompared: ['GDPR Policy', 'Societe Generale Global Privacy Policy'],
    aiSummary: 'Comprehensive compliance check against European privacy regulations. Data residency conflicts detected.',
    conflicts: [
      'Data residency clause overrides EU sovereign directives: storage path fallback is set to US default servers.'
    ],
    recommendations: 'Restructure cloud storage vendors to reside within EU zones and update the legal clauses to enforce EU residency.',
    downloadCount: 1,
  },
];

export default function Reports() {
  const { addToast, setActivePolicy, setIsCopilotOpen } = useOutletContext();
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('lexora_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // All | Conflict | Health | Compliance | Summary
  const [deptFilter, setDeptFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  useEffect(() => {
    localStorage.setItem('lexora_reports', JSON.stringify(reports));
  }, [reports]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedReport(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Statistics Calculation
  const totalReports = reports.length;
  const todayReports = reports.filter(r => r.date === 'Today').length;
  const downloadCount = reports.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);
  const pendingCount = reports.filter(r => r.status === 'Pending').length + 2;

  // Filters logic
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.policiesCompared.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'All' || report.type.toLowerCase() === activeTab.toLowerCase();
    const matchesDept = deptFilter === 'All' || report.department === deptFilter;
    const matchesDate = dateFilter === 'All' || report.date === dateFilter;

    return matchesSearch && matchesTab && matchesDept && matchesDate;
  });

  // Share functionality
  const handleShare = (report, e) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/reports?id=${report.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      addToast(`Share link copied for ${report.name}!`, 'success');
    }).catch(() => {
      addToast('Failed to copy share link.', 'error');
    });
  };

  // Delete Report
  const handleDelete = (id, name, e) => {
    if (e) e.stopPropagation();
    setReports(prev => prev.filter(r => r.id !== id));
    addToast(`Deleted report: ${name}`, 'success');
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport(null);
    }
  };

  // Ask AI integration
  const handleAskAI = (report) => {
    setActivePolicy({
      id: report.id,
      title: `${report.name} (${report.type} Report)`
    });
    setIsCopilotOpen(true);
    addToast(`Loaded ${report.name} context into Lexora Copilot.`, 'success');
  };

  // Generate and Download PDF using jsPDF
  const handleDownloadPDF = (report, e) => {
    if (e) e.stopPropagation();
    
    // Increment download count
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r));
    
    const doc = new jsPDF();
    
    // Header Styling (Societe Generale/Lexora Crimson theme)
    doc.setFillColor(17, 24, 39); // Deep dark slate background
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(200, 16, 46); // Crimson
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('LEXORA', 15, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('ENTERPRISE POLICY COMPLIANCE REPORT', 15, 35);
    doc.text(`Generated: ${report.date === 'Today' ? 'July 11, 2026' : report.date === 'Yesterday' ? 'July 10, 2026' : 'July 2026'}`, 140, 25);
    
    // Content body
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(report.name, 15, 60);
    
    // Report Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Metadata:', 15, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report ID: ${report.id}`, 15, 78);
    doc.text(`Type: ${report.type}`, 15, 84);
    doc.text(`Department: ${report.department}`, 15, 90);
    doc.text(`Risk Exposure Level: ${report.riskLevel}`, 15, 96);
    
    // Policies compared box
    doc.setFillColor(243, 244, 246);
    doc.rect(15, 103, 180, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Policies Compared:', 20, 110);
    doc.setFont('helvetica', 'italic');
    doc.text(report.policiesCompared.join('  vs  '), 20, 118);
    
    // Executive AI Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Executive AI Summary', 15, 140);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(report.aiSummary, 180);
    doc.text(splitSummary, 15, 147);
    
    // Detected Conflicts
    let currentY = 165;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Detected Conflicts & Inconsistencies', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    currentY += 7;
    
    if (report.conflicts.length === 0) {
      doc.setTextColor(16, 124, 65); // Green for no conflicts
      doc.text('✓ No critical conflicts or policy staleness issues detected.', 15, currentY);
      doc.setTextColor(17, 24, 39);
    } else {
      doc.setTextColor(200, 16, 46); // Crimson/Red for warnings
      report.conflicts.forEach((conflict) => {
        const splitConflict = doc.splitTextToSize(`• ${conflict}`, 180);
        doc.text(splitConflict, 15, currentY);
        currentY += (splitConflict.length * 5) + 2;
      });
      doc.setTextColor(17, 24, 39);
    }
    
    // Recommendations
    currentY = Math.max(currentY + 10, 210);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Strategic Recommendations', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitRec = doc.splitTextToSize(report.recommendations, 180);
    doc.text(splitRec, 15, currentY + 7);
    
    // Footer
    doc.setDrawColor(229, 231, 235);
    doc.line(15, 275, 195, 275);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Confidential - Lexora AI Governance Platform - Societe Generale Hackathon', 15, 282);
    
    doc.save(`${report.name.toLowerCase().replace(/\s+/g, '_')}_report.pdf`);
    addToast(`PDF report downloaded successfully!`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Reports', val: totalReports, icon: 'assessment', desc: 'All generated assets', color: 'from-blue-500/20 to-blue-600/5 text-blue-400' },
          { title: "Today's Reports", val: todayReports, icon: 'today', desc: 'Processed this cycle', color: 'from-[#C8102E]/20 to-[#C8102E]/5 text-[#C8102E]' },
          { title: 'Downloaded', val: downloadCount, icon: 'download', desc: 'PDF archives generated', color: 'from-green-500/20 to-green-600/5 text-green-400' },
          { title: 'Pending Tasks', val: pendingCount, icon: 'hourglass_empty', desc: 'Running conflict monitors', color: 'from-yellow-500/20 to-yellow-600/5 text-yellow-400' }
        ].map((c) => (
          <div key={c.title} className="bg-[#111827] border border-[#2A3447] rounded-xl p-5 inner-glow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest text-[#e8bcb9] opacity-60 font-bold">{c.title}</span>
              <h3 className="text-3xl font-headline font-bold text-white">{c.val}</h3>
              <p className="text-[10px] text-[#e8bcb9] opacity-40">{c.desc}</p>
            </div>
            <div className={`p-3 rounded-lg bg-gradient-to-br ${c.color.split(' ')[0]} ${c.color.split(' ')[1]}`}>
              <span className={`material-symbols-outlined text-2xl ${c.color.split(' ')[2]}`}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Dashboard Table */}
      <div className="bg-[#111827] rounded-xl border border-[#2A3447] inner-glow overflow-hidden">
        <div className="p-6 border-b border-[#2A3447] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="font-headline text-lg font-bold text-white">AI Governance Reports</h2>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0A1220] border border-[#2A3447] rounded-lg pl-9 pr-4 py-1.5 text-xs text-white w-full md:w-64 focus:outline-none focus:border-[#C8102E] transition-colors"
              />
              <span className="material-symbols-outlined absolute left-3 top-2 text-xs text-[#e8bcb9] opacity-60">search</span>
            </div>
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {/* Tab options */}
            <div className="flex bg-[#0A1220] rounded-lg p-0.5 border border-[#2A3447]">
              {['All', 'Conflict', 'Health', 'Compliance', 'Summary'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md transition-all font-semibold ${
                    activeTab === tab 
                      ? 'bg-[#C8102E] text-white' 
                      : 'text-[#e8bcb9] opacity-75 hover:opacity-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Department Dropdown */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-[#0A1220] border border-[#2A3447] rounded-lg px-2.5 py-1 text-xs text-[#e8bcb9] focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="EMEA">EMEA Region</option>
              <option value="Security">Global Security</option>
              <option value="Compliance">Compliance & Risk</option>
              <option value="Legal">Legal Division</option>
            </select>

            {/* Date Filter Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#0A1220] border border-[#2A3447] rounded-lg px-2.5 py-1 text-xs text-[#e8bcb9] focus:outline-none"
            >
              <option value="All">Any Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#05080f]/30 border-b border-[#2A3447]">
                <th className="px-6 py-3 text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Report Name</th>
                <th className="px-6 py-3 text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Type</th>
                <th className="px-6 py-3 text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Date</th>
                <th className="px-6 py-3 text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Status</th>
                <th className="px-6 py-3 text-right text-xs uppercase text-[#e8bcb9] opacity-60 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3447]/30">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="transition-colors cursor-pointer hover:bg-[#172033]/40 group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#C8102E]">description</span>
                      <span className="text-xs font-bold text-white">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-[#e8bcb9]/80">{report.type}</td>
                  <td className="px-6 py-4 text-xs text-[#e8bcb9] opacity-60">{report.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        title="View report"
                        className="p-1 text-[#e8bcb9] hover:text-white hover:bg-[#2A3447] rounded transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button
                        onClick={(e) => handleDownloadPDF(report, e)}
                        title="Download PDF"
                        className="p-1 text-green-400 hover:text-green-300 hover:bg-[#2A3447] rounded transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                      <button
                        onClick={(e) => handleShare(report, e)}
                        title="Share Report"
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-[#2A3447] rounded transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">share</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(report.id, report.name, e)}
                        title="Delete Report"
                        className="p-1 text-[#C8102E] hover:text-red-400 hover:bg-[#2A3447] rounded transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-xs text-[#e8bcb9] opacity-50">
                    No reports found matching selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Centered Modal Overlay for Report Preview */}
      <AnimatePresence>
        {selectedReport && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-[#0A1220]/75 backdrop-blur-[6px] z-[110]"
            />

            {/* Centered Dialog Wrapper */}
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[120] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto bg-[#111827] rounded-2xl border border-[#2A3447] inner-glow p-8 w-full max-w-[1150px] h-[80vh] flex flex-col relative shadow-2xl overflow-hidden"
              >
                {/* Modal Title bar */}
                <div className="flex items-start justify-between border-b border-[#2A3447]/80 pb-5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#C8102E] text-2xl">description</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline text-lg font-bold text-white">{selectedReport.name}</h3>
                        <span className="text-[9px] uppercase tracking-wider bg-[#C8102E]/20 text-[#fedad7] px-2 py-0.5 rounded font-bold">
                          {selectedReport.type} Report
                        </span>
                      </div>
                      <p className="text-[10px] text-[#e8bcb9] opacity-60 mt-0.5">Generated {selectedReport.date} • Department: {selectedReport.department}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-1.5 hover:bg-[#2A3447] rounded-full text-[#e8bcb9] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Modal scrollable body content */}
                <div className="flex-1 overflow-y-auto py-6 pr-2 space-y-6">
                  {/* Policies Compared details */}
                  <div className="bg-[#0A1220] p-4 rounded-xl border border-[#2A3447]">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#e8bcb9] opacity-60">Policies Compared</span>
                    <div className="mt-2.5 flex flex-wrap gap-4">
                      {selectedReport.policiesCompared.map((pol) => (
                        <div key={pol} className="flex items-center gap-2 text-xs text-white bg-[#172033] px-3.5 py-1.5 rounded-lg border border-[#2A3447]/60">
                          <span className="material-symbols-outlined text-xs text-[#C8102E] material-symbols-fill">verified_user</span>
                          <span>{pol}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">AI Executive Summary</h4>
                    <p className="text-xs text-[#fedad7]/90 leading-relaxed bg-[#0A1220]/40 p-4 rounded-xl border border-[#2A3447]/40">
                      {selectedReport.aiSummary}
                    </p>
                  </div>

                  {/* Risk Badge info */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Risk Evaluation Score:</span>
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-code font-bold tracking-wider uppercase ${
                      selectedReport.riskLevel === 'High' ? 'bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/30' :
                      selectedReport.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {selectedReport.riskLevel} Exposure
                    </span>
                  </div>

                  {/* Identified Conflicts list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Detected Conflicts & Staleness</h4>
                    <div className="space-y-2">
                      {selectedReport.conflicts.length > 0 ? (
                        selectedReport.conflicts.map((conflict, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-[#fedad7] bg-[#C8102E]/5 border border-[#C8102E]/10 p-3.5 rounded-lg">
                            <span className="material-symbols-outlined text-[#C8102E] text-sm mt-0.5">warning</span>
                            <span>{conflict}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-green-400 bg-green-500/5 border border-green-500/10 p-3.5 rounded-lg flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          <span>No policy alignment discrepancies or outdated references found.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strategic Recommendations */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Strategic Recommendations</h4>
                    <p className="text-xs text-[#fedad7]/80 leading-relaxed bg-[#0A1220]/40 p-4 rounded-xl border border-[#2A3447]/40">
                      {selectedReport.recommendations}
                    </p>
                  </div>
                </div>

                {/* Modal actions footer */}
                <div className="pt-5 border-t border-[#2A3447]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Ask AI Trigger */}
                  <button
                    onClick={() => handleAskAI(selectedReport)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E]/10 border border-[#C8102E]/30 text-[#fedad7] font-bold text-xs hover:bg-[#C8102E] hover:text-white transition-all duration-200"
                  >
                    <span className="material-symbols-outlined text-sm material-symbols-fill">auto_awesome</span>
                    ✨ Ask AI about this Report
                  </button>

                  <div className="flex items-center gap-3 justify-end">
                    <button
                      onClick={() => handleShare(selectedReport)}
                      className="flex items-center gap-2 text-xs font-bold text-[#e8bcb9] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-[#2A3447]"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                      Share
                    </button>
                    
                    <button
                      onClick={() => handleDownloadPDF(selectedReport)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#172033] border border-[#2A3447] text-white font-bold text-xs rounded-lg hover:bg-[#2A3447] transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download PDF
                    </button>

                    <button
                      onClick={() => setSelectedReport(null)}
                      className="px-4 py-2 bg-gradient-to-br from-[#C8102E] to-[#B11226] text-white font-bold text-xs rounded-lg shadow hover:opacity-90 active:scale-95 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
