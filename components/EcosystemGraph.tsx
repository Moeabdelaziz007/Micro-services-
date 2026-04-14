"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from "motion/react";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  status?: 'running' | 'stopped' | 'error' | 'unknown';
  repoUrl?: string;
  lastCommit?: string;
  commitStatus?: string;
  dependencies?: string[];
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type?: 'dependency' | 'system';
}

interface EcosystemGraphProps {
  services: any[];
}

export default function EcosystemGraph({ services }: EcosystemGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Prepare data
    const nodes: Node[] = [
      { id: 'brain', group: 1, label: 'دماغ أمريكي' },
      { id: 'repo', group: 2, label: 'Live Repo' },
    ];

    const links: Link[] = [];

    const safeServices = Array.isArray(services) ? services : [];
    
    // Add service nodes
    safeServices.forEach((service, index) => {
      const serviceId = typeof service === 'string' ? service : (service.name || `service-${index}`);
      const status = typeof service === 'object' && service.status ? service.status : 'running';
      
      nodes.push({ 
        id: serviceId, 
        group: 3, 
        label: serviceId, 
        status,
        repoUrl: service.repoUrl,
        lastCommit: service.lastCommit,
        commitStatus: service.commitStatus,
        dependencies: service.dependencies
      });
      
      // System links
      links.push({ source: 'brain', target: serviceId, type: 'system' });
      links.push({ source: 'repo', target: serviceId, type: 'system' });
    });

    // Add dependency links
    safeServices.forEach((service) => {
      if (service.dependencies && Array.isArray(service.dependencies)) {
        service.dependencies.forEach((depId: string) => {
          // Only add link if target node exists
          if (nodes.find(n => n.id === depId)) {
            links.push({ source: service.name, target: depId, type: 'dependency' });
          }
        });
      }
    });

    if (safeServices.length === 0) {
      nodes.push({ id: 'placeholder', group: 4, label: 'لا توجد خدمات بعد' });
      links.push({ source: 'brain', target: 'placeholder', type: 'system' });
    }

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add arrow markers for dependencies
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#10b981")
      .style("stroke", "none");

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(d => d.type === 'dependency' ? 150 : 100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(60));

    // Draw links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => d.type === 'dependency' ? "#10b981" : "#4b5563")
      .attr("stroke-opacity", d => d.type === 'dependency' ? 0.8 : 0.4)
      .attr("stroke-width", d => d.type === 'dependency' ? 2 : 1)
      .attr("stroke-dasharray", d => d.type === 'dependency' ? "none" : "4,4")
      .attr("marker-end", d => d.type === 'dependency' ? "url(#arrowhead)" : "none");

    // Draw nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => setSelectedNode(d))
      .call(drag(simulation) as any);

    node.append("circle")
      .attr("r", d => d.group <= 2 ? 25 : 20)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("fill", d => {
        if (d.group === 1) return "#a855f7"; // Purple for Brain
        if (d.group === 2) return "#3b82f6"; // Blue for Repo
        if (d.group === 4) return "#6b7280"; // Gray for placeholder
        
        // Group 3: Services
        if (d.status === 'error') return "#ef4444"; // Red
        if (d.status === 'stopped') return "#6b7280"; // Gray
        return "#10b981"; // Green (running)
      })
      .attr("filter", "drop-shadow(0 0 8px rgba(0,0,0,0.5))");

    // Draw labels
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.group <= 2 ? 45 : 40)
      .attr("fill", "#d1d5db")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .text(d => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [services]);

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 backdrop-blur-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> دماغ أمريكي</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> المستودع</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> خدمة تعمل</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> خطأ في الخدمة</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-500"></div> خدمة متوقفة</div>
        <div className="mt-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-emerald-500"></div> تبعية (Dependency)</div>
          <div className="flex items-center gap-2"><div className="w-4 h-0.5 border-t border-dashed border-neutral-600"></div> اتصال نظام</div>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && selectedNode.group === 3 && (
        <motion.div 
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          className="absolute top-0 left-0 w-64 h-full bg-neutral-900/95 border-r border-neutral-800 p-4 backdrop-blur-md z-20 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">{selectedNode.label}</h3>
            <button onClick={() => setSelectedNode(null)} className="text-neutral-500 hover:text-white">✕</button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  selectedNode.status === 'running' ? 'bg-emerald-500' : 
                  selectedNode.status === 'error' ? 'bg-red-500' : 'bg-neutral-600'
                }`} />
                <span className="text-xs text-neutral-200 capitalize">{selectedNode.status}</span>
              </div>
            </div>

            {selectedNode.repoUrl && (
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Repository</span>
                <a href={selectedNode.repoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline block truncate">
                  {selectedNode.repoUrl}
                </a>
              </div>
            )}

            {selectedNode.lastCommit && (
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Last Commit</span>
                <div className="text-xs text-neutral-300 font-mono">{selectedNode.lastCommit}</div>
              </div>
            )}

            {selectedNode.commitStatus && (
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Commit Status</span>
                <div className="text-xs text-neutral-300">{selectedNode.commitStatus}</div>
              </div>
            )}

            {selectedNode.dependencies && selectedNode.dependencies.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Dependencies</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.dependencies.map(dep => (
                    <span key={dep} className="px-1.5 py-0.5 bg-neutral-800 rounded text-[9px] text-neutral-400 border border-neutral-700">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
