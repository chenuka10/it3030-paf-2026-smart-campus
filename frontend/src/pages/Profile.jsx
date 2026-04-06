import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ROLE_COLORS = {
  ADMIN:      { bg: 'rgba(251,113,133,0.12)', text: '#fb7185', border: 'rgba(251,113,133,0.25)' },
  TECHNICIAN: { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  USER:       { bg: 'rgba(56,189,248,0.12)',   text: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
};

export default function Profile() {
  const { user, logout, loading, fetchMe } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({});
  const [errors,  setErrors]  = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openEdit = () => {
    setForm({
      name:       user.name       || '',
      phone:      user.phone      || '',
      bio:        user.bio        || '',
      department: user.department || '',
    });
    setErrors({});
    setEditing(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim())        e.name  = 'Name is required';
    else if (form.name.length < 2) e.name  = 'Name must be at least 2 characters';
    if (form.phone?.length > 20)   e.phone = 'Phone number too long';
    if (form.bio?.length   > 300)  e.bio   = 'Bio must be under 300 characters';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await api.put('/api/users/me', form);
      await fetchMe();
      setEditing(false);
      showToast('Profile updated successfully');
    } catch {
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <Spinner />;
  if (!user)   { navigate('/login'); return null; }

  const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.USER;

  return (
    <div style={s.page}>
      {toast && <Toast toast={toast} />}

      <nav style={s.nav}>
        <div style={s.navBrand}><div style={s.navDot} /><span style={s.navName}>SmartCampus</span></div>
        <div style={s.navRight}>
          {user.role === 'ADMIN' && (
            <button style={s.navBtn} onClick={() => navigate('/admin')}
              onMouseEnter={e => e.currentTarget.style.color='#38bdf8'}
              onMouseLeave={e => e.currentTarget.style.color='#7a9ab5'}>Admin →</button>
          )}
          <button style={{...s.navBtn,...s.logoutBtn}} onClick={handleLogout}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(251,113,133,0.15)';e.currentTarget.style.borderColor='rgba(251,113,133,0.4)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(56,189,248,0.2)';}}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={s.main}>
        {/* Header */}
        <div style={s.headerCard}>
          <div style={s.avatarWrap}>
            {user.imageUrl
              ? <img src={user.imageUrl} alt={user.name} style={s.avatar} />
              : <div style={s.avatarFallback}>{user.name?.[0]?.toUpperCase()}</div>}
            <div style={s.pip} />
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={s.name}>{user.name}</h1>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8,flexWrap:'wrap'}}>
              <span style={{...s.roleBadge,background:roleStyle.bg,color:roleStyle.text,borderColor:roleStyle.border}}>{user.role}</span>
              {user.department && <span style={s.deptTag}>{user.department}</span>}
            </div>
            {user.bio && <p style={s.bio}>{user.bio}</p>}
          </div>
          {!editing && (
            <button style={s.editBtn} onClick={openEdit}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(56,189,248,0.15)';e.currentTarget.style.borderColor='rgba(56,189,248,0.4)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(56,189,248,0.08)';e.currentTarget.style.borderColor='rgba(56,189,248,0.2)';}}>
              ✎ Edit Profile
            </button>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div style={s.editCard}>
            <div style={s.editHeader}>
              <span style={s.sectionLabel}>EDIT PROFILE</span>
              <button style={s.cancelBtn} onClick={() => setEditing(false)}>✕ Cancel</button>
            </div>
            <div style={s.formGrid}>
              <FormField label="Full Name" required error={errors.name}>
                <input style={{...s.input,...(errors.name?s.inputErr:{})}}
                  value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="Your full name" />
              </FormField>
              <FormField label="Phone Number" error={errors.phone}>
                <input style={{...s.input,...(errors.phone?s.inputErr:{})}}
                  value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                  placeholder="+94 77 123 4567" />
              </FormField>
              <FormField label="Department" style={{gridColumn:'span 2'}}>
                <input style={s.input}
                  value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}
                  placeholder="e.g. Computer Science, Engineering…" />
              </FormField>
              <FormField label={`Bio (${(form.bio||'').length}/300)`} error={errors.bio} style={{gridColumn:'span 2'}}>
                <textarea style={{...s.input,...s.textarea,...(errors.bio?s.inputErr:{})}}
                  value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}
                  placeholder="Tell us a bit about yourself…" rows={3} maxLength={300} />
              </FormField>
            </div>
            <div style={s.formActions}>
              <button style={s.cancelBtn} onClick={()=>setEditing(false)}>Cancel</button>
              <button style={{...s.saveBtn,opacity:saving?0.7:1}} onClick={handleSave} disabled={saving}
                onMouseEnter={e=>!saving&&(e.currentTarget.style.background='#0ea5e9')}
                onMouseLeave={e=>(e.currentTarget.style.background='#38bdf8')}>
                {saving ? 'Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Details grid */}
        <div style={s.sectionLabel}>ACCOUNT DETAILS</div>
        <div style={s.grid}>
          {[
            {label:'Email Address', value:user.email,                icon:'◉'},
            {label:'Phone',         value:user.phone||'—',           icon:'◈'},
            {label:'Department',    value:user.department||'—',      icon:'◆'},
            {label:'User ID',       value:`#${user.id}`,             icon:'◇', mono:true},
            {label:'Member Since',  value:fmtDate(user.createdAt),   icon:'◎'},
            {label:'Last Updated',  value:fmtDate(user.updatedAt),   icon:'◑'},
          ].map(f=>(
            <div key={f.label} style={s.field}>
              <span style={s.fieldIcon}>{f.icon}</span>
              <div>
                <div style={s.fieldLabel}>{f.label}</div>
                <div style={{...s.fieldValue,...(f.mono?s.mono:{})}}>{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.permCard}>
          <div style={s.permTitle}>Access Level</div>
          <div style={s.permDesc}>
            {user.role==='ADMIN'      && 'Full administrative privileges — user management, role assignment, and system configuration.'}
            {user.role==='TECHNICIAN' && 'Technician-level access to manage campus resources and maintenance requests.'}
            {user.role==='USER'       && 'Standard campus user access. Contact an administrator for elevated permissions.'}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';

function FormField({ label, required, error, children, style }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,...style}}>
      <label style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',color:error?'#fb7185':'#7a9ab5',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase'}}>
        {label}{required&&<span style={{color:'#fb7185'}}> *</span>}
      </label>
      {children}
      {error && <span style={{fontSize:12,color:'#fb7185'}}>{error}</span>}
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div style={{position:'fixed',top:24,right:24,zIndex:9999,padding:'12px 20px',borderRadius:10,fontSize:14,fontWeight:600,backdropFilter:'blur(12px)',animation:'fadeUp 0.3s ease',
      ...(toast.type==='error'
        ?{background:'rgba(251,113,133,0.15)',border:'1px solid rgba(251,113,133,0.3)',color:'#fb7185'}
        :{background:'rgba(34,197,94,0.15)',  border:'1px solid rgba(34,197,94,0.3)',  color:'#4ade80'})}}>
      {toast.type==='success'?'✓':'✕'} {toast.msg}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{minHeight:'100vh',background:'#050b18',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'2px solid rgba(56,189,248,0.15)',borderTopColor:'#38bdf8',animation:'spin 0.8s linear infinite'}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

const s = {
  page:       {minHeight:'100vh',background:'#050b18',fontFamily:"'DM Sans',sans-serif",color:'#f0f6ff'},
  nav:        {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 32px',borderBottom:'1px solid rgba(56,189,248,0.1)',background:'rgba(5,11,24,0.9)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:100},
  navBrand:   {display:'flex',alignItems:'center',gap:10},
  navDot:     {width:10,height:10,borderRadius:'50%',background:'#38bdf8'},
  navName:    {fontSize:15,fontWeight:700,letterSpacing:'-0.02em'},
  navRight:   {display:'flex',alignItems:'center',gap:16},
  navBtn:     {background:'none',border:'none',color:'#7a9ab5',fontSize:14,cursor:'pointer',transition:'color 0.2s',fontFamily:'inherit',fontWeight:500},
  logoutBtn:  {border:'1px solid rgba(56,189,248,0.2)',borderRadius:8,padding:'6px 14px',transition:'all 0.2s'},
  main:       {maxWidth:720,margin:'0 auto',padding:'48px 24px'},
  headerCard: {display:'flex',alignItems:'flex-start',gap:24,background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:18,padding:'28px 32px',marginBottom:28,backdropFilter:'blur(12px)',flexWrap:'wrap'},
  avatarWrap: {position:'relative',flexShrink:0},
  avatar:     {width:72,height:72,borderRadius:'50%',border:'2px solid rgba(56,189,248,0.3)',display:'block'},
  avatarFallback:{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#38bdf8,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'#050b18'},
  pip:        {position:'absolute',bottom:3,right:3,width:14,height:14,borderRadius:'50%',background:'#22c55e',border:'2px solid #050b18'},
  name:       {fontSize:26,fontWeight:800,margin:0,letterSpacing:'-0.03em'},
  roleBadge:  {fontSize:11,fontWeight:700,letterSpacing:'0.1em',padding:'3px 10px',borderRadius:6,border:'1px solid',fontFamily:"'Geist Mono',monospace",textTransform:'uppercase'},
  deptTag:    {fontSize:13,color:'#7a9ab5',background:'rgba(56,189,248,0.06)',border:'1px solid rgba(56,189,248,0.1)',borderRadius:6,padding:'2px 10px'},
  bio:        {fontSize:14,color:'#7a9ab5',marginTop:10,lineHeight:1.6,marginBottom:0},
  editBtn:    {flexShrink:0,background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,color:'#38bdf8',padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',whiteSpace:'nowrap'},
  editCard:   {background:'rgba(10,20,40,0.7)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:18,padding:'28px 32px',marginBottom:28,backdropFilter:'blur(12px)',animation:'fadeUp 0.25s ease'},
  editHeader: {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24},
  formGrid:   {display:'grid',gridTemplateColumns:'1fr 1fr',gap:18},
  input:      {background:'rgba(5,11,24,0.8)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,padding:'11px 14px',color:'#f0f6ff',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',width:'100%',boxSizing:'border-box',transition:'border-color 0.2s'},
  inputErr:   {borderColor:'rgba(251,113,133,0.5)'},
  textarea:   {resize:'vertical',minHeight:80,lineHeight:1.6},
  formActions:{display:'flex',justifyContent:'flex-end',gap:12,marginTop:24},
  cancelBtn:  {background:'transparent',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,color:'#7a9ab5',padding:'9px 20px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  saveBtn:    {background:'#38bdf8',border:'none',borderRadius:10,color:'#050b18',padding:'9px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'background 0.2s'},
  sectionLabel:{fontSize:10,fontWeight:700,letterSpacing:'0.15em',color:'#3d5a70',fontFamily:"'Geist Mono',monospace",marginBottom:12},
  grid:       {display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24},
  field:      {display:'flex',alignItems:'flex-start',gap:14,background:'rgba(10,20,40,0.5)',border:'1px solid rgba(56,189,248,0.1)',borderRadius:12,padding:'18px 20px'},
  fieldIcon:  {fontSize:14,color:'#38bdf8',marginTop:2},
  fieldLabel: {fontSize:11,color:'#3d5a70',letterSpacing:'0.05em',fontFamily:"'Geist Mono',monospace",marginBottom:5},
  fieldValue: {fontSize:15,fontWeight:600,color:'#d0e8ff'},
  mono:       {fontFamily:"'Geist Mono',monospace",fontSize:14},
  permCard:   {background:'rgba(56,189,248,0.04)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:14,padding:'20px 24px'},
  permTitle:  {fontSize:13,fontWeight:700,color:'#38bdf8',marginBottom:8},
  permDesc:   {fontSize:14,color:'#7a9ab5',lineHeight:1.7},
};