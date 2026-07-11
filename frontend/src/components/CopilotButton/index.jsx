import React from 'react';
import { motion } from 'framer-motion';

export default function CopilotButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-14 h-14 rounded-full primary-gradient-btn text-white flex items-center justify-center shadow-lg transition-all duration-300 group fixed bottom-6 right-6 z-[100]"
    >
      <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
        bolt
      </span>
    </motion.button>
  );
}
