import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatusBadge from '../StatusBadge';

export default function PolicyCard({ policy, onClick }) {
  const { title, status, department, updatedTime, description, obligations, conflicts, health, icon } = policy;
  
  // Animated Health Score counter
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = parseInt(health) || 0;
    if (target === 0) return;
    
    const stepTime = Math.max(Math.floor(800 / target), 10);
    const timer = setInterval(() => {
      current += 1;
      if (current >= target) {
        setHealthScore(target);
        clearInterval(timer);
      } else {
        setHealthScore(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [health]);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, borderColor: '#C8102E' }}
      className="ai-mesh group p-6 bg-[#111827] border border-[#2A3447] rounded-xl flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-[#C8102E]/40 transition-all cursor-pointer shadow-md relative overflow-hidden"
    >
      <div className="flex-1 flex items-start gap-4">
        <div className="w-12 h-12 bg-[#172033] rounded-lg flex items-center justify-center border border-[#2A3447] group-hover:scale-105 transition-transform flex-shrink-0">
          <span className="material-symbols-outlined text-[#C8102E] text-2xl">{icon || 'policy'}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="font-headline text-md text-[#fedad7] font-bold group-hover:text-white transition-colors">
              {title}
            </h3>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#e8bcb9] opacity-60">
            <span>{department}</span>
            <span className="w-1 h-1 rounded-full bg-[#2A3447]" />
            <span>Updated {updatedTime}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-[1.5] px-6 border-x border-[#2A3447]/30 hidden lg:block">
        <p className="text-xs text-[#e8bcb9] leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
      
      <div className="flex-1 flex justify-around text-center w-full md:w-auto mt-4 md:mt-0">
        <div>
          <p className="font-code text-sm text-[#fedad7] font-bold">{obligations}</p>
          <p className="text-[10px] uppercase text-[#e8bcb9] opacity-60 tracking-wider">Obligations</p>
        </div>
        <div>
          <p className={`font-code text-sm font-bold ${conflicts > 0 ? 'text-[#ffadaa]' : 'text-[#fedad7]'}`}>
            {conflicts}
          </p>
          <p className="text-[10px] uppercase text-[#e8bcb9] opacity-60 tracking-wider">Conflicts</p>
        </div>
        <div>
          <p className="font-code text-sm text-[#C8102E] font-bold">{healthScore}%</p>
          <p className="text-[10px] uppercase text-[#e8bcb9] opacity-60 tracking-wider">Health</p>
        </div>
      </div>
      
      <div className="flex-none self-end md:self-center mt-4 md:mt-0">
        <button className="flex items-center gap-1 text-sm text-[#C8102E] hover:gap-2 transition-all font-semibold">
          Open Policy <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </motion.div>
  );
}
