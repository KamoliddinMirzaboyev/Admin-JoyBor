import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Bell,
  Clock,
  ExternalLink
} from 'lucide-react';

interface NotificationToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
  timestamp?: Date;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onClose,
  timestamp
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-brand-500" />;
      default:
        return <Bell className="w-5 h-5 text-surface-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-success-500';
      case 'error':
        return 'border-l-danger-500';
      case 'warning':
        return 'border-l-warning-500';
      case 'info':
        return 'border-l-brand-500';
      default:
        return 'border-l-surface-500';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success-50 dark:bg-success-900/20';
      case 'error':
        return 'bg-danger-50 dark:bg-danger-900/20';
      case 'warning':
        return 'bg-warning-50 dark:bg-warning-900/20';
      case 'info':
        return 'bg-brand-50 dark:bg-brand-900/20';
      default:
        return 'bg-surface-50 dark:bg-surface-700';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative w-80 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden ${getBackgroundColor()}`}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={`h-1 ${getBorderColor().replace('border-l-', 'bg-')}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-surface-900 dark:text-white text-sm leading-tight">
                {title}
              </h4>
              <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 p-1 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {message && (
              <p className="text-surface-600 dark:text-surface-300 text-sm mt-1 leading-relaxed">
                {message}
              </p>
            )}

            <div className="flex items-center justify-between mt-3">
              {timestamp && (
                <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(timestamp)}</span>
                </div>
              )}

              {action && (
                <button
                  onClick={action.onClick}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {action.label}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface NotificationToastContainerProps {
  toasts: NotificationToastProps[];
  onClose: (id: string) => void;
}

const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  toasts,
  onClose
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export { NotificationToast, NotificationToastContainer };
export type { NotificationToastProps }; 