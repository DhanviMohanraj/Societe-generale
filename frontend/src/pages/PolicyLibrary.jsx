import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PolicyCard from '../components/PolicyCard';
import { governanceService } from '../services/governanceService';

export default function PolicyLibrary() {
  const { setActivePolicy, addToast } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Filters State
  const [activeDropdown, setActiveDropdown] = useState(null); // 'dept' | 'owner' | 'status' | 'version' | null
  const [filters, setFilters] = useState({
    department: 'All',
    owner: 'All',
    status: 'All',
    version: 'All'
  });

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const data = await governanceService.getPolicies();
      const mapped = data.map(p => {
        let icon = 'policy';
        let dept = 'Compliance & Legal';
        if (p.policy_name.toLowerCase().includes('password') || p.policy_name.toLowerCase().includes('auth')) {
          icon = 'lock';
          dept = 'Security Operations';
        } else if (p.policy_name.toLowerCase().includes('cloud') || p.policy_name.toLowerCase().includes('aws')) {
          icon = 'cloud';
          dept = 'Cloud Operations';
        }
        return {
          id: p.policy_id,
          title: p.policy_name,
          status: p.conflict_count > 0 ? 'Conflict Detected' : 'Healthy',
          department: dept,
          owner: 'Compliance Team',
          version: 'v1.0',
          updatedTime: 'Recently',
          description: `Comprehensive compliance scan for ${p.policy_name} completed with an overall score of ${p.governance_score}%. Identified ${p.conflict_count} active conflicts.`,
          obligations: p.obligation_count,
          conflicts: p.conflict_count,
          health: p.governance_score,
          icon: icon,
          summary: p.recommendations?.join('. ') || 'No recommendations generated.'
        };
      });
      setPolicies(mapped);
    } catch (err) {
      console.error("Failed to load policies", err);
      if (addToast) addToast(err.message || "Failed to load policy library.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Unique options extracted for dropdown menus
  const filterOptions = {
    department: ['All', 'Compliance & Legal', 'Security Operations', 'Cloud Operations'],
    owner: ['All', 'Compliance Team'],
    status: ['All', 'Healthy', 'Conflict Detected'],
    version: ['All', 'v1.0']
  };

  const handleOpenPolicy = (policy) => {
    // Set active policy in global context to update Copilot reference
    if (setActivePolicy) {
      setActivePolicy(policy);
    }
    // Navigate to Policy Viewer page
    navigate(`/policies/${policy.id}`);
    
    if (addToast) {
      addToast(`Opening ${policy.title} in Workspace Viewer`, 'success');
    }
  };

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(prev => prev === dropdown ? null : dropdown);
  };

  const handleSelectFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActiveDropdown(null);
    if (addToast) {
      addToast(`Filtered by ${key}: ${value}`, 'info');
    }
  };

  // Live filter evaluation
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          policy.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = filters.department === 'All' || policy.department === filters.department;
    const matchesOwner = filters.owner === 'All' || policy.owner === filters.owner;
    const matchesStatus = filters.status === 'All' || policy.status === filters.status;
    const matchesVersion = filters.version === 'All' || policy.version === filters.version;

    return matchesSearch && matchesDept && matchesOwner && matchesStatus && matchesVersion;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E] animate-spin" />
        <span className="text-xs text-[#e8bcb9] opacity-75">Loading policy library...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="mb-6">
        <h2 className="font-headline text-2xl text-white mb-1">Policy Library</h2>
        <p className="text-sm text-[#e8bcb9] opacity-80">
          Browse, understand and manage enterprise policies with AI-powered insights.
        </p>
      </section>

      {/* Filters Section */}
      <section className="flex flex-wrap items-center gap-3 mb-6 relative z-30">
        {/* Department Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('dept')}
            className={`flex items-center gap-1 px-4 py-1.5 bg-[#111827] border rounded text-xs font-semibold hover:border-[#C8102E] transition-colors ${
              filters.department !== 'All' ? 'border-[#C8102E] text-white' : 'border-[#2A3447] text-[#fedad7]'
            }`}
          >
            Dept: {filters.department} <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          
          <AnimatePresence>
            {activeDropdown === 'dept' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 mt-1 w-48 glass-panel rounded border border-[#2A3447] shadow-xl overflow-hidden py-1 z-50 text-xs text-[#fedad7]"
              >
                {filterOptions.department.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSelectFilter('department', opt)}
                    className="w-full text-left px-3 py-2 hover:bg-[#172033] hover:text-white transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Owner Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('owner')}
            className={`flex items-center gap-1 px-4 py-1.5 bg-[#111827] border rounded text-xs font-semibold hover:border-[#C8102E] transition-colors ${
              filters.owner !== 'All' ? 'border-[#C8102E] text-white' : 'border-[#2A3447] text-[#fedad7]'
            }`}
          >
            Owner: {filters.owner} <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          
          <AnimatePresence>
            {activeDropdown === 'owner' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 mt-1 w-48 glass-panel rounded border border-[#2A3447] shadow-xl overflow-hidden py-1 z-50 text-xs text-[#fedad7]"
              >
                {filterOptions.owner.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSelectFilter('owner', opt)}
                    className="w-full text-left px-3 py-2 hover:bg-[#172033] hover:text-white transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('status')}
            className={`flex items-center gap-1 px-4 py-1.5 bg-[#111827] border rounded text-xs font-semibold hover:border-[#C8102E] transition-colors ${
              filters.status !== 'All' ? 'border-[#C8102E] text-white' : 'border-[#2A3447] text-[#fedad7]'
            }`}
          >
            Status: {filters.status} <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          
          <AnimatePresence>
            {activeDropdown === 'status' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 mt-1 w-48 glass-panel rounded border border-[#2A3447] shadow-xl overflow-hidden py-1 z-50 text-xs text-[#fedad7]"
              >
                {filterOptions.status.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSelectFilter('status', opt)}
                    className="w-full text-left px-3 py-2 hover:bg-[#172033] hover:text-white transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Version Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('version')}
            className={`flex items-center gap-1 px-4 py-1.5 bg-[#111827] border rounded text-xs font-semibold hover:border-[#C8102E] transition-colors ${
              filters.version !== 'All' ? 'border-[#C8102E] text-white' : 'border-[#2A3447] text-[#fedad7]'
            }`}
          >
            Version: {filters.version} <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          
          <AnimatePresence>
            {activeDropdown === 'version' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 mt-1 w-48 glass-panel rounded border border-[#2A3447] shadow-xl overflow-hidden py-1 z-50 text-xs text-[#fedad7]"
              >
                {filterOptions.version.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSelectFilter('version', opt)}
                    className="w-full text-left px-3 py-2 hover:bg-[#172033] hover:text-white transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear Filters */}
        {(filters.department !== 'All' || filters.owner !== 'All' || filters.status !== 'All' || filters.version !== 'All') && (
          <button
            onClick={() => {
              setFilters({ department: 'All', owner: 'All', status: 'All', version: 'All' });
              if (addToast) addToast('Filters cleared', 'success');
            }}
            className="text-xs text-[#C8102E] hover:underline font-semibold"
          >
            Clear Filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#e8bcb9] opacity-60">Sort by:</span>
          <button className="text-xs text-white flex items-center gap-1 font-semibold hover:text-[#C8102E] transition-colors">
            Last Modified <span className="material-symbols-outlined text-sm">arrow_downward</span>
          </button>
        </div>
      </section>

      {/* Policy List */}
      <section className="space-y-4">
        <motion.div layout className="space-y-4">
          <AnimatePresence>
            {filteredPolicies.length > 0 ? (
              filteredPolicies.map((policy) => (
                <motion.div
                  key={policy.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <PolicyCard
                    policy={policy}
                    onClick={() => handleOpenPolicy(policy)}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-xs text-[#e8bcb9] opacity-50"
              >
                No policies match the selected filter criteria.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Pagination Footer */}
      <footer className="mt-12 flex items-center justify-between border-t border-[#2A3447]/30 pt-6">
        <span className="text-xs text-[#e8bcb9] opacity-60">
          Showing {filteredPolicies.length} of {policies.length} Policies
        </span>
        <div className="flex gap-3">
          <button
            className="px-4 py-1.5 border border-[#2A3447] rounded text-xs font-semibold text-[#e8bcb9] opacity-40 cursor-not-allowed"
            disabled
          >
            Previous
          </button>
          <button className="px-4 py-1.5 border border-[#2A3447] rounded text-xs font-semibold text-white hover:border-[#C8102E] transition-colors">
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
