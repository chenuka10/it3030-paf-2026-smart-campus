import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];
const RS = {
  ADMIN:      { bg:'rgba(251,113,133,0.12)', text:'#fb7185', border:'rgba(251,113,133,0.25)' },
  TECHNICIAN: { bg:'rgba(251,191,36,0.12)',  text:'#fbbf24', border:'rgba(251,191,36,0.25)' },
  USER:       { bg:'rgba(56,189,248,0.12)',   text:'#38bdf8', border:'rgba(56,189,248,0.25)' },
};

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [updating, setUpdating] = useState({});
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch(err) {
      setError(err.response?.status===403 ? 'forbidden' : 'Failed to load users.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (uid, newRole) => {
    setUpdating(p=>({...p,[uid]:true}));
    try {
      const { data } = await api.put(`/api/users/${uid}/role`,{role:newRole});
      setUsers(p=>p.map(u=>u.id===uid?{...u,role:data.role}:u));
      if (selected?.id===uid) setSelected(s=>({...s,role:data.role}));
      showToast(`Role updated to ${newRole}`);
    } catch(err) {
      showToast(err.response?.status===403?'Permission denied':'Failed to update role','error');
    } finally { setUpdating(p=>({...p,[uid]:false})); }
  };

  const handleDelete = async (uid) => {
    setUpdating(p=>({...p,[uid]:'del'}));
    try {
      await api.delete(`/api/users/${uid}`);
      setUsers(p=>p.filter(u=>u.id!==uid));
      setDeleting(null); setSelected(null);
      showToast('User deleted');
    } catch(err) {
      showToast(err.response?.status===403?'Permission denied':'Failed to delete','error');
    } finally { setUpdating(p=>({...p,[uid]:false})); }
  };

  const filtered = users.filter(u=>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label:'Total',       value: users.length,                               color:'#38bdf8' },
    { label:'Admins',      value: users.filter(u=>u.role==='ADMIN').length,      color:'#fb7185' },
    { label:'Technicians', value: users.filter(u=>u.role==='TECHNICIAN').length, color:'#fbbf24' },
    { label:'Users',       value: users.filter(u=>u.role==='USER').length,       color:'#4ade80' },
  ];

  return (
    <Layout adminOnly>
      {toast && <Toast toast={toast}/>}
      {selected && (
        <Modal onClose={()=>setSelected(null)}>
          <DetailPanel u={selected} updating={updating} currentUserId={user?.id}
            onRoleChange={handleRoleChange}
            onDelete={uid=>setDeleting(users.find(x=>x.id===uid))}
            onClose={()=>setSelected(null)} />
        </Modal>
      )}
      {deleting && (
        <Modal onClose={()=>setDeleting(null)}>
          <div style={s.confirmBox}>
            <div style={s.confirmIcon}>⚠</div>
            <h3 style={s.confirmTitle}>Delete User</h3>
            <p style={s.confirmSub}>Delete <strong style={{color:'#f0f6ff'}}>{deleting.name}</strong>? This cannot be undone.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={()=>setDeleting(null)}>Cancel</button>
              <button style={{...s.deleteBtn,opacity:updating[deleting.id]==='del'?0.7:1}}
                onClick={()=>handleDelete(deleting.id)} disabled={updating[deleting.id]==='del'}>
                {updating[deleting.id]==='del'?'Deleting…':'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div style={s.page}>
        <div style={s.pageHeader}>
          <div>
            <div style={s.label}>USER MANAGEMENT</div>
            <h1 style={s.title}>Campus Members</h1>
          </div>
        </div>

        <div style={s.statsRow}>
          {stats.map(st=>(
            <div key={st.label} style={s.statCard}>
              <span style={{...s.statNum,color:st.color}}>{st.value}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>

        {error && <div style={s.errBanner}>⚠ {error}</div>}

        <div style={s.controls}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>⌕</span>
            <input style={s.search} placeholder="Search name, email, department…"
              value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button style={s.refreshBtn} onClick={fetchUsers}>↺</button>
        </div>

        {loading ? <Spinner/> : (
          <>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{['ID','User','Email','Department','Role','Actions'].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.length===0
                    ? <tr><td colSpan={6} style={s.emptyCell}>No users found</td></tr>
                    : filtered.map((u,i)=>(
                      <tr key={u.id} style={{...s.tr,animationDelay:`${i*0.04}s`}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(56,189,248,0.04)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{...s.td,...s.mono,color:'#3d5a70'}}>#{u.id}</td>
                        <td style={s.td}>
                          <div style={s.userCell}>
                            <Avatar u={u} size={30}/>
                            <span style={s.userName}>{u.name||'—'}</span>
                          </div>
                        </td>
                        <td style={{...s.td,color:'#7a9ab5',fontSize:13}}>{u.email}</td>
                        <td style={{...s.td,color:'#7a9ab5',fontSize:13}}>{u.department||'—'}</td>
                        <td style={s.td}>
                          <span style={{...s.roleBadge,...RS[u.role]}}>{u.role}</span>
                        </td>
                        <td style={s.td}>
                          <div style={{display:'flex',gap:6}}>
                            <button style={s.viewBtn} onClick={()=>setSelected(u)}
                              onMouseEnter={e=>{e.currentTarget.style.background='rgba(56,189,248,0.15)';}}
                              onMouseLeave={e=>{e.currentTarget.style.background='rgba(56,189,248,0.08)';}}>View</button>
                            {user?.id!==u.id&&(
                              <button style={s.trashBtn} onClick={()=>setDeleting(u)}
                                onMouseEnter={e=>{e.currentTarget.style.color='#fb7185';e.currentTarget.style.borderColor='rgba(251,113,133,0.4)';}}
                                onMouseLeave={e=>{e.currentTarget.style.color='#3d5a70';e.currentTarget.style.borderColor='rgba(56,189,248,0.15)';}}>✕</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <div style={s.tableFooter}>Showing {filtered.length} of {users.length} users</div>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes rowIn { from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;} }
        @keyframes scaleIn{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
      `}</style>
    </Layout>
  );
}

function DetailPanel({ u, updating, onRoleChange, onDelete, onClose, currentUserId }) {
  const rs = RS[u.role]||RS.USER;
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <span style={s.label}>USER DETAILS</span>
        <button style={s.iconBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
        <Avatar u={u} size={56}/>
        <div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:'-0.03em',marginBottom:6}}>{u.name}</div>
          <span style={{...s.roleBadge,...rs}}>{u.role}</span>
        </div>
      </div>
      {[['Email',u.email],['Phone',u.phone||'—'],['Department',u.department||'—'],['User ID',`#${u.id}`],['Joined',fmtDate(u.createdAt)]].map(([l,v])=>(
        <div key={l} style={s.detailRow}>
          <span style={s.detailLabel}>{l}</span>
          <span style={s.detailValue}>{v}</span>
        </div>
      ))}
      {u.bio&&<div style={{margin:'16px 0',padding:'12px 14px',background:'rgba(56,189,248,0.04)',borderRadius:10,border:'1px solid rgba(56,189,248,0.1)',fontSize:13,color:'#7a9ab5',lineHeight:1.7}}>{u.bio}</div>}
      <div style={{marginTop:20}}>
        <div style={{...s.label,marginBottom:10}}>CHANGE ROLE</div>
        <div style={{display:'flex',gap:8}}>
          {ROLES.map(r=>(
            <button key={r} style={{...s.roleChip,...(u.role===r?{...RS[r],fontWeight:800}:{})}}
              onClick={()=>u.role!==r&&!updating[u.id]&&onRoleChange(u.id,r)}
              disabled={!!updating[u.id]}>
              {r}{u.role===r?' ✓':''}
            </button>
          ))}
        </div>
      </div>
      {currentUserId!==u.id&&(
        <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid rgba(251,113,133,0.1)'}}>
          <button style={s.deleteBtnOutline} onClick={()=>onDelete(u.id)}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(251,113,133,0.1)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
            ✕ Delete This User
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({u,size}){
  return(
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,overflow:'hidden',background:'linear-gradient(135deg,#38bdf8,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      {u.imageUrl?<img src={u.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        :<span style={{fontSize:size*0.38,fontWeight:800,color:'#050b18'}}>{u.name?.[0]?.toUpperCase()||'?'}</span>}
    </div>
  );
}
function Modal({children,onClose}){
  return(
    <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>{children}</div>
    </div>
  );
}
function Toast({toast}){
  return(
    <div style={{position:'fixed',top:24,right:24,zIndex:9999,padding:'12px 20px',borderRadius:10,fontSize:14,fontWeight:600,backdropFilter:'blur(12px)',animation:'fadeUp 0.3s ease',
      ...(toast.type==='error'?{background:'rgba(251,113,133,0.15)',border:'1px solid rgba(251,113,133,0.3)',color:'#fb7185'}:{background:'rgba(34,197,94,0.15)',border:'1px solid rgba(34,197,94,0.3)',color:'#4ade80'})}}>
      {toast.type==='success'?'✓':'✕'} {toast.msg}
    </div>
  );
}
function Spinner(){return(<div style={{display:'flex',justifyContent:'center',padding:60}}><div style={{width:28,height:28,borderRadius:'50%',border:'2px solid rgba(56,189,248,0.15)',borderTopColor:'#38bdf8',animation:'spin 0.8s linear infinite'}}/></div>);}
const fmtDate=d=>d?new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';

const s = {
  page:       {padding:'32px 36px',maxWidth:1000,margin:'0 auto'},
  pageHeader: {marginBottom:24},
  label:      {fontSize:10,fontWeight:700,letterSpacing:'0.15em',color:'#3d5a70',fontFamily:"'Geist Mono',monospace",marginBottom:8,display:'block'},
  title:      {fontSize:32,fontWeight:800,margin:0,letterSpacing:'-0.03em'},
  statsRow:   {display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24},
  statCard:   {background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:12,padding:'16px 18px',display:'flex',flexDirection:'column',gap:4},
  statNum:    {fontSize:28,fontWeight:800,lineHeight:1},
  statLabel:  {fontSize:10,color:'#3d5a70',fontFamily:"'Geist Mono',monospace",letterSpacing:'0.08em',textTransform:'uppercase'},
  errBanner:  {background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.2)',borderRadius:10,padding:'12px 20px',color:'#fb7185',fontSize:14,marginBottom:20},
  controls:   {display:'flex',gap:10,marginBottom:14},
  searchWrap: {position:'relative',flex:1},
  searchIcon: {position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#3d5a70',fontSize:18},
  search:     {width:'100%',background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:10,padding:'10px 16px 10px 40px',color:'#f0f6ff',fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'},
  refreshBtn: {background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,padding:'10px 16px',color:'#7a9ab5',fontSize:16,cursor:'pointer',fontFamily:'inherit'},
  tableWrap:  {background:'rgba(8,16,32,0.6)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:14,overflow:'hidden',backdropFilter:'blur(12px)'},
  table:      {width:'100%',borderCollapse:'collapse'},
  th:         {textAlign:'left',padding:'12px 18px',fontSize:10,fontWeight:700,letterSpacing:'0.12em',color:'#3d5a70',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase',borderBottom:'1px solid rgba(56,189,248,0.1)',background:'rgba(56,189,248,0.03)'},
  tr:         {transition:'background 0.15s',animation:'rowIn 0.35s ease both',borderBottom:'1px solid rgba(56,189,248,0.06)'},
  td:         {padding:'12px 18px',fontSize:14,verticalAlign:'middle'},
  mono:       {fontFamily:"'Geist Mono',monospace",fontSize:12},
  userCell:   {display:'flex',alignItems:'center',gap:10},
  userName:   {fontWeight:600,color:'#d0e8ff'},
  roleBadge:  {fontSize:10,fontWeight:700,letterSpacing:'0.1em',padding:'3px 9px',borderRadius:6,border:'1px solid',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase'},
  viewBtn:    {background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:7,color:'#38bdf8',padding:'5px 12px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'background 0.15s'},
  trashBtn:   {background:'transparent',border:'1px solid rgba(56,189,248,0.15)',borderRadius:7,color:'#3d5a70',padding:'5px 9px',fontSize:12,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
  emptyCell:  {textAlign:'center',padding:40,color:'#3d5a70',fontStyle:'italic',fontSize:14},
  tableFooter:{padding:'12px 18px',fontSize:11,color:'#3d5a70',fontFamily:"'Geist Mono',monospace",borderTop:'1px solid rgba(56,189,248,0.08)',background:'rgba(56,189,248,0.02)'},
  overlay:    {position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24},
  modal:      {background:'#0a1428',border:'1px solid rgba(56,189,248,0.2)',borderRadius:20,padding:32,width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto',animation:'scaleIn 0.25s ease',fontFamily:"'DM Sans',sans-serif",color:'#f0f6ff'},
  detailRow:  {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(56,189,248,0.07)'},
  detailLabel:{fontSize:11,color:'#3d5a70',letterSpacing:'0.08em',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase'},
  detailValue:{fontSize:13,fontWeight:600,color:'#d0e8ff'},
  roleChip:   {background:'rgba(56,189,248,0.06)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:8,color:'#7a9ab5',padding:'6px 12px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Geist Mono',monospace",letterSpacing:'0.08em',transition:'all 0.2s'},
  iconBtn:    {background:'none',border:'none',color:'#3d5a70',fontSize:16,cursor:'pointer',padding:'2px 6px',fontFamily:'inherit'},
  deleteBtnOutline:{background:'transparent',border:'1px solid rgba(251,113,133,0.2)',borderRadius:10,color:'#fb7185',padding:'9px 20px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'background 0.2s',width:'100%'},
  confirmBox: {textAlign:'center',padding:'8px 0'},
  confirmIcon:{fontSize:44,color:'#fbbf24',marginBottom:12},
  confirmTitle:{fontSize:20,fontWeight:800,margin:'0 0 10px',letterSpacing:'-0.03em'},
  confirmSub: {fontSize:14,color:'#7a9ab5',lineHeight:1.7,margin:'0 0 20px'},
  confirmActions:{display:'flex',gap:12,justifyContent:'center'},
  cancelBtn:  {background:'transparent',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,color:'#7a9ab5',padding:'9px 20px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  deleteBtn:  {background:'#fb7185',border:'none',borderRadius:10,color:'#fff',padding:'9px 22px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'},
};