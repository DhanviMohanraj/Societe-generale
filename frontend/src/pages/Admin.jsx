import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';

const RECENT_ACTIVITIES = [
  { id: 1, time: 'Today 11:34 AM', type: 'audit', message: 'Enterprise Admin generated Conflict Analysis Report for Security vs EMEA policies.' },
  { id: 2, time: 'Today 10:15 AM', type: 'scan', message: 'Lexora engine completed compliance scan on 14 active policies.' },
  { id: 3, time: 'Yesterday 4:45 PM', type: 'status', message: 'Policy "GDPR Policy" marked as "Stale" (Last audited 18 months ago).' },
  { id: 4, time: 'Yesterday 2:10 PM', type: 'resolution', message: 'Conflict #C-409 resolved: Aligned EMEA Local Password Standard with Global security mandate.' },
  { id: 5, time: '2 days ago', type: 'upload', message: 'New policy "Cybersecurity_Protocol_v4.pdf" uploaded and vectorized.' },
  { id: 6, time: '3 days ago', type: 'audit', message: 'Quarterly compliance audit exported by Compliance team.' }
];

const DEPARTMENT_METRICS = [
  { name: 'Global Security', policies: 18, conflicts: 1, compliance: 98, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { name: 'EMEA Regional', policies: 14, conflicts: 2, compliance: 89, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { name: 'Compliance & Risk', policies: 12, conflicts: 0, compliance: 100, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { name: 'Legal Division', policies: 10, conflicts: 4, compliance: 75, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
];

export default function Admin() {
  const { addToast } = useOutletContext();
  const [activities, setActivities] = useState(RECENT_ACTIVITIES);
  const [scanning, setScanning] = useState(false);

  const handleTriggerScan = () => {
    setScanning(true);
    addToast('Initiating organization-wide policy audit scan...', 'info');
    setTimeout(() => {
      setScanning(false);
      setActivities(prev => [
        { id: Date.now(), time: 'Just now', type: 'scan', message: 'Lexora compliance audit scanner completed. No new conflicts detected.' },
        ...prev
      ]);
      addToast('Lexora policy scan complete. 0 new conflicts found.', 'success');
    }, 3000);
  };

  return (
    <div className="space-y-8">
      {/* Title & Action header */}
      <div className="flex justify-between items-center bg-[#111827] border border-[#2A3447] rounded-xl p-6 inner-glow">
        <div>
          <h2 className="font-headline text-xl font-bold text-white">Enterprise Governance Control</h2>
          <p className="text-xs text-[#e8bcb9] opacity-60 mt-1">Societe Generale Global Compliance & Risk Dashboard</p>
        </div>
        <button
          onClick={handleTriggerScan}
          disabled={scanning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-lg transition-all ${
            scanning 
              ? 'bg-[#2A3447] text-[#e8bcb9] cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-br from-[#C8102E] to-[#B11226] text-white hover:opacity-90 active:scale-95'
          }`}
        >
          <span className={`material-symbols-outlined text-sm ${scanning ? 'animate-spin' : ''}`}>
            {scanning ? 'sync' : 'interactive_space'}
          </span>
          {scanning ? 'Scanning Workspace...' : 'Trigger System Scan'}
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: 'Compliance Index', val: '94.2%', desc: 'Weighted risk index', trend: '+1.4% MoM', green: true, icon: 'shield' },
          { label: 'Analyzed Policies', val: '54', desc: 'Total repository corpus', trend: '+4 added', green: true, icon: 'gavel' },
          { label: 'Active Conflicts', val: '7', desc: 'Require attention', trend: '-2 resolved', green: false, icon: 'warning' },
          { label: 'Stale Policies', val: '11', desc: 'Overdue for audit review', trend: '+1 this week', green: false, icon: 'history' },
          { label: 'AI Engine Accuracy', val: '98.7%', desc: 'RLHF validation score', trend: '+0.2% improvement', green: true, icon: 'auto_awesome' },
        ].map((item, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#2A3447] rounded-xl p-5 inner-glow flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-[#e8bcb9] opacity-60 font-bold">{item.label}</span>
              <h3 className="text-3xl font-headline font-bold text-white">{item.val}</h3>
              <p className="text-[10px] text-[#e8bcb9] opacity-40">{item.desc}</p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2A3447]/30">
              <span className={`text-[10px] font-bold ${item.green ? 'text-green-400' : 'text-red-400'}`}>
                {item.trend}
              </span>
              <span className="material-symbols-outlined text-sm text-[#e8bcb9] opacity-45">{item.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Control Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Department Breakdown & svg/css graph */}
        <div className="lg:col-span-7 bg-[#111827] rounded-xl border border-[#2A3447] inner-glow p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A3447]/60 pb-3">
            <h3 className="font-headline text-md font-bold text-white">Department Risk Mappings</h3>
            <span className="text-[10px] text-[#e8bcb9] uppercase tracking-wider opacity-60">Active Index</span>
          </div>

          <div className="space-y-5">
            {DEPARTMENT_METRICS.map(dept => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white font-bold">{dept.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#e8bcb9] opacity-75">{dept.policies} Policies</span>
                    <span className="text-red-400 font-bold">{dept.conflicts} Conflicts</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${dept.color}`}>{dept.compliance}% OK</span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-2 w-full bg-[#0A1220] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      dept.compliance >= 95 ? 'bg-green-500' :
                      dept.compliance >= 85 ? 'bg-orange-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${dept.compliance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Area Distribution Chart Simulation */}
          <div className="bg-[#0A1220]/40 rounded-xl p-4 border border-[#2A3447]/40 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#e8bcb9] font-bold">Policy Category Exposure</span>
              <span className="text-[10px] text-green-400 font-code font-bold">Low Risk</span>
            </div>
            
            {/* Simulation Heatmap grid */}
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { name: 'Infosec rules', status: 'Optimal', val: '98%', color: 'border-green-500/20 bg-green-500/5 text-green-400' },
                { name: 'Access Controls', status: 'Warning', val: '86%', color: 'border-orange-500/20 bg-orange-500/5 text-orange-400' },
                { name: 'Privacy Mandate', status: 'Critical', val: '72%', color: 'border-red-500/20 bg-red-500/5 text-red-400' },
                { name: 'Retention standard', status: 'Optimal', val: '99%', color: 'border-green-500/20 bg-green-500/5 text-green-400' },
              ].map(cat => (
                <div key={cat.name} className={`p-3 rounded-lg border flex flex-col justify-between h-20 ${cat.color}`}>
                  <span className="text-[10px] font-bold truncate">{cat.name}</span>
                  <span className="text-lg font-headline font-bold">{cat.val}</span>
                  <span className="text-[8px] uppercase tracking-wider opacity-80">{cat.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Governance Activity Feed */}
        <div className="lg:col-span-5 bg-[#111827] rounded-xl border border-[#2A3447] inner-glow p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#2A3447]/60 pb-3 mb-4">
            <h3 className="font-headline text-md font-bold text-white">System Audit Log</h3>
            <span className="material-symbols-outlined text-sm text-[#e8bcb9] opacity-65">history</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-2">
            {activities.map((act) => {
              // Icon selector
              let icon = 'info';
              let color = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
              if (act.type === 'scan') {
                icon = 'search';
                color = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
              } else if (act.type === 'status') {
                icon = 'history';
                color = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
              } else if (act.type === 'resolution') {
                icon = 'check_circle';
                color = 'text-green-400 bg-green-500/10 border-green-500/20';
              } else if (act.type === 'upload') {
                icon = 'cloud_upload';
                color = 'text-pink-400 bg-pink-500/10 border-pink-500/20';
              }

              return (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                  <div className={`p-1.5 rounded-lg border h-fit ${color.split(' ')[1]} ${color.split(' ')[2]}`}>
                    <span className={`material-symbols-outlined text-xs ${color.split(' ')[0]}`}>{icon}</span>
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <p className="text-white font-medium">{act.message}</p>
                    <span className="text-[9px] text-[#e8bcb9] opacity-50">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
