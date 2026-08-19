import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];
const pad2 = (n: number) => String(n).padStart(2, '0');
const parseYmd = (s: string) => {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const toYmd = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const toDmy = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
const toMonthYear = (date: Date) => `${UZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`;

interface ModernDatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  label?: string;
}

const ModernDatePicker: React.FC<ModernDatePickerProps> = ({ selectedDate, onChange, label }) => {
  const date = parseYmd(selectedDate);

  const CustomInput = React.forwardRef<HTMLDivElement, any>(({ value, onClick }, ref) => (
    <div className="relative group w-[180px] cursor-pointer" onClick={onClick} ref={ref}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-brand-50 dark:bg-brand-900/30 rounded group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors z-10 pointer-events-none">
        <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="pl-11 pr-3 py-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700 rounded-xl font-bold text-sm focus:outline-none hover:border-brand-400 dark:hover:border-brand-500 transition-all shadow-sm text-center flex items-center justify-center min-h-[44px]">
        {value || toDmy(new Date())}
      </div>
    </div>
  ));

  return (
    <div className="relative flex flex-col gap-1.5 z-50">
      {label && (
        <label className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <DatePicker
        selected={date}
        onChange={(d: Date | null) => d && onChange(toYmd(d))}
        dateFormat="dd/MM/yyyy"
        customInput={<CustomInput />}
        popperPlacement="bottom-end"
        popperClassName="modern-datepicker-popper"
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
            <button
              type="button"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 text-surface-600 dark:text-surface-400" />
            </button>
            <span className="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider">
              {toMonthYear(date)}
            </span>
            <button
              type="button"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4 text-surface-600 dark:text-surface-400" />
            </button>
          </div>
        )}
      />
      <style>{`
        .modern-datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker {
          border: 1px solid #e2e8f0 !important;
          border-radius: 0.875rem !important;
          font-family: inherit !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          background-color: #ffffff !important;
          overflow: hidden !important;
          padding-bottom: 6px !important;
        }
        .dark .react-datepicker {
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }
        .react-datepicker__month-container {
          background-color: transparent !important;
        }
        .react-datepicker__header {
          background-color: transparent !important;
          border-bottom: none !important;
          padding: 0 !important;
        }
        .react-datepicker__day-names {
          display: flex !important;
          justify-content: space-around !important;
          padding: 4px 6px 0 6px !important;
        }
        .react-datepicker__day-name {
          font-weight: 700 !important;
          color: #94a3b8 !important;
          text-transform: uppercase !important;
          font-size: 0.65rem !important;
          width: 2rem !important;
          line-height: 2rem !important;
          margin: 0 !important;
        }
        .react-datepicker__month {
          margin: 4px 6px !important;
        }
        .react-datepicker__week {
          display: flex !important;
          justify-content: space-around !important;
        }
        .react-datepicker__day {
          width: 2rem !important;
          height: 2rem !important;
          line-height: 2rem !important;
          margin: 1px 0 !important;
          font-size: 0.8rem !important;
          font-weight: 600 !important;
          color: #334155 !important;
          border-radius: 0.5rem !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.15s ease !important;
        }
        .dark .react-datepicker__day {
          color: #cbd5e1 !important;
        }
        .react-datepicker__day:hover {
          background-color: #f1f5f9 !important;
        }
        .dark .react-datepicker__day:hover {
          background-color: #334155 !important;
        }
        .react-datepicker__day--selected {
          background-color: #2563eb !important;
          color: #ffffff !important;
          font-weight: 700 !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #dbeafe !important;
          color: #1d4ed8 !important;
        }
        .react-datepicker__day--outside-month {
          color: #cbd5e1 !important;
          opacity: 0.6 !important;
        }
        .dark .react-datepicker__day--outside-month {
          color: #64748b !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default ModernDatePicker;
