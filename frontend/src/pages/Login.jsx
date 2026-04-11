import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/profile');
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ui-base">

      {/* Background grid */}
      <div className="absolute inset-0 grid grid-cols-12 opacity-5 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 120 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-ui-sky/30 h-24" />
        ))}
      </div>

      {/* Decorative glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-[100px] -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-muted/20 blur-[100px] -bottom-20 -right-20" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] p-10 glass shadow-2xl"
        style={{ animation: 'var(--animate-fade-in-up)' }}
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
            <div
              className="w-5 h-5 rotate-45 rounded-sm bg-brand-primary"
              style={{ boxShadow: 'var(--shadow-glow)' }}
            />
          </div>
        </div>

        <span className="text-[11px] font-mono tracking-widest text-ui-sky uppercase font-bold">
          SLIIT SmartCampus
        </span>

        <h1 className="text-5xl font-black mt-2 mb-4 tracking-tighter">
          Welcome<br />
          <span className="text-brand-primary">back.</span>
        </h1>

        <p className="text-ui-muted text-sm leading-relaxed mb-10">
          The central hub for SLIIT research and campus management.
        </p>

        {/* ✅ FIXED HERE */}
        <a
          href="http://localhost:8081/oauth2/authorization/google"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-ui-sky/20 text-ui-bright font-bold transition-all duration-300 hover:bg-ui-sky/10 hover:border-ui-sky/40 hover:-translate-y-1 hover:shadow-lg no-underline"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <p className="text-[11px] text-ui-dim/60 text-center mt-8 font-mono">
          SECURE INSTITUTIONAL ACCESS ONLY
        </p>
      </div>

    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}