import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];
const RS = {
  ADMIN:      { bg: 'rgba(224,122,95,0.12)',  text: 'var(--color-ui-danger)', border: 'rgba(224,122,95,0.25)'  },
  TECHNICIAN: { bg: 'rgba(242,166,90,0.12)',  text: 'var(--color-ui-warn)',   border: 'rgba(242,166,90,0.25)'  },
  USER:       { bg: 'rgba(111,143,114,0.12)', text: 'var(--color-ui-sky)',    border: 'rgba(111,143,114,0.25)' },
};

const stats = (users) => [
  { label: 'Total',       value: users.length,                                  color: 'var(--color-ui-sky)'    },
  { label: 'Admins',      value: users.filter(u => u.role === 'ADMIN').length,      color: 'var(--color-ui-danger)' },
  { label: 'Technicians', value: users.filter(u => u.role === 'TECHNICIAN').length, color: 'var(--color-ui-warn)'   },
  { label: 'Users',       value: users.filter(u => u.role === 'USER').length,       color: 'var(--color-ui-green)'  },
];

export default function AdminUsers() {
  const { user } = useAuth();

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [updating, setUpdating] = useState({});
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch (err) {
      setError(err.response?.status === 403 ? 'forbidden' : 'Failed to load users.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (uid, newRole) => {
    setUpdating(p => ({ ...p, [uid]: true }));
    try {
      const { data } = await api.put(`/api/users/${uid}/role`, { role: newRole });
      setUsers(p => p.map(u => u.id === uid ? { ...u, role: data.role } : u));
      if (selected?.id === uid) setSelected(s => ({ ...s, role: data.role }));
      showToast(`Role updated to ${newRole}`);
    } catch (err) {
      showToast(err.response?.status === 403 ? 'Permission denied' : 'Failed to update role', 'error');
    } finally { setUpdating(p => ({ ...p, [uid]: false })); }
  };

  const handleDelete = async (uid) => {
    setUpdating(p => ({ ...p, [uid]: 'del' }));
    try {
      await api.delete(`/api/users/${uid}`);
      setUsers(p => p.filter(u => u.id !== uid));
      setDeleting(null); setSelected(null);
      showToast('User deleted');
    } catch (err) {
      showToast(err.response?.status === 403 ? 'Permission denied' : 'Failed to delete', 'error');
    } finally { setUpdating(p => ({ ...p, [uid]: false })); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout adminOnly>
      {toast && <Toast toast={toast} />}

      {/* Detail Modal */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <DetailPanel
            u={selected} updating={updating} currentUserId={user?.id}
            onRoleChange={handleRoleChange}
            onDelete={uid => setDeleting(users.find(x => x.id === uid))}
            onClose={() => setSelected(null)}
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <div className="text-center py-2">
            <div className="text-[44px] text-ui-warn mb-3">⚠</div>
            <h3 className="text-xl font-extrabold tracking-[-0.03em] mb-2.5">Delete User</h3>
            <p className="text-sm text-ui-muted leading-relaxed mb-5">
              Delete <strong className="text-ui-bright">{deleting.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="bg-transparent border border-ui-sky/20 rounded-xl text-ui-muted px-5 py-2.5 text-sm font-semibold cursor-pointer"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                className="bg-ui-danger border-none rounded-xl text-ui-base px-5 py-2.5 text-sm font-bold cursor-pointer transition-opacity disabled:opacity-70"
                onClick={() => handleDelete(deleting.id)}
                disabled={updating[deleting.id] === 'del'}
              >
                {updating[deleting.id] === 'del' ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="px-9 py-8 max-w-[1000px] mx-auto">

        {/* Page Header */}
        <div className="mb-6">
          <span className="block text-[10px] font-bold tracking-[0.15em] text-ui-dim font-mono uppercase mb-2">
            USER MANAGEMENT
          </span>
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] m-0">Campus Members</h1>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {stats(users).map(st => (
            <div key={st.label} className="card flex flex-col gap-1">
              <span className="text-[28px] font-extrabold leading-none" style={{ color: st.color }}>
                {st.value}
              </span>
              <span className="text-[10px] text-ui-dim font-mono tracking-[0.08em] uppercase">
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-ui-danger/8 border border-ui-danger/20 rounded-xl px-5 py-3 text-ui-danger text-sm mb-5">
            ⚠ {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2.5 mb-3.5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ui-dim text-lg">⌕</span>
            <input
              className="w-full bg-ui-base border border-ui-sky/15 rounded-xl py-2.5 pl-10 pr-4 text-ui-bright text-sm outline-none box-border"
              placeholder="Search name, email, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="bg-ui-base border border-ui-sky/20 rounded-xl px-4 py-2.5 text-ui-muted text-base cursor-pointer"
            onClick={fetchUsers}
          >
            ↺
          </button>
        </div>

        {/* Table / Spinner */}
        {loading ? <Spinner /> : (
          <>
            <div className="bg-ui-base/60 border border-ui-sky/12 rounded-2xl overflow-hidden backdrop-blur-md">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['ID', 'User', 'Email', 'Department', 'Role', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="text-left px-[18px] py-3 text-[10px] font-bold tracking-[0.12em] text-ui-dim font-mono uppercase border-b border-ui-sky/10 bg-ui-sky/3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-ui-dim italic text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : filtered.map((u, i) => (
                    <TableRow
                      key={u.id} u={u} i={i}
                      currentUserId={user?.id}
                      updating={updating}
                      onView={() => setSelected(u)}
                      onDelete={() => setDeleting(u)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-[18px] py-3 text-[11px] text-ui-dim font-mono border-t border-ui-sky/8 bg-ui-sky/2">
              Showing {filtered.length} of {users.length} users
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes rowIn   { from { opacity:0; transform:translateY(4px); }  to { opacity:1; transform:none; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96); }      to { opacity:1; transform:scale(1); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); }  to { opacity:1; transform:none; } }
      `}</style>
    </Layout>
  );
}

/* ── Table Row ─────────────────────────────────────────── */
function TableRow({ u, i, currentUserId, updating, onView, onDelete }) {
  const [hovered,   setHovered]   = useState(false);
  const [viewHov,   setViewHov]   = useState(false);
  const [trashHov,  setTrashHov]  = useState(false);
  const rs = RS[u.role] || RS.USER;

  return (
    <tr
      className="border-b border-ui-sky/6 transition-colors duration-150"
      style={{
        background: hovered ? 'rgba(111,143,114,0.04)' : 'transparent',
        animation: `rowIn 0.35s ease both`,
        animationDelay: `${i * 0.04}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td className="px-[18px] py-3 text-xs font-mono text-ui-dim">#{u.id}</td>
      <td className="px-[18px] py-3 text-sm align-middle">
        <div className="flex items-center gap-2.5">
          <Avatar u={u} size={30} />
          <span className="font-semibold text-ui-bright">{u.name || '—'}</span>
        </div>
      </td>
      <td className="px-[18px] py-3 text-[13px] text-ui-muted align-middle">{u.email}</td>
      <td className="px-[18px] py-3 text-[13px] text-ui-muted align-middle">{u.department || '—'}</td>
      <td className="px-[18px] py-3 align-middle">
        <span
          className="text-[10px] font-bold tracking-[0.1em] px-2.5 py-[3px] rounded-md border font-mono uppercase"
          style={{ background: rs.bg, color: rs.text, borderColor: rs.border }}
        >
          {u.role}
        </span>
      </td>
      <td className="px-[18px] py-3 align-middle">
        <div className="flex gap-1.5">
          <button
            className={`border border-ui-sky/20 rounded-lg text-ui-sky px-3 py-1 text-xs font-bold cursor-pointer transition-colors duration-150
              ${viewHov ? 'bg-ui-sky/15' : 'bg-ui-sky/8'}`}
            onMouseEnter={() => setViewHov(true)}
            onMouseLeave={() => setViewHov(false)}
            onClick={onView}
          >
            View
          </button>
          {currentUserId !== u.id && (
            <button
              className={`bg-transparent rounded-lg px-2.5 py-1 text-xs cursor-pointer transition-all duration-200
                ${trashHov ? 'border border-ui-danger/40 text-ui-danger' : 'border border-ui-sky/15 text-ui-dim'}`}
              onMouseEnter={() => setTrashHov(true)}
              onMouseLeave={() => setTrashHov(false)}
              onClick={onDelete}
            >
              ✕
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Detail Panel ──────────────────────────────────────── */
function DetailPanel({ u, updating, onRoleChange, onDelete, onClose, currentUserId }) {
  const [deleteHov, setDeleteHov] = useState(false);
  const rs = RS[u.role] || RS.USER;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold tracking-[0.15em] text-ui-dim font-mono uppercase">
          USER DETAILS
        </span>
        <button className="bg-transparent border-none text-ui-dim text-base cursor-pointer px-1.5 py-0.5" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Avatar u={u} size={56} />
        <div>
          <div className="text-xl font-extrabold tracking-[-0.03em] mb-1.5">{u.name}</div>
          <span
            className="text-[10px] font-bold tracking-[0.1em] px-2.5 py-[3px] rounded-md border font-mono uppercase"
            style={{ background: rs.bg, color: rs.text, borderColor: rs.border }}
          >
            {u.role}
          </span>
        </div>
      </div>

      {[['Email', u.email], ['Phone', u.phone || '—'], ['Department', u.department || '—'], ['User ID', `#${u.id}`], ['Joined', fmtDate(u.createdAt)]].map(([l, v]) => (
        <div key={l} className="flex justify-between items-center py-2.5 border-b border-ui-sky/7">
          <span className="text-[11px] text-ui-dim tracking-[0.08em] font-mono uppercase">{l}</span>
          <span className="text-[13px] font-semibold text-ui-bright">{v}</span>
        </div>
      ))}

      {u.bio && (
        <div className="my-4 px-3.5 py-3 bg-ui-sky/4 rounded-xl border border-ui-sky/10 text-[13px] text-ui-muted leading-[1.7]">
          {u.bio}
        </div>
      )}

      <div className="mt-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim font-mono uppercase mb-2.5">
          CHANGE ROLE
        </div>
        <div className="flex gap-2">
          {ROLES.map(r => (
            <button
              key={r}
              className="border rounded-lg text-[11px] font-bold cursor-pointer font-mono tracking-[0.08em] px-3 py-1.5 transition-all duration-200"
              style={
                u.role === r
                  ? { background: RS[r].bg, color: RS[r].text, borderColor: RS[r].border, fontWeight: 800 }
                  : { background: 'rgba(111,143,114,0.06)', border: '1px solid rgba(111,143,114,0.15)', color: 'var(--color-ui-muted)' }
              }
              onClick={() => u.role !== r && !updating[u.id] && onRoleChange(u.id, r)}
              disabled={!!updating[u.id]}
            >
              {r}{u.role === r ? ' ✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {currentUserId !== u.id && (
        <div className="mt-6 pt-5 border-t border-ui-danger/10">
          <button
            className={`w-full border border-ui-danger/20 rounded-xl text-ui-danger px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors duration-200
              ${deleteHov ? 'bg-ui-danger/10' : 'bg-transparent'}`}
            onMouseEnter={() => setDeleteHov(true)}
            onMouseLeave={() => setDeleteHov(false)}
            onClick={() => onDelete(u.id)}
          >
            ✕ Delete This User
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────── */
function Avatar({ u, size }) {
  return (
    <div
      className="rounded-full shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, background: 'var(--gradient-primary)' }}
    >
      {u.imageUrl
        ? <img src={u.imageUrl} alt="" className="w-full h-full object-cover" />
        : <span style={{ fontSize: size * 0.38, fontWeight: 800, color: 'var(--color-ui-surface)' }}>
            {u.name?.[0]?.toUpperCase() || '?'}
          </span>
      }
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-ui-surface/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-6"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-ui-base border border-ui-sky/20 rounded-2xl p-8 w-full max-w-[460px] max-h-[90vh] overflow-y-auto text-ui-bright"
        style={{ animation: 'scaleIn 0.25s ease' }}
      >
        {children}
      </div>
    </div>
  );
}

function Toast({ toast }) {
  const isError = toast.type === 'error';
  return (
    <div
      className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl text-sm font-semibold backdrop-blur-md
        ${isError
          ? 'bg-ui-danger/10 border border-ui-danger/30 text-ui-danger'
          : 'bg-ui-green/10 border border-ui-green/30 text-ui-green'}`}
      style={{ animation: 'fadeUp 0.3s ease' }}
    >
      {isError ? '✕' : '✓'} {toast.msg}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div
        className="w-7 h-7 rounded-full border-2 border-ui-sky/15"
        style={{ borderTopColor: 'var(--color-ui-sky)', animation: 'spin 0.8s linear infinite' }}
      />
    </div>
  );
}

const fmtDate = d => d
  ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';