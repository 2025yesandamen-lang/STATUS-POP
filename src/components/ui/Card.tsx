import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline' | 'warm';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-200 overflow-hidden';

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  const variantClasses = {
    default:
      'bg-white dark:bg-[#1A202C] border border-gray-200/80 dark:border-gray-800 shadow-sm',
    elevated:
      'bg-white dark:bg-[#1E2533] border border-gray-100 dark:border-gray-700/60 shadow-md',
    outline:
      'bg-transparent border-2 border-gray-200 dark:border-gray-800',
    warm:
      'bg-[#FFF9EC] dark:bg-[#1E1C18] border border-[#FFC93C]/40 shadow-sm',
  };

  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
