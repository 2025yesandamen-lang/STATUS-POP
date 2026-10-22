import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'whatsapp' | 'coral' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'tap-target inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm';

  const sizeClasses = {
    sm: 'text-sm py-2 px-3 min-h-[44px]',
    md: 'text-base py-3 px-5 min-h-[48px]',
    lg: 'text-lg py-3.5 px-6 min-h-[52px]',
  };

  const variantClasses = {
    primary:
      'bg-[#0B6B3A] text-white hover:bg-[#064E2B] focus:ring-[#0B6B3A] border border-transparent shadow-[#0B6B3A]/20',
    secondary:
      'bg-[#111827] text-white hover:bg-black focus:ring-[#111827] border border-transparent',
    whatsapp:
      'bg-[#25D366] text-white hover:bg-[#128C7E] focus:ring-[#25D366] font-semibold border border-transparent shadow-[#25D366]/30',
    coral:
      'bg-[#FF5A36] text-white hover:bg-[#E04422] focus:ring-[#FF5A36] font-semibold border border-transparent',
    outline:
      'bg-transparent text-[#111827] dark:text-white border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400',
    ghost:
      'bg-transparent text-[#111827] dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 shadow-none border-transparent',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Hold on small...
        </span>
      ) : (
        <>
          {leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
