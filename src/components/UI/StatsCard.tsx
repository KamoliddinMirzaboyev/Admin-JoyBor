import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'danger';
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
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    secondary: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400',
    warning: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  const changeClasses = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      </div>

      {value !== undefined && (
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      )}

      {subStats && subStats.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
          {subStats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{stat.label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{stat.value}</span>
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
