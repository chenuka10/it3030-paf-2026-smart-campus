import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Home() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Layout>
      <div className="h-[80vh] flex items-center justify-center p-5">
        <div className="max-w-[500px] text-center px-10 py-10 card">

          {/* Badge */}
          <div className="inline-block px-3 py-1.5 bg-ui-sky/10 text-ui-sky text-[11px] font-bold tracking-[0.1em] rounded-full mb-6 border border-ui-sky/20">
            WORK IN PROGRESS
          </div>

          {/* Title */}
          <h1 className="text-[32px] font-bold mb-4">
            Welcome back, <span className="text-ui-sky">{firstName}</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-base text-ui-muted leading-relaxed mb-8 mx-auto">
            We're currently refining your SmartCampus experience.
            The full dashboard will be available shortly.
          </p>

          {/* Divider */}
          <div
            className="h-px mb-8"
            style={{ background: 'linear-gradient(90deg, transparent, var(--color-ui-sky), transparent)' }}
          />

          {/* Status */}
          <div className="flex items-center justify-center gap-2.5 text-[13px] text-ui-dim font-mono">
            <span
              className="w-2 h-2 rounded-full bg-ui-live shrink-0"
              style={{ animation: 'pulse 2s infinite' }}
            />
            System Status: <span className="text-ui-sky">Building Greatness</span>
          </div>

        </div>
      </div>
    </Layout>
  );
}