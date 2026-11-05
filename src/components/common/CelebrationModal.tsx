import React, { useEffect } from 'react';
import { PartyPopper, Sparkles, X, Trophy, CheckCircle2, Award } from 'lucide-react';
import { fireCelebrationConfetti } from '../../utils/confetti';

interface CelebrationModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onAction?: () => void;
  actionText?: string;
  approvedByName?: string;
  isWinner?: boolean;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  title,
  message,
  onClose,
  onAction,
  actionText = 'OK, Continue',
  approvedByName,
  isWinner = false,
}) => {
  useEffect(() => {
    fireCelebrationConfetti();
    const interval = setTimeout(() => {
      fireCelebrationConfetti();
    }, 450);
    return () => clearTimeout(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Close Button (X mark) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Top Decorative Banner */}
        <div className={`relative px-6 pt-10 pb-8 text-center text-white ${
          isWinner 
            ? 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700'
            : 'bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800'
        }`}>
          {/* Subtle party icons in background */}
          <Sparkles size={44} className="absolute left-6 top-6 text-white/20 animate-pulse pointer-events-none" />
          <PartyPopper size={48} className="absolute right-6 bottom-4 text-white/20 pointer-events-none" />

          {/* Centerpiece Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg mb-3">
            {isWinner ? (
              <Trophy size={34} className="text-amber-200 animate-bounce" />
            ) : (
              <PartyPopper size={34} className="text-yellow-200 animate-bounce" />
            )}
          </div>

          <span className="block text-[11px] font-black uppercase tracking-widest text-white/80 mb-1">
            {isWinner ? '🏆 Outstanding Achievement Verified' : '🎉 Official Appreciation'}
          </span>
          <h2 className="text-2xl font-black tracking-tight drop-shadow-xs">
            {title}
          </h2>

          {approvedByName && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-white/95">
              <CheckCircle2 size={13} className="text-emerald-300" />
              <span>Approved by: <strong>{approvedByName}</strong></span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-7 text-center space-y-4">
          <p className="text-sm font-medium leading-relaxed text-slate-600">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {onAction && (
              <button
                type="button"
                onClick={() => {
                  onAction();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all cursor-pointer"
              >
                {actionText}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                onAction
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md'
              }`}
            >
              {onAction ? 'Dismiss' : 'OK, Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
