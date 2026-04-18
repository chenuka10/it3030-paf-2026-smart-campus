import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const homePath = user?.role === 'ADMIN' ? '/admin' : '/home';

  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div
              onClick={() => navigate(homePath)}
              className="inline-flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-sky-400 to-sky-600 rotate-45" />
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-900 tracking-tight">
                  SmartCampus
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-mono">
                  Campus Operations Platform
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/home')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition"
            >
              Home
            </button>

            <button
              onClick={() => navigate('/resources')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition"
            >
              Resources
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition"
            >
              Profile
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[12px] text-slate-500">
          <div>© 2026 SmartCampus · SLIIT</div>
          <div className="font-mono tracking-wide">v1.0 · Internal Preview</div>
        </div>
      </div>
    </footer>
  );
}