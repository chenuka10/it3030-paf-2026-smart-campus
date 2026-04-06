import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

export default function AdminResources() {
  const navigate = useNavigate();
  return (
    <Layout adminOnly>
      <div style={s.page}>
        <div style={s.label}>RESOURCES</div>
        <h1 style={s.title}>Resource Management</h1>
        <p style={s.sub}>Add, edit, and manage all campus resources from here.</p>
        <div style={s.actions}>
          <button style={s.primaryBtn} onClick={() => navigate('/resources/add')}>+ Add Resource</button>
          <button style={s.secondaryBtn} onClick={() => navigate('/resources')}>View All Resources</button>
        </div>
        <div style={s.placeholder}>
          <span style={s.placeholderIcon}>◫</span>
          <p style={s.placeholderText}>Resource CRUD pages are at <code style={s.code}>/resources</code>, <code style={s.code}>/resources/add</code>, and <code style={s.code}>/resources/edit/:id</code></p>
          <p style={s.placeholderSub}>Connect your existing ResourceListPage, AddResourcePage, and EditResourcePage here or embed them inline.</p>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page:    { padding: '36px 36px', maxWidth: 900, margin: '0 auto' },
  label:   { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#4ade80', fontFamily: "'Geist Mono',monospace", marginBottom: 10 },
  title:   { fontSize: 34, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.04em', color: '#f0f6ff' },
  sub:     { fontSize: 15, color: '#7a9ab5', margin: '0 0 28px' },
  actions: { display: 'flex', gap: 12, marginBottom: 36 },
  primaryBtn:   { background: '#38bdf8', border: 'none', borderRadius: 10, color: '#050b18', padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  secondaryBtn: { background: 'transparent', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 10, color: '#38bdf8', padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  placeholder: { background: 'rgba(10,20,40,0.5)', border: '1px dashed rgba(56,189,248,0.2)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' },
  placeholderIcon: { fontSize: 48, color: '#2d4a60', display: 'block', marginBottom: 16 },
  placeholderText: { fontSize: 15, color: '#7a9ab5', margin: '0 0 10px', lineHeight: 1.7 },
  placeholderSub:  { fontSize: 13, color: '#3d5a70', margin: 0 },
  code: { background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '1px 6px', borderRadius: 4, fontFamily: "'Geist Mono',monospace", fontSize: 13 },
};