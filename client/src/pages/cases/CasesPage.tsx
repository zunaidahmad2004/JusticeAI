import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Download, RefreshCw, Eye,
  Calendar, MapPin, User, Clock, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, FileText, XCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { format } from 'date-fns';

interface Case {
  id: string;
  case_number: string;
  fir_number?: string;
  title: string;
  crime_type?: string;
  status: string;
  priority: string;
  date_of_incident?: string;
  location?: string;
  io_name?: string;
  updated_at?: string;
  updatedAt?: string;
  createdAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
  open: { label: 'Open', class: 'badge-blue', icon: FileText },
  under_investigation: { label: 'Active', class: 'badge-yellow', icon: AlertTriangle },
  chargesheet_filed: { label: 'Filed', class: 'badge-green', icon: CheckCircle2 },
  closed: { label: 'Closed', class: 'badge-slate', icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<string, string> = {
  critical: 'priority-critical',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

export default function CasesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const loadCases = async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset: (page - 1) * limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/cases', { params });
      setCases(res.data.cases || []);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [page, statusFilter, searchQuery]);

  const totalPages = Math.ceil(total / limit);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">Manage and track all investigation cases</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadCases} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link to="/cases/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Case
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-5">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by case number, FIR, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-12"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="under_investigation">Active</option>
              <option value="chargesheet_filed">Filed</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Advanced Filters */}
          <button className="btn-secondary">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-400">
          Showing <span className="font-semibold text-white">{cases.length}</span> of{' '}
          <span className="font-semibold text-white">{total}</span> cases
        </p>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="text-navy-400 hover:text-navy-300 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Cases Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="empty-state py-20">
            <FileText className="empty-state-icon" />
            <h3 className="empty-state-title">No cases found</h3>
            <p className="empty-state-desc">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first case'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link to="/cases/new" className="btn-primary mt-6">
                <Plus className="w-4 h-4" />
                Create First Case
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Crime Type</th>
                  <th>IO Name</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const statusConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
                  const StatusIcon = statusConfig.icon;
                  const priorityClass = PRIORITY_CONFIG[c.priority] || 'priority-low';

                  return (
                    <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-navy-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-navy-400" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-semibold text-white">{c.case_number}</p>
                            {c.fir_number && (
                              <p className="text-2xs text-slate-600">FIR: {c.fir_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-white max-w-xs truncate">{c.title}</p>
                        {c.location && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {c.location}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className={statusConfig.class}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <span className={priorityClass}>{c.priority || 'Low'}</span>
                      </td>
                      <td>
                        <span className="text-slate-400">{c.crime_type || '—'}</span>
                      </td>
                      <td>
                        {c.io_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-600 to-navy-400 flex items-center justify-center text-white text-2xs font-bold">
                              {c.io_name[0]}
                            </div>
                            <span className="text-sm text-slate-300">{c.io_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {(() => {
                            const raw = c.updatedAt || c.updated_at || c.createdAt;
                            if (!raw) return '—';
                            try { return format(new Date(raw), 'dd MMM yyyy'); }
                            catch { return '—'; }
                          })()}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cases/${c.id}`);
                          }}
                          className="btn-ghost btn-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary btn-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
