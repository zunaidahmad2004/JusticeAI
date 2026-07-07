import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Share2, FolderOpen, Users, Archive, User,
  RefreshCw, ZoomIn, ZoomOut, Maximize2, Info,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Case { id: string; case_number: string; title: string; }

interface GraphNode {
  id: string;
  label: string;
  type: 'case' | 'suspect' | 'victim' | 'witness' | 'evidence';
  detail?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_CONFIG: Record<string, { color: string; bg: string; radius: number }> = {
  case:     { color: '#3B82F6', bg: '#1E3A5F', radius: 28 },
  suspect:  { color: '#EF4444', bg: '#4C1D1D', radius: 22 },
  victim:   { color: '#8B5CF6', bg: '#3B1F6B', radius: 20 },
  witness:  { color: '#22C55E', bg: '#14401E', radius: 20 },
  evidence: { color: '#F59E0B', bg: '#4A3000', radius: 16 },
};

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

/* ─── Simple canvas-based graph renderer ────────────────────────────────── */
function GraphCanvas({ data, width, height }: { data: GraphData; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const velocities = useRef<Map<string, { vx: number; vy: number }>>(new Map());
  const animRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Initialize positions
  useEffect(() => {
    positions.current.clear();
    velocities.current.clear();
    const cx = width / 2;
    const cy = height / 2;
    data.nodes.forEach((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const r = Math.min(width, height) * 0.3;
      positions.current.set(node.id, {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      });
      velocities.current.set(node.id, { vx: 0, vy: 0 });
    });
  }, [data, width, height]);

  // Force-directed layout + render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const simulate = () => {
      const nodes = data.nodes;
      const edges = data.edges;

      if (tick < 200) {
        tick++;
        // Repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const pi = positions.current.get(nodes[i].id)!;
            const pj = positions.current.get(nodes[j].id)!;
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 3000 / (dist * dist);
            const vi = velocities.current.get(nodes[i].id)!;
            const vj = velocities.current.get(nodes[j].id)!;
            vi.vx += (dx / dist) * force;
            vi.vy += (dy / dist) * force;
            vj.vx -= (dx / dist) * force;
            vj.vy -= (dy / dist) * force;
          }
        }
        // Attraction along edges
        for (const edge of edges) {
          const ps = positions.current.get(edge.source);
          const pt = positions.current.get(edge.target);
          if (!ps || !pt) continue;
          const dx = pt.x - ps.x;
          const dy = pt.y - ps.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 120) * 0.05;
          const vs = velocities.current.get(edge.source)!;
          const vt = velocities.current.get(edge.target)!;
          vs.vx += (dx / dist) * force;
          vs.vy += (dy / dist) * force;
          vt.vx -= (dx / dist) * force;
          vt.vy -= (dy / dist) * force;
        }
        // Apply + dampen + clamp
        for (const node of nodes) {
          const p = positions.current.get(node.id)!;
          const v = velocities.current.get(node.id)!;
          v.vx *= 0.85; v.vy *= 0.85;
          p.x = Math.max(40, Math.min(width - 40, p.x + v.vx * 0.5));
          p.y = Math.max(40, Math.min(height - 40, p.y + v.vy * 0.5));
        }
      }

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Edges
      for (const edge of edges) {
        const ps = positions.current.get(edge.source);
        const pt = positions.current.get(edge.target);
        if (!ps || !pt) continue;
        ctx.beginPath();
        ctx.moveTo(ps.x, ps.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = 'rgba(99,102,241,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Edge label
        if (edge.label) {
          const mx = (ps.x + pt.x) / 2;
          const my = (ps.y + pt.y) / 2;
          ctx.fillStyle = 'rgba(148,163,184,0.7)';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(edge.label, mx, my - 4);
        }
      }

      // Nodes
      for (const node of nodes) {
        const p = positions.current.get(node.id)!;
        const cfg = NODE_CONFIG[node.type];

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, cfg.radius * 1.8);
        grad.addColorStop(0, cfg.color + '30');
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.x, p.y, cfg.radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, cfg.radius, 0, Math.PI * 2);
        ctx.fillStyle = cfg.bg;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = '#F1F5F9';
        ctx.font = `${Math.max(9, cfg.radius * 0.45)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxLen = Math.floor(cfg.radius * 0.35);
        const shortLabel = node.label.length > maxLen ? node.label.slice(0, maxLen) + '…' : node.label;
        ctx.fillText(shortLabel, p.x, p.y);

        // Type badge below
        ctx.fillStyle = cfg.color + 'CC';
        ctx.font = '8px Inter, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(node.type, p.x, p.y + cfg.radius + 3);
      }

      animRef.current = requestAnimationFrame(simulate);
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, width, height]);

  // Hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found: GraphNode | null = null;
    for (const node of data.nodes) {
      const p = positions.current.get(node.id);
      if (!p) continue;
      const r = NODE_CONFIG[node.type].radius;
      const dx = mx - p.x; const dy = my - p.y;
      if (Math.sqrt(dx*dx + dy*dy) <= r) { found = node; break; }
    }
    setHoveredNode(found);
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        className="w-full h-full cursor-crosshair"
      />
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 glass-strong rounded-xl px-4 py-3 pointer-events-none max-w-xs">
          <p className="text-xs font-bold text-white capitalize mb-0.5">{hoveredNode.type}</p>
          <p className="text-sm text-slate-200">{hoveredNode.label}</p>
          {hoveredNode.detail && <p className="text-xs text-slate-500 mt-0.5">{hoveredNode.detail}</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function RelationshipGraphPage() {
  const [cases, setCases]       = useState<Case[]>([]);
  const [caseId, setCaseId]     = useState('');
  const [graph, setGraph]       = useState<GraphData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const containerRef            = useRef<HTMLDivElement>(null);
  const [dims, setDims]         = useState({ w: 800, h: 500 });

  useEffect(() => {
    api.get('/cases', { params: { limit: 100 } })
      .then((r) => setCases((r.data?.cases ?? r.data) as Case[] || []))
      .catch(() => {})
      .finally(() => setLoadingCases(false));
  }, []);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: Math.max(420, e.contentRect.height) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const buildGraph = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setGraph(null);
    try {
      const [caseRes, evidenceRes, witnessRes, victimRes, suspectRes] = await Promise.all([
        api.get(`/cases/${id}`),
        api.get('/evidence', { params: { case_id: id } }),
        api.get('/witnesses', { params: { case_id: id } }),
        api.get('/victims',   { params: { case_id: id } }),
        api.get('/suspects',  { params: { case_id: id } }),
      ]);

      const caseData     = caseRes.data as any;
      const evidenceList = evidenceRes.data as any[];
      const witnessList  = witnessRes.data as any[];
      const victimList   = victimRes.data as any[];
      const suspectList  = suspectRes.data as any[];

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      // Case node
      const caseNodeId = `case_${id}`;
      nodes.push({ id: caseNodeId, label: caseData.case_number || 'Case', type: 'case', detail: caseData.title });

      // Suspects
      for (const s of suspectList) {
        const nid = `suspect_${s.id || s._id}`;
        nodes.push({ id: nid, label: s.full_name || 'Unknown', type: 'suspect', detail: s.arrest_status });
        edges.push({ source: caseNodeId, target: nid, label: 'suspect' });
        // Link suspect to their evidence
        if (s.linked_evidence?.length) {
          for (const eid of s.linked_evidence) {
            edges.push({ source: nid, target: `evidence_${eid}`, label: 'linked' });
          }
        }
      }

      // Victims
      for (const v of victimList) {
        const nid = `victim_${v.id || v._id}`;
        nodes.push({ id: nid, label: v.full_name || 'Unknown', type: 'victim', detail: v.injury_description });
        edges.push({ source: caseNodeId, target: nid, label: 'victim' });
      }

      // Witnesses
      for (const w of witnessList) {
        const nid = `witness_${w.id || w._id}`;
        nodes.push({ id: nid, label: w.full_name || 'Unknown', type: 'witness', detail: w.statement_summary });
        edges.push({ source: caseNodeId, target: nid, label: 'witness' });
      }

      // Evidence (limit to 12 for readability)
      for (const e of evidenceList.slice(0, 12)) {
        const nid = `evidence_${e.id || e._id}`;
        nodes.push({ id: nid, label: e.title || e.evidence_number, type: 'evidence', detail: e.evidence_type });
        edges.push({ source: caseNodeId, target: nid, label: 'evidence' });
      }

      setGraph({ nodes, edges });
      toast.success(`Graph built — ${nodes.length} nodes, ${edges.length} connections`);
    } catch {
      toast.error('Failed to build relationship graph');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (caseId) buildGraph(caseId);
  }, [caseId, buildGraph]);

  return (
    <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show" className="space-y-5 h-full flex flex-col">

      {/* Header */}
      <motion.div variants={fade}>
        <h1 className="page-title flex items-center gap-3">
          <Share2 className="w-7 h-7 text-navy-400" /> Criminal Relationship Graph
        </h1>
        <p className="page-subtitle">Visualize connections between suspects, victims, witnesses, and evidence</p>
      </motion.div>

      {/* Controls */}
      <motion.div variants={fade} className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-60">
          {loadingCases ? <div className="skeleton h-10 rounded-xl" /> : (
            <select className="input" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
              <option value="">Select a case to visualize...</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>)}
            </select>
          )}
        </div>
        {caseId && (
          <button onClick={() => buildGraph(caseId)} disabled={loading} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Rebuild
          </button>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
              <span className="text-2xs text-slate-400 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Graph */}
      <motion.div variants={fade} className="glass-card flex-1 overflow-hidden relative" style={{ minHeight: 480 }} ref={containerRef}>
        {!caseId && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Share2 className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Select a Case</h3>
            <p className="text-slate-500 text-sm">Choose a case above to visualize its relationship network</p>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-card/60 backdrop-blur-sm z-10">
            <div className="w-12 h-12 border-2 border-navy-400/30 border-t-navy-400 rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Building relationship graph...</p>
          </div>
        )}
        {graph && !loading && graph.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Info className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">No linked data found for this case yet.</p>
            <p className="text-slate-600 text-xs mt-1">Add suspects, victims, witnesses, or evidence to visualize relationships.</p>
          </div>
        )}
        {graph && graph.nodes.length > 0 && (
          <GraphCanvas data={graph} width={dims.w} height={dims.h} />
        )}
      </motion.div>

      {/* Stats */}
      {graph && graph.nodes.length > 0 && (
        <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(NODE_CONFIG).map(([type, cfg]) => {
            const count = graph.nodes.filter((n) => n.type === type).length;
            return (
              <div key={type} className="glass-card p-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                <div>
                  <p className="text-base font-bold text-white tabular-nums">{count}</p>
                  <p className="text-2xs text-slate-500 capitalize">{type === 'evidence' ? 'Evidence' : type + 's'}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
