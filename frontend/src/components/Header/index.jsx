import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '../SearchBar';

export default function Header({ title, onUploadClick, onCopilotClick }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (val) {
      setSearchParams({ q: val });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, text: 'POL-GBL-204 conflict detected in rotation cycle', time: '5h ago', unread: true },
    { id: 2, text: 'Cybersecurity_Protocol_v4.pdf verified successfully', time: '12h ago', unread: false },
    { id: 3, text: 'New policy analysis completed for Data Privacy Standard', time: '1d ago', unread: false },
  ];

  return (
    <header className="fixed top-0 right-0 h-16 w-[calc(100%-16rem)] bg-[#0A1220] border-b border-[#2A3447] flex justify-between items-center px-12 z-40">
      <div className="flex items-center gap-10 flex-1">
        <span className="font-headline text-lg font-bold text-[#C8102E]">
          {title}
        </span>
        <SearchBar
          placeholder="Search policies, obligations..."
          value={query}
          onChange={handleSearchChange}
        />
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={onUploadClick}
          className="bg-transparent border border-[#2A3447] hover:border-[#C8102E] hover:text-white text-[#fedad7] transition-colors px-4 py-2 rounded-lg text-sm font-medium"
        >
          Upload Policies
        </button>

        {/* Copilot Action Button */}
        <button
          onClick={onCopilotClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A3447] hover:border-[#C8102E] hover:text-white text-[#fedad7] transition-all text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-sm">smart_toy</span>
          <span>🤖 AI Copilot</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <div
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="relative cursor-pointer hover:scale-105 transition-transform active:scale-95 text-[#e8bcb9] hover:text-white"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#C8102E] rounded-full border-2 border-[#0A1220]"></span>
          </div>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-80 glass-panel rounded-xl shadow-2xl overflow-hidden border border-[#2A3447] z-50 text-xs"
              >
                <div className="px-4 py-3 border-b border-[#2A3447] bg-[#111827] font-bold text-white flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-[10px] text-[#C8102E] uppercase font-bold">3 alerts</span>
                </div>
                <div className="divide-y divide-[#2A3447]/30 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 hover:bg-[#172033]/60 transition-colors cursor-pointer ${
                        n.unread ? 'bg-[#C8102E]/5' : ''
                      }`}
                    >
                      <p className="text-white font-medium mb-1">{n.text}</p>
                      <p className="text-[10px] text-[#e8bcb9] opacity-60">{n.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User profile avatar */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="w-8 h-8 rounded-full overflow-hidden bg-[#172033] border border-[#2A3447] cursor-pointer hover:scale-105 transition-transform"
          >
            <img
              className="w-full h-full object-cover"
              alt="Profile Avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFMEr8wJifMmIYw_lvUx4OvVIO9ZZP1nUxlnuNQ1zkTmytOAOqsn7hWnchTaecyg2zmd51b70MqNioaxguJSiLdkskAwX63k8GKPJfgjHA8FhkcZrS9cr7E5Nt1u7ICdHlC8ZY1qJ8cZx07hNdIkfVUpQ5Jh7I-DfAyFRgX82EmVOH7OVCVlMdmaErmaCHHHY5ZfyediR_jn6ppvNUxVDMq6sTVIH-Wjfa4Bh-F15gRx6kEWalK-M"
            />
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-48 glass-panel rounded-xl shadow-2xl overflow-hidden border border-[#2A3447] z-50 text-xs"
              >
                <div className="px-4 py-3 border-b border-[#2A3447] bg-[#111827] text-white">
                  <p className="font-bold">Legal Executive</p>
                  <p className="text-[10px] text-[#e8bcb9] opacity-60">admin@lexora.ai</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      alert('Profile settings loaded');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-[#fedad7] hover:bg-[#172033]/60 transition-colors"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-[#ffadaa] hover:bg-[#C8102E]/10 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
