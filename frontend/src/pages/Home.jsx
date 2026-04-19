import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useEffect, useRef, useState } from 'react';

function RevealSection({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function WaveDivider() {
  return (
    <div className="relative h-20 overflow-hidden">
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-0 left-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          className="text-white/5"
          d="M0,224L48,218.7C96,213,192,203,288,176C384,149,480,107,576,117.3C672,128,768,192,864,208C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -left-20 h-72 w-72 rounded-full bg-ui-sky/10 blur-3xl" />
          <div className="absolute top-[25%] right-[-70px] h-96 w-96 rounded-full bg-ui-live/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_45%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
          {/* HERO */}
          <section className="min-h-[92vh] flex items-center py-10">
            <div className="grid w-full items-center gap-12 lg:grid-cols-2">
              <RevealSection>
                <div>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ui-sky/20 bg-ui-sky/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ui-sky">
                    <span className="h-2 w-2 rounded-full bg-ui-live animate-pulse" />
                    Smart Campus Portal
                  </div>

                  <h1 className="text-4xl font-black leading-tight text-ui-bright md:text-5xl lg:text-6xl">
                    Welcome back, <span className="text-ui-sky">{firstName}</span>
                  </h1>

                  <p className="mt-6 max-w-2xl text-[15px] leading-8 text-ui-muted md:text-lg">
                    SmartCampus connects students, staff, and university services in one
                    modern platform for smarter bookings, better coordination, and a more
                    engaging campus experience.
                  </p>

                  <p className="mt-4 max-w-2xl text-[15px] leading-8 text-ui-dim md:text-base">
                    Access important services, receive updates, and manage your campus
                    interactions with a cleaner and more connected digital system.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={() => navigate('/resources')}
                      className="rounded-2xl bg-ui-sky px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition hover:scale-[1.02]"
                    >
                      Explore Resources
                    </button>

                    <button
                      onClick={() => navigate('/notifications')}
                      className="rounded-2xl border border-ui-sky/20 bg-ui-base/80 px-6 py-3 text-sm font-bold text-ui-bright transition hover:border-ui-sky/40 hover:bg-ui-sky/5"
                    >
                      View Notifications
                    </button>

                    <button
                      onClick={() => navigate('/profile')}
                      className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-ui-bright transition hover:bg-white/10"
                    >
                      My Profile
                    </button>
                  </div>

                  <div className="mt-8 flex items-center gap-3 text-sm font-mono text-ui-dim">
                    <span className="h-2.5 w-2.5 rounded-full bg-ui-live animate-pulse" />
                    System Status:{' '}
                    <span className="font-semibold text-ui-sky">Active & Ready</span>
                  </div>
                </div>
              </RevealSection>

              <RevealSection className="lg:pl-4">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-[36px] bg-ui-sky/10 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[34px] border border-ui-sky/15 bg-ui-base/80 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.12)] backdrop-blur">
                    <img
                      src="https://thebossmagazine.com/wp-content/uploads/2021/06/smartcampus-scaled.jpg"
                      alt="Campus"
                      className="h-[460px] w-full rounded-[28px] object-cover"
                    />

                    <div className="mt-5 rounded-[24px] border border-white/5 bg-white/5 p-5">
                      <h2 className="text-xl font-bold text-ui-bright">
                        A smarter digital campus journey
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-ui-muted">
                        Designed to make university operations easier, faster, and more
                        user-friendly across services, bookings, and communication.
                      </p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            </div>
          </section>

          <WaveDivider />

          {/* INTRO */}
          <RevealSection>
            <section className="py-24">
              <div className="max-w-5xl">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ui-sky">
                  Intro to the system
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-ui-bright md:text-5xl">
                  One platform to simplify campus life
                </h2>

                <div className="mt-8 space-y-6 text-[15px] leading-9 text-ui-muted md:text-lg">
                  <p>
                    SmartCampus is built to bring essential university services into a
                    single organized digital space. It helps users interact with resources,
                    requests, notifications, and campus operations without the confusion of
                    disconnected systems.
                  </p>

                  <p>
                    The platform improves visibility, saves time, and supports better
                    communication between students, staff, and administrators through a
                    smoother and more responsive experience.
                  </p>
                </div>
              </div>
            </section>
          </RevealSection>

          <WaveDivider />

          {/* ABOUT + LARGE VISUAL */}
          <RevealSection>
            <section className="py-24">
              <div className="grid items-center gap-14 lg:grid-cols-2">
                <div className="overflow-hidden rounded-[34px] border border-ui-sky/15 bg-ui-base/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                  <img
                    src="https://api.hub.jhu.edu/factory/sites/default/files/styles/hub_large/public/2025-03/Rendering%203.png"
                    alt="Students on campus"
                    className="h-[520px] w-full object-cover"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ui-sky">
                    About us
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-ui-bright md:text-5xl leading-tight">
                    Built for a more connected university environment
                  </h2>

                  <p className="mt-6 text-[15px] leading-9 text-ui-muted md:text-lg">
                    SmartCampus is designed to support the entire campus community through a
                    modern system that makes digital services easier to access and easier to
                    manage.
                  </p>

                  <p className="mt-5 text-[15px] leading-9 text-ui-muted md:text-lg">
                    Whether it is resource booking, notifications, support workflows, or
                    everyday service access, the goal is to create a more transparent,
                    efficient, and attractive campus experience.
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="rounded-[22px] border border-ui-sky/15 bg-white/5 p-5">
                      <h3 className="text-lg font-bold text-ui-bright">Our Vision</h3>
                      <p className="mt-2 text-sm leading-7 text-ui-muted">
                        To transform campus life through smarter digital coordination and a
                        more seamless service experience.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-ui-sky/15 bg-white/5 p-5">
                      <h3 className="text-lg font-bold text-ui-bright">Our Purpose</h3>
                      <p className="mt-2 text-sm leading-7 text-ui-muted">
                        To provide one centralized platform for students, staff, and
                        administrators to interact more effectively.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </RevealSection>

          <WaveDivider />

          {/* FEATURE STORY */}
          <RevealSection>
            <section className="py-24">
              <div className="max-w-6xl">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ui-sky">
                  Why SmartCampus matters
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-ui-bright md:text-5xl">
                  Better services, clearer workflows, stronger campus experience
                </h2>

                <div className="mt-10 grid gap-8 md:grid-cols-3">
                  <div className="rounded-[28px] border border-ui-sky/15 bg-ui-base/70 p-8 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                    <h3 className="text-xl font-bold text-ui-bright">Better Access</h3>
                    <p className="mt-4 text-[15px] leading-8 text-ui-muted">
                      Users can quickly discover and use campus services in one place
                      without unnecessary complexity.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-ui-sky/15 bg-ui-base/70 p-8 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                    <h3 className="text-xl font-bold text-ui-bright">Better Coordination</h3>
                    <p className="mt-4 text-[15px] leading-8 text-ui-muted">
                      Bookings, notifications, and operations become easier to manage with
                      improved visibility and digital flow.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-ui-sky/15 bg-ui-base/70 p-8 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                    <h3 className="text-xl font-bold text-ui-bright">Better Experience</h3>
                    <p className="mt-4 text-[15px] leading-8 text-ui-muted">
                      A polished interface and connected system help make campus interaction
                      feel more modern, reliable, and engaging.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </RevealSection>

          <WaveDivider />

          {/* CTA FOOTER */}
          <RevealSection>
            <section className="py-24">
              <div className="rounded-[38px] border border-ui-sky/15 bg-gradient-to-r from-ui-sky/10 via-ui-base/80 to-ui-live/10 px-8 py-14 shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:px-12">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ui-sky">
                  SmartCampus Vision
                </p>

                <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-ui-bright md:text-5xl">
                  Creating a smoother, smarter, and more attractive campus platform
                </h2>

                <p className="mt-5 max-w-3xl text-[15px] leading-8 text-ui-muted md:text-lg">
                  Welcome to a modern university experience built around accessibility,
                  efficiency, communication, and stronger digital engagement.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/resources')}
                    className="rounded-2xl bg-ui-sky px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02]"
                  >
                    Explore Resources
                  </button>

                  <button
                    onClick={() => navigate('/notifications')}
                    className="rounded-2xl border border-ui-sky/20 bg-ui-base/80 px-6 py-3 text-sm font-bold text-ui-bright transition hover:border-ui-sky/40 hover:bg-ui-sky/5"
                  >
                    View Notifications
                  </button>
                </div>
              </div>
            </section>
          </RevealSection>
        </div>
      </div>
    </Layout>
  );
}