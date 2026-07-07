import { useEffect, useState, useCallback } from 'react';
import { Cog6ToothIcon, UsersIcon, ChartBarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  badge_number?: string;
  department?: string;
  station?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  full_name?: string;
  email?: string;
  action: string;
  resource_type?: string;
  ip_address?: string;
  created_at: string;
}

interface Stats {
  users: Array<{ role: string; count: string }>;
  cases: Array<{ status: string; count: string }>;
  total_witnesses: number;
  total_suspects: number;
}

type Tab = 'users' | 'audit' | 'stats';

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // Guard
  useEffect(() => {
    if (user && !['admin', 'super_admin'].includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data as AdminUser[]);
      } else if (t === 'audit') {
        const res = await api.get('/admin/audit-logs');
        setAuditLogs(res.data as AuditLog[]);
      } else {
        const res = await api.get('/admin/stats');
        setStats(res.data as Stats);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    if (!isActive) {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deactivated');
    } else {
      await api.put(`/admin/users/${userId}`, { is_active: true });
      toast.success('User activated');
    }
    loadTab('users');
  };

  const updateRole = async (userId: string, role: string) => {
    await api.put(`/admin/users/${userId}`, { role });
    toast.success('Role updated');
    loadTab('users');
  };

  const TABS = [
    { id: 'users' as Tab, label: 'Users', icon: UsersIcon },
    { id: 'audit' as Tab, label: 'Audit Logs', icon: ClipboardDocumentListIcon },
    { id: 'stats' as Tab, label: 'Platform Stats', icon: ChartBarIcon },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Cog6ToothIcon className="w-6 h-6 text-primary-400" />
          Admin Panel
        </h1>
        <p className="page-subtitle">Platform administration and management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Users tab */}
          {tab === 'users' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-white">Registered Users ({users.length})</h2>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name / Email</th>
                      <th>Role</th>
                      <th>Badge</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <p className="font-medium text-slate-200">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td>
                          <select
                            className="input text-xs py-1 px-2"
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                          >
                            {['admin', 'super_admin', 'police_officer', 'investigating_officer', 'sho', 'crime_branch', 'prosecutor', 'legal_advisor', 'law_student', 'judicial_researcher', 'trainer'].map((r) => (
                              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </td>
                        <td className="text-slate-400 text-xs">{u.badge_number || '—'}</td>
                        <td className="text-slate-400 text-xs">{u.department || '—'}</td>
                        <td>
                          <span className={`badge text-xs ${u.is_active ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">
                          {u.last_login ? format(new Date(u.last_login), 'dd MMM yyyy') : 'Never'}
                        </td>
                        <td>
                          {u.id !== user?.id && (
                            <button
                              className={`btn-sm text-xs rounded-lg px-3 py-1.5 ${u.is_active ? 'bg-red-900/30 text-red-300 border border-red-800 hover:bg-red-800/30' : 'bg-green-900/30 text-green-300 border border-green-800 hover:bg-green-800/30'}`}
                              onClick={() => toggleUserActive(u.id, !u.is_active)}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit logs */}
          {tab === 'audit' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-white">Audit Logs</h2>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-slate-400 text-xs whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                        </td>
                        <td>
                          <p className="text-slate-200 text-xs">{log.full_name || 'System'}</p>
                          <p className="text-slate-500 text-xs">{log.email}</p>
                        </td>
                        <td className="text-slate-300 text-xs">{log.action}</td>
                        <td className="text-slate-400 text-xs">{log.resource_type || '—'}</td>
                        <td className="text-slate-500 text-xs font-mono">{log.ip_address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats */}
          {tab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card p-5">
                <h3 className="font-semibold text-white mb-3">Users by Role</h3>
                <div className="space-y-2">
                  {stats.users.map((u) => (
                    <div key={u.role} className="flex justify-between text-sm">
                      <span className="text-slate-400 capitalize">{u.role.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-slate-200">{u.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-white mb-3">Cases by Status</h3>
                <div className="space-y-2">
                  {stats.cases.map((c) => (
                    <div key={c.status} className="flex justify-between text-sm">
                      <span className="text-slate-400 capitalize">{c.status.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-slate-200">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-white mb-3">Other Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Witnesses</span>
                    <span className="font-semibold text-slate-200">{stats.total_witnesses}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Suspect Records</span>
                    <span className="font-semibold text-slate-200">{stats.total_suspects}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
