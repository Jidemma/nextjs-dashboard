'use client';

/**
 * Network Graph Component
 * ======================
 * Interactive social network visualization using react-force-graph-2d
 */

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface Node {
  id: string;
  name: string;
  connections: number;
  group: number;
}

interface Link {
  source: string;
  target: string;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  height?: number;
  title?: string;
}

export function NetworkGraph({ 
  nodes, 
  links, 
  height = 500,
  title 
}: NetworkGraphProps) {
  const [layout, setLayout] = useState<'force' | 'circular'>('force');
  
  const graphData = useMemo(() => {
    const processedNodes = nodes.map(node => ({
      ...node,
      id: String(node.id),
    }));
    
    // If circular layout, pre-calculate positions
    if (layout === 'circular') {
      const radius = Math.min(height, 400) / 2 - 50;
      const angleStep = (2 * Math.PI) / processedNodes.length;
      
      processedNodes.forEach((node, index) => {
        const angle = index * angleStep;
        (node as any).fx = Math.cos(angle) * radius;
        (node as any).fy = Math.sin(angle) * radius;
      });
    }
    
    return {
      nodes: processedNodes,
      links: links.map(link => ({
        source: String(link.source),
        target: String(link.target),
      })),
    };
  }, [nodes, links, layout, height]);

  if (!nodes || nodes.length === 0 || !links || links.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No network data available</p>
          <p className="text-sm text-gray-400">
            Network graph will appear when users have social connections
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
        <div className="bg-white rounded-lg border-2 border-gray-300 p-4 shadow-sm">
        {/* Layout Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Layout:</span>
            <button
              onClick={() => setLayout('force')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                layout === 'force'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Force-Directed
            </button>
            <button
              onClick={() => setLayout('circular')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                layout === 'circular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Circular
            </button>
          </div>
        </div>
        
        <div 
          className="w-full rounded-lg overflow-hidden bg-gray-50"
          style={{ height: `${height}px` }}
        >
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node: any) => {
              const n = node as Node;
              return `${n.name}\nConnections: ${n.connections}`;
            }}
            nodeColor={(node: any) => {
              const n = node as Node;
              // More vibrant colors for better visibility
              if (n.group >= 4) return '#DC2626'; // High influence - Bright Red
              if (n.group >= 3) return '#EA580C'; // Medium-High - Bright Orange
              if (n.group >= 2) return '#EAB308'; // Medium - Bright Yellow
              if (n.group >= 1) return '#3B82F6'; // Low-Medium - Bright Blue
              return '#9CA3AF'; // Low - Medium Gray
            }}
            nodeVal={(node: any) => {
              const n = node as Node;
              // Larger nodes for better visibility
              return Math.sqrt(n.connections) * 5 + 10;
            }}
            nodeRelSize={6}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const n = node as Node;
              const label = n.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#374151';
              ctx.fillText(label, node.x || 0, (node.y || 0) + (Math.sqrt(n.connections) * 5 + 10) + 15);
            }}
            linkColor={() => '#94A3B8'} // Light blue-gray for better visibility
            linkWidth={(link: any) => 2} // Thicker, more visible links
            linkOpacity={0.6}
            linkCurvature={0.1} // Slight curve to avoid overlap
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={() => '#64748B'}
            linkDirectionalParticles={0}
            cooldownTicks={layout === 'circular' ? 0 : 100}
            onEngineStop={() => {
              // Graph has finished positioning
            }}
            backgroundColor="#F9FAFB"
            d3Force={
              layout === 'circular'
                ? {
                    // For circular layout, use minimal forces
                    charge: {
                      strength: -50,
                    },
                    link: {
                      distance: 80,
                    },
                    center: {
                      strength: 0.1,
                    },
                  }
                : {
                    // For force-directed, use balanced forces
                    charge: {
                      strength: -600,
                    },
                    link: {
                      distance: 80,
                    },
                    center: {
                      strength: 0.1,
                    },
                    collision: {
                      radius: (node: any) => {
                        const n = node as Node;
                        return Math.sqrt(n.connections) * 5 + 20;
                      },
                    },
                  }
            }
          />
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold mb-2 text-gray-700">Node Colors (by Connection Count):</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-red-800"></div>
                <span className="text-gray-700 font-medium">High Influence (Top 20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-600 border-2 border-orange-800"></div>
                <span className="text-gray-700 font-medium">Medium-High (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-yellow-700"></div>
                <span className="text-gray-700 font-medium">Medium (40-60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-800"></div>
                <span className="text-gray-700 font-medium">Low-Medium (20-40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-gray-700"></div>
                <span className="text-gray-700 font-medium">Low Influence (Bottom 20%)</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2 text-gray-700">Graph Features:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Node size = Number of connections</li>
              <li>• Hover to see user name and connection count</li>
              <li>• Drag nodes to explore the network</li>
              <li>• Zoom with mouse wheel</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {nodes.length} users and {links.length} connections
        </div>
      </div>
    </div>
  );
}

