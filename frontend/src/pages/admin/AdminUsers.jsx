import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useSSE } from '../../hooks/useSSE';
import {
  validateName, validateEmail, validatePhone,
  validateDepartment, validateRoleChange, isValid,
} from '../../utils/validation';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];

const RS = {
  ADMIN: { badge: 'bg-brand-danger/10 text-ui-danger border-brand-danger/25', text: '#fb7185' },
  TECHNICIAN: { badge: 'bg-brand-warning/12 text-ui-warn border-brand-warning/25', text: '#fbbf24' },
  USER: { badge: 'bg-brand-primary/12 text-ui-sky border-brand-primary/25', text: '#38bdf8' },
};

const EVENT_COLORS = {
  USER_REGISTERED: '#4ade80',
  ROLE_CHANGED: '#fbbf24',
  USER_DELETED: '#fb7185',
  PROFILE_UPDATED: '#38bdf8',
};

export default function AdminUsers() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [roleConfirm, setRoleConfirm] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  // ── Toast helpers ────────────────────────────────────────────────────────

  const addToast = useCallback((msg, type = 'success', color = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ── SSE — live event toasts ──────────────────────────────────────────────

  const handleLiveEvent = useCallback((notification) => {
    const color = EVENT_COLORS[notification.eventType] || '#38bdf8';
    addToast(notification.message, 'live', color);
    if (['ROLE_CHANGED', 'USER_DELETED', 'USER_REGISTERED', 'PROFILE_UPDATED'].includes(notification.eventType)) {
      fetchUsers(true);
    }
  }, [addToast]);

  useSSE(handleLiveEvent, !!user);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
      setSelected(prev => prev ? data.find(u => u.id === prev.id) || null : null);
    } catch (err) {
      setError(err.response?.status === 403 ? 'forbidden' : 'Failed to load users.');
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Role change logic ───────────────────────────────────────────────────

  const initiateRoleChange = (targetUser, newRole) => {
    const errors = validateRoleChange(targetUser.role, newRole, targetUser.id === user?.id);
    setEditErrors(prev => ({ ...prev, [targetUser.id]: errors }));
    if (!isValid(errors)) return;
    setRoleConfirm({ user: targetUser, newRole });
  };

  const confirmRoleChange = async () => {
    const { user: targetUser, newRole } = roleConfirm;
    setRoleConfirm(null);
    setUpdating(p => ({ ...p, [targetUser.id]: true }));
    try {
      const { data } = await api.put(`/api/users/${targetUser.id}/role`, { role: newRole });
      setUsers(p => p.map(u => u.id === targetUser.id ? { ...u, role: data.role } : u));
      if (selected?.id === targetUser.id) setSelected(s => ({ ...s, role: data.role }));
      addToast(`${targetUser.name}'s role updated to ${newRole}`);
    } catch (err) {
      addToast(err.response?.status === 403 ? 'Permission denied' : 'Failed to update role', 'error');
    } finally { setUpdating(p => ({ ...p, [targetUser.id]: false })); }
  };

  const handleDelete = async (uid) => {
    setUpdating(p => ({ ...p, [uid]: 'del' }));
    try {
      await api.delete(`/api/users/${uid}`);
      setUsers(p => p.filter(u => u.id !== uid));
      setDeleting(null); setSelected(null);
      addToast('User deleted successfully');
    } catch (err) {
      addToast(err.response?.status === 403 ? 'Permission denied' : 'Failed to delete', 'error');
    } finally { setUpdating(p => ({ ...p, [uid]: false })); }
  };

  const validateUserFields = (u) => ({
    name: validateName(u.name),
    email: validateEmail(u.email),
    phone: validatePhone(u.phone),
    department: validateDepartment(u.department),
  });

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total', value: users.length, color: 'text-ui-sky' },
    { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: 'text-ui-danger' },
    { label: 'Technicians', value: users.filter(u => u.role === 'TECHNICIAN').length, color: 'text-ui-warn' },
    { label: 'Users', value: users.filter(u => u.role === 'USER').length, color: 'text-ui-green' },
  ];

  return (
    <Layout adminOnly>
      {/* 1. Toast stack (Always on top) */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {/* ... toast mapping logic ... */}
      </div>

      {/* 2. Detail Modal (The "View" window) */}
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditErrors({}); }}>
          <DetailPanel
            u={selected}
            updating={updating}
            currentUserId={user?.id}
            editErrors={editErrors[selected.id] || {}}
            onRoleChange={initiateRoleChange}
            onDelete={uid => setDeleting(users.find(x => x.id === uid))}
            onClose={() => { setSelected(null); setEditErrors({}); }}
            validateUserFields={validateUserFields}
          />
        </Modal>
      )}

      {/* 3. Confirmation Modals (Rendered LAST so they appear on top of Detail Modal) */}
      {roleConfirm && (
        <div className="z-[1100] relative"> 
          <Modal onClose={() => setRoleConfirm(null)}>
            <div className="text-center py-2 text-ui-bright font-sans">
              <div className="text-4xl mb-3">◈</div>
              <h3 className="text-xl font-extrabold tracking-tight mb-3">Confirm Role Change</h3>
              <p className="text-sm text-ui-muted leading-relaxed mb-2">
                Change <strong className="text-ui-bright">{roleConfirm.user.name}</strong>'s role from{' '}
                <span style={{ color: RS[roleConfirm.user.role]?.text }}>{roleConfirm.user.role}</span> to{' '}
                <span style={{ color: RS[roleConfirm.newRole]?.text }}>{roleConfirm.newRole}</span>?
              </p>
              <div className="flex gap-3 justify-center mt-5">
                <button className="bg-transparent border border-ui-sky/20 rounded-xl text-ui-muted px-5 py-2.5 text-sm font-semibold hover:bg-ui-sky/5 transition-colors" onClick={() => setRoleConfirm(null)}>Cancel</button>
                <button 
                  className="border-none rounded-xl text-ui-base px-6 py-2.5 text-sm font-bold cursor-pointer"
                  style={{ background: RS[roleConfirm.newRole]?.text || '#38bdf8' }}
                  onClick={confirmRoleChange}
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <div className="text-center py-2 text-ui-bright">
            <div className="text-4xl text-ui-danger mb-3">⚠</div>
            <h3 className="text-xl font-extrabold tracking-tight mb-3">Delete User</h3>
            <p className="text-sm text-ui-muted leading-relaxed mb-5">
              Permanently delete <strong className="text-ui-bright">{deleting.name}</strong>? 
              This cannot be undone and all their data will be removed.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="bg-transparent border border-ui-sky/20 rounded-xl text-ui-muted px-5 py-2.5 text-sm font-semibold hover:bg-ui-sky/5 transition-colors" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="bg-ui-danger border-none rounded-xl text-white px-5 py-2.5 text-sm font-bold disabled:opacity-70 transition-opacity"
                onClick={() => handleDelete(deleting.id)}
                disabled={updating[deleting.id] === 'del'}>
                {updating[deleting.id] === 'del' ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditErrors({}); }}>
          <DetailPanel
            u={selected}
            updating={updating}
            currentUserId={user?.id}
            editErrors={editErrors[selected.id] || {}}
            onRoleChange={initiateRoleChange}
            onDelete={uid => setDeleting(users.find(x => x.id === uid))}
            onClose={() => { setSelected(null); setEditErrors({}); }}
            validateUserFields={validateUserFields}
          />
        </Modal>
      )}

      <div className="px-9 py-8 max-w-[1000px] mx-auto">
        <div className="mb-6">
          <span className="block text-[10px] font-bold tracking-widest text-ui-dim font-mono uppercase mb-2">USER MANAGEMENT</span>
          <h1 className="text-[32px] font-extrabold tracking-tight text-ui-bright">Campus Members</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map(st => (
            <div key={st.label} className="card flex flex-col gap-1 shadow-soft">
              <span className={`text-[28px] font-extrabold leading-none ${st.color}`}>{st.value}</span>
              <span className="text-[10px] text-ui-dim font-mono tracking-wider uppercase">{st.label}</span>
            </div>
          ))}
        </div>

        {error && <div className="bg-ui-danger/10 border border-ui-danger/20 rounded-xl px-5 py-3 text-ui-danger text-sm mb-5">⚠ {error}</div>}

        <div className="flex gap-2.5 mb-3.5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ui-dim text-lg">⌕</span>
            <input 
              className="w-full bg-ui-base border border-ui-sky/15 rounded-xl py-2.5 pl-10 pr-4 text-ui-bright text-sm outline-none focus:border-ui-sky/40 transition-all"
              placeholder="Search name, email, department…"
              value={search} onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button className="bg-ui-base border border-ui-sky/20 rounded-xl px-4 py-2.5 text-ui-muted hover:text-ui-sky transition-colors" onClick={() => fetchUsers()} title="Refresh">↺</button>
        </div>

        {loading ? <Spinner /> : (
          <div className="animate-fade-in">
            <div className="bg-ui-base/60 border border-ui-sky/12 rounded-2xl overflow-hidden backdrop-blur-md shadow-soft">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-ui-sky/5">
                    {['ID','User','Email','Department','Role','Actions'].map(h => (
                      <th key={h} className="text-left px-[18px] py-3 text-[10px] font-bold tracking-widest text-ui-dim font-mono uppercase border-b border-ui-sky/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-sky/5">
                  {filtered.length === 0
                    ? <tr><td colSpan={6} className="text-center py-10 text-ui-dim italic text-sm">No users found</td></tr>
                    : filtered.map((u, i) => (
                      <tr key={u.id} className="hover:bg-brand-primary/5 transition-colors duration-150 animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                        <td className="px-[18px] py-3 text-xs font-mono text-ui-dim">#{u.id}</td>
                        <td className="px-[18px] py-3 text-sm">
                          <div className="flex items-center gap-2.5">
                            <Avatar u={u} size={30} />
                            <span className="font-semibold text-ui-bright">{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-[18px] py-3 text-[13px] text-ui-muted">{u.email}</td>
                        <td className="px-[18px] py-3 text-[13px] text-ui-muted">{u.department || '—'}</td>
                        <td className="px-[18px] py-3">
                          <span className={`text-[10px] font-bold tracking-widest px-2.5 py-[3px] rounded-md border font-mono uppercase ${RS[u.role]?.badge}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-[18px] py-3">
                          <div className="flex gap-1.5 items-center">
                            <button className="bg-ui-sky/8 border border-ui-sky/20 rounded-lg text-ui-sky px-3 py-1 text-xs font-bold hover:bg-ui-sky/15 transition-colors" onClick={() => { setSelected(u); setEditErrors({}); }}>
                              View
                            </button>
                            {user?.id !== u.id && (
                              <button className="bg-transparent border border-ui-sky/15 rounded-lg px-2 text-ui-dim hover:text-ui-danger hover:border-ui-danger/40 transition-all" onClick={() => setDeleting(u)}>✕</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <div className="px-[18px] py-3 text-[11px] text-ui-dim font-mono border-t border-ui-sky/8 bg-ui-sky/2 rounded-b-2xl">
              Showing {filtered.length} of {users.length} users
              <span className="ml-3 text-ui-sky/60">· Live updates active ⚡</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function DetailPanel({ u, updating, onRoleChange, onDelete, onClose, currentUserId, editErrors, validateUserFields }) {
  const rs = RS[u.role] || RS.USER;
  const fieldErrors = validateUserFields(u);

  return (
    <div className="font-sans text-ui-bright animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold tracking-widest text-ui-dim font-mono uppercase">USER DETAILS</span>
        <button className="bg-transparent border-none text-ui-dim text-lg hover:text-ui-bright transition-colors" onClick={onClose}>✕</button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Avatar u={u} size={52} />
        <div>
          <div className="text-xl font-extrabold tracking-tight mb-1.5">{u.name}</div>
          <span className={`text-[10px] font-bold tracking-widest px-2.5 py-[3px] rounded-md border font-mono uppercase ${rs.badge}`}>
            {u.role}
          </span>
        </div>
      </div>

      {Object.values(fieldErrors).some(Boolean) && (
        <div className="bg-brand-warning/10 border border-brand-warning/20 rounded-xl p-4 mb-4">
          <div className="text-xs font-bold text-ui-warn mb-1.5">⚠ Data validation issues</div>
          {Object.entries(fieldErrors).map(([key, err]) => err && (
            <div key={key} className="text-[12px] text-ui-warn/80 leading-relaxed capitalize">{key}: {err}</div>
          ))}
        </div>
      )}

      <div className="divide-y divide-ui-sky/10">
        {[
          ['Email', u.email], ['Phone', u.phone || '—'], ['Department', u.department || '—'],
          ['User ID', `#${u.id}`], ['Joined', fmtDate(u.createdAt)], ['Updated', fmtDate(u.updatedAt)]
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between items-center py-2.5">
            <span className="text-[11px] text-ui-dim tracking-wider font-mono uppercase">{l}</span>
            <span className="text-[13px] font-semibold">{v}</span>
          </div>
        ))}
      </div>

      {u.bio && (
        <div className="my-4 p-3.5 bg-ui-sky/5 rounded-xl border border-ui-sky/10 text-xs text-ui-muted leading-relaxed">
          {u.bio}
        </div>
      )}

      {currentUserId !== u.id && (
        <div className="mt-5">
          <div className="text-[10px] font-bold tracking-widest text-ui-dim font-mono mb-2.5">CHANGE ROLE</div>
          {editErrors.role && (
            <div className="bg-ui-danger/10 border border-ui-danger/20 rounded-lg p-2 text-ui-danger text-[12px] mb-2.5">⚠ {editErrors.role}</div>
          )}
          <div className="flex gap-2 flex-wrap">
            {ROLES.map(r => {
              const isActive = u.role === r;
              return (
                <button 
                  key={r}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono border transition-all
                    ${isActive ? `${RS[r]?.badge} border-opacity-100 scale-105` : 'bg-brand-muted/20 border-brand-muted/40 text-ui-muted hover:border-ui-sky/30'}`}
                  style={{ opacity: updating[u.id] ? 0.6 : 1, cursor: updating[u.id] ? 'wait' : 'pointer' }}
                  onClick={() => onRoleChange(u, r)}
                  disabled={!!updating[u.id]}
                >
                  {r} {isActive && '✓'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentUserId !== u.id && (
        <div className="mt-6 pt-5 border-t border-ui-danger/10">
          <button className="w-full border border-ui-danger/20 rounded-xl text-ui-danger px-5 py-2.5 text-sm font-semibold hover:bg-ui-danger/10 transition-colors" onClick={() => onDelete(u.id)}>
            ✕ Delete This User
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared components ────────────────────────────────────────────────────────

function Avatar({ u, size }) {
  return (
    <div className="rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-brand-slate to-brand-muted shadow-sm" style={{ width: size, height: size }}>
      {u.imageUrl
        ? <img src={u.imageUrl} alt="" className="w-full h-full object-cover" />
        : <span className="font-extrabold text-ui-surface" style={{ fontSize: size * 0.38 }}>{u.name?.[0]?.toUpperCase() || '?'}</span>}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-ui-bright/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-6 animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-ui-base border border-ui-sky/20 rounded-2xl p-8 w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-medium animate-slide-in">
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 rounded-full border-2 border-ui-sky/15 border-t-ui-sky animate-spin" />
    </div>
  );
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';