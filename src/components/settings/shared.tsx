import React from 'react';
import { Edit, ListChecks, Wifi, BookOpen, WashingMachine, Tv, Coffee } from 'lucide-react';

export const getAmenityIcon = (name: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Wi-Fi': <Wifi className="w-5 h-5" />,
    'WiFi': <Wifi className="w-5 h-5" />,
    'Wifi': <Wifi className="w-5 h-5" />,
    'Darsxona': <BookOpen className="w-5 h-5" />,
    'O\'quv xonasi': <BookOpen className="w-5 h-5" />,
    'Study Room': <BookOpen className="w-5 h-5" />,
    'Kir yuvish': <WashingMachine className="w-5 h-5" />,
    'Washing Machine': <WashingMachine className="w-5 h-5" />,
    'Laundry': <WashingMachine className="w-5 h-5" />,
    'Dam olish xonasi': <Tv className="w-5 h-5" />,
    'TV': <Tv className="w-5 h-5" />,
    'Television': <Tv className="w-5 h-5" />,
    'Oshxona': <Coffee className="w-5 h-5" />,
    'Kitchen': <Coffee className="w-5 h-5" />,
    'Kafe': <Coffee className="w-5 h-5" />,
  };

  if (iconMap[name]) return iconMap[name];

  const lowerName = name.toLowerCase();
  if (lowerName.includes('wifi') || lowerName.includes('internet')) return <Wifi className="w-5 h-5" />;
  if (lowerName.includes('dars') || lowerName.includes('study') || lowerName.includes('o\'qu')) return <BookOpen className="w-5 h-5" />;
  if (lowerName.includes('kir') || lowerName.includes('wash') || lowerName.includes('laundry')) return <WashingMachine className="w-5 h-5" />;
  if (lowerName.includes('tv') || lowerName.includes('dam') || lowerName.includes('television')) return <Tv className="w-5 h-5" />;
  if (lowerName.includes('oshxona') || lowerName.includes('kitchen') || lowerName.includes('kafe')) return <Coffee className="w-5 h-5" />;

  return <ListChecks className="w-5 h-5" />;
};

export function SectionCard({ icon, title, description, children, onEdit }: { icon: React.ReactNode; title: React.ReactNode; description?: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 border border-surface-200 dark:border-surface-800 relative group transition-colors duration-150 hover:shadow-md">
      <div className="flex items-center gap-2 sm:gap-3 mb-1">
        <span className="p-1.5 sm:p-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-200 flex-shrink-0">{icon}</span>
        <h2 className="text-base sm:text-lg font-bold text-surface-800 dark:text-surface-100 flex-1 min-w-0">{title}</h2>
        {onEdit && (
          <button onClick={onEdit} className="p-1.5 sm:p-2 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors duration-150 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500/40" title="Tahrirlash">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500" />
          </button>
        )}
      </div>
      {description && <div className="text-xs text-surface-500 dark:text-surface-400 mb-2 leading-relaxed">{description}</div>}
      {children}
    </div>
  );
}

export function EditableInput({ label, value, onChange, disabled, placeholder, helper, fullWidth, style, maxLength }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean; placeholder?: string; helper?: string; fullWidth?: boolean; style?: React.CSSProperties; maxLength?: number }) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {label && <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">{label}</label>}
      <input
        className={`bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 text-surface-900 dark:text-white text-sm sm:text-base font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${disabled ? 'cursor-default' : 'cursor-text'}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={style}
        maxLength={maxLength}
      />
      {helper && <span className="text-xs text-surface-400 mt-1">{helper}</span>}
    </div>
  );
}
