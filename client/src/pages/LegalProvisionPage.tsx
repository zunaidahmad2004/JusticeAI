import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ScaleIcon, SparklesIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Provision {
  id: string;
  provision_id?: string;
  section: string;
  act_name: string;
  title: string;
  description: string;
  plain_language?: string;
  typical_evidence?: string[];
  punishment?: string;
  is_bailable?: boolean;
  is_cognizable?: boolean;
  confidence_score?: number;
  ai_reasoning?: string;
  status?: string;
  why_applicable?: string;
  confidence?: number;
}

export default function LegalProvisionPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [caseData, setCaseData] = useState<{ title: string; crime_type?: string; description?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Provision[]>([]);
  const [searching, setSearching] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Provision[]>([]);

  const loadProvisions = useCallback(async () => {
    setLoading(true);
    const [caseRes, provisionsRes] = await Promise.all([
      api.get(`/cases/${caseId}`),
      api.get(`/legal/case-provisions/${caseId}`),
    ]);
    setCaseData(caseRes.data as { title: string; crime_type?: string; description?: string });
    setProvisions(provisionsRes.data as Provision[]);
    setLoading(false);
  }, [caseId]);

  useEffect(() => { loadProvisions(); }, [loadProvisions]);

  const getAISuggestions = async () => {
    if (!caseData) return;
    setLoadingAI(true);
    try {
      const res = await api.post('/ai/recommend-provisions', {
        case_description: caseData.description || caseData.title,
        crime_type: caseData.crime_type,
      });
      const data = res.data as { provisions: Provision[] };
      setAiSuggestions(data.provisions || []);
    } finally {
      setLoadingAI(false);
    }
  };

  const searchLegal = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/legal/provisions?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data as Provision[]);
    } finally {
      setSearching(false);
    }
  };

  const addProvision = async (p: Provision) => {
    await api.post('/legal/case-provisions', {
      case_id: caseId,
      provision_id: p.id,
      confidence_score: p.confidence || 0.5,
      ai_reasoning: p.why_applicable || p.ai_reasoning,
    });
    toast.success('Provision added to case');
    loadProvisions();
  };

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/legal/case-provisions/${id}`, { status });
    toast.success(`Provision ${status}`);
    loadProvisions();
  };

  return (
    <div>
      <div className="page-header">
        <Link to={`/cases/${caseId}`} className="btn-ghost btn-sm mb-2 -ml-2">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Case
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <ScaleIcon className="w-6 h-6 text-primary-400" />
          Legal Provisions
        </h1>
        <p className="page-subtitle">AI-assisted legal provision recommendations</p>
      </div>

      <div className="ai-disclaimer mb-6">
        All legal provision suggestions are advisory only. They must be reviewed and approved by
        qualified legal professionals before use in official proceedings.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* AI Recommendations */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-primary-400" />
              AI Recommendations
            </h2>
            <button className="btn-secondary btn-sm" onClick={getAISuggestions} disabled={loadingAI}>
              {loadingAI ? 'Analyzing...' : 'Get Suggestions'}
            </button>
          </div>
          <div className="card-body">
            {aiSuggestions.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Click "Get Suggestions" to receive AI-powered legal provision recommendations based on the case details.
              </p>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((p, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          {p.act_name} — Section {p.section}
                        </p>
                        <p className="text-xs text-primary-300">{p.title}</p>
                        {p.plain_language && <p className="text-xs text-slate-400 mt-1">{p.plain_language}</p>}
                        {p.why_applicable && (
                          <p className="text-xs text-yellow-400/80 mt-1">Why applicable: {p.why_applicable}</p>
                        )}
                        {p.confidence && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Confidence</span>
                              <span>{Math.round(p.confidence * 100)}%</span>
                            </div>
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${Math.round(p.confidence * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search legal provisions */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white">Search Legal Database</h2>
          </div>
          <div className="card-body">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  className="input pl-9"
                  placeholder="Search by section, act, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLegal()}
                />
              </div>
              <button className="btn-secondary" onClick={searchLegal} disabled={searching}>
                {searching ? '...' : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-2 bg-slate-800/50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {p.act_name} — Sec. {p.section}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{p.title}</p>
                    </div>
                    <button
                      className="btn-secondary btn-sm flex-shrink-0"
                      onClick={() => addProvision(p)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Search the legal database to find and add relevant provisions.</p>
            )}
          </div>
        </div>
      </div>

      {/* Case provisions */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-white">Case Provisions</h2>
        </div>
        {loading ? (
          <div className="p-6"><PageLoader /></div>
        ) : provisions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ScaleIcon}
              title="No provisions added"
              description="Use AI recommendations or search to add legal provisions to this case."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {provisions.map((p) => (
              <div key={p.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white">{p.act_name} — Section {p.section}</h3>
                      {p.is_cognizable !== undefined && (
                        <span className={`badge text-xs ${p.is_cognizable ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                          {p.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}
                        </span>
                      )}
                      {p.is_bailable !== undefined && (
                        <span className={`badge text-xs ${p.is_bailable ? 'bg-green-900/40 text-green-300 border border-green-800' : 'bg-red-900/40 text-red-300 border border-red-800'}`}>
                          {p.is_bailable ? 'Bailable' : 'Non-Bailable'}
                        </span>
                      )}
                      <span className={`badge text-xs ${p.status === 'accepted' ? 'bg-green-900/40 text-green-300 border border-green-800' : p.status === 'rejected' ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-yellow-900/40 text-yellow-300 border border-yellow-800'}`}>
                        {p.status || 'suggested'}
                      </span>
                    </div>
                    <p className="text-primary-300 text-sm">{p.title}</p>
                    {p.plain_language && <p className="text-slate-400 text-sm mt-1">{p.plain_language}</p>}
                    {p.punishment && <p className="text-xs text-slate-500 mt-1">Punishment: {p.punishment}</p>}
                    {p.ai_reasoning && (
                      <p className="text-xs text-yellow-400/70 mt-2">AI reasoning: {p.ai_reasoning}</p>
                    )}
                    {p.confidence_score !== undefined && (
                      <p className="text-xs text-slate-500 mt-1">
                        Confidence: {Math.round(p.confidence_score * 100)}%
                      </p>
                    )}
                  </div>
                  {p.status === 'suggested' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        className="btn-sm bg-green-900/40 text-green-300 border border-green-800 hover:bg-green-800/40 rounded-lg px-3 py-1.5 text-xs"
                        onClick={() => updateStatus(p.id, 'accepted')}
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        className="btn-sm bg-red-900/40 text-red-300 border border-red-800 hover:bg-red-800/40 rounded-lg px-3 py-1.5 text-xs"
                        onClick={() => updateStatus(p.id, 'rejected')}
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
