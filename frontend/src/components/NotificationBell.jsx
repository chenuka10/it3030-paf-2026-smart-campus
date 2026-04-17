import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSSE } from '../hooks/useSSE';
import api from '../api/axios';

const EVENT_ICONS = {
  USER_REGISTERED: { icon: '◎', color: 'text-green-500 bg-green-100' },
  ROLE_CHANGED:    { icon: '◈', color: 'text-yellow-500 bg-yellow-100' },
  USER_DELETED:    { icon: '⊗', color: 'text-rose-500 bg-rose-100' },
  PROFILE_UPDATED: { icon: '◉', color: 'text-sky-500 bg-sky-100' },
};

export default function NotificationBell({ variant = 'navbar' }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications/me');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNewNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  useSSE(handleNewNotification, !!user);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.put('/api/notifications/me/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id) => {
    await api.put(`/api/notifications/${id}/read`);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = async () => {
    await api.delete('/api/notifications/me');
    setNotifications([]);
    setUnreadCount(0);
  };

  const deleteOneNotification = async (id, wasUnread) => {
    await api.delete(`/api/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const fmtTime = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  const panelPosition =
  variant === 'sidebar'
    ? 'absolute left-full top-0 ml-4 w-[380px] z-[9999]'
    : 'absolute right-0 top-[calc(100%+10px)] w-[380px] z-[9999]';

  const bellButtonClass =
    variant === 'sidebar'
      ? 'relative w-10 h-10 flex items-center justify-center rounded-xl border border-ui-sky/15 bg-ui-sky/5 hover:bg-ui-sky/10 transition'
      : 'relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-sky-50 transition';

  return (
    <div ref={panelRef} className="relative">
      {/* Bell */}
      <button
        onClick={() => setOpen(o => !o)}
        className={bellButtonClass}
        title="Notifications"
      >
        <span className="text-[15px]">🔔</span>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[16px] h-4 flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className={`${panelPosition} bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-[fade-in_0.15s_ease]`}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-bold text-gray-900">
                  Notifications
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {loading
                    ? 'Loading...'
                    : unreadCount > 0
                    ? `${unreadCount} unread`
                    : `${notifications.length} total`}
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {(unreadCount > 0 || notifications.length > 0) && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 transition"
                  >
                    Mark all read
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 flex flex-col items-center text-gray-400 gap-2">
                <span className="text-3xl">◌</span>
                <span className="text-sm font-medium">No notifications yet</span>
                <span className="text-[11px] text-gray-350">
                  Live updates will appear here
                </span>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => {
                const meta = EVENT_ICONS[n.eventType] || {
                  icon: '◎',
                  color: 'text-sky-500 bg-sky-100'
                };

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markOneRead(n.id)}
                    className={`
                      group relative flex gap-3 px-4 py-3 border-b border-gray-100 transition
                      ${!n.isRead ? 'bg-sky-50/80 hover:bg-sky-50' : 'bg-white hover:bg-gray-50'}
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm flex-shrink-0 ${meta.color}`}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-gray-900 truncate">
                            {n.title}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {fmtTime(n.createdAt)}
                          </div>
                        </div>

                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                        )}
                      </div>

                      <div className="text-[12px] text-gray-600 leading-relaxed mt-1 pr-6">
                        {n.message}
                      </div>

                      {n.actorName && (
                        <div className="text-[11px] text-gray-400 mt-2 font-mono">
                          by {n.actorName}
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOneNotification(n.id, !n.isRead);
                      }}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-[11px] text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                      title="Delete notification"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/70 text-[11px] text-gray-400 font-mono">
              Showing latest {Math.min(notifications.length, 20)} notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}