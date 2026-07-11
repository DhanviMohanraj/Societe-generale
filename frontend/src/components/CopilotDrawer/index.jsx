import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CopilotDrawer({ isOpen, onClose, activePolicy }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'copilot',
      text: "I've analyzed the conflict between POL-GBL-204 and POL-REG-EMEA-08. The contradiction lies in the password rotation frequency (90 vs 180 days), which could lead to non-compliance in central monitoring. How can I help you resolve this?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (activePolicy) {
      setMessages([
        {
          id: Date.now(),
          sender: 'copilot',
          text: `I have updated my context with "${activePolicy.title}" (${activePolicy.id || 'POL-GBL-201'}). I can help you summarize this policy, identify conflicts, or draft compliance audits.`,
        },
      ]);
    }
  }, [activePolicy]);

  const suggestedQueries = [
    "Explain this policy in detail",
    "Summarize obligations",
    "Identify any related conflicts"
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    // Simulate copilot typing after 1s
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'copilot',
          text: `This is a simulated AI response to: "${newMsg.text}". In a production setup, this would query your compliance knowledge graph or policy model.`,
        },
      ]);
    }, 1000);
  };

  const handleSuggestedClick = (query) => {
    setInputValue(query);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-16 bottom-0 w-[400px] glass-panel border-l border-[#2A3447] z-[100] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#2A3447] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C8102E]">smart_toy</span>
                <h3 className="font-headline text-lg font-bold text-white">Lexora Copilot</h3>
              </div>
              <button
                onClick={onClose}
                className="text-[#e8bcb9] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.sender === 'copilot' ? 'bg-[#C8102E] text-white' : 'bg-[#172033] border border-[#2A3447]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {msg.sender === 'copilot' ? 'bolt' : 'person'}
                    </span>
                  </div>
                  <div
                    className={`rounded-xl p-4 text-sm leading-relaxed ${
                      msg.sender === 'copilot'
                        ? 'bg-[#172033]/80 border border-[#2A3447]/60 text-[#e8bcb9]'
                        : 'bg-[#C8102E]/10 border border-[#C8102E]/30 text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Suggestions */}
              <div className="space-y-2 pt-6">
                <p className="font-headline text-xs font-bold tracking-widest text-[#e8bcb9] uppercase opacity-60">
                  Suggested Queries
                </p>
                {suggestedQueries.map((query) => (
                  <button
                    key={query}
                    onClick={() => handleSuggestedClick(query)}
                    className="w-full text-left p-3 rounded-lg bg-[#0A1220] border border-[#2A3447] hover:border-[#C8102E] transition-all group flex items-center justify-between"
                  >
                    <span className="text-xs text-[#e8bcb9] group-hover:text-white">
                      {query}
                    </span>
                    <span className="material-symbols-outlined text-[#e8bcb9] text-[16px]">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-6 border-t border-[#2A3447]">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-[#0A1220] border border-[#2A3447] rounded-xl py-3 pl-4 pr-12 focus:ring-1 focus:ring-[#C8102E] focus:border-[#C8102E] outline-none text-xs text-white placeholder:text-on-surface-variant/30"
                  placeholder="Ask Lexora..."
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#C8102E] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
