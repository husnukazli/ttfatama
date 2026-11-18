import React from 'react';
import { AlertTriangle, ShieldAlert, Trash2, CheckCircle2, X } from 'lucide-react';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'primary';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  title,
  message,
  details = [],
  confirmLabel = 'Evet, Onaylıyorum',
  cancelLabel = 'Vazgeç',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const palette =
    variant === 'danger'
      ? {
          iconBg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400',
          boxBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          Icon: Trash2
        }
      : variant === 'warning'
      ? {
          iconBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400',
          boxBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          Icon: AlertTriangle
        }
      : {
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400',
          boxBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          Icon: CheckCircle2
        };

  const IconComp = palette.Icon;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette.iconBg}`}>
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {details.length > 0 && (
          <div className="px-5 pt-4">
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${palette.boxBg}`}>
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>İşlem Özeti / Uyarı</span>
              </div>
              <ul className="space-y-1 pl-1">
                {details.map((line, i) => (
                  <li key={i} className="leading-snug">
                    • {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="p-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors ${palette.btnBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
