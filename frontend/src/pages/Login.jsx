import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const inputBase =
    'w-full rounded-xl border border-ui-sky/20 bg-white px-4 py-3 text-sm text-ui-bright placeholder:text-ui-dim shadow-sm outline-none transition duration-200 focus:border-ui-sky focus:ring-4 focus:ring-ui-sky/10 autofill:shadow-[inset_0_0_0px_1000px_white] autofill:[-webkit-text-fill-color:#111827]';

  const inputError =
    'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100';

  const primaryBtn =
    'rounded-xl bg-ui-sky px-4 py-[13px] text-[15px] font-bold text-white shadow-sm transition duration-200 hover:-translate-y-[1px] hover:shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70';

  const secondaryBtn =
    'flex w-full items-center justify-center gap-3 rounded-xl border border-ui-bright/15 bg-white px-4 py-3 text-sm font-semibold text-ui-bright shadow-sm transition duration-200 hover:-translate-y-[1px] hover:bg-ui-surface hover:shadow-md';

  useEffect(() => {
    if (!loading && user) navigate('/home');
  }, [user, loading, navigate]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setServerErr('');
    setErrors({});

    try {
      const { data } = await api.post('/auth/login', form);
      await login(data.token);
      navigate('/home');
    } catch (err) {
      setServerErr(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
    setServerErr('');
  };

  return (
    <>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ui-base px-4 font-sans">
        <div
          className="pointer-events-none absolute inset-0 grid grid-cols-12 opacity-5"
          aria-hidden="true"
        >
          {Array.from({ length: 120 }).map((_, i) => (
            <div key={i} className="h-24 border border-ui-sky" />
          ))}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.10)_0%,transparent_70%)]" />

        <div className="relative z-10 w-full max-w-[420px] animate-[fadeSlideUp_0.5s_ease_both] rounded-[20px] border border-ui-sky/20 bg-white/90 px-10 py-11 shadow-[0_0_80px_rgba(0,0,0,0.12)] backdrop-blur-[20px]">
          <div className="mb-6">
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-ui-sky/25 bg-ui-sky/10">
              <div className="h-5 w-5 rotate-45 rounded-[5px] bg-gradient-to-br from-ui-sky to-blue-400" />
            </div>
          </div>

          <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ui-sky">
            SLIIT SmartCampus
          </div>

          <h1 className="mb-[10px] text-[38px] font-extrabold leading-[1.1] tracking-[-0.04em] text-ui-bright">
            Welcome
            <br />
            <span className="text-ui-sky">back.</span>
          </h1>

          <p className="mb-6 text-sm leading-7 text-ui-muted">
            Sign in to access your campus portal.
          </p>

          {serverErr && (
            <div className="mb-[18px] rounded-[10px] border border-red-300 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
              ⚠ {serverErr}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mb-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ui-muted">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                className={`${inputBase} ${errors.email ? inputError : ''}`}
              />
              {errors.email && (
                <span className="text-xs font-medium text-red-500">{errors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ui-muted">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                className={`${inputBase} ${errors.password ? inputError : ''}`}
              />
              {errors.password && (
                <span className="text-xs font-medium text-red-500">{errors.password}</span>
              )}
            </div>

            <button type="submit" disabled={submitting} className={primaryBtn}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-[10px]">
            <span className="h-px flex-1 bg-ui-sky/10" />
            <span className="whitespace-nowrap font-mono text-[11px] tracking-[0.08em] text-ui-dim">
              or continue with
            </span>
            <span className="h-px flex-1 bg-ui-sky/10" />
          </div>

          <a
            href="http://localhost:8081/oauth2/authorization/google"
            target="_self"
            className={secondaryBtn}
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <p className="mt-5 mb-0 text-center text-[13px] text-ui-dim">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-ui-sky no-underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}