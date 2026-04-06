import Layout from '../../components/Layout';

export default function AdminReports() {
  return (
    <Layout adminOnly>
      <div style={s.page}>
        <div style={s.label}>REPORTS</div>
        <h1 style={s.title}>Analytics & Reports</h1>
        <p style={s.sub}>Usage statistics, activity logs, and campus insights.</p>
        <div style={s.placeholder}>
          <span style={s.icon}>◈</span>
          <p style={s.text}>Reports dashboard coming soon.</p>
          <p style={s.hint}>Connect your analytics endpoints to populate charts and activity logs here.</p>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page:  { padding: '36px 36px', maxWidth: 900, margin: '0 auto' },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#c084fc', fontFamily: "'Geist Mono',monospace", marginBottom: 10 },
  title: { fontSize: 34, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.04em', color: '#f0f6ff' },
  sub:   { fontSize: 15, color: '#7a9ab5', margin: '0 0 36px' },
  placeholder: { background: 'rgba(10,20,40,0.5)', border: '1px dashed rgba(56,189,248,0.2)', borderRadius: 16, padding: '64px 32px', textAlign: 'center' },
  icon:  { fontSize: 52, color: '#2d4a60', display: 'block', marginBottom: 16 },
  text:  { fontSize: 16, color: '#7a9ab5', margin: '0 0 10px' },
  hint:  { fontSize: 13, color: '#3d5a70', margin: 0, lineHeight: 1.7 },
};