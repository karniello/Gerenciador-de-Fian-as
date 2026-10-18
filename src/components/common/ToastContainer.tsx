import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFinanceStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg shadow-xl text-xs font-semibold backdrop-blur-md border animate-in slide-in-from-bottom-2 fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
              : toast.type === 'error'
              ? 'bg-slate-900/95 text-rose-300 border-rose-500/40 shadow-rose-950/40'
              : toast.type === 'warning'
              ? 'bg-slate-900/95 text-amber-300 border-amber-500/40 shadow-amber-950/40'
              : 'bg-slate-900/95 text-sky-300 border-sky-500/40 shadow-sky-950/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
