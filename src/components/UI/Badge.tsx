import React from 'react';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400',
  info: 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400',
  neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
};

const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${toneClasses[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
