import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, Locate, RefreshCw, AlertTriangle,
  X, ExternalLink, Search, Layers, Filter,
  Newspaper, Shield, Clock,
} from 'lucide-react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CaseMarker {
  kind: 'case';
  id: string; case_number: string; fir_number: string; title: string;
  crime_type: string; status: string; priority: 'critical'|'high'|'medium'|'low';
  latitude: number; longitude: number;
  address: string; city: string; state: string;
  io_name: string; date_of_incident: string;
}

interface NewsMarker {
  kind: 'news';
  id: string; headline: string; source: string; source_url: string;
  crime_type: string; city: string; state: string; address: string;
  summary: string; severity: 'high'|'medium'|'low';
  latitude: number; longitude: number; published_at: string;
}

type AnyMarker = CaseMarker | NewsMarker;
interface OfficerLoc { lat: number; lng: number; }

/* ─── Constants ──────────────────────────────────────────────────────────── */
const P_COLOR: Record<string, string> = {
  critical:'#EF4444', high:'#F97316', medium:'#F59E0B', low:'#3B82F6',
};
const SEV_COLOR: Record<string, string> = {
  high:'#EF4444', medium:'#F59E0B', low:'#3B82F6',
};
const CRIME_TYPES = ['all','Murder','Theft','Assault','Cyber Crime','Fraud','Kidnapping','Drugs','Women Safety'];
const DATE_FILTERS = [
  { label:'All Time',   hours: 0    },
  { label:'24 Hours',  hours: 24   },
  { label:'7 Days',    hours: 168  },
  { label:'30 Days',   hours: 720  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function distKm(la1:number,lo1:number,la2:number,lo2:number){
  const R=6371,dL=((la2-la1)*Math.PI)/180,dO=((lo2-lo1)*Math.PI)/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

let cssLoaded=false;
function injectCSS(){
  if(cssLoaded)return; cssLoaded=true;
  ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
   'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
   'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  ].forEach(href=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l);});
}

function caseIcon(color:string,L:any){
  const s=`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
    <path d="M13 0C5.8 0 0 5.8 0 13c0 9 13 21 13 21s13-12 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="1.2"/>
    <circle cx="13" cy="13" r="5" fill="white" opacity="0.92"/>
  </svg>`;
  return new L.DivIcon({html:`<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.55))">${s}</div>`,iconSize:[26,34],iconAnchor:[13,34],popupAnchor:[0,-36],className:''});
}

function newsIcon(color:string,L:any){
  const s=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.85"/>
    <circle cx="12" cy="12" r="2" fill="${color}"/>
  </svg>`;
  return new L.DivIcon({html:`<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.5))">${s}</div>`,iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-14],className:''});
}

function officerIcon(L:any){
  const s=`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="16" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
    <circle cx="17" cy="17" r="8" fill="white" opacity="0.9"/>
    <circle cx="17" cy="17" r="4" fill="#3B82F6"/>
  </svg>`;
  return new L.DivIcon({html:`<div style="filter:drop-shadow(0 3px 6px rgba(59,130,246,0.6))">${s}</div>`,iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-20],className:''});
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CrimeHeatmap() {
  const navigate   = useNavigate();
  const mapDiv     = useRef<HTMLDivElement>(null);
  const mapRef     = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const heatRef    = useRef<any>(null);
  const officerRef = useRef<any>(null);
  const radiusRef  = useRef<any>(null);
  const watchId    = useRef<number|null>(null);

  const [officer,    setOfficer]    = useState<OfficerLoc|null>(null);
  const [caseMarkers,   setCaseMarkers]    = useState<CaseMarker[]>([]);
  const [newsMarkers,   setNewsMarkers]    = useState<NewsMarker[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [newsLoading,setNewsLoading]= useState(false);
  const [locError,   setLocError]   = useState('');
  const [radius,     setRadius]     = useState(10);
  const [crimeType,  setCrimeType]  = useState('all');
  const [dateFilter, setDateFilter] = useState(0);
  const [priority,   setPriority]   = useState('all');
  const [search,     setSearch]     = useState('');
  const [heatmap,    setHeatmap]    = useState(false);
  const [showNews,   setShowNews]   = useState(true);
  const [selected,   setSelected]   = useState<(AnyMarker & {dist:number})|null>(null);
  const [mapReady,   setMapReady]   = useState(false);
  const [lastFetch,  setLastFetch]  = useState<string|null>(null);
  const [statsMsg,   setStatsMsg]   = useState('');

  /* ── Fetch MongoDB case markers ──────────────────────────────────────── */
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = {};
      if (priority !== 'all') params.priority = priority;
      const res = await api.get('/cases/map', { params });
      const data = res.data as { markers: CaseMarker[]; stats: any };
      const m = (data.markers || []).map((c: any) => ({ ...c, kind: 'case' as const }));
      setCaseMarkers(m);
      const s = data.stats;
      if (s) setStatsMsg(`${s.with_coordinates}/${s.total} cases geocoded`);
    } catch {
      setCaseMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [priority]);

  /* ── Fetch public news incidents ─────────────────────────────────────── */
  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const params: Record<string,string> = {};
      if (crimeType !== 'all') params.crime_type = crimeType;
      if (dateFilter > 0) params.hours = String(dateFilter);
      const res = await api.get('/public-crime/incidents', { params });
      const data = res.data as { incidents: NewsMarker[]; last_fetch: string };
      const m = (data.incidents || []).map((n: any) => ({ ...n, kind: 'news' as const }));
      setNewsMarkers(m);
      if (data.last_fetch) setLastFetch(data.last_fetch);
    } catch {
      setNewsMarkers([]);
    } finally {
      setNewsLoading(false);
    }
  }, [crimeType, dateFilter]);

  /* ── Geolocation ─────────────────────────────────────────────────────── */
  const locate = useCallback(() => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setOfficer(loc); setLocError('');
        mapRef.current?.setView([loc.lat, loc.lng], 12, { animate: true });
      },
      (e) => setLocError(e.code === 1 ? 'Location permission denied.' : 'Location unavailable.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setOfficer({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}, { enableHighAccuracy: true }
    );
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current!); };
  }, []);

  /* ── Init map ────────────────────────────────────────────────────────── */
  useEffect(() => {
    injectCSS();
    if (!mapDiv.current || mapRef.current) return;
    import('leaflet').then((L) => {
      if (!mapDiv.current || mapRef.current) return;
      const map = L.map(mapDiv.current, {
        center: [20.5937, 78.9629], zoom: 5,
        zoomControl: false, attributionControl: true,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
        attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
      locate();
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => { if (mapReady) { fetchCases(); fetchNews(); } }, [mapReady, fetchCases, fetchNews]);

  /* ── Officer marker + radius ─────────────────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current || !officer) return;
    import('leaflet').then((L) => {
      officerRef.current?.remove();
      officerRef.current = L.marker([officer.lat, officer.lng], { icon: officerIcon(L), zIndexOffset: 1000 })
        .addTo(mapRef.current)
        .bindPopup('<b style="color:#1e293b">&#128205; Your Location</b>');
      radiusRef.current?.remove();
      radiusRef.current = L.circle([officer.lat, officer.lng], {
        radius: radius*1000, color:'#3B82F6', fillColor:'#3B82F6',
        fillOpacity:0.04, weight:1.5, dashArray:'6 4',
      }).addTo(mapRef.current);
    });
  }, [officer, radius]);

  useEffect(() => { radiusRef.current?.setRadius(radius*1000); }, [radius]);

  /* ── Render markers / heatmap ────────────────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then(async (L) => {
      // Remove old layers
      clusterRef.current?.remove(); clusterRef.current = null;
      heatRef.current?.remove();    heatRef.current    = null;

      const q = search.toLowerCase();

      // Case markers (from MongoDB)
      const filteredCases = caseMarkers.filter(m => {
        const matchPri  = priority === 'all' || m.priority === priority;
        const matchType = crimeType === 'all' || m.crime_type.toLowerCase().includes(crimeType.toLowerCase());
        const matchDate = dateFilter === 0 || (Date.now() - new Date(m.date_of_incident).getTime()) < dateFilter * 3600000;
        const matchQ    = !q || m.title.toLowerCase().includes(q) || m.case_number.toLowerCase().includes(q) ||
                          m.fir_number.toLowerCase().includes(q) || m.city.toLowerCase().includes(q) ||
                          m.crime_type.toLowerCase().includes(q);
        return matchPri && matchType && matchDate && matchQ;
      });

      // News markers (from public feed)
      const filteredNews = showNews ? newsMarkers.filter(m => {
        const matchType = crimeType === 'all' || m.crime_type.toLowerCase().includes(crimeType.toLowerCase());
        const matchDate = dateFilter === 0 || (Date.now() - new Date(m.published_at).getTime()) < dateFilter * 3600000;
        const matchQ    = !q || m.headline.toLowerCase().includes(q) || m.city.toLowerCase().includes(q) ||
                          m.crime_type.toLowerCase().includes(q);
        return matchType && matchDate && matchQ;
      }) : [];

      const allVisible = [...filteredCases, ...filteredNews];

      if (heatmap) {
        // Heatmap mode using Leaflet.heat
        const points = allVisible
          .filter(m => m.latitude && m.longitude)
          .map(m => {
            const intensity = m.kind === 'case'
              ? { critical:1, high:0.8, medium:0.5, low:0.3 }[m.priority] ?? 0.5
              : { high:0.9, medium:0.5, low:0.3 }[m.severity] ?? 0.5;
            return [m.latitude, m.longitude, intensity];
          });

        if (points.length > 0) {
          try {
            const L_any = L as any;
            if (typeof L_any.heatLayer !== 'function') {
              // Dynamically inject Leaflet.heat
              await new Promise<void>((resolve) => {
                const s = document.createElement('script');
                s.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
                s.onload = () => resolve();
                document.head.appendChild(s);
              });
            }
            heatRef.current = (L as any).heatLayer(points, {
              radius:15, blur:20, maxZoom:14,
              gradient:{ 0.2:'#3B82F6', 0.5:'#F59E0B', 0.8:'#F97316', 1.0:'#EF4444' },
            }).addTo(mapRef.current);
          } catch { /* fallback to cluster if heat not available */ }
        }
        return;
      }

      // Cluster mode
      const { default: _MC } = await import('leaflet.markercluster');
      const group = (L as any).markerClusterGroup({
        maxClusterRadius:50, spiderfyOnMaxZoom:true,
        showCoverageOnHover:false, zoomToBoundsOnClick:true,
        iconCreateFunction: (cluster:any) => {
          const n = cluster.getChildCount();
          return new L.DivIcon({
            html:`<div style="background:rgba(239,68,68,0.88);border:2px solid rgba(255,255,255,0.5);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.45)">${n}</div>`,
            className:'', iconSize:[36,36],
          });
        },
      });

      // Add case markers
      filteredCases.forEach(m => {
        const mk = L.marker([m.latitude, m.longitude], { icon: caseIcon(P_COLOR[m.priority]??'#3B82F6', L) });
        const dist = officer ? distKm(officer.lat, officer.lng, m.latitude, m.longitude) : 0;
        mk.on('click', () => setSelected({ ...m, dist }));
        group.addLayer(mk);
      });

      // Add news markers (diamond/circle icon)
      if (showNews) {
        filteredNews.forEach(m => {
          const mk = L.marker([m.latitude, m.longitude], { icon: newsIcon(SEV_COLOR[m.severity]??'#3B82F6', L) });
          const dist = officer ? distKm(officer.lat, officer.lng, m.latitude, m.longitude) : 0;
          mk.on('click', () => setSelected({ ...m, dist }));
          group.addLayer(mk);
        });
      }

      clusterRef.current = group;
      mapRef.current.addLayer(group);
    });
  }, [caseMarkers, newsMarkers, priority, crimeType, dateFilter, search, heatmap, showNews, officer]);

  /* ── Counts ──────────────────────────────────────────────────────────── */
  const totalVisible = caseMarkers.length + (showNews ? newsMarkers.length : 0);

  const refreshAll = () => { fetchCases(); fetchNews(); };
  const centerOnOfficer = () => {
    if (officer) mapRef.current?.setView([officer.lat, officer.lng], 13, { animate: true });
    else locate();
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="card h-full flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="card-header flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Crime Incident Map</h2>
              <p className="text-xs text-slate-500">
                {loading || newsLoading ? 'Loading...' : `${caseMarkers.length} cases · ${newsMarkers.length} news`}
                {statsMsg ? ` · ${statsMsg}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Radius */}
            <div className="flex gap-0.5 bg-base-elevated rounded-lg p-0.5 border border-base-border">
              {[5,10,25].map(r=>(
                <button key={r} onClick={()=>setRadius(r)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${radius===r?'bg-blue-500/20 text-blue-400':'text-slate-500 hover:text-slate-300'}`}>
                  {r}km
                </button>
              ))}
            </div>

            {/* Heatmap toggle */}
            <button onClick={()=>setHeatmap(h=>!h)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all ${heatmap?'bg-orange-500/20 text-orange-400 border-orange-500/30':'text-slate-500 border-base-border hover:text-slate-300'}`}>
              <Layers className="w-3 h-3" />{heatmap?'Heatmap':'Cluster'}
            </button>

            {/* News toggle */}
            <button onClick={()=>setShowNews(s=>!s)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all ${showNews?'bg-purple-500/20 text-purple-400 border-purple-500/30':'text-slate-500 border-base-border hover:text-slate-300'}`}>
              <Newspaper className="w-3 h-3" />News
            </button>

            <button onClick={refreshAll} className="btn-icon w-7 h-7" title="Refresh all">
              <RefreshCw className={`w-3.5 h-3.5 ${(loading||newsLoading)?'animate-spin':''}`} />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2">
          {/* Priority */}
          <div className="flex gap-0.5 bg-base-elevated rounded-lg p-0.5 border border-base-border">
            {['all','critical','high','medium','low'].map(f=>(
              <button key={f} onClick={()=>setPriority(f)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold capitalize transition-all ${priority===f?'bg-primary-500/20 text-primary-400':'text-slate-500 hover:text-slate-300'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <select value={dateFilter} onChange={e=>setDateFilter(Number(e.target.value))}
            className="bg-base-elevated border border-base-border rounded-lg px-2 py-1 text-[10px] text-slate-400 focus:outline-none">
            {DATE_FILTERS.map(d=><option key={d.hours} value={d.hours}>{d.label}</option>)}
          </select>
        </div>

        {/* Crime type filter */}
        <div className="flex gap-1 flex-wrap">
          {CRIME_TYPES.map(t=>(
            <button key={t} onClick={()=>setCrimeType(t)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${crimeType===t?'bg-navy-600 text-white':'text-slate-500 bg-base-elevated border border-base-border hover:text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input type="text" placeholder="Search FIR, case number, crime type, city..." value={search}
            onChange={e=>setSearch(e.target.value)} className="input pl-9 py-2 text-xs h-8" />
        </div>

        {locError && (
          <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{locError}
          </div>
        )}
      </div>

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapDiv} className="absolute inset-0" style={{ zIndex:0 }} />

        {/* Loading overlay */}
        {(loading || newsLoading) && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 glass-strong rounded-xl px-4 py-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading map data...</p>
          </div>
        )}

        {/* My location */}
        <button onClick={centerOnOfficer} title="My Location"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-xl bg-base-card/90 backdrop-blur-sm border border-base-border flex items-center justify-center text-blue-400 hover:bg-base-elevated hover:border-blue-500/40 transition-all shadow-card">
          <Locate className="w-4 h-4" />
        </button>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 space-y-1">
          <div className="glass-strong rounded-xl px-3 py-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-slate-400">Case (MongoDB)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 ring-1 ring-white/30" />
                <span className="text-[10px] text-slate-400">News (Public)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {[{c:'#EF4444',l:'Critical'},{c:'#F97316',l:'High'},{c:'#F59E0B',l:'Medium'},{c:'#3B82F6',l:'Low'}].map(x=>(
                <div key={x.l} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{background:x.c}} />
                  <span className="text-[10px] text-slate-500">{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-strong rounded-xl px-3 py-1.5">
            <p className="text-[10px] text-slate-400">
              <span className="text-white font-semibold">{totalVisible}</span> total incident{totalVisible!==1?'s':''}{' '}
              {officer && <>· <span className="text-blue-400">{radius}km radius</span></>}
            </p>
            {lastFetch && (() => {
              try {
                const d = new Date(lastFetch);
                return isNaN(d.getTime()) ? null : (
                  <p className="text-[9px] text-slate-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />News updated {formatDistanceToNow(d, {addSuffix:true})}
                  </p>
                );
              } catch { return null; }
            })()}
          </div>
          {showNews && newsMarkers.length > 0 && (
            <div className="glass-strong rounded-xl px-3 py-1.5 border border-purple-500/20">
              <p className="text-[9px] text-purple-300 flex items-center gap-1">
                <Newspaper className="w-2.5 h-2.5" />Public News-Based Crime Incidents
              </p>
            </div>
          )}
        </div>

        {/* Case or news popup */}
        {selected && (
          <div className="absolute top-3 left-3 z-20 w-72 glass-strong rounded-2xl border border-base-border shadow-card overflow-hidden">
            <div className="h-1 w-full" style={{background:
              selected.kind==='case' ? P_COLOR[selected.priority] : SEV_COLOR[selected.severity]}} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {selected.kind === 'case' ? (
                    <>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500">{selected.case_number}</span>
                        {selected.fir_number && <span className="text-[10px] font-mono text-slate-600">FIR: {selected.fir_number}</span>}
                        <span className="flex items-center gap-1 text-[10px] text-blue-400"><Shield className="w-2.5 h-2.5" />MongoDB</span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight">{selected.title}</h3>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 mb-1">
                        <Newspaper className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-purple-400 font-semibold">Public News</span>
                        <span className="text-[10px] text-slate-600">· {selected.source}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{selected.headline}</h3>
                    </>
                  )}
                </div>
                <button onClick={()=>setSelected(null)}
                  className="ml-2 w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-base-elevated flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                {selected.kind === 'case' ? [
                  {l:'Crime Type', v:selected.crime_type},
                  {l:'Status',     v:selected.status.replace(/_/g,' ')},
                  {l:'Date',       v:selected.date_of_incident?format(new Date(selected.date_of_incident),'dd MMM yyyy'):'—'},
                  {l:'Location',   v:[selected.address,selected.city,selected.state].filter(Boolean).join(', ')||'—'},
                  {l:'Officer',    v:selected.io_name||'Unassigned'},
                  ...(officer?[{l:'Distance',v:`${selected.dist.toFixed(1)} km away`}]:[]),
                ].map(r=>(
                  <div key={r.l} className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-slate-600 font-medium flex-shrink-0">{r.l}</span>
                    <span className="text-[11px] text-slate-300 capitalize text-right">{r.v}</span>
                  </div>
                )) : [
                  {l:'Crime Type', v:selected.crime_type},
                  {l:'Location',   v:[selected.address,selected.city,selected.state].filter(Boolean).join(', ')||'—'},
                  {l:'Date',       v:selected.published_at?format(new Date(selected.published_at),'dd MMM yyyy'):'—'},
                  ...(officer?[{l:'Distance',v:`${selected.dist.toFixed(1)} km away`}]:[]),
                ].map(r=>(
                  <div key={r.l} className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-slate-600 font-medium flex-shrink-0">{r.l}</span>
                    <span className="text-[11px] text-slate-300 capitalize text-right">{r.v}</span>
                  </div>
                ))}

                {selected.kind === 'news' && selected.summary && (
                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-base-border pt-2">{selected.summary}</p>
                )}
              </div>

              {selected.kind === 'case' ? (
                <button onClick={()=>navigate(`/cases/${selected.id}`)} className="btn-primary w-full btn-sm text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />Open Full Case
                </button>
              ) : (
                <a href={selected.source_url} target="_blank" rel="noreferrer"
                  className="btn-secondary w-full btn-sm text-xs flex items-center justify-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />Read Original Article
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
