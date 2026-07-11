import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { name: 'Workspace', path: '/workspace', icon: 'dashboard' },
    { name: 'Policies', path: '/policies', icon: 'gavel' },
    { name: 'Conflicts', path: '/conflicts', icon: 'warning' },
    { name: 'Reports', path: '#', icon: 'assessment' },
    { name: 'Settings', path: '#', icon: 'settings' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#111827] border-r border-[#2A3447] flex flex-col py-6 z-50">
      {/* Brand logo */}
      <div className="px-6 mb-10 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#C8102E] text-2xl material-symbols-fill">
          shield_with_heart
        </span>
        <div className="flex flex-col">
          <span className="font-headline text-xl font-bold text-[#C8102E] tracking-tight">Lexora</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#e8bcb9] opacity-60">Enterprise Intelligence</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          if (item.path === '#') {
            return (
              <span
                key={item.name}
                className="flex items-center gap-3 px-4 py-2.5 text-[#e8bcb9] font-medium hover:bg-[#172033]/50 hover:text-white transition-colors cursor-not-allowed opacity-50 rounded-lg group"
              >
                <span className="material-symbols-outlined group-hover:text-[#C8102E] transition-colors">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </span>
            );
          }
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? 'text-[#ffb3ae] font-bold border-r-2 border-[#C8102E] bg-[#C8102E]/10'
                    : 'text-[#e8bcb9] font-medium hover:bg-[#172033] hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar bottom */}
      <div className="px-4 mt-auto pt-6 border-t border-[#2A3447]/30">
        <button className="w-full bg-gradient-to-br from-[#C8102E] to-[#B11226] text-white font-semibold py-2.5 rounded-lg inner-glow shadow-lg hover:opacity-95 active:scale-95 transition-all mb-4">
          New Analysis
        </button>
        <a
          className="flex items-center gap-3 px-4 py-2.5 text-[#e8bcb9] font-medium hover:bg-[#172033] transition-colors rounded-lg"
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          <span className="material-symbols-outlined">help</span>
          <span className="text-sm">Support</span>
        </a>
      </div>
    </aside>
  );
}
