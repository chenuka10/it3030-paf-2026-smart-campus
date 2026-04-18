import { useEffect, useRef, useCallback } from 'react';

/**
 * useSSE — connects to the backend SSE stream and calls onNotification
 * whenever a NOTIFICATION event arrives.
 *
 * Automatically reconnects on disconnect (with exponential backoff).
 * Closes cleanly on unmount.
 */
export function useSSE(onNotification, enabled = true) {
  const esRef      = useRef(null);
  const retryRef   = useRef(1000); // backoff ms
  const timerRef   = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // EventSource doesn't support custom headers — pass token as query param.
    // The backend JwtAuthFilter must also accept ?token= for SSE routes.
    const url = `http://localhost:8081/api/notifications/stream?token=${token}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.addEventListener('CONNECTED', () => {
      retryRef.current = 1000; // reset backoff on successful connect
    });

    es.addEventListener('NOTIFICATION', (e) => {
      try {
        const notification = JSON.parse(e.data);
        onNotification(notification);

        // Browser push notification
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      } catch {/* ignore parse errors */}
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (!mountedRef.current) return;
      // Exponential backoff: 1s → 2s → 4s → max 30s
      timerRef.current = setTimeout(() => {
        retryRef.current = Math.min(retryRef.current * 2, 30000);
        connect();
      }, retryRef.current);
    };
  }, [onNotification, enabled]);

  useEffect(() => {
    mountedRef.current = true;

    // Request browser notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      esRef.current?.close();
    };
  }, [connect]);
}