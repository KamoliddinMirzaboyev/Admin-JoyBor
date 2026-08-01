import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'md',
  variant = 'default',
  showIcon = false,
  className = '',
  onClick
}) => {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  const variantClasses = {
    default: 'bg-brand-500 text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    error: 'bg-danger-500 text-white'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`relative inline-flex items-center justify-center rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {showIcon && (
        <Bell className={`${iconSizes[size]} mr-1`} />
      )}
      <span className="font-semibold">
        {count > 99 ? '99+' : count}
      </span>
      
      {/* Pulse animation for unread notifications */}
      {count > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full bg-current opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
};

export default NotificationBadge; 