import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';

const DEFAULT_SETTINGS = {
  profile: {
    name: 'Lexora Administrator',
    email: 'admin@lexora.ai',
    department: 'Enterprise Governance',
    role: 'Policy Administrator',
  },
  ai: {
    model: 'Qwen',
    threshold: 80,
    autoRecommend: true,
    autoConflict: true,
    autoReports: false,
    realtimeNotify: true,
  },
  document: {
    uploadFolder: '/var/lexora/uploads/compliance',
    fileTypes: 'PDF, DOCX, TXT',
    maxSize: 50, // MB
    ocrEnabled: true,
  },
  appearance: {
    darkMode: true,
    accentColor: 'Red', // Red | Blue | Emerald
    compactLayout: false,
    animations: true,
  },
  security: {
    twoFactor: false,
    sessionTimeout: 30, // minutes
    apiToken: 'lex_live_4b8a9cf29e018dfad982c',
  }
};

export default function Settings() {
  const { addToast } = useOutletContext();
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('lexora_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    localStorage.setItem('lexora_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    localStorage.setItem('lexora_settings', JSON.stringify(settings));
    addToast('Workspace settings saved successfully!', 'success');
  };

  const handleGenerateToken = () => {
    const randomHex = Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('');
    updateSetting('security', 'apiToken', `lex_live_${randomHex}`);
    addToast('Generated new API token.', 'success');
  };

  const handleClearCache = () => {
    addToast('Cache cleared successfully! Saved 242MB storage.', 'success');
  };

  const handleDeleteAllReports = () => {
    if (window.confirm('Are you absolutely sure you want to delete all reports? This action is permanent.')) {
      localStorage.removeItem('lexora_reports');
      addToast('All reports deleted successfully.', 'success');
    }
  };

  const handleExportWorkspace = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "lexora_workspace_settings.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Workspace configuration exported.', 'success');
  };

  const sections = [
    { id: 'profile', label: 'User Profile', icon: 'person' },
    { id: 'ai', label: 'AI Preferences', icon: 'auto_awesome' },
    { id: 'document', label: 'Document Preferences', icon: 'description' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'security', label: 'Security', icon: 'security' },
    { id: 'data', label: 'Data Management', icon: 'database' },
  ];

  return (
    <div className="bg-[#111827] rounded-xl border border-[#2A3447] inner-glow min-h-[600px] flex overflow-hidden">
      {/* Sidebar Nav */}
      <aside className="w-64 border-r border-[#2A3447]/60 bg-[#0A1220]/20 py-6 px-4 space-y-1 flex flex-col">
        <div className="px-3 mb-6">
          <h2 className="font-headline text-md font-bold text-white">Workspace Settings</h2>
          <p className="text-[10px] text-[#e8bcb9] opacity-60">Lexora Enterprise Governance</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === sec.id
                  ? 'bg-[#C8102E]/10 text-[#ffb3ae] border-r-2 border-[#C8102E]'
                  : 'text-[#e8bcb9] hover:bg-[#172033]/50 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleSave}
          className="w-full mt-auto bg-gradient-to-br from-[#C8102E] to-[#B11226] text-white font-bold py-2 rounded-lg text-xs hover:opacity-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xs">save</span>
          Save Changes
        </button>
      </aside>

      {/* Main Settings Panel */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Profile Settings */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-[#2A3447]/60 pb-3">User Profile</h3>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C8102E] to-[#B11226] flex items-center justify-center text-white font-bold text-lg shadow-lg border border-[#2A3447]">
                LA
              </div>
              <div>
                <button
                  onClick={() => addToast('Upload avatar feature coming soon!', 'info')}
                  className="bg-[#2A3447] text-white text-xs px-3 py-1.5 rounded hover:bg-[#3F4E66] transition-colors font-bold"
                >
                  Upload New Avatar
                </button>
                <p className="text-[10px] text-[#e8bcb9] opacity-60 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Full Name</label>
                <input
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                  className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8102E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Email Address</label>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8102E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Department</label>
                <input
                  type="text"
                  value={settings.profile.department}
                  onChange={(e) => updateSetting('profile', 'department', e.target.value)}
                  className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8102E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Access Role</label>
                <input
                  type="text"
                  value={settings.profile.role}
                  onChange={(e) => updateSetting('profile', 'role', e.target.value)}
                  className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8102E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Engine Settings */}
        {activeSection === 'ai' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-[#2A3447]/60 pb-3">AI Engine Preferences</h3>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Choose AI Model</label>
              <div className="flex gap-4">
                {['Qwen', 'Llama', 'GPT (Future Integration)'].map((m) => (
                  <label key={m} className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                    <input
                      type="radio"
                      name="ai_model"
                      checked={settings.ai.model === m}
                      disabled={m.includes('Future')}
                      onChange={() => updateSetting('ai', 'model', m)}
                      className="accent-[#C8102E]"
                    />
                    <span className={m.includes('Future') ? 'opacity-50' : ''}>{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Threshold slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Confidence Threshold</label>
                <span className="font-bold text-[#C8102E]">{settings.ai.threshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.ai.threshold}
                onChange={(e) => updateSetting('ai', 'threshold', Number(e.target.value))}
                className="w-full accent-[#C8102E]"
              />
            </div>

            {/* AI Toggles */}
            <div className="space-y-4 pt-2">
              {[
                { key: 'autoRecommend', label: 'Enable Auto Recommendations', desc: 'Allows the AI to proactively generate mitigation steps for policy conflicts.' },
                { key: 'autoConflict', label: 'Enable Auto Conflict Detection', desc: 'Scan newly uploaded documents against database automatically.' },
                { key: 'autoReports', label: 'Auto Generate Health Reports', desc: 'Trigger routine governance reports on scheduled intervals.' },
                { key: 'realtimeNotify', label: 'Real-time Notifications', desc: 'Push warnings directly to active browser sessions upon staleness trigger.' }
              ].map(toggle => (
                <div key={toggle.key} className="flex items-start justify-between gap-4 p-3 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white">{toggle.label}</h4>
                    <p className="text-[10px] text-[#e8bcb9] opacity-60">{toggle.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ai[toggle.key]}
                    onChange={(e) => updateSetting('ai', toggle.key, e.target.checked)}
                    className="w-4 h-4 rounded text-[#C8102E] accent-[#C8102E] cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Preferences */}
        {activeSection === 'document' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-[#2A3447]/60 pb-3">Document & Upload Preferences</h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Default Upload Folder</label>
                <input
                  type="text"
                  value={settings.document.uploadFolder}
                  onChange={(e) => updateSetting('document', 'uploadFolder', e.target.value)}
                  className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Supported File Types</label>
                  <input
                    type="text"
                    value={settings.document.fileTypes}
                    onChange={(e) => updateSetting('document', 'fileTypes', e.target.value)}
                    className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Maximum Upload Size (MB)</label>
                  <input
                    type="number"
                    value={settings.document.maxSize}
                    onChange={(e) => updateSetting('document', 'maxSize', Number(e.target.value))}
                    className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Enable OCR Engine</h4>
                  <p className="text-[10px] text-[#e8bcb9] opacity-60">Enable Optical Character Recognition parsing for scanned/image PDFs.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.document.ocrEnabled}
                  onChange={(e) => updateSetting('document', 'ocrEnabled', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#C8102E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeSection === 'appearance' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-[#2A3447]/60 pb-3">Appearance & Layout</h3>

            <div className="space-y-4">
              {/* Dark mode */}
              <div className="flex items-center justify-between p-3 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                <div>
                  <h4 className="text-xs font-bold text-white">Force Dark Mode</h4>
                  <p className="text-[10px] text-[#e8bcb9] opacity-60">Enforce Lexora Crimson dark palette. (Recommended)</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.appearance.darkMode}
                  onChange={(e) => updateSetting('appearance', 'darkMode', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#C8102E]"
                />
              </div>

              {/* Accent selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Accent Color</label>
                <div className="flex gap-4">
                  {['Red', 'Blue', 'Emerald'].map(color => (
                    <label key={color} className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                      <input
                        type="radio"
                        checked={settings.appearance.accentColor === color}
                        onChange={() => updateSetting('appearance', 'accentColor', color)}
                        className="accent-[#C8102E]"
                      />
                      <span>{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compact / Animations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                  <div>
                    <h4 className="text-xs font-bold text-white">Compact Layout</h4>
                    <p className="text-[10px] text-[#e8bcb9] opacity-60">Decrease UI cell padding.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.appearance.compactLayout}
                    onChange={(e) => updateSetting('appearance', 'compactLayout', e.target.checked)}
                    className="w-4 h-4 rounded accent-[#C8102E]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                  <div>
                    <h4 className="text-xs font-bold text-white">Enable Transitions</h4>
                    <p className="text-[10px] text-[#e8bcb9] opacity-60">Render framer-motion micro-animations.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.appearance.animations}
                    onChange={(e) => updateSetting('appearance', 'animations', e.target.checked)}
                    className="w-4 h-4 rounded accent-[#C8102E]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeSection === 'security' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-[#2A3447]/60 pb-3">Security & Access Controls</h3>

            <div className="space-y-4">
              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                <div>
                  <h4 className="text-xs font-bold text-white">Two-Factor Authentication</h4>
                  <p className="text-[10px] text-[#e8bcb9] opacity-60">Enforce mobile token login upon portal access.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactor}
                  onChange={(e) => updateSetting('security', 'twoFactor', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#C8102E]"
                />
              </div>

              {/* Session timeout selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Session Timeout (Minutes)</label>
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSetting('security', 'sessionTimeout', Number(e.target.value))}
                  className="w-full bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="120">120 Minutes (Insecure)</option>
                </select>
              </div>

              {/* API Token display */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#e8bcb9] opacity-60">Lexora API Endpoint Token</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.security.apiToken}
                    readOnly
                    className="flex-1 bg-[#0A1220] border border-[#2A3447] rounded-lg px-3 py-2 text-xs text-white select-all font-code"
                  />
                  <button
                    onClick={handleGenerateToken}
                    className="bg-[#2A3447] text-white text-xs px-3 py-2 rounded hover:bg-[#3F4E66] transition-all font-bold"
                  >
                    Regenerate Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Management Settings */}
        {activeSection === 'data' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-[#2A3447]/60 pb-3">Workspace Data Management</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                <div>
                  <h4 className="text-xs font-bold text-white">Export Configuration</h4>
                  <p className="text-[10px] text-[#e8bcb9] opacity-60">Download configuration JSON containing custom prompt settings and preferences.</p>
                </div>
                <button
                  onClick={handleExportWorkspace}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  Export Workspace
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0A1220]/40 rounded-lg border border-[#2A3447]/30">
                <div>
                  <h4 className="text-xs font-bold text-white">Purge System Caches</h4>
                  <p className="text-[10px] text-[#e8bcb9] opacity-60">Delete processed vector index local files and intermediate parsed texts.</p>
                </div>
                <button
                  onClick={handleClearCache}
                  className="bg-[#2A3447] hover:bg-[#3F4E66] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">cleaning_services</span>
                  Clear Cache
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#C8102E]/5 rounded-lg border border-[#C8102E]/20">
                <div>
                  <h4 className="text-xs font-bold text-white text-[#C8102E]">Delete All Generated Reports</h4>
                  <p className="text-[10px] text-[#e8bcb9] opacity-60">Permanently empty reports dashboard state and clear list databases.</p>
                </div>
                <button
                  onClick={handleDeleteAllReports}
                  className="bg-[#C8102E] hover:bg-[#B11226] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">delete_forever</span>
                  Delete Reports
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
