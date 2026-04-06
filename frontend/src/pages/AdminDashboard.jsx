import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];
const ROLE_STYLES = {
  ADMIN:      { bg:'rgba(251,113,133,0.12)', text:'#fb7185', border:'rgba(251,113,133,0.25)' },
  TECHNICIAN: { bg:'rgba(251,191,36,0.12)',  text:'#fbbf24', border:'rgba(251,191,36,0.25)' },
  USER:       { bg:'rgba(56,189,248,0.12)',   text:'#38bdf8', border:'rgba(56,189,248,0.25)' },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [updating, setUpdating] = useState({});
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null); // user detail modal
  const [deleting, setDeleting] = useState(null); // confirm delete modal

  const showToast = (msg, type='success') => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch(err) {
      setError(err.response?.status===403 ? 'forbidden' : 'Failed to load users. Check backend connection.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchUsers();
  }, [user]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(p=>({...p,[userId]:true}));
    try {
      const { data } = await api.put(`/api/users/${userId}/role`,{role:newRole});
      setUsers(p=>p.map(u=>u.id===userId?{...u,role:data.role}:u));
      if (selected?.id===userId) setSelected(s=>({...s,role:data.role}));
      showToast(`Role updated to ${newRole}`);
    } catch(err) {
      showToast(err.response?.status===403?'Permission denied — Admin only':'Failed to update role','error');
    } finally { setUpdating(p=>({...p,[userId]:false})); }
  };

  const handleDelete = async (userId) => {
    setUpdating(p=>({...p,[userId]:'deleting'}));
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers(p=>p.filter(u=>u.id!==userId));
      setDeleting(null);
      setSelected(null);
      showToast('User deleted successfully');
    } catch(err) {
      showToast(err.response?.status===403?'Permission denied':'Failed to delete user','error');
    } finally { setUpdating(p=>({...p,[userId]:false})); }
  };

  const filtered = users.filter(u=>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u=>u.role==='ADMIN').length,
    techs:  users.filter(u=>u.role==='TECHNICIAN').length,
    users:  users.filter(u=>u.role==='USER').length,
  };

  if (loading) return <Spinner />;
  if (error==='forbidden') return <Forbidden navigate={navigate}/>;

  return (
    <div style={s.page}>
      {toast && <Toast toast={toast}/>}

      {/* Detail modal */}
      {selected && (
        <Modal onClose={()=>setSelected(null)}>
          <UserDetailPanel
            u={selected}
            updating={updating}
            onRoleChange={handleRoleChange}
            onDelete={uid=>setDeleting(users.find(x=>x.id===uid))}
            onClose={()=>setSelected(null)}
            currentUserId={user?.id}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleting && (
        <Modal onClose={()=>setDeleting(null)}>
          <div style={s.confirmBox}>
            <div style={s.confirmIcon}>⚠</div>
            <h3 style={s.confirmTitle}>Delete User</h3>
            <p style={s.confirmSub}>Are you sure you want to delete <strong style={{color:'#f0f6ff'}}>{deleting.name}</strong>? This action cannot be undone.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={()=>setDeleting(null)}>Cancel</button>
              <button style={{...s.deleteBtn,opacity:updating[deleting.id]==='deleting'?0.7:1}}
                onClick={()=>handleDelete(deleting.id)}
                disabled={updating[deleting.id]==='deleting'}>
                {updating[deleting.id]==='deleting' ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <div style={s.navDot}/>
          <span style={s.navName}>SmartCampus</span>
          <span style={s.navSep}>/</span>
          <span style={s.navPage}>Admin</span>
        </div>
        <div style={s.navRight}>
          <button style={s.navBtn} onClick={()=>navigate('/profile')}
            onMouseEnter={e=>e.currentTarget.style.color='#38bdf8'}
            onMouseLeave={e=>e.currentTarget.style.color='#7a9ab5'}>Profile</button>
          <button style={{...s.navBtn,...s.logoutBtn}}
            onClick={()=>{logout();navigate('/login');}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(251,113,133,0.15)';e.currentTarget.style.borderColor='rgba(251,113,133,0.4)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(56,189,248,0.2)';}}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={s.main}>
        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <div style={s.sectionLabel}>ADMIN PANEL</div>
            <h1 style={s.pageTitle}>User Management</h1>
            <p style={s.pageSub}>Manage roles, view profiles, and moderate campus access</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={s.statsRow}>
          {[
            {label:'Total Users', value:stats.total, color:'#38bdf8'},
            {label:'Admins',      value:stats.admins, color:'#fb7185'},
            {label:'Technicians', value:stats.techs,  color:'#fbbf24'},
            {label:'Users',       value:stats.users,  color:'#4ade80'},
          ].map(st=>(
            <div key={st.label} style={s.statCard}>
              <span style={{...s.statNum,color:st.color}}>{st.value}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>

        {error && error!=='forbidden' && (
          <div style={s.errBanner}>⚠ {error}</div>
        )}

        {/* Controls */}
        <div style={s.controls}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>⌕</span>
            <input style={s.search} placeholder="Search by name, email, or department…"
              value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button style={s.refreshBtn} onClick={fetchUsers}>↺ Refresh</button>
        </div>

        {/* Table */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>{['ID','User','Email','Department','Role','Actions'].map(h=>(
                <th key={h} style={s.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={6} style={s.emptyCell}>No users found</td></tr>
              ) : filtered.map((u,i)=>(
                <tr key={u.id} style={{...s.tr,animationDelay:`${i*0.04}s`}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(56,189,248,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{...s.td,...s.mono,color:'#3d5a70'}}>#{u.id}</td>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      <Avatar user={u} size={32}/>
                      <span style={s.userName}>{u.name||'—'}</span>
                    </div>
                  </td>
                  <td style={{...s.td,color:'#7a9ab5',fontSize:13}}>{u.email}</td>
                  <td style={{...s.td,color:'#7a9ab5',fontSize:13}}>{u.department||'—'}</td>
                  <td style={s.td}>
                    <span style={{...s.roleBadge,background:ROLE_STYLES[u.role]?.bg,color:ROLE_STYLES[u.role]?.text,borderColor:ROLE_STYLES[u.role]?.border}}>
                      {u.role}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <button style={s.viewBtn} onClick={()=>setSelected(u)}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(56,189,248,0.15)';e.currentTarget.style.borderColor='rgba(56,189,248,0.4)';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='rgba(56,189,248,0.08)';e.currentTarget.style.borderColor='rgba(56,189,248,0.2)';}}>
                        View
                      </button>
                      {user?.id!==u.id && (
                        <button style={s.trashBtn} onClick={()=>setDeleting(u)}
                          onMouseEnter={e=>{e.currentTarget.style.background='rgba(251,113,133,0.15)';e.currentTarget.style.borderColor='rgba(251,113,133,0.4)';e.currentTarget.style.color='#fb7185';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(56,189,248,0.15)';e.currentTarget.style.color='#3d5a70';}}>
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={s.tableFooter}>Showing {filtered.length} of {users.length} users</div>
      </main>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes rowIn   { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserDetailPanel({ u, updating, onRoleChange, onDelete, onClose, currentUserId }) {
  const rs = ROLE_STYLES[u.role]||ROLE_STYLES.USER;
  return (
    <div style={s.detailPanel}>
      <div style={s.detailHeader}>
        <span style={s.sectionLabel}>USER DETAILS</span>
        <button style={s.iconBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:28}}>
        <Avatar user={u} size={64}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.03em',marginBottom:6}}>{u.name}</div>
          <span style={{...s.roleBadge,background:rs.bg,color:rs.text,borderColor:rs.border}}>{u.role}</span>
        </div>
      </div>

      {[
        {label:'Email',      value:u.email},
        {label:'Phone',      value:u.phone||'—'},
        {label:'Department', value:u.department||'—'},
        {label:'User ID',    value:`#${u.id}`, mono:true},
        {label:'Joined',     value:fmtDate(u.createdAt)},
        {label:'Updated',    value:fmtDate(u.updatedAt)},
      ].map(f=>(
        <div key={f.label} style={s.detailRow}>
          <span style={s.detailLabel}>{f.label}</span>
          <span style={{...s.detailValue,...(f.mono?s.mono:{})}}>{f.value}</span>
        </div>
      ))}

      {u.bio && (
        <div style={{marginTop:16,padding:'14px 16px',background:'rgba(56,189,248,0.04)',borderRadius:10,border:'1px solid rgba(56,189,248,0.1)'}}>
          <div style={{...s.detailLabel,marginBottom:6}}>Bio</div>
          <div style={{fontSize:14,color:'#7a9ab5',lineHeight:1.7}}>{u.bio}</div>
        </div>
      )}

      {/* Role change */}
      <div style={{marginTop:24}}>
        <div style={{...s.sectionLabel,marginBottom:10}}>CHANGE ROLE</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {ROLES.map(r=>(
            <button key={r}
              style={{...s.roleChip,
                ...(u.role===r?{background:ROLE_STYLES[r].bg,color:ROLE_STYLES[r].text,borderColor:ROLE_STYLES[r].border}:{}),
                opacity:updating[u.id]?0.6:1,cursor:updating[u.id]?'wait':'pointer'}}
              onClick={()=>u.role!==r&&!updating[u.id]&&onRoleChange(u.id,r)}
              disabled={!!updating[u.id]}>
              {r} {u.role===r && '✓'}
            </button>
          ))}
          {updating[u.id]===true && <div style={s.miniSpinner}/>}
        </div>
      </div>

      {/* Delete */}
      {currentUserId!==u.id && (
        <div style={{marginTop:28,paddingTop:20,borderTop:'1px solid rgba(251,113,133,0.1)'}}>
          <div style={{...s.sectionLabel,color:'rgba(251,113,133,0.6)',marginBottom:10}}>DANGER ZONE</div>
          <button style={s.deleteBtnOutline} onClick={()=>onDelete(u.id)}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(251,113,133,0.1)';e.currentTarget.style.borderColor='rgba(251,113,133,0.4)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(251,113,133,0.2)';}}>
            ✕ Delete This User
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ user: u, size }) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,overflow:'hidden',
      background:'linear-gradient(135deg,#38bdf8,#0ea5e9)',
      display:'flex',alignItems:'center',justifyContent:'center'}}>
      {u.imageUrl
        ? <img src={u.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : <span style={{fontSize:size*0.38,fontWeight:800,color:'#050b18'}}>{u.name?.[0]?.toUpperCase()||'?'}</span>
      }
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>{children}</div>
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div style={{position:'fixed',top:24,right:24,zIndex:9999,padding:'12px 20px',borderRadius:10,
      fontSize:14,fontWeight:600,backdropFilter:'blur(12px)',animation:'fadeUp 0.3s ease',
      ...(toast.type==='error'
        ?{background:'rgba(251,113,133,0.15)',border:'1px solid rgba(251,113,133,0.3)',color:'#fb7185'}
        :{background:'rgba(34,197,94,0.15)',  border:'1px solid rgba(34,197,94,0.3)',  color:'#4ade80'})}}>
      {toast.type==='success'?'✓':'✕'} {toast.msg}
    </div>
  );
}

function Forbidden({ navigate }) {
  return (
    <div style={{minHeight:'100vh',background:'#050b18',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:"'DM Sans',sans-serif",color:'#f0f6ff'}}>
      <div style={{fontSize:64,color:'#fb7185'}}>⊗</div>
      <h2 style={{fontSize:28,fontWeight:800,margin:0,letterSpacing:'-0.03em',color:'#fb7185'}}>Access Denied</h2>
      <p style={{color:'#7a9ab5',fontSize:16,margin:0}}>You need Admin privileges to view this page.</p>
      <button style={{background:'rgba(56,189,248,0.1)',border:'1px solid rgba(56,189,248,0.25)',borderRadius:10,color:'#38bdf8',padding:'10px 20px',fontSize:14,cursor:'pointer',fontFamily:'inherit',fontWeight:600,marginTop:8}}
        onClick={()=>navigate('/profile')}>← Back to Profile</button>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{minHeight:'100vh',background:'#050b18',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'2px solid rgba(56,189,248,0.15)',borderTopColor:'#38bdf8',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';

const s = {
  page:        {minHeight:'100vh',background:'#050b18',fontFamily:"'DM Sans',sans-serif",color:'#f0f6ff'},
  nav:         {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 32px',borderBottom:'1px solid rgba(56,189,248,0.1)',background:'rgba(5,11,24,0.9)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:100},
  navBrand:    {display:'flex',alignItems:'center',gap:8},
  navDot:      {width:10,height:10,borderRadius:'50%',background:'#38bdf8'},
  navName:     {fontSize:15,fontWeight:700,letterSpacing:'-0.02em'},
  navSep:      {color:'#3d5a70',fontSize:16},
  navPage:     {fontSize:15,color:'#7a9ab5',fontWeight:500},
  navRight:    {display:'flex',alignItems:'center',gap:16},
  navBtn:      {background:'none',border:'none',color:'#7a9ab5',fontSize:14,cursor:'pointer',transition:'color 0.2s',fontFamily:'inherit',fontWeight:500},
  logoutBtn:   {border:'1px solid rgba(56,189,248,0.2)',borderRadius:8,padding:'6px 14px',transition:'all 0.2s'},
  main:        {maxWidth:1100,margin:'0 auto',padding:'48px 24px'},
  pageHeader:  {marginBottom:28},
  sectionLabel:{fontSize:10,fontWeight:700,letterSpacing:'0.15em',color:'#3d5a70',fontFamily:"'Geist Mono',monospace",marginBottom:8},
  pageTitle:   {fontSize:36,fontWeight:800,margin:'0 0 8px',letterSpacing:'-0.03em'},
  pageSub:     {color:'#7a9ab5',fontSize:14,margin:0},
  statsRow:    {display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:28},
  statCard:    {background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:14,padding:'18px 20px',display:'flex',flexDirection:'column',gap:6},
  statNum:     {fontSize:32,fontWeight:800,lineHeight:1},
  statLabel:   {fontSize:11,color:'#3d5a70',letterSpacing:'0.08em',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase'},
  errBanner:   {background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.2)',borderRadius:10,padding:'12px 20px',color:'#fb7185',fontSize:14,marginBottom:20},
  controls:    {display:'flex',gap:12,marginBottom:16,alignItems:'center'},
  searchWrap:  {position:'relative',flex:1},
  searchIcon:  {position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#3d5a70',fontSize:18},
  search:      {width:'100%',background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:10,padding:'11px 16px 11px 40px',color:'#f0f6ff',fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'},
  refreshBtn:  {background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,padding:'11px 20px',color:'#7a9ab5',fontSize:14,cursor:'pointer',fontFamily:'inherit',fontWeight:600,whiteSpace:'nowrap'},
  tableWrap:   {background:'rgba(8,16,32,0.6)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:16,overflow:'hidden',backdropFilter:'blur(12px)'},
  table:       {width:'100%',borderCollapse:'collapse'},
  th:          {textAlign:'left',padding:'14px 20px',fontSize:10,fontWeight:700,letterSpacing:'0.12em',color:'#3d5a70',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase',borderBottom:'1px solid rgba(56,189,248,0.1)',background:'rgba(56,189,248,0.03)'},
  tr:          {transition:'background 0.15s',animation:'rowIn 0.4s ease both',borderBottom:'1px solid rgba(56,189,248,0.06)'},
  td:          {padding:'14px 20px',fontSize:14,verticalAlign:'middle'},
  mono:        {fontFamily:"'Geist Mono',monospace",fontSize:12},
  userCell:    {display:'flex',alignItems:'center',gap:10},
  userName:    {fontWeight:600,color:'#d0e8ff'},
  roleBadge:   {fontSize:10,fontWeight:700,letterSpacing:'0.1em',padding:'3px 9px',borderRadius:6,border:'1px solid',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase'},
  viewBtn:     {background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:7,color:'#38bdf8',padding:'5px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
  trashBtn:    {background:'transparent',border:'1px solid rgba(56,189,248,0.15)',borderRadius:7,color:'#3d5a70',padding:'5px 10px',fontSize:12,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
  emptyCell:   {textAlign:'center',padding:40,color:'#3d5a70',fontStyle:'italic',fontSize:14},
  tableFooter: {padding:'14px 20px',fontSize:12,color:'#3d5a70',fontFamily:"'Geist Mono',monospace",borderTop:'1px solid rgba(56,189,248,0.08)',background:'rgba(56,189,248,0.02)'},
  // Modal
  overlay:     {position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24},
  modal:       {background:'#0a1428',border:'1px solid rgba(56,189,248,0.2)',borderRadius:20,padding:32,width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto',animation:'scaleIn 0.25s ease'},
  // Detail panel
  detailPanel: {},
  detailHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24},
  detailRow:   {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(56,189,248,0.07)'},
  detailLabel: {fontSize:11,color:'#3d5a70',letterSpacing:'0.08em',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase'},
  detailValue: {fontSize:14,fontWeight:600,color:'#d0e8ff'},
  roleChip:    {background:'rgba(56,189,248,0.06)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:8,color:'#7a9ab5',padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Geist Mono',monospace",letterSpacing:'0.08em',transition:'all 0.2s'},
  miniSpinner: {width:16,height:16,borderRadius:'50%',border:'2px solid rgba(56,189,248,0.15)',borderTopColor:'#38bdf8',animation:'spin 0.6s linear infinite'},
  iconBtn:     {background:'none',border:'none',color:'#3d5a70',fontSize:16,cursor:'pointer',fontFamily:'inherit',padding:'2px 6px'},
  deleteBtnOutline:{background:'transparent',border:'1px solid rgba(251,113,133,0.2)',borderRadius:10,color:'#fb7185',padding:'9px 20px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',width:'100%'},
  // Confirm modal
  confirmBox:  {textAlign:'center',padding:'8px 0'},
  confirmIcon: {fontSize:48,color:'#fbbf24',marginBottom:16},
  confirmTitle:{fontSize:22,fontWeight:800,margin:'0 0 12px',letterSpacing:'-0.03em'},
  confirmSub:  {fontSize:14,color:'#7a9ab5',lineHeight:1.7,margin:'0 0 24px'},
  confirmActions:{display:'flex',gap:12,justifyContent:'center'},
  cancelBtn:   {background:'transparent',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,color:'#7a9ab5',padding:'9px 20px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  deleteBtn:   {background:'#fb7185',border:'none',borderRadius:10,color:'#fff',padding:'9px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'},
};