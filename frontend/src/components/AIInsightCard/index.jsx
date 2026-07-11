import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AIInsightCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#172033] border border-[#2A3447] rounded-xl p-6 inner-glow ai-mesh relative overflow-hidden">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-1 bg-[#E60028]/20 rounded">
          <span className="material-symbols-outlined text-[#E60028] text-lg material-symbols-fill">
            auto_awesome
          </span>
        </div>
        <h3 className="font-headline text-md font-bold text-[#fedad7]">AI Insight</h3>
      </div>
      <p className="text-sm text-[#fedad7] mb-6 leading-relaxed">
        Two uploaded policies contain <span className="text-[#E60028] font-bold underline decoration-[#E60028]/30 decoration-2">conflicting password rotation rules</span> (90 vs 180 days).
      </p>
      <button
        onClick={() => navigate('/conflicts')}
        className="w-full bg-[#E60028]/10 border border-[#E60028]/30 text-[#E60028] font-bold py-2 rounded-lg hover:bg-[#E60028] hover:text-white transition-all flex items-center justify-center gap-2"
      >
        Review Conflict
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </div>
  );
}
