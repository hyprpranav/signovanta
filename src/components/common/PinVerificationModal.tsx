import React, { useState } from 'react';
import { AlertTriangle, KeyRound, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  title: string;
  description: string;
  confirmButtonText?: string;
}

const MASTER_DELETE_PIN = '927624';

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  confirmButtonText = 'Delete Permanently',
}) => {
  const [step, setStep] = useState<'CONFIRM' | 'PIN'>('CONFIRM');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isProcessing) return;
    setStep('CONFIRM');
    setPin('');
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  const handleProceedToPin = () => {
    setStep('PIN');
    setError(null);
  };

  const handleVerifyAndExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.replace(/\s+/g, '').trim();
    if (cleanPin !== MASTER_DELETE_PIN) {
      setError('❌ Incorrect Security PIN. Deletion aborted.');
      return;
    }

    setIsProcessing(true);
    try {
      await onSuccess();
      setSuccessMsg('✓ Action authorized & completed successfully.');
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete deletion.');
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'CONFIRM' ? 'Confirm Deletion (Step 1 of 2)' : 'Security PIN Authorization (Step 2 of 2)'}
      maxWidth="md"
    >
      <div className="space-y-5">
        {step === 'CONFIRM' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-600 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-950">{title}</h4>
                <p className="text-xs leading-relaxed text-rose-800">{description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Lock size={15} className="text-slate-500" />
                <span>Two-Step Security Verification</span>
              </div>
              <p>
                To prevent accidental data loss, proceeding will require your department's authorization PIN.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProceedToPin}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Proceed to Verification
              </Button>
            </div>
          </div>
        )}

        {step === 'PIN' && (
          <form onSubmit={handleVerifyAndExecute} className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700 shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Master Security PIN Required</h4>
                <p className="text-xs text-amber-800">
                  Please enter your secret 6-digit administrative security PIN to confirm this deletion.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Security PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  required
                  maxLength={10}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  disabled={isProcessing || !!successMsg}
                  className="w-full pl-9 pr-3 py-2.5 text-center text-lg font-mono tracking-widest bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <KeyRound size={16} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                The administrative deletion PIN is kept strictly confidential.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('CONFIRM')} disabled={isProcessing}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isProcessing || !pin.trim() || !!successMsg}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isProcessing ? 'Verifying & Deleting...' : confirmButtonText}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

