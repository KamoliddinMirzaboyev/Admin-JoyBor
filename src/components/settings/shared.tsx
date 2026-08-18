import React from 'react';
import { Edit, ListChecks, Wifi, BookOpen, WashingMachine, Tv, Coffee } from 'lucide-react';

export const getAmenityIcon = (name: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Wi-Fi': <Wifi className="w-4 h-4" />,
    'WiFi': <Wifi className="w-4 h-4" />,
    'Wifi': <Wifi className="w-4 h-4" />,
    'Darsxona': <BookOpen className="w-4 h-4" />,
    'O\'quv xonasi': <BookOpen className="w-4 h-4" />,
    'Study Room': <BookOpen className="w-4 h-4" />,
    'Kir yuvish': <WashingMachine className="w-4 h-4" />,
    'Washing Machine': <WashingMachine className="w-4 h-4" />,
    'Laundry': <WashingMachine className="w-4 h-4" />,
    'Dam olish xonasi': <Tv className="w-4 h-4" />,
    'TV': <Tv className="w-4 h-4" />,
    'Television': <Tv className="w-4 h-4" />,
    'Oshxona': <Coffee className="w-4 h-4" />,
    'Kitchen': <Coffee className="w-4 h-4" />,
    'Kafe': <Coffee className="w-4 h-4" />,
  };

  if (iconMap[name]) return iconMap[name];

  const lowerName = name.toLowerCase();
  if (lowerName.includes('wifi') || lowerName.includes('internet')) return <Wifi className="w-4 h-4" />;
  if (lowerName.includes('dars') || lowerName.includes('study') || lowerName.includes('o\'qu')) return <BookOpen className="w-4 h-4" />;
  if (lowerName.includes('kir') || lowerName.includes('wash') || lowerName.includes('laundry')) return <WashingMachine className="w-4 h-4" />;
  if (lowerName.includes('tv') || lowerName.includes('dam') || lowerName.includes('television')) return <Tv className="w-4 h-4" />;
  if (lowerName.includes('oshxona') || lowerName.includes('kitchen') || lowerName.includes('kafe')) return <Coffee className="w-4 h-4" />;

  return <ListChecks className="w-4 h-4" />;
};

export function SectionCard({
  icon,
  title,
  description,
  children,
  onEdit,
  action,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  onEdit?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm p-5 sm:p-6 flex flex-col gap-4 border border-surface-200 dark:border-surface-800 transition-all duration-150 hover:shadow">
      <div className="flex items-center justify-between gap-3 border-b border-surface-100 dark:border-surface-800 pb-3.5">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 flex-shrink-0">
            {icon}
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-surface-900 dark:text-white leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {action}
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-semibold transition-colors shadow-sm"
              title="Tahrirlash"
            >
              <Edit className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Tahrirlash</span>
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export function EditableInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  helper,
  fullWidth,
  style,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  helper?: string;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  maxLength?: number;
}) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="text-[11px] font-bold text-surface-600 dark:text-surface-400 uppercase tracking-wider mb-0.5">
          {label}
        </label>
      )}
      <input
        className={`bg-surface-50 dark:bg-surface-800/70 border border-surface-200 dark:border-surface-700 rounded-lg px-3.5 py-2 text-surface-900 dark:text-white text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 ${
          disabled ? 'opacity-70 cursor-default' : 'cursor-text'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={style}
        maxLength={maxLength}
      />
      {helper && <span className="text-[11px] text-surface-400 mt-0.5">{helper}</span>}
    </div>
  );
}
