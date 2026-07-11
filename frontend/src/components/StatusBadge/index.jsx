import React from 'react';

export default function StatusBadge({ status }) {
  const normalized = status?.toLowerCase().trim();

  let styles = "bg-muted/10 text-muted";
  let tooltip = "Standard policy status.";
  
  if (normalized === 'verified' || normalized === 'healthy') {
    styles = "bg-green-500/10 text-green-400";
    tooltip = "Policy meets all regulatory obligations and has a high compliance scoring.";
  } else if (normalized === 'pending review' || normalized === 'pending') {
    styles = "bg-yellow-500/10 text-yellow-400";
    tooltip = "Document has been uploaded and is waiting for compliance review.";
  } else if (normalized === 'conflict detected' || normalized === 'conflict') {
    styles = "bg-red-500/10 text-red-400";
    tooltip = "AI has flagged contradictions or rule mismatches against other policies.";
  }

  return (
    <div className="relative group/badge inline-block cursor-help">
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-code text-[10px] font-bold tracking-wider uppercase ${styles}`}>
        {status}
      </span>
      {/* Tooltip Popup */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 hidden group-hover/badge:block bg-[#172033] border border-[#2A3447] text-[#fedad7] text-[10px] p-2 rounded shadow-2xl z-50 text-center leading-normal normal-case pointer-events-none">
        {tooltip}
      </div>
    </div>
  );
}
