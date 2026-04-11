import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    if (!token) { navigate('/login'); return; }

    login(token)
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, []);

  return (
    <div className="min-h-screen bg-ui-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">

        {/* Spinner ring */}
        <div className="w-16 h-16 rounded-full bg-ui-sky/8 border border-ui-sky/20 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-ui-sky/15"
            style={{
              borderTopColor: 'var(--color-ui-sky)',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>

        {/* Label */}
        <p className="text-[18px] font-bold text-ui-surface tracking-[-0.02em] m-0">
          Authenticating
        </p>

        {/* Dots */}
        <div className="flex gap-1.5">
          {['0s', '0.2s', '0.4s'].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-ui-sky inline-block"
              style={{ animation: `dotPulse 1.4s ease-in-out ${delay} infinite` }}
            />
          ))}
        </div>

        {/* Sub */}
        <p className="text-[13px] text-ui-dim font-mono tracking-[0.02em] m-0">
          Verifying your credentials…
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}