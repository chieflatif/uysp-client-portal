'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { theme } from '@/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number; // Auto-dismiss after N milliseconds (0 = no auto-dismiss)
}

const toastStyles: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'bg-green-500/90',
    border: 'border-green-400',
    text: 'text-white',
  },
  error: {
    bg: 'bg-red-500/90',
    border: 'border-red-400',
    text: 'text-white',
  },
  warning: {
    bg: 'bg-orange-500/90',
    border: 'border-orange-400',
    text: 'text-white',
  },
  info: {
    bg: 'bg-cyan-500/90',
    border: 'border-cyan-400',
    text: 'text-white',
  },
};

export default function Toast({ message, type = 'info', onClose, duration = 5000 }: ToastProps) {
  const styles = toastStyles[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Announce to screen readers
  useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    return () => {
      document.body.removeChild(announcement);
    };
  }, [message, type]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in-right`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        className={`${styles.bg} ${styles.text} px-6 py-4 rounded-lg shadow-2xl border-2 ${styles.border} flex items-start gap-3`}
      >
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-75 transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded"
          aria-label="Dismiss notification"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
