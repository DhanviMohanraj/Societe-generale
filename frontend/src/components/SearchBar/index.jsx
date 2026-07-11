import React, { useRef, useEffect } from 'react';

export default function SearchBar({ placeholder = "Search...", value, onChange, shortcut = "⌘K" }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-96 group">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-md">
        search
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        className="w-full bg-background border border-outline rounded-lg pl-10 pr-12 py-2 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 text-on-surface placeholder:text-on-surface-variant/30 transition-all"
        placeholder={placeholder}
      />
      {shortcut && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-code text-on-surface-variant/40 border border-outline px-1.5 py-0.5 rounded pointer-events-none">
          {shortcut}
        </span>
      )}
    </div>
  );
}
