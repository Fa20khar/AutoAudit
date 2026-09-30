import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Download, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4500;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => {
          let Icon = Info;
          let iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
          let borderAccent = 'border-l-blue-500';

          if (t.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            borderAccent = 'border-l-emerald-500';
          } else if (t.type === 'warning') {
            Icon = AlertCircle;
            iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            borderAccent = 'border-l-amber-500';
          } else if (t.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            borderAccent = 'border-l-rose-500';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 border-l-4 ${borderAccent} rounded-xl p-3.5 shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 select-none`}
              role="alert"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h5 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
                    {t.title}
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">just now</span>
                </div>
                {t.message && (
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
                    {t.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
