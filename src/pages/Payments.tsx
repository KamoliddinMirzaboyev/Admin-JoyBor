import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CreditCard, Plus, X, Wallet } from "lucide-react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import "../index.css";
import { toast } from "sonner";
import { useLocation, Link } from "react-router-dom";
import { formatCurrency, formatCurrencyDetailed } from "../utils/formatters";
import { usePayments, useStudents, useCreatePayment, useUpdatePayment } from "../hooks/api/useApi";
import { api } from "../data/api";
import { useAppStore } from "../stores/useAppStore";
import Skeleton from "../components/UI/Skeleton";
import PaymentsFilters, { type PaymentMethodFilter, type DateRangeFilter, type AmountRangeFilter } from "../components/payments/PaymentsFilters";
import PaymentsTable from "../components/payments/PaymentsTable";
import type { Student, Payment } from "../components/payments/types";

const Payments: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    validUntil: "",
    paymentType: "",
    comment: "",
  });
  const location = useLocation();

  // Filter states
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("");
  const [amountRangeFilter, setAmountRangeFilter] = useState<AmountRangeFilter>("");

  const isDarkMode = useAppStore((state) => state.isDark);

  // Fetch payments and students using custom hooks with caching
  const { data: paymentsData, isLoading: paymentsLoading, error: fetchError, refetch } = usePayments();
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ is_active: true });

  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();

  const payments = useMemo(() => {
    return Array.isArray(paymentsData?.results) ? paymentsData.results : (Array.isArray(paymentsData) ? paymentsData : []);
  }, [paymentsData]);

  const students = useMemo(() => {
    return Array.isArray(studentsData?.results) ? studentsData.results : (Array.isArray(studentsData) ? studentsData : []);
  }, [studentsData]);

  const isLoading = paymentsLoading || studentsLoading;
  const loading = createPaymentMutation.isPending || updatePaymentMutation.isPending;

  useEffect(() => {
    if (location.state && (location.state as { openAddPaymentModal?: boolean }).openAddPaymentModal) {
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Listen for global updates
  useEffect(() => {
    const handleUpdate = () => refetch();
    window.addEventListener('payment-updated', handleUpdate);
    window.addEventListener('student-updated', handleUpdate);
    return () => {
      window.removeEventListener('payment-updated', handleUpdate);
      window.removeEventListener('student-updated', handleUpdate);
    };
  }, [refetch]);

  const handleOpen = () => {
    setIsEditMode(false);
    setForm({
      studentId: "",
      amount: "",
      validUntil: "",
      paymentType: "",
      comment: "",
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setIsEditMode(false);
    setSelectedPayment(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (opt: { value: string; label: string } | null) => {
    setForm(prev => ({ ...prev, studentId: opt ? opt.value : "" }));
  };

  const formatNumber = (value: string) => {
    if (!value) return "";
    const numericValue = value.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const unformatNumber = (value: string) => {
    return value.replace(/[^\d]/g, "");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const unformattedValue = unformatNumber(rawValue);
    const numericValue = Number(unformattedValue);
    if (numericValue > 100000000) {
      toast.error("Maksimal summa 100,000,000 som bo'lishi mumkin");
      return;
    }
    setForm(prev => ({ ...prev, amount: unformattedValue }));
  };

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditMode(true);
    setForm({
      studentId: String(payment.student_info?.id || payment.student?.id || ""),
      amount: String(payment.amount || ""),
      validUntil: payment.valid_until || "",
      paymentType: payment.method?.toLowerCase() === "cash" ? "cash" : "card",
      comment: payment.comment || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!form.studentId.trim()) errors.push("Talabani tanlang");
    if (!form.amount.trim()) errors.push("To'lov miqdorini kiriting");
    if (!form.paymentType.trim()) errors.push("To'lov turini tanlang");

    if (errors.length > 0) {
      toast.error(errors.join(". "));
      return;
    }

    const payload = {
      student: Number(form.studentId),
      amount: Number(form.amount),
      method: form.paymentType === "cash" ? "Cash" : "Card",
      comment: form.comment || "",
      status: "APPROVED"
    };

    if (isEditMode && selectedPayment) {
      updatePaymentMutation.mutate({ id: selectedPayment.id, data: payload }, {
        onSuccess: () => {
          setShowModal(false);
          setIsEditMode(false);
          setSelectedPayment(null);
        }
      });
    } else {
      createPaymentMutation.mutate(payload, {
        onSuccess: () => {
          setShowModal(false);
          setForm({
            studentId: "",
            amount: "",
            validUntil: "",
            paymentType: "",
            comment: "",
          });
        }
      });
    }
  };

  // Student options - optimizatsiya qilingan
  const studentOptions = useMemo(() => {
    if (!Array.isArray(students)) return [];

    return students
      .filter((s: Student) => s.id && s.name && s.last_name)
      .map((s: Student) => ({
        value: String(s.id),
        label: `${s.last_name} ${s.name}` // Familiya birinchi
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'uz')); // Alifbo tartibida
  }, [students]);

  // Filter payments based on selected filters - optimizatsiya qilingan
  const filteredPayments = useMemo(() => {
    if (!Array.isArray(payments)) return [];

    return payments.filter((payment: Payment) => {
      // Payment method filter
      if (paymentMethodFilter) {
        const method = payment.method?.toLowerCase();
        if (paymentMethodFilter === "cash" && method !== "cash") return false;
        if (paymentMethodFilter === "card" && method !== "card") return false;
      }

      // Date range filter
      if (dateRangeFilter && payment.paid_date) {
        const paymentDate = new Date(payment.paid_date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (dateRangeFilter) {
          case "today": {
            const paymentToday = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
            if (paymentToday.getTime() !== today.getTime()) return false;
            break;
          }
          case "week": {
            const weekAgo = new Date(today.getTime());
            weekAgo.setDate(today.getDate() - 7);
            if (paymentDate < weekAgo) return false;
            break;
          }
          case "month": {
            const monthAgo = new Date(today.getTime());
            monthAgo.setMonth(today.getMonth() - 1);
            if (paymentDate < monthAgo) return false;
            break;
          }
          case "year": {
            const yearAgo = new Date(today.getTime());
            yearAgo.setFullYear(today.getFullYear() - 1);
            if (paymentDate < yearAgo) return false;
            break;
          }
        }
      }

      // Amount range filter
      if (amountRangeFilter && payment.amount) {
        const amount = Number(payment.amount);
        switch (amountRangeFilter) {
          case "low":
            if (amount >= 1000000) return false;
            break;
          case "medium":
            if (amount < 1000000 || amount >= 5000000) return false;
            break;
          case "high":
            if (amount < 5000000) return false;
            break;
        }
      }

      return true;
    });
  }, [payments, paymentMethodFilter, dateRangeFilter, amountRangeFilter]);

  const hasActiveFilters = Boolean(paymentMethodFilter || dateRangeFilter || amountRangeFilter);

  const handleClearFilters = useCallback(() => {
    setPaymentMethodFilter("");
    setDateRangeFilter("");
    setAmountRangeFilter("");
  }, []);

  // Export handler for DataTable
  const handleExportPayments = useCallback(async () => {
    try {
      toast.info("Export boshlanmoqda...");

      const response = await api.exportPayments();

      if (!response.ok) {
        toast.error(`Export xatolik: ${response.status} ${response.statusText}`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tolovlar_ro'yxati_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("To'lovlar ro'yxati muvaffaqiyatli yuklandi!");
    } catch (error) {
      toast.error("Export xatolik yuz berdi!");
    }
  }, []);

  // React Select uchun dinamik styles (talaba tanlash formasi uchun)
  const selectStyles = useMemo(() => ({
    control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1e293b" : "#fff",
      color: isDarkMode ? "#fff" : "#0f172a",
      borderColor: state.isFocused
        ? (isDarkMode ? "#2dd4bf" : "#14b8a6")
        : (isDarkMode ? "#334155" : "#cbd5e1"),
      boxShadow: state.isFocused
        ? `0 0 0 2px ${isDarkMode ? "rgba(45, 212, 191, 0.3)" : "rgba(20, 184, 166, 0.3)"}`
        : "none",
      minHeight: 42,
      fontSize: 14,
      borderRadius: 12,
      transition: "all 0.15s ease",
      '&:hover': {
        borderColor: isDarkMode ? "#475569" : "#94a3b8"
      }
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
      zIndex: 9999
    }),
    menuList: (base: Record<string, unknown>) => ({
      ...base,
      padding: 4
    }),
    singleValue: (base: Record<string, unknown>) => ({
      ...base,
      color: isDarkMode ? "#fff" : "#0f172a",
    }),
    input: (base: Record<string, unknown>) => ({
      ...base,
      color: isDarkMode ? "#fff" : "#0f172a",
    }),
    placeholder: (base: Record<string, unknown>) => ({
      ...base,
      color: isDarkMode ? "#94a3b8" : "#64748b",
    }),
    option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected
        ? (isDarkMode ? "#0d9488" : "#14b8a6")
        : state.isFocused
          ? (isDarkMode ? "#334155" : "#f1f5f9")
          : "transparent",
      color: state.isSelected
        ? "#fff"
        : (isDarkMode ? "#e2e8f0" : "#0f172a"),
      cursor: "pointer",
      borderRadius: 8,
      margin: "2px 0",
      padding: "8px 12px",
      transition: "all 0.15s ease",
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: isDarkMode ? "#94a3b8" : "#64748b",
      '&:hover': {
        color: isDarkMode ? "#2dd4bf" : "#14b8a6"
      }
    }),
    clearIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: isDarkMode ? "#94a3b8" : "#64748b",
      '&:hover': {
        color: isDarkMode ? "#fb7185" : "#e11d48"
      }
    })
  }), [isDarkMode]);

  if (isLoading && payments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8 space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-10 text-danger-600 dark:text-danger-400">
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-3 sm:gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-surface-900 dark:text-white">To'lovlar</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1 text-sm sm:text-base">
            Yotoqxona to'lovlari boshqaruvi
          </p>
        </div>
        <div className="sm:ml-auto">
          <button
            onClick={handleOpen}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors duration-150 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>To'lov qo'shish</span>
          </button>
        </div>
      </div>

      <PaymentsFilters
        paymentMethodFilter={paymentMethodFilter}
        dateRangeFilter={dateRangeFilter}
        amountRangeFilter={amountRangeFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        onDateRangeChange={setDateRangeFilter}
        onAmountRangeChange={setAmountRangeFilter}
        onClear={handleClearFilters}
        filteredCount={filteredPayments.length}
        totalCount={payments.length}
      />

      <PaymentsTable
        payments={filteredPayments}
        hasActiveFilters={hasActiveFilters}
        onView={handleView}
        onEdit={handleEdit}
        onExport={handleExportPayments}
      />

      {/* Modal for adding/editing payment */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md lg:max-w-lg relative flex flex-col gap-4 sm:gap-6 max-h-[95vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 text-surface-400 hover:text-danger-500 dark:hover:text-danger-400 bg-transparent rounded-full p-1 transition-colors duration-150"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-surface-900 dark:text-white">
                  {isEditMode ? "To'lovni tahrirlash" : "Yangi to'lov qo'shish"}
                </h2>
                {isEditMode && selectedPayment && (
                  <div className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                    <div className="text-xs text-brand-600 dark:text-brand-400">
                      Faqat summa, sana, to'lov turi va izohni o'zgartirishingiz mumkin
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5 pb-6 sm:pb-8">
                <div>
                  <label className="block text-sm font-medium mb-2 text-surface-900 dark:text-surface-200">
                    Talaba
                    {form.studentId && studentOptions.length > 0 && (
                      <span className="text-xs text-success-600 dark:text-success-400 ml-2">✓</span>
                    )}
                  </label>
                  <Select
                    options={studentOptions}
                    value={studentOptions.filter((opt: { value: string; label: string }) => opt.value === form.studentId)[0] || null}
                    onChange={handleSelectChange}
                    isClearable={!isEditMode}
                    placeholder={studentsLoading ? "Talabalar yuklanmoqda..." : "Talabani qidiring yoki tanlang..."}
                    styles={selectStyles}
                    classNamePrefix="react-select"
                    isDisabled={isEditMode || studentsLoading}
                    isLoading={studentsLoading}
                    isSearchable={true}
                    noOptionsMessage={() => "Talaba topilmadi"}
                    loadingMessage={() => "Yuklanmoqda..."}
                  />
                  {isEditMode && (
                    <div className="text-xs text-warning-600 dark:text-warning-400 mt-2 bg-warning-50 dark:bg-warning-900/20 p-3 rounded-xl border border-warning-200 dark:border-warning-800">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">⚠️ Eslatma:</span>
                      </div>
                      <p className="mt-1">Tahrirlash rejimida talabani o'zgartirib bo'lmaydi. Agar boshqa talabaga o'tkazish kerak bo'lsa, yangi to'lov yarating.</p>
                    </div>
                  )}
                  {!isEditMode && studentOptions.length === 0 && !studentsLoading && (
                    <div className="text-xs text-danger-600 dark:text-danger-400 mt-2 bg-danger-50 dark:bg-danger-900/20 p-3 rounded-xl border border-danger-200 dark:border-danger-800">
                      Talabalar ro'yxati bo'sh yoki yuklanmadi. Iltimos, sahifani yangilang.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-surface-900 dark:text-surface-200">
                    To'lov miqdori (som)
                    {form.amount && (
                      <span className="text-xs font-medium text-success-600 dark:text-success-400 ml-2">
                        = {formatCurrency(Number(form.amount))}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-300 pointer-events-none z-10">
                      <span className="text-sm font-medium">UZS</span>
                    </span>
                    <input
                      type="text"
                      name="amount"
                      value={formatNumber(form.amount)}
                      onChange={handleAmountChange}
                      className="w-full pl-12 pr-3 py-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 transition-colors duration-150 text-right"
                      required
                      placeholder="1,200,000"
                      autoComplete="off"
                    />
                  </div>
                  {isEditMode && selectedPayment && form.amount && Number(form.amount) !== selectedPayment.amount && (
                    <div className="text-xs text-brand-600 dark:text-brand-400 mt-2 bg-brand-50 dark:bg-brand-900/20 p-2 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span>Avvalgi:</span>
                        <span className="font-medium">{selectedPayment.amount ? formatCurrency(selectedPayment.amount) : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Yangi:</span>
                        <span className="font-medium">{formatCurrency(Number(form.amount))}</span>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    Minimal: 100,000 som • Maksimal: 100,000,000 som
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-surface-900 dark:text-surface-200">
                    To'lov turi
                    {isEditMode && selectedPayment?.method && (
                      <span className="text-xs text-surface-500 dark:text-surface-400 ml-2">
                        (Avvalgi: {selectedPayment.method === "Cash" ? "Naqd" : "Karta orqali"})
                      </span>
                    )}
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors duration-150 cursor-pointer select-none shadow-sm focus-within:ring-2 focus-within:ring-brand-500/40 ${form.paymentType === "cash" ? "border-brand-600 bg-brand-50 dark:bg-brand-900/30" : "border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800"}`}>
                      <Wallet className={`w-5 h-5 ${form.paymentType === "cash" ? "text-brand-600" : "text-surface-400 dark:text-surface-500"}`} />
                      <input
                        type="radio"
                        name="paymentType"
                        value="cash"
                        checked={form.paymentType === "cash"}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <span className={`text-sm font-medium ${form.paymentType === "cash" ? "text-brand-700 dark:text-brand-300" : "text-surface-700 dark:text-surface-200"}`}>Naqd</span>
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors duration-150 cursor-pointer select-none shadow-sm focus-within:ring-2 focus-within:ring-brand-500/40 ${form.paymentType === "card" ? "border-brand-600 bg-brand-50 dark:bg-brand-900/30" : "border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800"}`}>
                      <CreditCard className={`w-5 h-5 ${form.paymentType === "card" ? "text-brand-600" : "text-surface-400 dark:text-surface-500"}`} />
                      <input
                        type="radio"
                        name="paymentType"
                        value="card"
                        checked={form.paymentType === "card"}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <span className={`text-sm font-medium ${form.paymentType === "card" ? "text-brand-700 dark:text-brand-300" : "text-surface-700 dark:text-surface-200"}`}>Karta</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-surface-900 dark:text-surface-200">Izoh</label>
                  <textarea
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-brand-500/40 focus:border-transparent"
                    rows={2}
                    placeholder="Izoh..."
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors duration-150"
                    disabled={loading}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 shadow-sm disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        {isEditMode ? "Yangilanmoqda..." : "Qo'shilmoqda..."}
                      </span>
                    ) : (
                      isEditMode ? "Yangilash" : "Qo'shish"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedPayment && (() => {
          const payment = selectedPayment as Payment;
          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-6 w-full max-w-lg relative border border-surface-200 dark:border-surface-800"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors duration-150"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">To'lov ma'lumotlari</h2>
                    <p className="text-surface-500 dark:text-surface-400 text-sm">ID: #{payment.id}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Student info */}
                <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-200 dark:bg-surface-700 rounded-xl flex items-center justify-center">
                      <span className="text-surface-700 dark:text-surface-300 font-semibold text-sm">
                        {payment.student_info
                          ? `${payment.student_info.name?.[0] || ""}${payment.student_info.last_name?.[0] || ""}`
                          : payment.student
                          ? `${payment.student.name?.[0] || ""}${payment.student.last_name?.[0] || ""}`
                          : "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Talaba</p>
                      <Link
                        to={`/studentprofile/${payment.student_info?.id || payment.student?.id || ''}`}
                        className="font-semibold text-surface-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors duration-150"
                      >
                        {payment.student_info
                          ? [payment.student_info.last_name, payment.student_info.name].filter(Boolean).join(' ')
                          : payment.student
                          ? [payment.student.last_name, payment.student.name].filter(Boolean).join(' ')
                          : "-"}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                  <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">To'lov miqdori</p>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">
                    {payment.amount ? formatCurrencyDetailed(payment.amount) : "-"}
                  </p>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">To'lov sanasi</p>
                    <p className="font-semibold text-surface-900 dark:text-white text-sm">
                      {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString("uz-UZ") : "-"}
                    </p>
                  </div>

                  <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">To'lov turi</p>
                    <div className="flex items-center gap-2">
                      {payment.method === "Cash" ? (
                        <Wallet className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                      )}
                      <span className="font-semibold text-surface-900 dark:text-white text-sm">
                        {payment.method === "Cash" ? "Naqd" : payment.method === "Card" ? "Karta orqali" : payment.method}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                {payment.comment && (
                  <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-2">Izoh</p>
                    <p className="text-surface-900 dark:text-white text-sm">{payment.comment || '-'}</p>
                  </div>
                )}

                {/* Valid until */}
                {payment.valid_until && (
                  <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Amal qilish muddati</p>
                    <p className="font-semibold text-surface-900 dark:text-white text-sm">
                      {payment.valid_until ? new Date(payment.valid_until).toLocaleDateString("uz-UZ") : '-'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-800">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full bg-surface-600 hover:bg-surface-700 dark:bg-surface-700 dark:hover:bg-surface-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors duration-150"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default Payments;
