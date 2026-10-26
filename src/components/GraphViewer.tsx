import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Info } from 'lucide-react';
import { GraphDataPayload } from '../types';

interface Props {
  graphData: GraphDataPayload;
  title?: string;
  subtitle?: string;
  height?: string;
  className?: string;
}

export const GraphViewer: React.FC<Props> = ({
  graphData,
  title = 'Patient-Similarity Graph Subgraph',
  subtitle = 'Topological neighborhood constructed via k-NN with Gaussian RBF similarity weights',
  height = '420px',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [layoutName, setLayoutName] = useState<'cose' | 'circle' | 'concentric'>('cose');

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return;
    }

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...graphData.nodes, ...graphData.edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: 'data(label)',
            color: '#0f172a',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-wrap': 'wrap',
            width: 38,
            height: 38,
            'border-width': 2,
            'border-color': '#ffffff',
          },
        },
        {
          selector: 'node[type = "query"]',
          style: {
            'background-color': '#0284c7',
            width: 48,
            height: 48,
            'border-width': 4,
            'border-color': '#bae6fd',
            'border-opacity': 0.9,
            color: '#0369a1',
            'font-size': '12px',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#0f172a',
            'border-width': 4,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 'mapData(weight, 0, 1, 1.5, 5)',
            'line-color': '#94a3b8',
            'curve-style': 'bezier',
            opacity: 0.7,
            label: 'data(label)',
            'font-size': '9px',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            color: '#64748b',
          },
        },
      ] as any,
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 500,
        padding: 40,
      },
      minZoom: 0.3,
      maxZoom: 3.0,
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data();
      setSelectedNode(nodeData);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, layoutName]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleReset = () => {
    cyRef.current?.reset();
    cyRef.current?.fit(undefined, 30);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs ${className}`}>
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div>
          <h3 className="font-bold text-navy-900 text-sm flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs bg-medblue-100 text-medblue-700 px-2 py-0.5 rounded-full font-semibold">
              {graphData.nodes?.length || 0} Nodes
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout selector */}
          <select
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value as any)}
            className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-medblue-500"
          >
            <option value="cose">Force-Directed (COSE)</option>
            <option value="circle">Circular Layout</option>
            <option value="concentric">Concentric Layout</option>
          </select>

          {/* Action buttons */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-slate-600">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFit}
              title="Fit to bounds"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              title="Reset view"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div className="relative">
        <div
          ref={containerRef}
          style={{ height }}
          className="w-full bg-slate-50/50 cursor-grab active:cursor-grabbing"
        />

        {/* Legend */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-sm text-[11px] space-y-1.5 pointer-events-none">
          <div className="font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-medblue-600 border border-white shadow-xs" />
            <span className="text-slate-700">Query Patient (Inductive)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs" />
            <span className="text-slate-700">Reference: Nondemented</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shadow-xs" />
            <span className="text-slate-700">Reference: Demented</span>
          </div>
        </div>

        {/* Selected Node Details Floating Overlay */}
        {selectedNode && (
          <div className="absolute bottom-3 right-3 max-w-xs bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-md text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-bold text-navy-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-medblue-600" />
                {selectedNode.type === 'query' ? 'Query Patient' : selectedNode.label || selectedNode.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedNode.diagnosis === 'Demented'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedNode.diagnosis === 'Nondemented'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-medblue-100 text-medblue-800'
                }`}
              >
                {selectedNode.diagnosis || 'Assessed Input'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div><span className="font-medium">Node ID:</span> {selectedNode.id}</div>
              <div><span className="font-medium">Embedding Role:</span> {selectedNode.type === 'query' ? 'Inductive query node (0)' : 'Reference cohort prototype'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
