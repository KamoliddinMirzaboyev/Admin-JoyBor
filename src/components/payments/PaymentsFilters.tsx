import React, { useMemo } from "react";
import Select from "react-select";
import { useAppStore } from "../../stores/useAppStore";

export type PaymentMethodFilter = "" | "cash" | "card";
export type DateRangeFilter = "" | "today" | "week" | "month" | "year";
export type AmountRangeFilter = "" | "low" | "medium" | "high";

interface FilterOption {
  value: string;
  label: string;
}

interface PaymentsFiltersProps {
  paymentMethodFilter: PaymentMethodFilter;
  dateRangeFilter: DateRangeFilter;
  amountRangeFilter: AmountRangeFilter;
  onPaymentMethodChange: (value: PaymentMethodFilter) => void;
  onDateRangeChange: (value: DateRangeFilter) => void;
  onAmountRangeChange: (value: AmountRangeFilter) => void;
  onClear: () => void;
  filteredCount: number;
  totalCount: number;
}

const methodOptions: FilterOption[] = [
  { value: "cash", label: "Naqd" },
  { value: "card", label: "Karta orqali" },
];

const dateOptions: FilterOption[] = [
  { value: "today", label: "Bugun" },
  { value: "week", label: "Bu hafta" },
  { value: "month", label: "Bu oy" },
  { value: "year", label: "Bu yil" },
];

const amountOptions: FilterOption[] = [
  { value: "low", label: "1M gacha" },
  { value: "medium", label: "1M - 5M" },
  { value: "high", label: "5M dan yuqori" },
];

const PaymentsFilters: React.FC<PaymentsFiltersProps> = ({
  paymentMethodFilter,
  dateRangeFilter,
  amountRangeFilter,
  onPaymentMethodChange,
  onDateRangeChange,
  onAmountRangeChange,
  onClear,
  filteredCount,
  totalCount,
}) => {
  const isDarkMode = useAppStore((state) => state.isDark);

  // React Select uchun dinamik styles (JS-in-CSS, brand teal ranglari)
  const selectStyles = useMemo(() => ({
    control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1e293b" : "#fff",
      color: isDarkMode ? "#fff" : "#0f172a",
      borderColor: state.isFocused
        ? (isDarkMode ? "#3b82f6" : "#2563eb")
        : (isDarkMode ? "#334155" : "#cbd5e1"),
      boxShadow: state.isFocused
        ? `0 0 0 2px ${isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(37, 99, 235, 0.3)"}`
        : "none",
      minHeight: 42,
      fontSize: 14,
      borderRadius: 12,
      transition: "all 0.15s ease",
      "&:hover": {
        borderColor: isDarkMode ? "#475569" : "#94a3b8",
      },
    }),
    menu: (base: Record<string, unknown>) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1e293b" : "#fff",
      color: isDarkMode ? "#fff" : "#0f172a",
      borderRadius: 12,
      border: `1px solid ${isDarkMode ? "#334155" : "#cbd5e1"}`,
      boxShadow: isDarkMode
        ? "0 10px 25px rgba(0, 0, 0, 0.3)"
        : "0 10px 25px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }),
    menuList: (base: Record<string, unknown>) => ({ ...base, padding: 4 }),
    singleValue: (base: Record<string, unknown>) => ({ ...base, color: isDarkMode ? "#fff" : "#0f172a" }),
    input: (base: Record<string, unknown>) => ({ ...base, color: isDarkMode ? "#fff" : "#0f172a" }),
    placeholder: (base: Record<string, unknown>) => ({ ...base, color: isDarkMode ? "#94a3b8" : "#64748b" }),
    option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected
        ? (isDarkMode ? "#1d4ed8" : "#2563eb")
        : state.isFocused
          ? (isDarkMode ? "#334155" : "#eff6ff")
          : "transparent",
      color: state.isSelected ? "#fff" : (isDarkMode ? "#e2e8f0" : "#0f172a"),
      cursor: "pointer",
      borderRadius: 8,
      margin: "2px 0",
      padding: "8px 12px",
      transition: "all 0.15s ease",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: isDarkMode ? "#94a3b8" : "#64748b",
      "&:hover": { color: isDarkMode ? "#3b82f6" : "#2563eb" },
    }),
    clearIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: isDarkMode ? "#94a3b8" : "#64748b",
      "&:hover": { color: isDarkMode ? "#fb7185" : "#e11d48" },
    }),
  }), [isDarkMode]);

  const hasActiveFilters = Boolean(paymentMethodFilter || dateRangeFilter || amountRangeFilter);

  return (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Filterlar:</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[150px]">
          <Select
            options={methodOptions}
            value={paymentMethodFilter ? methodOptions.find((o) => o.value === paymentMethodFilter) ?? null : null}
            onChange={(opt) => onPaymentMethodChange((opt?.value as PaymentMethodFilter) ?? "")}
            isClearable
            placeholder="To'lov turi"
            styles={selectStyles}
            classNamePrefix="react-select"
          />
        </div>

        <div className="min-w-[150px]">
          <Select
            options={dateOptions}
            value={dateRangeFilter ? dateOptions.find((o) => o.value === dateRangeFilter) ?? null : null}
            onChange={(opt) => onDateRangeChange((opt?.value as DateRangeFilter) ?? "")}
            isClearable
            placeholder="Sana oralig'i"
            styles={selectStyles}
            classNamePrefix="react-select"
          />
        </div>

        <div className="min-w-[150px]">
          <Select
            options={amountOptions}
            value={amountRangeFilter ? amountOptions.find((o) => o.value === amountRangeFilter) ?? null : null}
            onChange={(opt) => onAmountRangeChange((opt?.value as AmountRangeFilter) ?? "")}
            isClearable
            placeholder="Summa oralig'i"
            styles={selectStyles}
            classNamePrefix="react-select"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-xs font-medium text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/20 dark:hover:bg-danger-900/30 rounded-xl transition-colors duration-150"
          >
            Filterlarni tozalash
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="text-sm text-surface-600 dark:text-surface-400">
          {filteredCount} ta to'lov topildi ({totalCount} tadan)
        </div>
      )}
    </div>
  );
};

export default PaymentsFilters;
