import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function UploadZone({ onFilesUploaded }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length && onFilesUploaded) {
      // Filter for accepted files (.pdf, .docx, .txt)
      const allowed = files.filter(f => 
        f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.txt')
      );
      if (allowed.length > 0) {
        onFilesUploaded(allowed);
      } else {
        alert('Unsupported file type. Please upload PDF, DOCX or TXT.');
      }
    }
  };

  const handleBrowseClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length && onFilesUploaded) {
      onFilesUploaded(files);
    }
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
      whileHover={{ borderColor: '#C8102E' }}
      className={`drag-area group relative h-64 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
        isDragOver ? 'bg-[#C8102E]/5 scale-[1.01]' : 'hover:bg-[#111827]'
      }`}
    >
      <input
        type="file"
        multiple
        accept=".pdf,.docx,.txt"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mb-4 p-3 rounded-full bg-[#111827] border border-[#2A3447] text-[#C8102E] group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'wght' 200" }}>
          cloud_upload
        </span>
      </div>
      
      <h2 className="font-headline text-xl mb-1 tracking-tight text-[#fedad7]">
        Upload Policy Documents
      </h2>
      <p className="text-sm text-[#e8bcb9] opacity-70 mb-6">
        Drag & Drop PDFs, DOCX or TXT files to start analysis
      </p>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBrowseClick}
        className="px-6 py-2.5 border border-[#2A3447] text-[#fedad7] font-medium rounded-lg hover:border-[#C8102E] hover:bg-[#C8102E]/5 transition-all"
      >
        Browse Files
      </motion.button>
      
      {/* Decorative subtle grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
    </motion.div>
  );
}
