import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CopilotDrawer from '../components/CopilotDrawer';

export default function DashboardLayout({ pageTitle }) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0A1220] text-on-surface flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="pl-64 flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header (with copilot toggle action trigger) */}
        <Header
          title={pageTitle}
          onUploadClick={() => addToast('Upload Policies feature clicked!', 'info')}
          onCopilotClick={() => setIsCopilotOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0A1220] pt-16">
          <div className="max-w-[1200px] mx-auto px-12 py-10">
            <Outlet context={{ activePolicy, setActivePolicy, addToast, isCopilotOpen, setIsCopilotOpen }} />
          </div>
        </main>
      </div>

      {/* Lexora Copilot Slide Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        activePolicy={activePolicy}
      />

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[120] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="pointer-events-auto p-4 rounded-xl glass-panel border border-[#2A3447] shadow-2xl flex items-center gap-3 text-xs text-white max-w-sm"
            >
              <span className={`material-symbols-outlined text-sm ${
                toast.type === 'success' ? 'text-green-400' :
                toast.type === 'error' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {toast.type === 'success' ? 'check_circle' :
                 toast.type === 'error' ? 'error' : 'info'}
              </span>
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
