import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { governanceService } from '../services/governanceService';

export default function Admin() {
  const { addToast } = useOutletContext();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [scanning, setScanning] = useState(false);

  // Load real governance snapshot from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await governanceService.getSnapshot();
      setSnapshot(data);

      // Build activity feed from real policy data
      if (data?.policy_summaries?.length) {
        const feed = data.policy_summaries.flatMap((p, i) => {
          const events = [];
          events.push({
            id: `${p.policy_id}-upload`,
            time: 'Recently',
            type: 'upload',
            message: `Policy "${p.policy_name}" ingested and vectorized into knowledge graph.`
          });
          if (p.conflict_count > 0) {
            events.push({
              id: `${p.policy_id}-conflict`,
              time: 'Recently',
              type: 'scan',
              message: `${p.conflict_count} conflict(s) detected in "${p.policy_name}" — risk level: ${p.risk_level}.`
            });
          }
          if (p.governance_score >= 80) {
            events.push({
              id: `${p.policy_id}-health`,
              time: 'Recently',
              type: 'status',
              message: `Governance health for "${p.policy_name}" scored ${p.governance_score}% — marked ${p.risk_level} risk.`
            });
          }
          return events;
        });
        setActivities(feed.slice(0, 8));
      }
    } catch (err) {
      console.error('Failed to load governance data', err);
      addToast('Failed to load admin governance data. Run the pipeline first.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTriggerScan = () => {
    setScanning(true);
    addToast('Re-fetching latest governance analytics...', 'info');
    setTimeout(async () => {
      await fetchData();
      setScanning(false);
      addToast('Governance data refreshed.', 'success');
    }, 1500);
  };

  // Derive real metrics from snapshot
  const totalPolicies = snapshot?.total_policies ?? 0;
  const totalConflicts = snapshot?.total_conflicts ?? 0;
  const duplicates = snapshot?.duplicate_requirements ?? 0;
  const govScore = snapshot?.overall_governance_score ?? 0;
  const riskLevel = snapshot?.overall_risk_level ?? 'N/A';

  // Build department rows from real policy summaries
  const deptRows = (snapshot?.policy_summaries ?? []).map(p => ({
    name: p.policy_name,
    policies: p.obligation_count,
    conflicts: p.conflict_count,
    compliance: p.governance_score,
    color: p.governance_score >= 80
      ? 'text-green-400 bg-green-500/10 border-green-500/20'
      : p.governance_score >= 60
        ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
        : 'text-red-400 bg-red-500/10 border-red-500/20'
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E] animate-spin" />
        <p className="text-xs text-[#e8bcb9] opacity-60">Loading governance data...</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <span className="material-symbols-outlined text-4xl text-[#e8bcb9] opacity-30">analytics</span>
        <p className="text-sm text-[#e8bcb9] opacity-60 max-w-sm">
          No governance data available. Upload a policy document in the Workspace and run the AI pipeline first.
        </p>
      </div>
    );
  }

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
          {scanning ? 'Refreshing...' : 'Refresh Analytics'}
        </button>
      </div>

      {/* Primary Metrics Grid — real data */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: 'Governance Score', val: `${govScore}%`, desc: 'Overall policy health index', trend: riskLevel + ' Risk', green: govScore >= 70, icon: 'shield' },
          { label: 'Analyzed Policies', val: String(totalPolicies), desc: 'Total repository corpus', trend: `${totalPolicies} active`, green: true, icon: 'gavel' },
          { label: 'Active Conflicts', val: String(totalConflicts), desc: 'Require attention', trend: totalConflicts === 0 ? 'All clear' : `${totalConflicts} open`, green: totalConflicts === 0, icon: 'warning' },
          { label: 'Duplicate Clauses', val: String(duplicates), desc: 'Redundant obligations', trend: duplicates === 0 ? 'None found' : `${duplicates} found`, green: duplicates === 0, icon: 'content_copy' },
          { label: 'Risk Level', val: riskLevel, desc: 'Enterprise risk classification', trend: govScore >= 70 ? 'Acceptable' : 'Review needed', green: govScore >= 70, icon: 'auto_awesome' },
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

        {/* Left Column: Policy Risk Breakdown */}
        <div className="lg:col-span-7 bg-[#111827] rounded-xl border border-[#2A3447] inner-glow p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A3447]/60 pb-3">
            <h3 className="font-headline text-md font-bold text-white">Policy Risk Breakdown</h3>
            <span className="text-[10px] text-[#e8bcb9] uppercase tracking-wider opacity-60">Live Index</span>
          </div>

          {deptRows.length === 0 ? (
            <p className="text-xs text-[#e8bcb9] opacity-40 text-center py-8">No policy data available.</p>
          ) : (
            <div className="space-y-5">
              {deptRows.map(dept => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white font-bold truncate max-w-[160px]">{dept.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#e8bcb9] opacity-75">{dept.policies} Obligations</span>
                      <span className="text-red-400 font-bold">{dept.conflicts} Conflicts</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${dept.color}`}>{dept.compliance}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[#0A1220] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        dept.compliance >= 80 ? 'bg-green-500' :
                        dept.compliance >= 60 ? 'bg-orange-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${dept.compliance}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Governance Activity Feed */}
        <div className="lg:col-span-5 bg-[#111827] rounded-xl border border-[#2A3447] inner-glow p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#2A3447]/60 pb-3 mb-4">
            <h3 className="font-headline text-md font-bold text-white">System Audit Log</h3>
            <span className="material-symbols-outlined text-sm text-[#e8bcb9] opacity-65">history</span>
          </div>

          {activities.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="material-symbols-outlined text-3xl text-[#e8bcb9] opacity-20">history</span>
              <p className="text-xs text-[#e8bcb9] opacity-40">No activity yet. Run the pipeline to generate logs.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-2">
              {activities.map((act) => {
                let icon = 'info';
                let color = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                if (act.type === 'scan') { icon = 'search'; color = 'text-purple-400 bg-purple-500/10 border-purple-500/20'; }
                else if (act.type === 'status') { icon = 'history'; color = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
                else if (act.type === 'resolution') { icon = 'check_circle'; color = 'text-green-400 bg-green-500/10 border-green-500/20'; }
                else if (act.type === 'upload') { icon = 'cloud_upload'; color = 'text-pink-400 bg-pink-500/10 border-pink-500/20'; }
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
          )}
        </div>

      </div>
    </div>
  );
}
