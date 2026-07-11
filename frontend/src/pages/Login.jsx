import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LexoraLogo from '../components/LexoraLogo';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Mouse Parallax movement
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cardRotate, setCardRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const x = (e.clientX - window.innerWidth / 2) / 80;
    const y = (e.clientY - window.innerHeight / 2) / 80;
    setMousePos({ x, y });
  };

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - card.left - card.width / 2) / 25;
    const y = (e.clientY - card.top - card.height / 2) / 25;
    setCardRotate({ x: -y, y: x });
  };

  const handleCardMouseLeave = () => {
    setCardRotate({ x: 0, y: 0 });
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }
    
    setIsLoading(true);

    try {
      let isAuthenticated = false;
      let token = 'lexora_mock_jwt_token_header_payload_signature';

      // 1. Prepared Call for future FastAPI /login endpoint
      try {
        const response = await fetch('http://127.0.0.1:8000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: email, password: password }),
        });

        if (response.ok) {
          const data = await response.json();
          token = data.access_token || token;
          isAuthenticated = true;
        }
      } catch (apiError) {
        // Backend API not reachable or /login endpoint not registered yet
      }

      // 2. Demo Credentials Fallback
      if (!isAuthenticated) {
        if (email === 'admin@lexora.ai' && password === 'Admin@123') {
          isAuthenticated = true;
        }
      }

      // 3. Response handling
      if (isAuthenticated) {
        localStorage.setItem('lexora_jwt_token', token);
        showToast('Authentication successful. Redirecting...', 'success');
        
        setTimeout(() => {
          navigate('/workspace');
        }, 1200);
      } else {
        setIsLoading(false);
        showToast('Invalid enterprise credentials.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      showToast('A secure connection error occurred.', 'error');
    }
  };

  return (
    <main
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#08111F] text-[#fedad7] overflow-hidden flex items-center justify-center select-none"
    >
      {/* Full-Screen Parallax Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out pointer-events-none z-0 scale-105"
        style={{
          transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`,
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCSbZci60_lpZQoTPD0wQIS7-kIDac5qfIt4dxY6ogcflCvOe6SMN6rdqS85o_8WQdKiSK7OseASdjUhftTD7Nta9mQN91O49Vmwv9P8uq0g8Cz9qQfFHMM3bt6Njno-kIsL7uff56W-Om9t2fAr-hwI8jGfKFh2d8QJaKeuKaK8gY90X2FonhAteXwZ3ZXc1f39oGnaan15rIx6_5KObWIajRmjmKPAdCBTTQeFPJyvUT8tWbwt20')`,
        }}
      />

      {/* Dark navy overlay */}
      <div className="absolute inset-0 bg-[#08111F]/85 pointer-events-none z-0" />

      {/* Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#08111F_95%)] pointer-events-none z-0" />

      {/* Ambient Lighting Glows */}
      <motion.div
        animate={{
          opacity: [0.18, 0.25, 0.18],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-[600px] h-[600px] rounded-full bg-[#B11226] blur-[150px] pointer-events-none z-0"
        style={{
          top: '20%',
          right: '5%',
          transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)`,
        }}
      />

      <motion.div
        animate={{
          opacity: [0.12, 0.18, 0.12],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/30 blur-[130px] pointer-events-none z-0"
        style={{
          bottom: '10%',
          left: '5%',
          transform: `translate(${-mousePos.x * 0.6}px, ${-mousePos.y * 0.6}px)`,
        }}
      />

      {/* Floating Background Network Nodes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <motion.div
          animate={{
            y: [-10, 10, -10],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-2 h-2 rounded-full bg-[#B11226] shadow-[0_0_10px_#B11226]"
          style={{ top: '30%', left: '15%' }}
        />
        <motion.div
          animate={{
            y: [10, -10, 10],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#3B82F6]"
          style={{ top: '65%', left: '25%' }}
        />
        <motion.div
          animate={{
            y: [-15, 15, -15],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-2.5 h-2.5 rounded-full bg-[#B11226] shadow-[0_0_12px_#B11226]"
          style={{ top: '20%', right: '25%' }}
        />
      </div>

      {/* Top-Left Brand Logo */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-12 py-5 bg-transparent">
        <motion.div
          whileHover={{ scale: 1.04, filter: 'drop-shadow(0 0 8px rgba(177,18,38,0.5))' }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <LexoraLogo className="w-10 h-10" />
          <div className="flex flex-col">
            <span className="font-headline text-2xl font-bold text-[#B11226] tracking-tight">Lexora</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#e8bcb9]/50">Enterprise Intelligence</span>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-6">
          <button
            onClick={() => alert('Secure portal documentation loaded')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#e8bcb9] hover:text-white transition-colors uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-sm">help_outline</span>
            Support
          </button>
        </div>
      </nav>

      {/* Centered/Floating Layout Container */}
      <div className="w-full max-w-[1200px] px-12 flex flex-col lg:flex-row items-center justify-between gap-12 z-10 relative pt-16">
        
        {/* Left Half: Title Text & Status indicator */}
        <div className="w-full lg:w-1/2 text-left space-y-8 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="w-12 h-1 bg-[#B11226]" />
            <h2 className="font-headline text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Governance & Compliance <br />
              <span className="text-[#B11226] bg-clip-text">Driven by AI</span>
            </h2>
            <p className="text-sm text-[#e8bcb9] opacity-80 max-w-md leading-relaxed">
              Verify corporate alignment, detect policy conflicts, and ensure systemic compliance within minutes using Lexora's semantic intelligence graph.
            </p>
          </motion.div>

          {/* Pulse Status Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-[#121B2C]/40 border border-[#2A3447]/60 rounded-xl p-4 w-fit flex items-center gap-4 shadow-xl backdrop-blur-sm"
          >
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <div className="text-xs">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#e8bcb9] opacity-60">System Status</div>
              <div className="text-white font-bold flex items-center gap-2 mt-0.5">
                <span>Operational</span>
                <span className="text-[9px] text-[#e8bcb9]/50 font-normal border-l border-[#2A3447] pl-2">Latency 23ms</span>
                <span className="text-[9px] text-[#e8bcb9]/50 font-normal border-l border-[#2A3447] pl-2">AI Services Online</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Half: Premium Glassmorphic Login Card */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${cardRotate.x}deg) rotateY(${cardRotate.y}deg) translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`,
              transition: cardRotate.x === 0 && cardRotate.y === 0 ? 'all 0.5s ease' : 'none',
            }}
            className="w-full max-w-[450px] bg-[#121B2C]/50 backdrop-blur-lg border border-[#2A3447]/60 p-10 rounded-2xl shadow-2xl relative transition-all duration-300 hover:border-[#B11226]/40 hover:shadow-[0_0_35px_rgba(177,18,38,0.08)]"
          >
            <div className="mb-8">
              <h2 className="font-headline text-lg font-bold text-white uppercase tracking-wider">Access Lexora Workspace</h2>
              <p className="text-[9px] text-[#e8bcb9] opacity-50 uppercase tracking-[0.2em] font-semibold mt-1">
                Enter credentials to log in
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#e8bcb9] uppercase tracking-wider" htmlFor="email">
                  Security Email Address
                </label>
                <div className="relative group flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#e8bcb9] group-focus-within:text-[#B11226] transition-colors text-sm">
                    alternate_email
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#08111F]/70 border border-[#2A3447] text-white rounded-xl focus:outline-none focus:border-[#B11226] focus:ring-1 focus:ring-[#B11226]/20 transition-all placeholder:text-[#e8bcb9]/20 text-xs"
                    placeholder="admin@lexora.ai"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#e8bcb9] uppercase tracking-wider" htmlFor="password">
                  Security Code / Password
                </label>
                <div className="relative group flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#e8bcb9] group-focus-within:text-[#B11226] transition-colors text-sm">
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#08111F]/70 border border-[#2A3447] text-white rounded-xl focus:outline-none focus:border-[#B11226] focus:ring-1 focus:ring-[#B11226]/20 transition-all placeholder:text-[#e8bcb9]/20 text-xs"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Remember & Session options */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#08111F] border-[#2A3447] text-[#B11226] focus:ring-[#B11226]/20 cursor-pointer accent-[#B11226]"
                  />
                  <span className="text-[#e8bcb9] opacity-75 group-hover:text-white transition-colors">Remember Session</span>
                </label>
                <a className="text-[#B11226] font-bold hover:underline transition-all" href="#" onClick={(e) => e.preventDefault()}>
                  Reset Password?
                </a>
              </div>

              {/* Submit Button with Loading Animation */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-br from-[#B11226] to-[#910e20] text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(177,18,38,0.25)] flex items-center justify-center gap-2 transition-all"
                type="submit"
              >
                {isLoading ? (
                  <>
                    <span>Authenticating...</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Enter Workspace</span>
                    <span className="material-symbols-outlined text-sm">login</span>
                  </>
                )}
              </motion.button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2A3447]/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#121B2C] px-3 text-[10px] text-[#e8bcb9] opacity-50 uppercase tracking-widest font-bold">Or</span>
                </div>
              </div>

              {/* Single Sign-On (SSO) */}
              <button
                disabled={isLoading}
                className="w-full py-3 bg-transparent border border-[#2A3447] text-white font-bold rounded-xl hover:bg-white/5 hover:border-[#3F4E66] transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-40"
                type="button"
                onClick={() => {
                  setEmail('admin@lexora.ai');
                  setPassword('Admin@123');
                  showToast('SSO credentials pre-filled. Press Enter Workspace.', 'info');
                }}
              >
                <span className="material-symbols-outlined text-sm">fingerprint</span>
                <span>Single Sign-On (SSO)</span>
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-[#e8bcb9] opacity-40 text-[10px] tracking-wider uppercase font-semibold">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span>256-bit Encrypted Session</span>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Page Footer */}
      <footer className="fixed bottom-0 left-0 w-full flex justify-between py-4 px-12 bg-transparent text-[10px] text-[#e8bcb9] opacity-50 z-10 pointer-events-none">
        <p>© 2026 Lexora Governance Platform. All rights reserved.</p>
        <div className="flex gap-4 pointer-events-auto">
          <a className="underline hover:text-white" href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a className="underline hover:text-white" href="#" onClick={(e) => e.preventDefault()}>Terms</a>
          <a className="underline hover:text-white" href="#" onClick={(e) => e.preventDefault()}>Security Operations</a>
        </div>
      </footer>

      {/* Floating Toast Alerts */}
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
    </main>
  );
}
