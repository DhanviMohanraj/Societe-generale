import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Node component
const CustomNode = ({ data, isConnectable }) => {
  const { icon, label, subtext, type, isHovered, isDimmed, isPulsing } = data;

  // Color mappings based on entity type
  const typeStyles = {
    policy: {
      border: 'border-[#C8102E]/60 hover:border-[#C8102E]',
      bg: 'bg-[#111827]',
      glow: 'shadow-[0_0_15px_rgba(200,16,46,0.15)]',
      iconColor: 'text-[#C8102E]',
      labelColor: 'text-white'
    },
    obligation: {
      border: 'border-purple-500/40 hover:border-purple-400',
      bg: 'bg-[#111827]',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.12)]',
      iconColor: 'text-purple-400',
      labelColor: 'text-purple-100'
    },
    regulation: {
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'bg-[#111827]',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.12)]',
      iconColor: 'text-amber-400',
      labelColor: 'text-amber-100'
    },
    department: {
      border: 'border-blue-500/40 hover:border-blue-400',
      bg: 'bg-[#111827]',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.12)]',
      iconColor: 'text-blue-400',
      labelColor: 'text-blue-100'
    },
    conflict: {
      border: 'border-red-600 bg-red-950/20',
      bg: 'bg-[#1e1517]',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.35)]',
      iconColor: 'text-red-500',
      labelColor: 'text-red-200'
    }
  };

  const style = typeStyles[type] || typeStyles.policy;
  
  return (
    <div
      className={`px-4 py-3 rounded-xl border ${style.border} ${style.bg} ${style.glow} ${
        isHovered ? 'scale-105 border-white shadow-[0_0_25px_rgba(255,255,255,0.2)]' : ''
      } ${isDimmed ? 'opacity-30' : 'opacity-100'} ${
        isPulsing ? 'animate-pulse border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''
      } transition-all duration-300 w-[220px] text-left relative group`}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0" />
      
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg bg-[#0A1220] ${style.iconColor} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-bold truncate ${style.labelColor}`}>{label}</div>
          <div className="text-[9px] text-[#e8bcb9] opacity-60 truncate mt-0.5">{subtext}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="opacity-0" />
    </div>
  );
};

// Initial Nodes Data
const INITIAL_NODES = [
  {
    id: 'gdpr-32',
    type: 'customNode',
    position: { x: 380, y: 30 },
    data: {
      type: 'regulation',
      icon: 'gavel',
      label: 'GDPR Article 32',
      subtext: 'EU Regulatory Mandate',
      description: 'Requires technical and organizational measures to ensure a level of security appropriate to risk, including password rules.',
      owner: 'EU Regulator',
      department: 'Corporate Legal',
      lastUpdated: 'May 2018',
    }
  },
  {
    id: 'gbl-policy',
    type: 'customNode',
    position: { x: 380, y: 150 },
    data: {
      type: 'policy',
      icon: 'description',
      label: 'Global Password Policy',
      subtext: 'POL-GBL-204',
      description: 'Sets baseline authentication requirements across all international business units, focusing on secure rotations.',
      owner: 'CISO Office',
      department: 'Global Security',
      lastUpdated: 'January 2026',
    }
  },
  {
    id: 'ob-90',
    type: 'customNode',
    position: { x: 120, y: 280 },
    data: {
      type: 'obligation',
      icon: 'shield_with_heart',
      label: 'Rotate Password Every 90 Days',
      subtext: 'GBL Obligation OBL-90',
      description: 'Enforces strict password expiry rules to reduce exposure windows on critical central databases.',
      owner: 'SecOps Team',
      department: 'Global Security',
      lastUpdated: 'March 2026',
    }
  },
  {
    id: 'ob-180',
    type: 'customNode',
    position: { x: 640, y: 280 },
    data: {
      type: 'obligation',
      icon: 'shield_with_heart',
      label: 'Rotate Password Every 180 Days',
      subtext: 'EMEA Obligation OBL-180',
      description: 'Allows extended rotation parameters for Regional EMEA systems to reduce user friction.',
      owner: 'EMEA Risk Lead',
      department: 'EMEA Department',
      lastUpdated: 'September 2025',
    }
  },
  {
    id: 'conflict-node',
    type: 'customNode',
    position: { x: 380, y: 400 },
    data: {
      type: 'conflict',
      icon: 'warning',
      label: 'Rotation Mismatch Conflict',
      subtext: '98% Confidence Alert',
      description: 'Incompatible password rotation schedules (90 vs 180 days) targeting overlapping server infrastructure.',
      owner: 'AI Engine Scanner',
      department: 'Risk & Compliance',
      lastUpdated: 'Today',
      isPulsing: true
    }
  },
  {
    id: 'emea-policy',
    type: 'customNode',
    position: { x: 640, y: 500 },
    data: {
      type: 'policy',
      icon: 'description',
      label: 'EMEA Regional Policy',
      subtext: 'POL-REG-EMEA-08',
      description: 'Regional policy adjusting global baselines for local operation efficiency across EMEA territories.',
      owner: 'EMEA Risk Director',
      department: 'EMEA Department',
      lastUpdated: 'October 2025',
    }
  },
  {
    id: 'emea-dept',
    type: 'customNode',
    position: { x: 640, y: 620 },
    data: {
      type: 'department',
      icon: 'corporate_fare',
      label: 'EMEA Department',
      subtext: 'Regional Division',
      description: 'The regional operating unit covering Europe, Middle East, and Africa compliance.',
      owner: 'EMEA General Manager',
      department: 'EMEA Operations',
      lastUpdated: 'Ongoing',
    }
  }
];

// Initial Edges Data
const INITIAL_EDGES = [
  {
    id: 'e-gdpr-gbl',
    source: 'gdpr-32',
    target: 'gbl-policy',
    label: 'references',
    animated: false,
    style: { stroke: '#3B82F6', strokeWidth: 2 }, // Blue
  },
  {
    id: 'e-gbl-ob90',
    source: 'gbl-policy',
    target: 'ob-90',
    label: 'contains obligation',
    animated: false,
    style: { stroke: '#10B981', strokeWidth: 2 }, // Green
  },
  {
    id: 'e-ob90-conf',
    source: 'ob-90',
    target: 'conflict-node',
    label: 'conflicts with',
    animated: true,
    style: { stroke: '#EF4444', strokeWidth: 2.5 }, // Red
  },
  {
    id: 'e-ob180-conf',
    source: 'ob-180',
    target: 'conflict-node',
    label: 'conflicts with',
    animated: true,
    style: { stroke: '#EF4444', strokeWidth: 2.5 }, // Red
  },
  {
    id: 'e-emea-ob180',
    source: 'emea-policy',
    target: 'ob-180',
    label: 'contains obligation',
    animated: false,
    style: { stroke: '#10B981', strokeWidth: 2 }, // Green
  },
  {
    id: 'e-emea-dept',
    source: 'emea-policy',
    target: 'emea-dept',
    label: 'applies to',
    animated: false,
    style: { stroke: '#F59E0B', strokeWidth: 2 }, // Orange / Amber
  }
];

export default function KnowledgeGraph() {
  const nodeTypesMap = useMemo(() => ({ customNode: CustomNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  // States
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);

  // Smart Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Handle outside click to clear selected node details panel
  const handleClearSelected = useCallback(() => {
    setSelectedNodeData(null);
  }, []);

  // Filter application
  useEffect(() => {
    let filteredNodes = INITIAL_NODES.map(node => {
      let isDimmed = false;
      
      // Filter by Search Query
      if (searchQuery && !node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) && !node.data.subtext.toLowerCase().includes(searchQuery.toLowerCase())) {
        isDimmed = true;
      }
      // Filter by Department
      if (selectedDept !== 'All' && node.data.department !== selectedDept) {
        isDimmed = true;
      }
      // Filter by Node Type
      if (selectedType !== 'All' && node.data.type !== selectedType) {
        isDimmed = true;
      }

      return {
        ...node,
        data: {
          ...node.data,
          isDimmed
        }
      };
    });

    setNodes(filteredNodes);
  }, [searchQuery, selectedDept, selectedType, setNodes]);

  // Node Hover logic
  const handleNodeMouseEnter = useCallback((event, node) => {
    setHoveredNodeId(node.id);

    // Find connected nodes
    const connectedNodeIds = new Set([node.id]);
    INITIAL_EDGES.forEach(edge => {
      if (edge.source === node.id) connectedNodeIds.add(edge.target);
      if (edge.target === node.id) connectedNodeIds.add(edge.source);
    });

    // Update nodes styling
    setNodes(prevNodes =>
      prevNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          isHovered: n.id === node.id,
          isDimmed: !connectedNodeIds.has(n.id)
        }
      }))
    );

    // Update edges styling to highlight active ones
    setEdges(prevEdges =>
      prevEdges.map(e => ({
        ...e,
        animated: e.source === node.id || e.target === node.id || e.animated,
        style: {
          ...e.style,
          opacity: (e.source === node.id || e.target === node.id) ? 1 : 0.15,
          strokeWidth: (e.source === node.id || e.target === node.id) ? 3 : (e.style?.strokeWidth || 1.5)
        }
      }))
    );
  }, [setNodes, setEdges]);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);

    // Reset nodes opacity
    setNodes(prevNodes =>
      prevNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          isHovered: false,
          isDimmed: false
        }
      }))
    );

    // Reset edges styles
    setEdges(INITIAL_EDGES);
  }, [setNodes, setEdges]);

  // Node click details panel trigger
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNodeData(node.data);
  }, []);

  return (
    <div className="w-full h-[620px] bg-[#0A1220] rounded-2xl border border-[#2A3447] overflow-hidden relative flex flex-col">
      {/* 1. Smart Filters Header */}
      <div className="p-4 border-b border-[#2A3447]/60 bg-[#111827]/80 backdrop-blur flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search Knowledge Node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0A1220] border border-[#2A3447] rounded-lg pl-8 pr-4 py-1.5 text-xs text-white placeholder:text-[#e8bcb9]/30 focus:outline-none focus:border-[#C8102E]"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-xs text-[#e8bcb9]/50">search</span>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-[#0A1220] border border-[#2A3447] rounded-lg px-2 py-1.5 text-xs text-[#e8bcb9] focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Global Security">Global Security</option>
            <option value="EMEA Department">EMEA Dept</option>
            <option value="Risk & Compliance">Risk & Compliance</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#0A1220] border border-[#2A3447] rounded-lg px-2 py-1.5 text-xs text-[#e8bcb9] focus:outline-none"
          >
            <option value="All">All Entity Types</option>
            <option value="policy">📄 Policies</option>
            <option value="obligation">🛡 Obligations</option>
            <option value="regulation">📚 Regulations</option>
            <option value="department">🏢 Departments</option>
            <option value="conflict">⚠ Conflicts</option>
          </select>
        </div>

        {/* AI Explain trigger */}
        <button
          onClick={() => setShowAIExplanation(!showAIExplanation)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#C8102E]/10 border border-[#C8102E]/30 text-[#fedad7] font-bold text-xs rounded-lg hover:bg-[#C8102E] hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-xs material-symbols-fill">auto_awesome</span>
          AI Explain Graph
        </button>
      </div>

      {/* 2. Interactive Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypesMap}
          fitView
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onNodeClick={handleNodeClick}
          attribPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          className="bg-[#080d16]"
        >
          <Background color="#2A3447" gap={20} size={1} />
          <Controls showInteractive={false} className="opacity-80 bg-[#111827] border-[#2A3447] text-white" />
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.data.type === 'conflict') return '#EF4444';
              if (n.data.type === 'policy') return '#C8102E';
              return '#2A3447';
            }}
            nodeColor="#111827"
            maskColor="rgba(10, 18, 32, 0.6)"
            className="border border-[#2A3447] rounded-lg overflow-hidden bg-[#111827]"
          />
        </ReactFlow>

        {/* 3. Collapsible Legend Box */}
        <div className="absolute top-4 right-4 z-10 max-w-[220px]">
          <div className="bg-[#111827] border border-[#2A3447] rounded-xl inner-glow overflow-hidden shadow-2xl">
            <button
              onClick={() => setLegendCollapsed(!legendCollapsed)}
              className="w-full px-4 py-2 border-b border-[#2A3447]/60 flex items-center justify-between text-[10px] font-bold text-[#e8bcb9] uppercase tracking-wider bg-[#0A1220]/20"
            >
              <span>Graph Legend</span>
              <span className="material-symbols-outlined text-xs">
                {legendCollapsed ? 'expand_more' : 'expand_less'}
              </span>
            </button>

            {!legendCollapsed && (
              <div className="p-3.5 space-y-2.5 text-xs text-[#fedad7]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#C8102E]">description</span>
                  <span>Policy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-purple-400">shield_with_heart</span>
                  <span>Obligation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-amber-400">gavel</span>
                  <span>Regulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-400">corporate_fare</span>
                  <span>Department</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-red-500">warning</span>
                  <span>Conflict</span>
                </div>
                
                <div className="pt-2 border-t border-[#2A3447]/40 space-y-1.5 text-[9px] text-[#e8bcb9] opacity-75">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-[2px] bg-[#EF4444] inline-block" />
                    <span>Red = Conflict</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-[2px] bg-[#3B82F6] inline-block" />
                    <span>Blue = Reference</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-[2px] bg-[#10B981] inline-block" />
                    <span>Green = Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-[2px] bg-[#F59E0B] inline-block" />
                    <span>Orange = Applies</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. AI Explanation Dialogue Box */}
        <AnimatePresence>
          {showAIExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[480px] bg-[#172033] border border-[#C8102E]/40 rounded-xl p-5 shadow-2xl z-20 inner-glow ai-mesh"
            >
              <div className="flex items-center justify-between border-b border-[#2A3447]/60 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C8102E] text-sm material-symbols-fill">auto_awesome</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">AI Relationship Insight</span>
                </div>
                <button
                  onClick={() => setShowAIExplanation(false)}
                  className="text-[#e8bcb9] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className="text-xs text-[#fedad7] leading-relaxed">
                The **Global Password Policy** references **GDPR Article 32** and contains an obligation requiring password rotation every **90 days**. The **EMEA Regional Policy** contains a conflicting obligation requiring rotation every **180 days**. Lexora detected this semantic contradiction with **98% confidence** because both obligations apply to the same department but prescribe incompatible requirements.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Floating Node Inspector Panel */}
        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute left-4 top-4 bottom-4 w-[330px] bg-[#111827]/95 backdrop-blur border border-[#2A3447] rounded-xl p-5 shadow-2xl z-20 flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest bg-[#C8102E]/20 text-[#fedad7] px-2 py-0.5 rounded font-bold">
                      {selectedNodeData.type}
                    </span>
                    <h3 className="font-headline text-md font-bold text-white mt-1.5">{selectedNodeData.label}</h3>
                    <p className="text-[9px] text-[#e8bcb9] opacity-60">{selectedNodeData.subtext}</p>
                  </div>
                  <button
                    onClick={handleClearSelected}
                    className="p-1 hover:bg-[#2A3447] rounded-full text-[#e8bcb9] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-md">close</span>
                  </button>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#e8bcb9] opacity-60 font-bold">Entity Description</span>
                  <p className="text-xs text-[#fedad7]/90 leading-relaxed bg-[#0A1220]/50 p-3 rounded-lg border border-[#2A3447]/30">
                    {selectedNodeData.description}
                  </p>
                </div>

                {/* Meta details list */}
                <div className="space-y-2.5 pt-2 border-t border-[#2A3447]/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#e8bcb9] opacity-50">Department Owner:</span>
                    <span className="text-white font-semibold">{selectedNodeData.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#e8bcb9] opacity-50">Lead Steward:</span>
                    <span className="text-white font-medium">{selectedNodeData.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#e8bcb9] opacity-50">Last Audited:</span>
                    <span className="text-[#e8bcb9] font-medium">{selectedNodeData.lastUpdated}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="space-y-2 pt-4 border-t border-[#2A3447]/50 mt-4">
                <button
                  onClick={() => alert(`Navigating to ${selectedNodeData.label}`)}
                  className="w-full py-2 bg-gradient-to-br from-[#C8102E] to-[#B11226] text-white text-xs font-bold rounded-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  Open Policy
                </button>
                <button
                  onClick={() => alert(`Showing obligations for ${selectedNodeData.label}`)}
                  className="w-full py-2 bg-[#172033] border border-[#2A3447] text-[#fedad7] text-xs font-bold rounded-lg hover:bg-[#2A3447] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">list_alt</span>
                  View Obligations
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
