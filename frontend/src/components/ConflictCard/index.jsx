import React from 'react';

export default function ConflictCard({ policyA, policyB }) {
  return (
    <div className="relative flex flex-col md:flex-row items-center gap-6">
      {/* Policy A */}
      <div className="flex-1 glass-panel inner-glow rounded-xl p-6 space-y-4 border-l-4 border-l-[#2A3447] transition-all hover:border-l-[#C8102E] w-full">
        <div className="flex items-center justify-between">
          <span className="font-code text-xs bg-white/5 px-2 py-1 rounded text-[#e8bcb9] opacity-60">
            {policyA.id}
          </span>
          <span className="material-symbols-outlined text-[#e8bcb9] opacity-60">{policyA.icon || 'public'}</span>
        </div>
        <h3 className="font-headline text-lg text-white">{policyA.title}</h3>
        <p className="text-[#e8bcb9] text-xs line-clamp-2">{policyA.description}</p>
        <div className="p-4 bg-[#0A1220]/50 rounded border border-[#2A3447]">
          <p className="text-[10px] uppercase text-[#e8bcb9] opacity-60 mb-2">Key Constraint</p>
          <p className="font-code text-sm text-white">
            Rotation Cycle: <span className="text-[#ffb3ae] font-bold">{policyA.constraint}</span>
          </p>
        </div>
      </div>

      {/* VS Badge */}
      <div className="flex flex-col items-center gap-1 z-10 flex-shrink-0">
        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-[#C8102E] to-[#C8102E] hidden md:block"></div>
        <div className="w-12 h-12 rounded-full border-2 border-[#C8102E] bg-[#0A1220] flex items-center justify-center shadow-[0_0_20px_rgba(200,16,46,0.3)]">
          <span className="font-headline text-sm text-[#C8102E] font-bold">VS</span>
        </div>
        <div className="w-[1px] h-8 bg-gradient-to-t from-transparent via-[#C8102E] to-[#C8102E] hidden md:block"></div>
      </div>

      {/* Policy B */}
      <div className="flex-1 glass-panel inner-glow rounded-xl p-6 space-y-4 border-r-4 border-r-[#2A3447] transition-all hover:border-r-[#C8102E] text-right w-full">
        <div className="flex items-center justify-between flex-row-reverse">
          <span className="font-code text-xs bg-white/5 px-2 py-1 rounded text-[#e8bcb9] opacity-60">
            {policyB.id}
          </span>
          <span className="material-symbols-outlined text-[#e8bcb9] opacity-60">{policyB.icon || 'flag'}</span>
        </div>
        <h3 className="font-headline text-lg text-white">{policyB.title}</h3>
        <p className="text-[#e8bcb9] text-xs line-clamp-2 text-right">{policyB.description}</p>
        <div className="p-4 bg-[#0A1220]/50 rounded border border-[#2A3447] text-right">
          <p className="text-[10px] uppercase text-[#e8bcb9] opacity-60 mb-2">Key Constraint</p>
          <p className="font-code text-sm text-white">
            Rotation Cycle: <span className="text-[#ffb3ae] font-bold">{policyB.constraint}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
