import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';

const ROLE_COLORS = {
  ADMIN:      { bg: 'rgba(224,122,95,0.12)', text: 'var(--color-ui-danger)', border: 'rgba(224,122,95,0.25)' },
  TECHNICIAN: { bg: 'rgba(242,166,90,0.12)', text: 'var(--color-ui-warn)',   border: 'rgba(242,166,90,0.25)' },
  USER:       { bg: 'rgba(111,143,114,0.12)', text: 'var(--color-ui-sky)',   border: 'rgba(111,143,114,0.25)' },
};

const fmtDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

export default function Profile() {
  const { user, fetchMe } = useAuth();

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [form, setForm]         = useState({});
  const [errors, setErrors]     = useState({});

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
    if (!form.name?.trim())       e.name  = 'Name is required';
    else if (form.name.length < 2) e.name  = 'Name must be at least 2 characters';
    if (form.phone?.length > 20)  e.phone = 'Phone number too long';
    if (form.bio?.length > 300)   e.bio   = 'Bio must be under 300 characters';
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

  if (!user) return null;
  const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.USER;

  return (
    <Layout>
      {toast && <Toast toast={toast} />}

      <div className="max-w-[720px] mx-auto px-6 py-9">

        {/* Header card */}
        <div className="flex items-start gap-6 flex-wrap card mb-7">

          {/* Avatar */}
          <div className="relative shrink-0">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.name}
                className="w-[72px] h-[72px] rounded-full border-2 border-ui-sky/30 object-cover"
              />
            ) : (
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-extrabold text-ui-surface"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-[3px] right-[3px] w-[14px] h-[14px] rounded-full bg-ui-live border-2 border-ui-base" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">
              {user.name}
            </h1>

            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <span
                className="text-[11px] font-bold tracking-[0.1em] px-[10px] py-[3px] rounded-[6px] border uppercase font-mono"
                style={{ background: roleStyle.bg, color: roleStyle.text, borderColor: roleStyle.border }}
              >
                {user.role}
              </span>

              {user.department && (
                <span className="text-[13px] text-ui-muted bg-ui-sky/5 border border-ui-sky/10 rounded-[6px] px-[10px] py-[2px]">
                  {user.department}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="text-[14px] text-ui-muted mt-2.5 leading-[1.6]">
                {user.bio}
              </p>
            )}
          </div>

          {!editing && (
            <button
              onClick={openEdit}
              className="shrink-0 bg-ui-sky/8 border border-ui-sky/20 rounded-[10px] text-ui-sky px-[18px] py-[8px] text-[13px] font-semibold transition-all duration-200 whitespace-nowrap hover:bg-ui-sky/15 hover:border-ui-sky/40"
            >
              ✎ Edit Profile
            </button>
          )}
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="card mb-7">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono">
                Edit Profile
              </span>
              <button
                onClick={() => setEditing(false)}
                className="text-ui-muted hover:text-ui-bright transition-colors"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
              <FF label="Full Name" required error={errors.name}>
                <input
                  className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors
                    ${errors.name ? 'border-ui-danger' : 'border-ui-sky/20'}`}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </FF>

              <FF label="Phone Number" error={errors.phone}>
                <input
                  className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright text-[14px] focus:outline-none focus:border-ui-sky transition-colors
                    ${errors.phone ? 'border-ui-danger' : 'border-ui-sky/20'}`}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </FF>

              <FF label="Department" className="md:col-span-2">
                <input
                  className="w-full bg-ui-base border border-ui-sky/20 rounded-[10px] px-[14px] py-[11px] text-ui-bright focus:outline-none focus:border-ui-sky transition-colors"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                />
              </FF>

              <FF label="Bio" error={errors.bio} className="md:col-span-2">
                <textarea
                  className={`w-full bg-ui-base border rounded-[10px] px-[14px] py-[11px] text-ui-bright resize-y min-h-[80px] focus:outline-none focus:border-ui-sky transition-colors
                    ${errors.bio ? 'border-ui-danger' : 'border-ui-sky/20'}`}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
              </FF>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Section label */}
        <div className="text-[10px] font-bold tracking-[0.15em] text-ui-dim uppercase font-mono mb-3">
          Account Details
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Email Address', value: user.email,                 icon: '◉' },
            { label: 'Phone',         value: user.phone      || '—',     icon: '◈' },
            { label: 'Department',    value: user.department || '—',     icon: '◆' },
            { label: 'User ID',       value: `#${user.id}`,              icon: '◇', mono: true },
            { label: 'Member Since',  value: fmtDate(user.createdAt),    icon: '◎' },
            { label: 'Last Updated',  value: fmtDate(user.updatedAt),    icon: '◑' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-3.5 bg-ui-base border border-ui-sky/10 rounded-[12px] px-5 py-4"
            >
              <span className="text-[14px] text-ui-sky mt-[2px]">{f.icon}</span>
              <div>
                <div className="text-[11px] text-ui-dim tracking-[0.05em] font-mono mb-1">
                  {f.label}
                </div>
                <div className={`text-[15px] font-semibold text-ui-bright ${f.mono ? 'font-mono text-[14px]' : ''}`}>
                  {f.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Access Level */}
        <div className="bg-ui-sky/4 border border-ui-sky/15 rounded-[14px] px-6 py-5">
          <div className="text-[13px] font-bold text-ui-sky mb-2">Access Level</div>
          <div className="text-[14px] text-ui-muted leading-[1.7]">
            {user.role === 'ADMIN'      && 'Full administrative privileges — user management, role assignment, and system configuration.'}
            {user.role === 'TECHNICIAN' && 'Technician-level access to manage campus resources and maintenance requests.'}
            {user.role === 'USER'       && 'Standard campus user access. Contact an administrator for elevated permissions.'}
          </div>
        </div>

      </div>
    </Layout>
  );
}

function FF({ label, required, error, children, className }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      <label className={`text-[11px] font-bold tracking-[0.1em] uppercase font-mono ${error ? 'text-ui-danger' : 'text-ui-muted'}`}>
        {label}{required && <span className="text-ui-danger"> *</span>}
      </label>
      {children}
      {error && <span className="text-[12px] text-ui-danger font-medium">{error}</span>}
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-[10px] font-semibold backdrop-blur-md shadow-2xl transition-all
      ${toast.type === 'error'
        ? 'bg-ui-danger/10 border border-ui-danger/30 text-ui-danger'
        : 'bg-ui-green/10 border border-ui-green/30 text-ui-green'
      }`}
    >
      {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
    </div>
  );
}