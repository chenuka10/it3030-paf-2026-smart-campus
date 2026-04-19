import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Register() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [strength, setStrength] = useState(0);

  const inputBase =
    'w-full rounded-xl border border-ui-sky/20 bg-white px-4 py-3 text-sm text-ui-bright placeholder:text-ui-dim shadow-sm outline-none transition duration-200 focus:border-ui-sky focus:ring-4 focus:ring-ui-sky/10 autofill:shadow-[inset_0_0_0px_1000px_white] autofill:[-webkit-text-fill-color:#111827]';

  const inputError =
    'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100';

  const inputSuccess =
    'border-green-400 bg-green-50 focus:border-green-400 focus:ring-green-100';

  const primaryBtn =
    'mt-1 rounded-xl bg-ui-sky px-4 py-[13px] text-[15px] font-bold text-white shadow-sm transition duration-200 hover:-translate-y-[1px] hover:shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70';

  const secondaryBtn =
    'flex w-full items-center justify-center gap-3 rounded-xl border border-ui-bright/15 bg-white px-4 py-3 text-sm font-semibold text-ui-bright shadow-sm transition duration-200 hover:-translate-y-[1px] hover:bg-ui-surface hover:shadow-md';

  useEffect(() => {
    if (!loading && user) navigate('/home');
  }, [user, loading, navigate]);

  useEffect(() => {
    const p = form.password;
    let score = 0;

    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    setStrength(Math.min(score, 4));
  }, [form.password]);

  const validate = () => {
    const e = {};

    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';

    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';

    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match';

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
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      await login(data.token);
      navigate('/home');
    } catch (err) {
      setServerErr(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
    setServerErr('');
  };

  const strengthColors = [
    'bg-ui-dim',
    'bg-red-400',
    'bg-amber-400',
    'bg-green-400',
    'bg-ui-sky',
  ];

  const strengthText = [
    'text-ui-dim',
    'text-red-500',
    'text-amber-500',
    'text-green-500',
    'text-ui-sky',
  ];

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ui-base px-4 py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid grid-cols-12 opacity-5"
        >
          {Array.from({ length: 120 }).map((_, i) => (
            <div key={i} className="border border-ui-sky" />
          ))}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,transparent_70%)]" />

        <div className="relative z-10 w-full max-w-[420px] animate-[fadeSlideUp_0.5s_ease_both] rounded-[20px] border border-ui-sky/20 bg-white/90 px-10 py-11 shadow-[0_0_80px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="mb-6">
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-ui-sky/25 bg-ui-sky/10">
              <div className="h-5 w-5 rotate-45 rounded-[5px] bg-gradient-to-br from-ui-sky to-blue-400" />
            </div>
          </div>

          <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ui-sky">
            SLIIT SmartCampus
          </div>

          <h1 className="mb-[10px] text-[36px] font-extrabold leading-[1.1] tracking-[-0.04em] text-ui-bright">
            Create an
            <br />
            <span className="text-ui-sky">account.</span>
          </h1>

          <p className="mb-[22px] text-[13px] leading-6 text-ui-muted">
            Join SmartCampus. Your role will be set to User by default.
          </p>

          {serverErr && (
            <div className="mb-[18px] rounded-[10px] border border-red-300 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
              ⚠ {serverErr}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mb-[18px] flex flex-col gap-[14px]">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ui-muted">
                Full Name
              </label>

              <input
                type="text"
                placeholder="John Smith"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
                className={`${inputBase} ${errors.name ? inputError : ''}`}
              />

              {errors.name && (
                <span className="text-xs font-medium text-red-500">{errors.name}</span>
              )}
            </div>

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
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                className={`${inputBase} ${errors.password ? inputError : ''}`}
              />

              {errors.password && (
                <span className="text-xs font-medium text-red-500">{errors.password}</span>
              )}

              {form.password.length > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-[3px] flex-1 rounded ${
                          strength >= i ? strengthColors[strength] : 'bg-ui-sky/10'
                        }`}
                      />
                    ))}
                  </div>

                  <span
                    className={`min-w-[40px] font-mono text-[11px] font-bold ${strengthText[strength]}`}
                  >
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ui-muted">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                className={`${inputBase} ${
                  errors.confirm
                    ? inputError
                    : form.confirm && form.confirm === form.password
                    ? inputSuccess
                    : ''
                }`}
              />

              {errors.confirm && (
                <span className="text-xs font-medium text-red-500">{errors.confirm}</span>
              )}

              {form.confirm && form.confirm === form.password && !errors.confirm && (
                <span className="text-xs font-medium text-green-600">✓ Passwords match</span>
              )}
            </div>

            <button type="submit" disabled={submitting} className={primaryBtn}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-[10px]">
            <span className="h-px flex-1 bg-ui-sky/10" />
            <span className="whitespace-nowrap font-mono text-[11px] tracking-[0.08em] text-ui-dim">
              or sign up with
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

          <p className="mt-[18px] text-center text-[13px] text-ui-dim">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-ui-sky no-underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp{
          from{
            opacity:0;
            transform:translateY(16px);
          }
          to{
            opacity:1;
            transform:none;
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