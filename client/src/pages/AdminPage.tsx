import { useEffect, useState, useCallback } from 'react';
import { Settings, Users, BarChart3, ScrollText, CheckCircle2, XCircle, Shield } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AdminUser {
  id: string; email: string; full_name: string; role: string;
  badge_number?: string; department?: string; station?: string;
  is_active: boolean; last_login?: string; created_at: string;
}
interface AuditLog {
  id: string; full_name?: string; email?: string;
  action: string; resource_type?: string; ip_address?: string; created_at: string;
}
interface Stats {
  users: Array<{ role: string; count: string }>;
  cases: Array<{ status: string; count: string }>;
  total_witnesses: number; total_suspects: number;
}
type Tab = 'users' | 'audit' | 'stats';

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab]         = useState<Tab>('users');
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !['admin', 'super_admin'].includes(user.role)) navigate('/dashboard');
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
    } catch { /* toast shown by interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  const toggleUserActive = async (userId: string, active: boolean) => {
    try {
      if (!active) { await api.delete(`/admin/users/${userId}`); toast.success('User deactivated'); }
      else         { await api.put(`/admin/users/${userId}`, { is_active: true }); toast.success('User activated'); }
      loadTab('users');
    } catch { /* handled */ }
  };

  const updateRole = async (userId: string, role: string) => {
    try { await api.put(`/admin/users/${userId}`, { role }); toast.success('Role updated'); loadTab('users'); }
    catch { /* handled */ }
  };

  const TABS = [
    { id: 'users' as Tab, label: 'Users',          icon: Users      },
    { id: 'audit' as Tab, label: 'Audit Logs',     icon: ScrollText },
    { id: 'stats' as Tab, label: 'Platform Stats', icon: BarChart3  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-3"><Settings className="w-7 h-7 text-navy-400" />Admin Panel</h1>
        <p className="page-subtitle">Platform administration and user management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-base-surface border border-base-border rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===id ? 'bg-navy-600 text-white shadow-glow-sm' : 'text-slate-500 hover:text-white'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : (
        <>
          {/* Users */}
          {tab === 'users' && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-base-border flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-400" />
                <h2 className="text-sm font-bold text-white">Registered Users ({users.length})</h2>
              </div>
              {users.length === 0 ? (
                <div className="py-12 text-center"><Users className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-slate-500 text-sm">No users found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead><tr><th>Name / Email</th><th>Role</th><th>Badge</th><th>Department</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-navy-500/10 flex items-center justify-center text-navy-400 text-xs font-bold">{u.full_name?.[0] || 'U'}</div>
                              <div><p className="text-sm font-semibold text-white">{u.full_name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                            </div>
                          </td>
                          <td>
                            <select className="input text-xs py-1 px-2 h-8 w-auto" value={u.role}
                              onChange={(e) => updateRole(u.id, e.target.value)}>
                              {['admin','super_admin','police_officer','investigating_officer','sho','crime_branch','prosecutor','legal_advisor','law_student','judicial_researcher','trainer'].map(r=>(
                                <option key={r} value={r}>{r.replace(/_/g,' ')}</option>
                              ))}
                            </select>
                          </td>
                          <td className="text-slate-400 text-xs">{u.badge_number || '—'}</td>
                          <td className="text-slate-400 text-xs">{u.department || '—'}</td>
                          <td><span className={u.is_active ? 'badge-green text-2xs' : 'badge-slate text-2xs'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td className="text-slate-500 text-xs">{u.last_login ? (() => { try { return format(new Date(u.last_login!),'dd MMM yyyy'); } catch { return 'Invalid'; } })() : 'Never'}</td>
                          <td>
                            {u.id !== user?.id && (
                              <button onClick={() => toggleUserActive(u.id, !u.is_active)}
                                className={`btn-sm text-xs rounded-lg px-3 py-1.5 font-semibold ${u.is_active ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'}`}>
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Audit Logs */}
          {tab === 'audit' && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-base-border flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-navy-400" />
                <h2 className="text-sm font-bold text-white">Audit Logs ({auditLogs.length})</h2>
              </div>
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center"><ScrollText className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-slate-500 text-sm">No audit logs</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th></tr></thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="text-slate-400 text-xs whitespace-nowrap">{(() => { try { return format(new Date(log.created_at),'dd MMM yyyy HH:mm:ss'); } catch { return log.created_at || '—'; } })()}</td>
                          <td><p className="text-sm text-white">{log.full_name || 'System'}</p><p className="text-xs text-slate-500">{log.email}</p></td>
                          <td><span className="badge-slate text-2xs capitalize">{log.action?.replace(/_/g,' ')}</span></td>
                          <td className="text-slate-400 text-xs">{log.resource_type || '—'}</td>
                          <td className="text-slate-500 text-xs font-mono">{log.ip_address || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {tab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-navy-400" />Users by Role</h3>
                <div className="space-y-2">
                  {(stats?.users || []).map((u) => (
                    <div key={u.role} className="flex justify-between text-sm">
                      <span className="text-slate-400 capitalize">{u.role.replace(/_/g,' ')}</span>
                      <span className="font-bold text-white">{u.count}</span>
                    </div>
                  ))}
                  {!stats?.users?.length && <p className="text-slate-600 text-sm">No data</p>}
                </div>
              </div>
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" />Cases by Status</h3>
                <div className="space-y-2">
                  {(stats?.cases || []).map((c) => (
                    <div key={c.status} className="flex justify-between text-sm">
                      <span className="text-slate-400 capitalize">{c.status.replace(/_/g,' ')}</span>
                      <span className="font-bold text-white">{c.count}</span>
                    </div>
                  ))}
                  {!stats?.cases?.length && <p className="text-slate-600 text-sm">No data</p>}
                </div>
              </div>
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-green-400" />Other Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Total Witnesses</span><span className="font-bold text-white">{stats?.total_witnesses ?? '—'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Suspect Records</span><span className="font-bold text-white">{stats?.total_suspects ?? '—'}</span></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
