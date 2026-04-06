import Layout from '../../components/Layout';

export default function AdminNotifications() {
  return (
    <Layout adminOnly>
      <div style={s.page}>
        <div style={s.label}>NOTIFICATIONS</div>
        <h1 style={s.title}>Notification Center</h1>
        <p style={s.sub}>Broadcast alerts and messages to campus users.</p>
        <div style={s.placeholder}>
          <span style={s.icon}>◎</span>
          <p style={s.text}>Notification management coming soon.</p>
          <p style={s.hint}>Wire up <code style={s.code}>POST /api/notifications</code> and <code style={s.code}>GET /api/notifications</code> from your backend.</p>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page:  { padding: '36px 36px', maxWidth: 900, margin: '0 auto' },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#fbbf24', fontFamily: "'Geist Mono',monospace", marginBottom: 10 },
  title: { fontSize: 34, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.04em', color: '#f0f6ff' },
  sub:   { fontSize: 15, color: '#7a9ab5', margin: '0 0 36px' },
  placeholder: { background: 'rgba(10,20,40,0.5)', border: '1px dashed rgba(56,189,248,0.2)', borderRadius: 16, padding: '64px 32px', textAlign: 'center' },
  icon:  { fontSize: 52, color: '#2d4a60', display: 'block', marginBottom: 16 },
  text:  { fontSize: 16, color: '#7a9ab5', margin: '0 0 10px' },
  hint:  { fontSize: 13, color: '#3d5a70', margin: 0, lineHeight: 1.7 },
  code:  { background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '1px 6px', borderRadius: 4, fontFamily: "'Geist Mono',monospace", fontSize: 12 },
};