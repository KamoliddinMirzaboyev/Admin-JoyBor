import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const UZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const parseYmd = (s: string) => {
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
    <div className="relative group w-[180px]" onClick={onClick} ref={ref}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-blue-50 dark:bg-blue-900/30 rounded group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors z-10 pointer-events-none">
        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div
        className="pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-black text-sm focus:outline-none ring-blue-500/10 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-sm text-center flex items-center justify-center min-h-[44px]"
      >
        {value || toDmy(new Date())}
      </div>
    </div>
  ));

  return (
    <div className="relative flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <DatePicker
        selected={date}
        onChange={(date: Date) => onChange(toYmd(date))}
        dateFormat="dd/MM/yyyy"
        customInput={<CustomInput />}
        popperClassName="modern-datepicker-popper"
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between px-2 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
              {toMonthYear(date)}
            </span>
            <button
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      />
      <style>{`
        .modern-datepicker-popper {
          z-index: 1000 !important;
        }
        .react-datepicker {
          border: 1px solid #e5e7eb !important;
          border-radius: 1rem !important;
          font-family: inherit !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          background-color: #ffffff !important;
          overflow: hidden !important;
        }
        .dark .react-datepicker {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }
        .react-datepicker__month-container {
          background-color: transparent !important;
        }
        .react-datepicker__day--selected {
          background-color: #2563eb !important;
          border-radius: 0.5rem !important;
          font-weight: 900 !important;
        }
        .react-datepicker__day:hover {
          background-color: #f3f4f6 !important;
          border-radius: 0.5rem !important;
        }
        .dark .react-datepicker__day:hover {
          background-color: #374151 !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #eff6ff !important;
          color: #2563eb !important;
          border-radius: 0.5rem !important;
        }
        .react-datepicker__header {
          background-color: transparent !important;
          border-bottom: none !important;
          padding: 0 !important;
        }
        .react-datepicker__day-name {
          font-weight: 900 !important;
          color: #9ca3af !important;
          text-transform: uppercase !important;
          font-size: 0.7rem !important;
          width: 2.5rem !important;
          line-height: 2.5rem !important;
        }
        .react-datepicker__day {
          width: 2.5rem !important;
          line-height: 2.5rem !important;
          margin: 0 !important;
          font-weight: 700 !important;
          color: #374151 !important;
        }
        .dark .react-datepicker__day {
          color: #d1d5db !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default ModernDatePicker;
