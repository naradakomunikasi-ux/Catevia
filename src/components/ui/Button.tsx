import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#082340] text-white border border-transparent hover:bg-[#0F355E] active:bg-[#061A30] disabled:bg-[#94A3B8]',
  secondary:
    'bg-white text-[#0D1B2A] border border-[#CBD4E1] hover:bg-[#F2F4F8] hover:border-[#94A3B8] active:bg-[#E7ECF3] disabled:text-[#94A3B8]',
  ghost:
    'bg-transparent text-[#334155] border border-transparent hover:bg-[#EEF2F7] hover:text-[#082340] active:bg-[#E2E8F0] disabled:text-[#94A3B8]',
  danger:
    'bg-[#B42318] text-white border border-transparent hover:bg-[#912018] active:bg-[#7A1B14] disabled:bg-[#FCA5A5]',
  accent:
    'bg-[#B8893E] text-white border border-transparent hover:bg-[#9C712E] active:bg-[#855E1E] disabled:bg-[#DFC69B]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-[13px] gap-1.5 rounded-[7px]',
  md: 'min-h-[40px] px-4 py-2 text-[14px] gap-2 rounded-[8px]',
  lg: 'min-h-[44px] px-5 py-2.5 text-[15px] gap-2 rounded-[8px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed ${
        VARIANT_CLASSES[variant]
      } ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="shrink-0 flex items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
