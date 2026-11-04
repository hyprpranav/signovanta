import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'relative inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl select-none min-h-[44px] cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-slate-900',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-blue-600',
    outline: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-rose-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-600',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

