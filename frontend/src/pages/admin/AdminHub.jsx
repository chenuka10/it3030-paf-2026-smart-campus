import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useState, useEffect } from 'react';

const SECTIONS = [
  {
    label: 'User Management',
    desc: 'View, edit roles, and remove campus members',
    icon: '◉', path: '/admin/users', color: '#38bdf8',
    stat: 'users', statLabel: 'Total Users',
  },
  {
    label: 'Resources',
    desc: 'Add, edit, and manage campus resources',
    icon: '◫', path: '/admin/resources', color: '#4ade80',
    stat: 'resources', statLabel: 'Total Resources',
  },
  {
    label: 'Notifications',
    desc: 'Broadcast alerts to users or groups',
    icon: '◎', path: '/admin/notifications', color: '#fbbf24',
    stat: 'notifications', statLabel: 'Sent Today',
  },
  {
    label: 'Reports',
    desc: 'Analytics, logs, and activity summaries',
    icon: '◈', path: '/admin/reports', color: '#c084fc',
    stat: 'reports', statLabel: 'This Month',
  },
];

export default function AdminHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Fetch user count as a sample stat
    api.get('/api/users').then(({ data }) => {
      setStats(s => ({ ...s, users: data.length }));
    }).catch(() => {});
  }, []);

  return (
    <Layout adminOnly>
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.label}>ADMIN CONSOLE</div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>Manage all SmartCampus systems from one place</p>
        </div>

        <div style={s.grid}>
          {SECTIONS.map(sec => (
            <button key={sec.path} style={s.card}
              onClick={() => navigate(sec.path)}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = sec.color + '44';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 12px 40px ${sec.color}0f`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.12)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <div style={{ ...s.cardIcon, color: sec.color, background: sec.color + '14' }}>
                {sec.icon}
              </div>
              <div style={s.cardBody}>
                <div style={s.cardLabel}>{sec.label}</div>
                <div style={s.cardDesc}>{sec.desc}</div>
              </div>
              {stats[sec.stat] !== undefined && (
                <div style={s.cardStat}>
                  <span style={{ ...s.statNum, color: sec.color }}>{stats[sec.stat]}</span>
                  <span style={s.statLabel}>{sec.statLabel}</span>
                </div>
              )}
              <span style={{ ...s.arrow, color: sec.color }}>→</span>
            </button>
          ))}
        </div>

        {/* Quick info strip */}
        <div style={s.infoStrip}>
          <div style={s.infoItem}>
            <span style={s.infoDot} />
            <span style={s.infoText}>All changes are logged and audited</span>
          </div>
          <div style={s.infoItem}>
            <span style={{ ...s.infoDot, background: '#fbbf24' }} />
            <span style={s.infoText}>Role changes take effect immediately</span>
          </div>
          <div style={s.infoItem}>
            <span style={{ ...s.infoDot, background: '#fb7185' }} />
            <span style={s.infoText}>Deletions are permanent and irreversible</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page:   { padding: '36px 36px', maxWidth: 900, margin: '0 auto' },
  header: { marginBottom: 32 },
  label:  { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#fb7185', fontFamily: "'Geist Mono',monospace", marginBottom: 10 },
  title:  { fontSize: 38, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.04em', color: '#f0f6ff' },
  sub:    { fontSize: 15, color: '#7a9ab5', margin: 0 },
  grid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 },
  card: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: 16, padding: '22px 24px',
    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
    transition: 'all 0.2s', position: 'relative',
  },
  cardIcon:  { width: 48, height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  cardBody:  { flex: 1, minWidth: 0 },
  cardLabel: { fontSize: 16, fontWeight: 700, color: '#d0e8ff', marginBottom: 4, letterSpacing: '-0.02em' },
  cardDesc:  { fontSize: 13, color: '#3d5a70', lineHeight: 1.5 },
  cardStat:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 },
  statNum:   { fontSize: 26, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 10, color: '#2d4a60', fontFamily: "'Geist Mono',monospace", marginTop: 2 },
  arrow:     { fontSize: 18, flexShrink: 0 },
  infoStrip: {
    background: 'rgba(10,20,40,0.4)', border: '1px solid rgba(56,189,248,0.08)',
    borderRadius: 12, padding: '16px 24px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  infoItem:  { display: 'flex', alignItems: 'center', gap: 10 },
  infoDot:   { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 },
  infoText:  { fontSize: 13, color: '#3d5a70' },
};