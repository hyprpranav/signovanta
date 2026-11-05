import React from 'react';
import { PresenceStatus } from '../../types';

interface StatusDotProps {
  status: PresenceStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  showLabel = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'ONLINE':
        return {
          color: 'bg-emerald-500',
          ring: 'ring-emerald-200',
          ping: true,
          label: 'Online',
          textColor: 'text-emerald-700',
        };
      case 'NOT_ACTIVATED':
        return {
          color: 'bg-amber-400',
          ring: 'ring-amber-200',
          ping: false,
          label: 'Not Activated',
          textColor: 'text-amber-700',
        };
      case 'SUSPENDED':
        return {
          color: 'bg-rose-500',
          ring: 'ring-rose-200',
          ping: false,
          label: 'Suspended',
          textColor: 'text-rose-700',
        };
      case 'OFFLINE':
      default:
        return {
          color: 'bg-slate-400',
          ring: 'ring-slate-200',
          ping: false,
          label: 'Offline',
          textColor: 'text-slate-600',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="relative flex items-center justify-center"
        title={showLabel && status === 'NOT_ACTIVATED' ? config.label : undefined}
        aria-label={showLabel && status === 'NOT_ACTIVATED' ? config.label : undefined}
      >
        {config.ping && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ring-2 ${sizeClasses[size]} ${config.color} ${config.ring}`}
        />
      </span>
      {showLabel && status !== 'NOT_ACTIVATED' && (
        <span className={`text-xs font-semibold tracking-wide uppercase ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};
