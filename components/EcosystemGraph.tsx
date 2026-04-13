"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

interface EcosystemGraphProps {
  services: any[];
}

export default function EcosystemGraph({ services }: EcosystemGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 300;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Prepare data
    const nodes: Node[] = [
      { id: 'brain', group: 1, label: 'دماغ أمريكي' },
      { id: 'repo', group: 2, label: 'Live Repo' },
    ];

    const links: Link[] = [
      { source: 'brain', target: 'repo' }
    ];

    const safeServices = Array.isArray(services) ? services : [];
    
    safeServices.forEach((service, index) => {
      const serviceId = typeof service === 'string' ? service : (service.name || `service-${index}`);
      nodes.push({ id: serviceId, group: 3, label: serviceId });
      links.push({ source: 'brain', target: serviceId });
      links.push({ source: 'repo', target: serviceId });
    });

    if (safeServices.length === 0) {
      nodes.push({ id: 'placeholder', group: 4, label: 'لا توجد خدمات بعد' });
      links.push({ source: 'brain', target: 'placeholder' });
    }

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50));

    // Draw links
    const link = svg.append("g")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // Draw nodes
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 20)
      .attr("fill", d => {
        if (d.group === 1) return "#a855f7"; // Purple for Brain
        if (d.group === 2) return "#3b82f6"; // Blue for Repo
        if (d.group === 4) return "#6b7280"; // Gray for placeholder
        return "#10b981"; // Green for Services
      })
      .call(drag(simulation) as any);

    // Draw labels
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", 35)
      .attr("fill", "#d1d5db")
      .attr("font-size", "12px")
      .attr("font-family", "monospace")
      .text(d => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

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
    <div ref={containerRef} className="w-full h-[300px] bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 flex flex-col gap-1 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800 text-[10px] text-neutral-400">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> دماغ أمريكي</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> المستودع</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> خدمات مصغرة</div>
      </div>
    </div>
  );
}
