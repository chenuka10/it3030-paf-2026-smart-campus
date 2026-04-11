import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Layout from "../../components/Layout";

const STATUS_STYLES = {
  ACTIVE:         { bg: 'rgba(111,143,114,0.12)', text: 'var(--color-ui-green)',  border: 'rgba(111,143,114,0.25)' },
  OUT_OF_SERVICE: { bg: 'rgba(224,122,95,0.12)',  text: 'var(--color-ui-danger)', border: 'rgba(224,122,95,0.25)'  },
};

export default function ResourceListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [search,    setSearch]    = useState("");

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchResources = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get("/api/resources");
      setResources(data);
    } catch (err) {
      setError('Failed to load resources. Check backend connection.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchResources();
  }, [user, navigate]);

  const handleDelete = async (id) => {
    setDeleting(null);
    try {
      await api.delete(`/api/resources/${id}`);
      setResources(prev => prev.filter(r => r.id !== id));
      showToast('Resource deleted successfully');
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const filtered = resources.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:        resources.length,
    active:       resources.filter(r => r.status === 'ACTIVE').length,
    outOfService: resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
  };

  if (loading) {
    return (
      <Layout adminOnly>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div
            className="w-10 h-10 rounded-full border-[3px] border-ui-sky/15"
            style={{ borderTopColor: 'var(--color-ui-sky)', animation: 'spin 0.8s linear infinite' }}
          />
          <p className="text-ui-muted text-[14px]">Loading resources...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout adminOnly>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-[10px] text-sm font-semibold backdrop-blur-md
            ${toast.type === 'error'
              ? 'bg-ui-danger/10 border border-ui-danger/30 text-ui-danger'
              : 'bg-ui-green/10 border border-ui-green/30 text-ui-green'}`}
          style={{ animation: 'fadeUp 0.3s ease' }}
        >
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <div
          className="fixed inset-0 bg-ui-surface/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-6"
          onClick={e => e.target === e.currentTarget && setDeleting(null)}
        >
          <div
            className="bg-ui-base border border-ui-sky/20 rounded-[20px] p-8 w-full max-w-[480px] text-center"
            style={{ animation: 'scaleIn 0.25s ease' }}
          >
            <div className="text-[48px] mb-4">⚠️</div>
            <h3 className="text-[22px] font-extrabold tracking-[-0.03em] m-0 mb-3">Delete Resource</h3>
            <p className="text-[14px] text-ui-muted leading-[1.7] mb-6">
              Are you sure you want to delete <strong className="text-ui-bright">{deleting.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="bg-transparent border border-ui-sky/20 rounded-[10px] text-ui-muted px-5 py-[9px] text-[14px] font-semibold cursor-pointer"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                className="bg-ui-danger border-none rounded-[10px] text-ui-base px-6 py-[9px] text-[14px] font-bold cursor-pointer"
                onClick={() => handleDelete(deleting.id)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-9 py-8 max-w-[1400px] mx-auto w-full">

        {/* Header */}
        <div className="flex justify-between items-end mb-7 flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-ui-warn font-mono uppercase mb-2">
              RESOURCE MANAGEMENT
            </div>
            <h1 className="text-[34px] font-extrabold m-0 mb-2 tracking-[-0.04em]">
              Campus Resources
            </h1>
            <p className="text-ui-muted text-[15px] m-0">
              Manage labs, equipment, rooms, and other campus assets
            </p>
          </div>
          <button
            className="bg-ui-sky/10 border border-ui-sky/25 rounded-[10px] text-ui-sky px-6 py-3 text-[14px] font-bold cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-ui-sky/20 hover:border-ui-sky/40"
            onClick={() => navigate("/admin/resources/add")}
          >
            + Add Resource
          </button>
        </div>

        {/* Stats / Error */}
        {error ? (
          <div className="bg-ui-danger/8 border border-ui-danger/20 rounded-[10px] px-5 py-3 text-ui-danger text-[14px] mb-5">
            ⚠ {error}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-7">
            {[
              { label: 'TOTAL RESOURCES', value: stats.total,        color: 'var(--color-ui-sky)'    },
              { label: 'ACTIVE',          value: stats.active,       color: 'var(--color-ui-green)'  },
              { label: 'OUT OF SERVICE',  value: stats.outOfService, color: 'var(--color-ui-danger)' },
            ].map(st => (
              <div key={st.label} className="card flex flex-col gap-1.5">
                <span className="text-[32px] font-extrabold leading-none" style={{ color: st.color }}>
                  {st.value}
                </span>
                <span className="text-[11px] text-ui-dim font-mono tracking-[0.08em] uppercase">
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mb-5 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ui-dim text-base">🔍</span>
            <input
              type="text"
              placeholder="Search by name, type, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-ui-base border border-ui-sky/15 rounded-[10px] py-[11px] pl-10 pr-4 text-ui-bright text-[14px] outline-none box-border"
            />
          </div>
          <button
            className="bg-ui-base border border-ui-sky/20 rounded-[10px] px-5 py-[11px] text-ui-muted text-[14px] font-semibold cursor-pointer whitespace-nowrap hover:border-ui-sky/40 transition-all duration-200"
            onClick={fetchResources}
          >
            ↺ Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-ui-base/60 border border-ui-sky/12 rounded-2xl overflow-auto backdrop-blur-md">
          <table className="w-full border-collapse" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                {['NAME','TYPE','DESCRIPTION','LOCATION','CAPACITY','STATUS','AVAILABLE HOURS','MAX HOURS','ACTIONS'].map(h => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[10px] font-bold tracking-[0.12em] text-ui-dim font-mono uppercase border-b border-ui-sky/10 bg-ui-sky/3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-[60px] text-ui-dim italic text-[14px]">
                    {search ? "No matching resources found" : "No resources found. Click 'Add Resource' to create one."}
                  </td>
                </tr>
              ) : filtered.map((resource, index) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  index={index}
                  onEdit={() => navigate(`/admin/resources/edit/${resource.id}`)}
                  onDelete={() => setDeleting(resource)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3.5 text-[12px] text-ui-dim font-mono border-t border-ui-sky/8 bg-ui-sky/2 rounded-b-2xl">
          Showing {filtered.length} of {resources.length} resources
        </div>

      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes rowIn   { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95); }     to { opacity:1; transform:scale(1); } }
      `}</style>
    </Layout>
  );
}

/* ── Resource Row ──────────────────────────────────────── */
function ResourceRow({ resource, index, onEdit, onDelete }) {
  const [editHov,  setEditHov]  = useState(false);
  const [trashHov, setTrashHov] = useState(false);
  const ss = STATUS_STYLES[resource.status] || STATUS_STYLES.ACTIVE;

  return (
    <tr
      className="border-b border-ui-sky/6 transition-colors duration-150 hover:bg-ui-sky/3"
      style={{ animation: `rowIn 0.4s ease both`, animationDelay: `${index * 0.03}s` }}
    >
      <td className="px-5 py-3.5 text-[14px] font-semibold text-ui-bright align-middle">
        {resource.name}
      </td>
      <td className="px-5 py-3.5 align-middle">
        <span className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[3px] rounded-[6px] bg-ui-sky/8 text-ui-sky border border-ui-sky/20 font-mono uppercase inline-block">
          {resource.type}
        </span>
      </td>
      <td className="px-5 py-3.5 text-[13px] text-ui-muted align-middle max-w-[250px]">
        {resource.description?.slice(0, 80)}{resource.description?.length > 80 ? '...' : ''}
      </td>
      <td className="px-5 py-3.5 text-[14px] text-ui-muted align-middle">{resource.location || '—'}</td>
      <td className="px-5 py-3.5 text-[14px] text-ui-muted align-middle">{resource.capacity || '—'}</td>
      <td className="px-5 py-3.5 align-middle">
        <span
          className="text-[10px] font-bold tracking-[0.1em] px-[9px] py-[3px] rounded-[6px] border font-mono uppercase inline-block"
          style={{ background: ss.bg, color: ss.text, borderColor: ss.border }}
        >
          {resource.status || 'ACTIVE'}
        </span>
      </td>
      <td className="px-5 py-3.5 text-[13px] text-ui-muted align-middle">
        {resource.availableFrom || '—'} - {resource.availableTo || '—'}
      </td>
      <td className="px-5 py-3.5 text-[14px] text-ui-muted align-middle">
        {resource.maxBookingHours || '—'}h
      </td>
      <td className="px-5 py-3.5 align-middle">
        <div className="flex gap-2 items-center">
          <button
            className={`border border-ui-sky/20 rounded-[7px] text-ui-sky px-3.5 py-[5px] text-[12px] font-bold cursor-pointer transition-all duration-200
              ${editHov ? 'bg-ui-sky/15' : 'bg-ui-sky/8'}`}
            onMouseEnter={() => setEditHov(true)}
            onMouseLeave={() => setEditHov(false)}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className={`bg-transparent rounded-[7px] px-2.5 py-[5px] text-[12px] cursor-pointer transition-all duration-200
              ${trashHov ? 'border border-ui-danger/40 text-ui-danger' : 'border border-ui-sky/15 text-ui-dim'}`}
            onMouseEnter={() => setTrashHov(true)}
            onMouseLeave={() => setTrashHov(false)}
            onClick={onDelete}
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}