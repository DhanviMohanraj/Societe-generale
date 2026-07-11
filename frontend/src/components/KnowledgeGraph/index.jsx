import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 50, y: 50 },
    data: { label: 'POL-GBL-204' },
    style: {
      background: '#172033',
      color: '#ffffff',
      border: '1px solid #E60028',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: 'bold',
      boxShadow: '0 0 15px rgba(230, 0, 40, 0.3)',
      width: 100,
    },
  },
  {
    id: '2',
    position: { x: 220, y: 70 },
    data: { label: 'GDPR Obligation' },
    style: {
      background: '#0A1220',
      color: '#e8bcb9',
      border: '1px solid #2A3447',
      borderRadius: '8px',
      fontSize: '10px',
      width: 110,
    },
  },
  {
    id: '3',
    position: { x: 80, y: 220 },
    data: { label: 'EMEA Dept' },
    style: {
      background: '#172033',
      color: '#ffffff',
      border: '1px solid #86cfff',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: 'bold',
      boxShadow: '0 0 15px rgba(134, 207, 255, 0.3)',
      width: 100,
    },
  },
  {
    id: '4',
    position: { x: 200, y: 170 },
    data: { label: 'POL-REG-08' },
    style: {
      background: '#172033',
      color: '#ffffff',
      border: '1px solid #E60028',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: 'bold',
      width: 100,
    },
  },
];

const initialEdges = [
  { id: 'e1-4', source: '1', target: '4', animated: true, style: { stroke: 'rgba(230,0,40,0.5)' } },
  { id: 'e2-4', source: '2', target: '4', style: { stroke: 'rgba(255,255,255,0.1)' } },
  { id: 'e3-4', source: '3', target: '4', style: { stroke: 'rgba(255,255,255,0.1)' } },
];

export default function KnowledgeGraph() {
  return (
    <div className="w-full h-full min-h-[320px] bg-black/20 rounded-xl overflow-hidden relative">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
        attribPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2A3447" gap={16} size={1} />
        <Controls showInteractive={false} className="opacity-70" />
      </ReactFlow>
    </div>
  );
}
