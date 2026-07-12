import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, SparklesIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Document {
  id: string;
  document_type: string;
  title: string;
  content: string;
  status: string;
  generated_by_ai: boolean;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

const DOC_TYPES = [
  { value: 'chargesheet', label: 'Chargesheet Draft' },
  { value: 'summary', label: 'Investigation Summary' },
  { value: 'diary', label: 'Case Diary Entry' },
  { value: 'evidence_inventory', label: 'Evidence Inventory' },
  { value: 'witness_summary', label: 'Witness Statement Summary' },
];

export default function ChargesheetPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [selected, setSelected] = useState<Document | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/documents?case_id=${caseId}`);
    setDocuments(res.data as Document[]);
    setLoading(false);
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  const generate = async (docType: string) => {
    setGenerating(docType);
    try {
      const res = await api.post('/ai/generate-document', { case_id: caseId, document_type: docType });
      const doc = res.data as Document;
      toast.success(`${docType.replace('_', ' ')} generated`);
      setDocuments((prev) => [doc, ...prev]);
      setSelected(doc);
    } finally {
      setGenerating('');
    }
  };

  const saveEdit = async () => {
    if (!selected) return;
    await api.put(`/documents/${selected.id}`, { content: editContent });
    toast.success('Document saved');
    setEditing(false);
    setSelected({ ...selected, content: editContent });
    load();
  };

  const approveDoc = async (docId: string) => {
    await api.put(`/documents/${docId}`, { status: 'approved' });
    toast.success('Document approved');
    load();
    if (selected?.id === docId) {
      setSelected({ ...selected, status: 'approved' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <Link to={`/cases/${caseId}`} className="btn-ghost btn-sm mb-2 -ml-2">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Case
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6 text-primary-400" />
          Documents & Chargesheet
        </h1>
        <p className="page-subtitle">AI-generated investigation documents</p>
      </div>

      <div className="ai-disclaimer mb-6">
        All AI-generated documents are drafts only. They must be thoroughly reviewed, edited, and
        approved by authorized officers before official use.
      </div>

      {/* Generate buttons */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary-400" />
            Generate with AI
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.value}
                onClick={() => generate(dt.value)}
                disabled={!!generating}
                className="p-3 bg-slate-800 border border-slate-700 hover:border-primary-700 hover:bg-slate-800/80 rounded-xl text-center transition-all"
              >
                <DocumentTextIcon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">{dt.label}</p>
                {generating === dt.value && (
                  <p className="text-xs text-primary-400 mt-1">Generating...</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document list */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white">Documents</h2>
          </div>
          {loading ? (
            <div className="p-4"><PageLoader /></div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No documents yet. Generate one using the buttons above.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  className={`w-full text-left p-4 hover:bg-slate-800/50 transition-colors ${selected?.id === doc.id ? 'bg-slate-800/50 border-l-2 border-primary-500' : ''}`}
                  onClick={() => { setSelected(doc); setEditing(false); setEditContent(doc.content); }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{doc.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {doc.created_at ? (() => { try { return format(new Date(doc.created_at), 'dd MMM yyyy HH:mm'); } catch { return '—'; } })() : '—'}
                      </p>
                    </div>
                    <span className={`badge text-xs ${doc.status === 'approved' ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-yellow-900/40 text-yellow-300 border-yellow-800'}`}>
                      {doc.status}
                    </span>
                  </div>
                  {doc.generated_by_ai && (
                    <span className="text-xs text-primary-400 flex items-center gap-1 mt-1">
                      <SparklesIcon className="w-3 h-3" /> AI Generated
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Document viewer/editor */}
        <div className="lg:col-span-2 card">
          {!selected ? (
            <div className="flex items-center justify-center h-full min-h-[400px] text-slate-500">
              Select a document to view or generate a new one
            </div>
          ) : (
            <>
              <div className="card-header flex items-center justify-between">
                <h2 className="font-semibold text-white truncate">{selected.title}</h2>
                <div className="flex gap-2 flex-shrink-0">
                  {selected.status !== 'approved' && (
                    <>
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => { setEditing(!editing); setEditContent(selected.content); }}
                      >
                        <PencilIcon className="w-4 h-4" />
                        {editing ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        className="btn-sm bg-green-900/40 text-green-300 border border-green-800 hover:bg-green-800/40 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1"
                        onClick={() => approveDoc(selected.id)}
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </>
                  )}
                  {editing && (
                    <button className="btn-primary btn-sm" onClick={saveEdit}>
                      Save
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {editing ? (
                  <textarea
                    className="input resize-y min-h-[500px] font-mono text-xs leading-relaxed"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                ) : (
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
                    {selected.content}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
