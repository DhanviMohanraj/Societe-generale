import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - card.left - card.width / 2) / 25;
    const y = (e.clientY - card.top - card.height / 2) / 25;
    setRotate({ x: -y, y: x });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login and redirect to workspace
    navigate('/workspace');
  };

  return (
    <main className="flex min-h-screen w-full bg-[#0A1220] text-[#fedad7]">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-12 py-4 bg-transparent">
        <div className="flex items-center gap-2">
          <span className="font-headline text-2xl font-bold text-[#C8102E]">Lexora</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-1 text-[#e8bcb9] hover:text-[#ffb3ae] transition-colors text-xs font-semibold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            Help
          </button>
          <button className="flex items-center gap-1 text-[#e8bcb9] hover:text-[#ffb3ae] transition-colors">
            <span className="material-symbols-outlined text-[20px]">dark_mode</span>
          </button>
        </div>
      </nav>

      {/* Left side: Atmospheric Cover */}
      <section className="hidden lg:block lg:w-1/2 relative overflow-hidden border-r border-[#2A3447]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCSbZci60_lpZQoTPD0wQIS7-kIDac5qfIt4dxY6ogcflCvOe6SMN6rdqS85o_8WQdKiSK7OseASdjUhftTD7Nta9mQN91O49Vmwv9P8uq0g8Cz9qQfFHMM3bt6Njno-kIsL7uff56W-Om9t2fAr-hwI8jGfKFh2d8QJaKeuKaK8gY90X2FonhAteXwZ3ZXc1f39oGnaan15rIx6_5KObWIajRmjmKPAdCBTTQeFPJyvUT8tWbwt20')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A1220]/20" />
        <div className="absolute bottom-12 left-12 max-w-md animate-pulse">
          <div className="w-12 h-1 bg-[#C8102E] mb-4" />
          <p className="font-code text-xs text-[#C8102E]/80 uppercase tracking-widest">
            System Status: Operational
          </p>
        </div>
      </section>

      {/* Right side: Login form */}
      <section className="w-full lg:w-1/2 flex flex-col items-center justify-center relative px-6 md:px-12 py-16">
        {/* Background glow effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#C8102E_0%,transparent_70%)]" />

        {/* Parallax Login Card */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transition: rotate.x === 0 && rotate.y === 0 ? 'all 0.5s ease' : 'none',
          }}
          className="w-full max-w-[460px] glass-panel p-10 rounded-xl relative z-10"
        >
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-headline text-3xl font-bold text-[#C8102E] mb-1">Lexora</h1>
            <p className="text-[10px] text-[#e8bcb9] uppercase tracking-widest font-bold mb-4">
              Enterprise Policy Intelligence
            </p>
            <h2 className="font-headline text-lg font-medium text-[#fedad7]">
              Transforming Policies into Actionable Intelligence.
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#e8bcb9] uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e8bcb9] group-focus-within:text-[#C8102E] transition-colors">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A1220] border border-[#2A3447] text-[#fedad7] rounded-lg input-focus-ring transition-all placeholder:text-[#e8bcb9]/20 text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#e8bcb9] uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e8bcb9] group-focus-within:text-[#C8102E] transition-colors">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A1220] border border-[#2A3447] text-[#fedad7] rounded-lg input-focus-ring transition-all placeholder:text-[#e8bcb9]/20 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0A1220] border-[#2A3447] text-[#C8102E] focus:ring-[#C8102E]/20 cursor-pointer"
                />
                <span className="text-[#e8bcb9] group-hover:text-white transition-colors">Remember Me</span>
              </label>
              <a className="text-[#C8102E] hover:underline transition-all" href="#" onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 primary-gradient-btn text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
              type="submit"
            >
              <span>Sign In</span>
              <span className="material-symbols-outlined text-[20px]">login</span>
            </motion.button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A3447]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#172033] px-4 text-xs text-[#e8bcb9] opacity-60">Or continue with</span>
              </div>
            </div>

            <button
              className="w-full py-3 bg-transparent border border-[#2A3447] text-[#fedad7] font-semibold rounded-lg hover:bg-white/5 hover:border-[#3F4E66] transition-all flex items-center justify-center gap-2 text-sm"
              type="button"
              onClick={() => navigate('/workspace')}
            >
              <span className="material-symbols-outlined text-[20px]">fingerprint</span>
              <span>Single Sign-On</span>
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[#e8bcb9]/60 text-xs">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Secure enterprise access</span>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="fixed bottom-0 right-0 w-full lg:w-1/2 flex justify-center py-4 px-12 bg-transparent">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-2xl justify-between border-t border-[#2A3447]/20 pt-4 text-[10px] text-[#e8bcb9] opacity-60">
            <p>© 2024 Lexora Intelligence. All rights reserved.</p>
            <div className="flex gap-4">
              <a className="underline hover:text-white" href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <a className="underline hover:text-white" href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              <a className="underline hover:text-white" href="#" onClick={(e) => e.preventDefault()}>Security</a>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
