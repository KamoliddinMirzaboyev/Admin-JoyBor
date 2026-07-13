import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
  trend?: number[];
  subStats?: { label: string; value: string | number }[];
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'primary',
  subStats,
}) => {
  const colorClasses = {
    primary: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
    secondary: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
    accent: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
    info: 'bg-info-50 text-info-600 dark:bg-info-900/20 dark:text-info-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
  };

  const changeClasses = {
    increase: 'text-success-600 dark:text-success-400',
    decrease: 'text-danger-600 dark:text-danger-400',
    neutral: 'text-surface-600 dark:text-surface-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</h3>
      </div>

      {value !== undefined && (
        <div className="text-2xl font-semibold text-surface-900 dark:text-white">{value}</div>
      )}

      {subStats && subStats.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-100 dark:border-surface-800">
          {subStats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-surface-500 dark:text-surface-400">{stat.label}</span>
              <span className="font-medium text-surface-900 dark:text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {change && (
        <p className={`text-xs font-medium ${changeClasses[changeType]}`}>{change}</p>
      )}
    </motion.div>
  );
};

export default StatsCard;
